import type { AbuseIPDBResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.ABUSEIPDB_API_KEY;
const BASE_URL = "https://api.abuseipdb.com/api/v2";

export async function checkIP(
  ip: string
): Promise<ServiceResponse<AbuseIPDBResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "ABUSEIPDB_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("abuseipdb", 5, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "AbuseIPDB rate limit exceeded (5/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: "90",
      verbose: "",
    });

    const res = await fetch(`${BASE_URL}/check?${params}`, {
      headers: {
        Key: API_KEY,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `AbuseIPDB returned ${res.status}`,
        },
      };
    }

    const json = await res.json();
    const d = json.data;

    return {
      success: true,
      data: {
        ipAddress: d.ipAddress,
        isPublic: d.isPublic,
        abuseConfidenceScore: d.abuseConfidenceScore,
        countryCode: d.countryCode || undefined,
        isp: d.isp || undefined,
        domain: d.domain || undefined,
        totalReports: d.totalReports,
        lastReportedAt: d.lastReportedAt || undefined,
        usageType: d.usageType || undefined,
        reports: (d.reports || []).slice(0, 15).map((r: any) => ({
          reportedAt: r.reportedAt,
          comment: (r.comment || "").substring(0, 200),
          categories: r.categories || [],
          reporterCountryCode: r.reporterCountryCode || undefined,
        })),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
