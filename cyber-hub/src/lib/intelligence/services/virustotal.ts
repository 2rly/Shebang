import type { VirusTotalResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

const API_KEY = process.env.VIRUSTOTAL_API_KEY;
const BASE_URL = "https://www.virustotal.com/api/v3";

export async function lookupHash(
  hash: string
): Promise<ServiceResponse<VirusTotalResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "VIRUSTOTAL_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("virustotal", 4, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "VirusTotal rate limit exceeded (4/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/files/${hash}`, {
      headers: { "x-apikey": API_KEY },
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 404) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Hash not found in VirusTotal" },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `VirusTotal returned ${res.status}`,
        },
      };
    }

    const json = await res.json();
    const attrs = json.data.attributes;
    const stats = attrs.last_analysis_stats;
    const totalEngines =
      stats.malicious +
      stats.undetected +
      stats.harmless +
      stats.suspicious +
      stats.timeout;

    const engines = Object.entries(
      attrs.last_analysis_results as Record<string, any>
    )
      .slice(0, 30)
      .map(([name, r]: [string, any]) => ({
        name,
        detected: r.category === "malicious",
        result: r.result as string | null,
      }));

    return {
      success: true,
      data: {
        detectionRatio: `${stats.malicious}/${totalEngines}`,
        scanDate: attrs.last_analysis_date
          ? new Date(attrs.last_analysis_date * 1000).toISOString()
          : "",
        positives: stats.malicious,
        total: totalEngines,
        permalink: `https://www.virustotal.com/gui/file/${hash}`,
        engines,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}

export async function lookupUrl(
  url: string
): Promise<ServiceResponse<VirusTotalResult>> {
  if (!API_KEY) {
    return {
      success: false,
      error: {
        code: "API_KEY_MISSING",
        message: "VIRUSTOTAL_API_KEY not configured",
      },
    };
  }

  if (!checkRateLimit("virustotal", 4, 60_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "VirusTotal rate limit exceeded (4/min)",
        retryAfter: 60,
      },
    };
  }

  try {
    // VT v3 URL lookup uses base64-encoded URL (no padding)
    const urlId = Buffer.from(url).toString("base64url");

    const res = await fetch(`${BASE_URL}/urls/${urlId}`, {
      headers: { "x-apikey": API_KEY },
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 404) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "URL not found in VirusTotal" },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `VirusTotal returned ${res.status}`,
        },
      };
    }

    const json = await res.json();
    const attrs = json.data.attributes;
    const stats = attrs.last_analysis_stats;
    const totalEngines =
      stats.malicious +
      stats.undetected +
      stats.harmless +
      stats.suspicious +
      stats.timeout;

    const engines = Object.entries(
      attrs.last_analysis_results as Record<string, any>
    )
      .slice(0, 30)
      .map(([name, r]: [string, any]) => ({
        name,
        detected: r.category === "malicious",
        result: r.result as string | null,
      }));

    return {
      success: true,
      data: {
        detectionRatio: `${stats.malicious}/${totalEngines}`,
        scanDate: attrs.last_analysis_date
          ? new Date(attrs.last_analysis_date * 1000).toISOString()
          : "",
        positives: stats.malicious,
        total: totalEngines,
        permalink: `https://www.virustotal.com/gui/url/${urlId}`,
        engines,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
