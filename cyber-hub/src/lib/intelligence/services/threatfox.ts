import type { ThreatFoxResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

// ThreatFox API is free, no key required
const BASE_URL = "https://threatfox-api.abuse.ch/api/v1/";

export async function searchIOC(
  query: string
): Promise<ServiceResponse<ThreatFoxResult>> {
  if (!checkRateLimit("threatfox", 5, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "ThreatFox rate limit exceeded (5/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "search_ioc",
        search_term: query,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `ThreatFox returned ${res.status}`,
        },
      };
    }

    const json = await res.json();

    // ThreatFox returns { query_status: "ok" | "no_result", data: [...] }
    if (json.query_status === "no_result" || !json.data) {
      return {
        success: true,
        data: { iocs: [], total: 0 },
      };
    }

    const iocs = (json.data || []).slice(0, 20).map((item: any) => ({
      id: String(item.id),
      ioc: item.ioc || "",
      threatType: item.threat_type || item.threat_type_desc || "",
      malware: item.malware || undefined,
      malwareAlias: item.malware_alias || undefined,
      malwarePrintable: item.malware_printable || undefined,
      firstSeen: item.first_seen || "",
      lastSeen: item.last_seen || undefined,
      confidence: item.confidence_level ?? 0,
      reference: item.reference || undefined,
      tags: (item.tags || []).slice(0, 10),
    }));

    return {
      success: true,
      data: {
        iocs,
        total: json.data.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
