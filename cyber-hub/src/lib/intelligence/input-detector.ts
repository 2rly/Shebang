import type { InputType, DetectionResult } from "@/types/intelligence";

const PATTERNS = {
  url: /^https?:\/\/.+/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  sha256: /^[a-fA-F0-9]{64}$/,
  sha1: /^[a-fA-F0-9]{40}$/,
  md5: /^[a-fA-F0-9]{32}$/,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  ipv6: /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/,
  domain: /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
  // Username: alphanumeric, hyphens, underscores, dots — 3-39 chars, no dots/hyphens at start/end
  username: /^[a-zA-Z][a-zA-Z0-9._-]{2,38}$/,
};

function isValidIPv4(ip: string): boolean {
  return ip.split(".").every((octet) => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

export function detectInput(query: string): DetectionResult {
  const trimmed = query.trim();

  if (!trimmed) {
    return { type: "unknown", value: trimmed, confidence: 0 };
  }

  if (PATTERNS.url.test(trimmed)) {
    return { type: "url", value: trimmed, confidence: 1.0 };
  }
  if (PATTERNS.email.test(trimmed)) {
    return { type: "email", value: trimmed, confidence: 0.95 };
  }
  if (PATTERNS.sha256.test(trimmed)) {
    return { type: "hash", value: trimmed, confidence: 1.0, subtype: "sha256" };
  }
  if (PATTERNS.sha1.test(trimmed)) {
    return { type: "hash", value: trimmed, confidence: 1.0, subtype: "sha1" };
  }
  if (PATTERNS.md5.test(trimmed)) {
    return { type: "hash", value: trimmed, confidence: 1.0, subtype: "md5" };
  }
  if (PATTERNS.ipv4.test(trimmed) && isValidIPv4(trimmed)) {
    return { type: "ip", value: trimmed, confidence: 1.0 };
  }
  if (PATTERNS.ipv6.test(trimmed)) {
    return { type: "ip", value: trimmed, confidence: 0.9 };
  }
  if (PATTERNS.domain.test(trimmed)) {
    return { type: "domain", value: trimmed, confidence: 0.85 };
  }
  // Username detection — lowest priority since it's the most generic pattern
  if (PATTERNS.username.test(trimmed)) {
    return { type: "username", value: trimmed, confidence: 0.6 };
  }

  return { type: "unknown", value: trimmed, confidence: 0 };
}

/** Map input types to the services that should be queried */
export function getServicesForType(type: InputType): string[] {
  const routing: Record<InputType, string[]> = {
    ip: ["shodan", "exploitdb", "alienvault", "censys", "greynoise", "abuseipdb"],
    domain: ["dns-whois", "exploitdb", "crtsh", "alienvault"],
    email: ["breach-check", "epieos"],
    hash: ["virustotal", "threatfox"],
    url: ["virustotal"],
    username: ["username-check"],
    unknown: [],
  };
  return routing[type];
}

/** Human-readable labels for input types */
export function getInputTypeLabel(type: InputType, subtype?: string): string {
  if (type === "hash" && subtype) return subtype.toUpperCase() + " Hash";
  const labels: Record<InputType, string> = {
    ip: "IP Address",
    domain: "Domain",
    email: "Email",
    hash: "Hash",
    url: "URL",
    username: "Username",
    unknown: "Unknown",
  };
  return labels[type];
}

/** Human-readable labels for services */
export function getServiceLabel(service: string): string {
  const labels: Record<string, string> = {
    virustotal: "VirusTotal",
    shodan: "Shodan",
    exploitdb: "Exploit-DB",
    "dns-whois": "DNS / WHOIS",
    "breach-check": "Breach Check",
    crtsh: "Crt.sh (CT Logs)",
    alienvault: "AlienVault OTX",
    censys: "Censys",
    greynoise: "GreyNoise",
    "username-check": "Username Check",
    epieos: "Epieos",
    abuseipdb: "AbuseIPDB",
    threatfox: "ThreatFox",
  };
  return labels[service] || service;
}
