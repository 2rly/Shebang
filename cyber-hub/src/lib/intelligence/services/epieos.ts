import type { EpieosResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.EPIEOS_API_KEY;
const BASE_URL = "https://api.epieos.com";

export async function lookupEmail(
  email: string
): Promise<ServiceResponse<EpieosResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "EPIEOS_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("epieos", 5, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Epieos rate limit exceeded (5/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const res = await fetch(
      `${BASE_URL}/v1/email?email=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `Epieos returned ${res.status}`,
        },
      };
    }

    const data = await res.json();

    const accountDetails = (data.accounts || []).slice(0, 20).map((a: any) => ({
      name: a.name || a.service || "Unknown",
      domain: a.domain || "",
      exists: a.exists ?? true,
      profile: a.profileUrl || a.url || undefined,
      avatar: a.avatar || undefined,
    }));

    return {
      success: true,
      data: {
        email,
        accountDetails,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
