import type { ShodanResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.SHODAN_API_KEY;
const BASE_URL = "https://api.shodan.io";

export async function lookupHost(
  ip: string
): Promise<ServiceResponse<ShodanResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "SHODAN_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("shodan", 1, 1_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Shodan rate limit exceeded (1/sec)",
        retryAfter: 1,
      },
    };
  }

  try {
    const res = await fetch(
      `${BASE_URL}/shodan/host/${encodeURIComponent(ip)}?key=${API_KEY}`,
      { signal: AbortSignal.timeout(15_000) }
    );

    if (res.status === 404) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Host not found in Shodan" },
      };
    }

    if (!res.ok) {
      const body = await res.text();
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: body || `Shodan returned ${res.status}`,
        },
      };
    }

    const data = await res.json();

    const services = (data.data || []).slice(0, 20).map((svc: any) => ({
      port: svc.port,
      protocol: svc.transport || "tcp",
      product: svc.product || undefined,
      version: svc.version || undefined,
      banner: svc.data ? svc.data.substring(0, 200) : undefined,
    }));

    return {
      success: true,
      data: {
        ip: data.ip_str,
        hostnames: data.hostnames || [],
        ports: data.ports || [],
        services,
        vulns: data.vulns || [],
        os: data.os || undefined,
        org: data.org || undefined,
        isp: data.isp || undefined,
        asn: data.asn || undefined,
        country: data.country_name || data.country_code || undefined,
        city: data.city || undefined,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
