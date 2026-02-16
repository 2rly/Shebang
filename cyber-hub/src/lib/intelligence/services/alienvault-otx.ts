import type { AlienVaultResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.OTX_API_KEY;
const BASE_URL = "https://otx.alienvault.com/api/v1";

export async function lookupIndicator(
  value: string,
  type: "ip" | "domain"
): Promise<ServiceResponse<AlienVaultResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "OTX_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("alienvault", 10, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "AlienVault OTX rate limit exceeded (10/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const section = type === "ip" ? "IPv4" : "domain";
    const headers: HeadersInit = { "X-OTX-API-KEY": API_KEY };

    // Fetch general info
    const generalRes = await fetch(
      `${BASE_URL}/indicators/${section}/${encodeURIComponent(value)}/general`,
      { headers, signal: AbortSignal.timeout(15_000) }
    );

    if (!generalRes.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `AlienVault OTX returned ${generalRes.status}`,
        },
      };
    }

    const general = await generalRes.json();

    const pulses = (general.pulse_info?.pulses || [])
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: (p.description || "").substring(0, 200),
        tags: (p.tags || []).slice(0, 10),
        created: p.created,
        references: (p.references || []).slice(0, 5),
      }));

    return {
      success: true,
      data: {
        pulseCount: general.pulse_info?.count || 0,
        reputation: general.reputation || 0,
        country: general.country_name || general.country_code || undefined,
        asn: general.asn ? `AS${general.asn}` : undefined,
        pulses,
        malware: [],
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
