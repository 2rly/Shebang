import type { CrtshResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

// crt.sh is free, no API key required
const BASE_URL = "https://crt.sh";

export async function lookupSubdomains(
  domain: string
): Promise<ServiceResponse<CrtshResult>> {
  if (!checkRateLimit("crtsh", 3, 10_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "crt.sh rate limit exceeded (3/10s)",
        retryAfter: 10,
      },
    };
  }

  try {
    const res = await fetch(
      `${BASE_URL}/?q=%25.${encodeURIComponent(domain)}&output=json`,
      { signal: AbortSignal.timeout(20_000) }
    );

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `crt.sh returned ${res.status}`,
        },
      };
    }

    const data: any[] = await res.json();

    // Deduplicate subdomains
    const seen = new Set<string>();
    const subdomains: CrtshResult["subdomains"] = [];

    for (const entry of data.slice(0, 200)) {
      const cn = (entry.common_name || "").toLowerCase().replace(/^\*\./, "");
      if (!cn || seen.has(cn)) continue;
      seen.add(cn);
      subdomains.push({
        commonName: cn,
        issuer: entry.issuer_name || "",
        notBefore: entry.not_before || "",
        notAfter: entry.not_after || "",
      });
    }

    return {
      success: true,
      data: {
        subdomains: subdomains.slice(0, 50),
        uniqueSubdomains: Array.from(seen).sort().slice(0, 100),
        total: seen.size,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
