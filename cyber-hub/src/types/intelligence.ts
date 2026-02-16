// Input detection
export type InputType = "ip" | "domain" | "email" | "hash" | "url" | "username" | "unknown";

export interface DetectionResult {
  type: InputType;
  value: string;
  confidence: number;
  subtype?: string; // e.g. "md5", "sha1", "sha256"
}

// Status
export type IntelligenceStatus = "idle" | "scanning" | "success" | "error" | "rate_limited" | "no_key";

// Magic Search
export interface MagicSearchRequest {
  query: string;
}

export interface MagicSearchResponse {
  detection: DetectionResult;
  results: {
    virustotal?: VirusTotalResult;
    shodan?: ShodanResult;
    exploitdb?: ExploitDBResult;
    dnsWhois?: DNSWhoisResult;
    breachCheck?: BreachCheckResult;
    crtsh?: CrtshResult;
    alienvault?: AlienVaultResult;
    censys?: CensysResult;
    greynoise?: GreyNoiseResult;
    usernameCheck?: UsernameCheckResult;
    epieos?: EpieosResult;
    abuseipdb?: AbuseIPDBResult;
    threatfox?: ThreatFoxResult;
  };
  errors?: Record<string, string>;
}

// VirusTotal
export interface VirusTotalResult {
  detectionRatio: string;
  scanDate: string;
  positives: number;
  total: number;
  permalink: string;
  engines: Array<{
    name: string;
    detected: boolean;
    result: string | null;
  }>;
}

// Shodan
export interface ShodanResult {
  ip: string;
  hostnames: string[];
  ports: number[];
  services: Array<{
    port: number;
    protocol: string;
    product?: string;
    version?: string;
    banner?: string;
  }>;
  vulns: string[];
  os?: string;
  org?: string;
  isp?: string;
  asn?: string;
  country?: string;
  city?: string;
}

// Exploit-DB
export interface ExploitDBResult {
  exploits: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    author: string;
    type: string;
    platform: string;
    url: string;
  }>;
  total: number;
}

// DNS & WHOIS
export interface DNSWhoisResult {
  dns: {
    A: string[];
    AAAA: string[];
    MX: Array<{ priority: number; exchange: string }>;
    NS: string[];
    TXT: string[];
    CNAME?: string;
  };
  whois: {
    registrar?: string;
    createdDate?: string;
    updatedDate?: string;
    expiryDate?: string;
    registrant?: {
      name?: string;
      organization?: string;
      country?: string;
    };
    nameServers: string[];
    status: string[];
  };
}

// Breach Check (HIBP-style)
export interface BreachCheckResult {
  breached: boolean;
  breachCount: number;
  breaches: Array<{
    name: string;
    title: string;
    domain: string;
    breachDate: string;
    pwnCount: number;
    description: string;
    dataClasses: string[];
    isVerified: boolean;
  }>;
}

// Crt.sh — Certificate Transparency subdomain discovery
export interface CrtshResult {
  subdomains: Array<{
    commonName: string;
    issuer: string;
    notBefore: string;
    notAfter: string;
  }>;
  uniqueSubdomains: string[];
  total: number;
}

// AlienVault OTX — Threat intel for IPs/Domains
export interface AlienVaultResult {
  pulseCount: number;
  reputation: number;
  country?: string;
  asn?: string;
  pulses: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    created: string;
    references: string[];
  }>;
  malware: Array<{
    hash: string;
    detections?: string;
  }>;
}

// Censys — Host/port scanning
export interface CensysResult {
  ip: string;
  services: Array<{
    port: number;
    serviceName: string;
    transportProtocol: string;
    certificate?: string;
  }>;
  operatingSystem?: string;
  lastUpdated?: string;
  autonomousSystem?: {
    asn: number;
    name: string;
    bgpPrefix: string;
    countryCode: string;
  };
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

// GreyNoise — Internet noise/scanner analysis
export interface GreyNoiseResult {
  ip: string;
  noise: boolean;
  riot: boolean;
  classification: "benign" | "malicious" | "unknown";
  name?: string;
  link?: string;
  lastSeen?: string;
  message?: string;
}

// Username Check (Sherlock/WhatsMyName style)
export interface UsernameCheckResult {
  username: string;
  found: Array<{
    platform: string;
    url: string;
    category: string;
  }>;
  notFound: string[];
  total: number;
}

// Epieos — Email-to-identity lookup
export interface EpieosResult {
  email: string;
  accountDetails: Array<{
    name: string;
    domain: string;
    exists: boolean;
    profile?: string;
    avatar?: string;
  }>;
}

// AbuseIPDB — IP reputation and abuse reports
export interface AbuseIPDBResult {
  ipAddress: string;
  isPublic: boolean;
  abuseConfidenceScore: number;
  countryCode?: string;
  isp?: string;
  domain?: string;
  totalReports: number;
  lastReportedAt?: string;
  usageType?: string;
  reports: Array<{
    reportedAt: string;
    comment: string;
    categories: number[];
    reporterCountryCode?: string;
  }>;
}

// ThreatFox — IoC (Indicator of Compromise) lookup
export interface ThreatFoxResult {
  iocs: Array<{
    id: string;
    ioc: string;
    threatType: string;
    malware?: string;
    malwareAlias?: string;
    malwarePrintable?: string;
    firstSeen: string;
    lastSeen?: string;
    confidence: number;
    reference?: string;
    tags: string[];
  }>;
  total: number;
}
