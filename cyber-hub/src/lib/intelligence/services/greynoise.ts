import type { GreyNoiseResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

// GreyNoise Community API — free, no key required (but key increases limits)
const API_KEY = process.env.GREYNOISE_API_KEY;
const BASE_URL = "https://api.greynoise.io/v3/community";

export async function lookupIP(
  ip: string
): Promise<ServiceResponse<GreyNoiseResult>> {
  if (!checkRateLimit("greynoise", 10, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "GreyNoise rate limit exceeded (10/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (API_KEY) {
      headers["key"] = API_KEY;
    }

    const res = await fetch(
      `${BASE_URL}/${encodeURIComponent(ip)}`,
      { headers, signal: AbortSignal.timeout(15_000) }
    );

    if (res.status === 404) {
      // IP not observed by GreyNoise
      return {
        success: true,
        data: {
          ip,
          noise: false,
          riot: false,
          classification: "unknown",
          message: "IP not observed by GreyNoise",
        },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `GreyNoise returned ${res.status}`,
        },
      };
    }

    const data = await res.json();

    return {
      success: true,
      data: {
        ip: data.ip || ip,
        noise: data.noise ?? false,
        riot: data.riot ?? false,
        classification: data.classification || "unknown",
        name: data.name || undefined,
        link: data.link || undefined,
        lastSeen: data.last_seen || undefined,
        message: data.message || undefined,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
