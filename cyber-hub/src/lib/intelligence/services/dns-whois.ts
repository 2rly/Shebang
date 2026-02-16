import dns from "dns";
import type { DNSWhoisResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const resolver = new dns.promises.Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

async function resolveSafe<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function lookupDomain(
  domain: string
): Promise<ServiceResponse<DNSWhoisResult>> {
  if (!checkRateLimit("dns-whois", 10, 10_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "DNS/WHOIS rate limit exceeded",
        retryAfter: 10,
      },
    };
  }

  try {
    // Resolve DNS records in parallel
    const [aRecords, aaaaRecords, mxRecords, nsRecords, txtRecords, cnameRecord] =
      await Promise.all([
        resolveSafe(() => resolver.resolve4(domain), []),
        resolveSafe(() => resolver.resolve6(domain), []),
        resolveSafe(
          () =>
            resolver
              .resolveMx(domain)
              .then((recs) =>
                recs.map((r) => ({ priority: r.priority, exchange: r.exchange }))
              ),
          [] as Array<{ priority: number; exchange: string }>
        ),
        resolveSafe(() => resolver.resolveNs(domain), []),
        resolveSafe(
          () => resolver.resolveTxt(domain).then((recs) => recs.map((r) => r.join(""))),
          [] as string[]
        ),
        resolveSafe(
          () => resolver.resolveCname(domain).then((recs) => recs[0]),
          undefined as string | undefined
        ),
      ]);

    // Fetch WHOIS via public API
    let whois: DNSWhoisResult["whois"] = {
      nameServers: [],
      status: [],
    };

    try {
      const whoisRes = await fetch(
        `https://rdap.org/domain/${encodeURIComponent(domain)}`,
        { signal: AbortSignal.timeout(10_000) }
      );

      if (whoisRes.ok) {
        const data = await whoisRes.json();

        const events = data.events || [];
        const registration = events.find(
          (e: any) => e.eventAction === "registration"
        );
        const lastChanged = events.find(
          (e: any) => e.eventAction === "last changed"
        );
        const expiration = events.find(
          (e: any) => e.eventAction === "expiration"
        );

        const entities = data.entities || [];
        const registrarEntity = entities.find((e: any) =>
          e.roles?.includes("registrar")
        );
        const registrantEntity = entities.find((e: any) =>
          e.roles?.includes("registrant")
        );

        const nameservers = (data.nameservers || []).map(
          (ns: any) => ns.ldhName || ns.unicodeName || ""
        );

        const statusList = (data.status || []) as string[];

        let registrantInfo: DNSWhoisResult["whois"]["registrant"];
        if (registrantEntity?.vcardArray?.[1]) {
          const vcard = registrantEntity.vcardArray[1];
          const fnEntry = vcard.find((v: any) => v[0] === "fn");
          const orgEntry = vcard.find((v: any) => v[0] === "org");
          registrantInfo = {
            name: fnEntry?.[3] || undefined,
            organization: orgEntry?.[3] || undefined,
          };
        }

        whois = {
          registrar: registrarEntity?.vcardArray?.[1]?.find(
            (v: any) => v[0] === "fn"
          )?.[3],
          createdDate: registration?.eventDate,
          updatedDate: lastChanged?.eventDate,
          expiryDate: expiration?.eventDate,
          registrant: registrantInfo,
          nameServers: nameservers,
          status: statusList,
        };
      }
    } catch {
      // WHOIS lookup failed — continue with DNS-only results
    }

    return {
      success: true,
      data: {
        dns: {
          A: aRecords,
          AAAA: aaaaRecords,
          MX: mxRecords,
          NS: nsRecords,
          TXT: txtRecords,
          CNAME: cnameRecord,
        },
        whois,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
