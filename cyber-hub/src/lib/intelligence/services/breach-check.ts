import type { BreachCheckResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.HIBP_API_KEY;
const BASE_URL = "https://haveibeenpwned.com/api/v3";

export async function checkBreaches(
  email: string
): Promise<ServiceResponse<BreachCheckResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "HIBP_API_KEY not configured",
      },
    };
  }

  // HIBP requires 1.5s between requests
  if (!checkRateLimit("hibp", 1, 1_500)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "HIBP rate limit exceeded (1 req/1.5s)",
        retryAfter: 2,
      },
    };
  }

  try {
    const res = await fetch(
      `${BASE_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": API_KEY,
          "User-Agent": "CyberHub-OSINT-Platform",
        },
        signal: AbortSignal.timeout(15_000),
      }
    );

    // 404 = not breached
    if (res.status === 404) {
      return {
        success: true,
        data: {
          breached: false,
          breachCount: 0,
          breaches: [],
        },
      };
    }

    if (res.status === 429) {
      return {
        success: false,
        error: {
          code: "RATE_LIMIT",
          message: "HIBP rate limit exceeded",
          retryAfter: 2,
        },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `HIBP returned ${res.status}`,
        },
      };
    }

    const breaches = await res.json();

    return {
      success: true,
      data: {
        breached: true,
        breachCount: breaches.length,
        breaches: breaches.map((b: any) => ({
          name: b.Name,
          title: b.Title,
          domain: b.Domain,
          breachDate: b.BreachDate,
          pwnCount: b.PwnCount,
          description: b.Description,
          dataClasses: b.DataClasses || [],
          isVerified: b.IsVerified,
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
