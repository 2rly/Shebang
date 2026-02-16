import { NextRequest, NextResponse } from "next/server";
import { detectInput, getServicesForType } from "@/lib/intelligence/input-detector";
import { lookupHash, lookupUrl } from "@/lib/intelligence/services/virustotal";
import { lookupHost as shodanLookup } from "@/lib/intelligence/services/shodan";
import { searchExploits } from "@/lib/intelligence/services/exploitdb";
import { lookupDomain } from "@/lib/intelligence/services/dns-whois";
import { checkBreaches } from "@/lib/intelligence/services/breach-check";
import { lookupSubdomains } from "@/lib/intelligence/services/crtsh";
import { lookupIndicator } from "@/lib/intelligence/services/alienvault-otx";
import { lookupHost as censysLookup } from "@/lib/intelligence/services/censys";
import { lookupIP as greynoiseLookup } from "@/lib/intelligence/services/greynoise";
import { checkUsername } from "@/lib/intelligence/services/username-check";
import { lookupEmail } from "@/lib/intelligence/services/epieos";
import { checkIP as abuseipdbCheck } from "@/lib/intelligence/services/abuseipdb";
import { searchIOC } from "@/lib/intelligence/services/threatfox";
import type { MagicSearchResponse } from "@/types/intelligence";

export async function POST(request: NextRequest) {
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { success: false, error: "query field required" },
      { status: 400 }
    );
  }

  const detection = detectInput(query);
  const services = getServicesForType(detection.type);

  if (services.length === 0) {
    return NextResponse.json({
      detection,
      results: {},
      errors: { general: "Could not determine input type. Try an IP, domain, email, hash, URL, or username." },
    });
  }

  // Fan out to all relevant services in parallel
  const tasks: Record<string, Promise<any>> = {};

  for (const service of services) {
    switch (service) {
      case "virustotal":
        tasks.virustotal =
          detection.type === "url" ? lookupUrl(query) : lookupHash(query);
        break;
      case "shodan":
        tasks.shodan = shodanLookup(query);
        break;
      case "exploitdb":
        tasks.exploitdb = searchExploits(query);
        break;
      case "dns-whois":
        tasks["dns-whois"] = lookupDomain(query);
        break;
      case "breach-check":
        tasks["breach-check"] = checkBreaches(query);
        break;
      case "crtsh":
        tasks.crtsh = lookupSubdomains(query);
        break;
      case "alienvault":
        tasks.alienvault = lookupIndicator(
          query,
          detection.type === "ip" ? "ip" : "domain"
        );
        break;
      case "censys":
        tasks.censys = censysLookup(query);
        break;
      case "greynoise":
        tasks.greynoise = greynoiseLookup(query);
        break;
      case "username-check":
        tasks["username-check"] = checkUsername(query);
        break;
      case "epieos":
        tasks.epieos = lookupEmail(query);
        break;
      case "abuseipdb":
        tasks.abuseipdb = abuseipdbCheck(query);
        break;
      case "threatfox":
        tasks.threatfox = searchIOC(query);
        break;
    }
  }

  const keys = Object.keys(tasks);
  const settled = await Promise.allSettled(Object.values(tasks));

  const results: MagicSearchResponse["results"] = {};
  const errors: Record<string, string> = {};

  settled.forEach((outcome, i) => {
    const key = keys[i];
    if (outcome.status === "fulfilled") {
      const res = outcome.value;
      if (res.success) {
        // Map task keys to result object keys
        const resultKeyMap: Record<string, keyof MagicSearchResponse["results"]> = {
          "dns-whois": "dnsWhois",
          "breach-check": "breachCheck",
          "username-check": "usernameCheck",
        };
        const resultKey = resultKeyMap[key] || key;
        (results as any)[resultKey] = res.data;
      } else {
        errors[key] = res.error?.message || "Unknown error";
      }
    } else {
      errors[key] = outcome.reason?.message || "Service failed";
    }
  });

  const response: MagicSearchResponse = { detection, results, errors };
  return NextResponse.json(response);
}
