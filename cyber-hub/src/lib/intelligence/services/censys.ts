import type { CensysResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_ID = process.env.CENSYS_API_ID;
const API_SECRET = process.env.CENSYS_API_SECRET;
const BASE_URL = "https://search.censys.io/api/v2";

export async function lookupHost(
  ip: string
): Promise<ServiceResponse<CensysResult>> {
  if (!API_ID || !API_SECRET) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "CENSYS_API_ID / CENSYS_API_SECRET not configured",
      },
    };
  }

  if (!checkRateLimit("censys", 5, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Censys rate limit exceeded (5/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const auth = Buffer.from(`${API_ID}:${API_SECRET}`).toString("base64");

    const res = await fetch(
      `${BASE_URL}/hosts/${encodeURIComponent(ip)}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (res.status === 404) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Host not found in Censys" },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `Censys returned ${res.status}`,
        },
      };
    }

    const json = await res.json();
    const host = json.result;

    const services = (host.services || []).slice(0, 20).map((s: any) => ({
      port: s.port,
      serviceName: s.service_name || s.extended_service_name || "unknown",
      transportProtocol: s.transport_protocol || "TCP",
      certificate: s.tls?.certificates?.leaf_data?.subject_dn || undefined,
    }));

    return {
      success: true,
      data: {
        ip: host.ip || ip,
        services,
        operatingSystem: host.operating_system?.product || undefined,
        lastUpdated: host.last_updated_at || undefined,
        autonomousSystem: host.autonomous_system
          ? {
              asn: host.autonomous_system.asn,
              name: host.autonomous_system.name,
              bgpPrefix: host.autonomous_system.bgp_prefix || "",
              countryCode: host.autonomous_system.country_code || "",
            }
          : undefined,
        location: host.location
          ? {
              country: host.location.country,
              city: host.location.city,
              latitude: host.location.coordinates?.latitude,
              longitude: host.location.coordinates?.longitude,
            }
          : undefined,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
