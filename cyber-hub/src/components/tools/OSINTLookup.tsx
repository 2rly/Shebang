"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Globe, Server, Shield, User, Bug, Radio, Database, FileSearch, Mail, AtSign, Fingerprint, Scan
} from "lucide-react";
import { detectInput, getInputTypeLabel, getServicesForType, getServiceLabel } from "@/lib/intelligence/input-detector";
import { StatusBadge } from "@/components/intelligence/StatusBadge";
import { ShodanCard } from "@/components/tools/results/ShodanCard";
import { VirusTotalCard } from "@/components/tools/results/VirusTotalCard";
import { ExploitDBCard } from "@/components/tools/results/ExploitDBCard";
import { DNSWhoisCard } from "@/components/tools/results/DNSWhoisCard";
import { BreachCheckCard } from "@/components/tools/results/BreachCheckCard";
import { CrtshCard } from "@/components/tools/results/CrtshCard";
import { AlienVaultCard } from "@/components/tools/results/AlienVaultCard";
import { CensysCard } from "@/components/tools/results/CensysCard";
import { GreyNoiseCard } from "@/components/tools/results/GreyNoiseCard";
import { UsernameCheckCard } from "@/components/tools/results/UsernameCheckCard";
import { EpieosCard } from "@/components/tools/results/EpieosCard";
import { AbuseIPDBCard } from "@/components/tools/results/AbuseIPDBCard";
import { ThreatFoxCard } from "@/components/tools/results/ThreatFoxCard";
import type { MagicSearchResponse, IntelligenceStatus } from "@/types/intelligence";

const EXAMPLES = [
  { label: "IP", value: "8.8.8.8" },
  { label: "Domain", value: "example.com" },
  { label: "Email", value: "test@example.com" },
  { label: "Hash", value: "d41d8cd98f00b204e9800998ecf8427e" },
  { label: "Username", value: "johndoe" },
];

const SERVICE_CATALOG = [
  {
    category: "Infrastructure Recon",
    description: "Domain & IP intelligence",
    icon: Server,
    color: "cyber-secondary",
    inputTypes: "IP, Domain",
    tools: [
      { name: "Crt.sh", desc: "Subdomain discovery via CT logs", icon: Globe, free: true, example: "example.com" },
      { name: "AlienVault OTX", desc: "Threat intel for IPs/Domains", icon: Scan, free: false, envKey: "OTX_API_KEY", example: "8.8.8.8" },
      { name: "Censys", desc: "Port scanning & host analysis", icon: Server, free: false, envKey: "CENSYS_API_ID", example: "1.1.1.1" },
      { name: "GreyNoise", desc: "Internet noise & scanner analysis", icon: Radio, free: true, example: "8.8.8.8" },
      { name: "AbuseIPDB", desc: "IP reputation & abuse reports", icon: Shield, free: false, envKey: "ABUSEIPDB_API_KEY", example: "118.25.6.39" },
      { name: "Shodan", desc: "Internet-connected device search", icon: Database, free: false, envKey: "SHODAN_API_KEY", example: "8.8.8.8" },
      { name: "DNS / WHOIS", desc: "DNS records & domain registration", icon: Globe, free: true, example: "example.com" },
      { name: "Exploit-DB", desc: "Known exploits search", icon: Bug, free: true, example: "apache" },
    ],
  },
  {
    category: "Identity & Social Lookup",
    description: "Username & Email intelligence",
    icon: User,
    color: "cyber-primary",
    inputTypes: "Username, Email",
    tools: [
      { name: "Username Check", desc: "Availability across 20+ platforms (Sherlock-style)", icon: AtSign, free: true, example: "johndoe" },
      { name: "Epieos", desc: "Email-to-identity lookup", icon: Mail, free: false, envKey: "EPIEOS_API_KEY", example: "test@example.com" },
    ],
  },
  {
    category: "Leaks & Threat Intel",
    description: "Breach data & IoC lookup",
    icon: Fingerprint,
    color: "cyber-warning",
    inputTypes: "Email, Hash",
    tools: [
      { name: "HIBP", desc: "Data breach checking (Have I Been Pwned)", icon: Shield, free: false, envKey: "HIBP_API_KEY", example: "test@example.com" },
      { name: "ThreatFox", desc: "Indicator of Compromise (IoC) lookup", icon: Bug, free: true, example: "d41d8cd98f00b204e9800998ecf8427e" },
      { name: "VirusTotal", desc: "Malware & URL scanning", icon: FileSearch, free: false, envKey: "VIRUSTOTAL_API_KEY", example: "d41d8cd98f00b204e9800998ecf8427e" },
    ],
  },
];

interface ServiceCardState {
  expanded: boolean;
}

// Maps result keys back to service keys for error lookup
const RESULT_TO_SERVICE: Record<string, string> = {
  dnsWhois: "dns-whois",
  breachCheck: "breach-check",
  usernameCheck: "username-check",
};

export function OSINTLookup() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IntelligenceStatus>("idle");
  const [response, setResponse] = useState<MagicSearchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cardStates, setCardStates] = useState<Record<string, ServiceCardState>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Live detection as user types
  const detection = query.trim() ? detectInput(query) : null;
  const services = detection ? getServicesForType(detection.type) : [];

  const toggleCard = (key: string) => {
    setCardStates((prev) => ({
      ...prev,
      [key]: { expanded: !prev[key]?.expanded },
    }));
  };

  // Auto-expand all cards when new results arrive
  useEffect(() => {
    if (response) {
      const keys = Object.keys(response.results);
      const initial: Record<string, ServiceCardState> = {};
      keys.forEach((k) => (initial[k] = { expanded: true }));
      setCardStates(initial);
    }
  }, [response]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const trimmed = (searchQuery ?? query).trim();
    if (!trimmed) return;

    setStatus("scanning");
    setResponse(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/intelligence/magic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: MagicSearchResponse = await res.json();
      setResponse(data);

      const hasResults = Object.keys(data.results).length > 0;
      const hasErrors = data.errors && Object.keys(data.errors).length > 0;

      if (hasResults) {
        setStatus("success");
      } else if (hasErrors) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Request failed");
    }
  }, [query]);

  const runWithQuery = useCallback((example: string) => {
    setQuery(example);
    inputRef.current?.focus();
    // Use setTimeout so the state update settles before searching
    setTimeout(() => handleSearch(example), 50);
  }, [handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const renderServiceCard = (key: string, label: string, content: React.ReactNode) => {
    const expanded = cardStates[key]?.expanded ?? true;
    const serviceKey = RESULT_TO_SERVICE[key] || key;
    const errorForService = response?.errors?.[serviceKey];

    return (
      <div key={key} className="bg-cyber-surface border border-cyber-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleCard(key)}
          className="w-full flex items-center justify-between p-3 hover:bg-cyber-border/20 transition-colors"
        >
          <span className="text-sm font-medium text-cyber-text">{label}</span>
          <div className="flex items-center gap-2">
            {errorForService && (
              <span className="text-[10px] text-cyber-accent flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-cyber-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyber-muted" />
            )}
          </div>
        </button>
        {expanded && (
          <div className="p-3 pt-0 border-t border-cyber-border/50">
            {errorForService ? (
              <p className="text-xs text-cyber-accent mt-2">{errorForService}</p>
            ) : (
              <div className="mt-2">{content}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter an IP, domain, email, hash, URL, or username..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg py-2.5 pl-3 pr-10 font-mono text-sm
                       focus:border-cyber-secondary focus:outline-none"
            />
            {detection && detection.type !== "unknown" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyber-secondary uppercase">
                {getInputTypeLabel(detection.type, detection.subtype)}
              </span>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || status === "scanning"}
            className="cyber-btn flex items-center gap-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "scanning" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Scan
          </button>
        </div>

        {/* Detection hint + target services */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1.5 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setQuery(ex.value)}
                className="text-[10px] text-cyber-muted hover:text-cyber-secondary transition-colors
                         px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border/50 hover:border-cyber-secondary/30"
              >
                {ex.label}
              </button>
            ))}
          </div>
          {detection && services.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-cyber-muted flex-wrap justify-end">
              <span>Will query:</span>
              {services.map((s, i) => (
                <span key={s} className="text-cyber-secondary">
                  {getServiceLabel(s)}{i < services.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {status !== "idle" && (
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {status === "scanning" && (
            <span className="text-xs text-cyber-muted animate-pulse">Querying intelligence services...</span>
          )}
        </div>
      )}

      {/* Global Error */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30">
          <AlertCircle className="w-4 h-4 text-cyber-accent shrink-0" />
          <p className="text-xs text-cyber-accent">{errorMsg}</p>
        </div>
      )}

      {/* Available Tools Overview — shown when idle (no results yet) */}
      {!response && status !== "scanning" && (
        <div className="space-y-4">
          {SERVICE_CATALOG.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.category} className="bg-cyber-surface border border-cyber-border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className={`p-3 border-b border-cyber-border/50 bg-${cat.color}/5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md bg-${cat.color}/15`}>
                        <CatIcon className={`w-4 h-4 text-${cat.color}`} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold text-${cat.color}`}>{cat.category}</h3>
                        <p className="text-[10px] text-cyber-muted">{cat.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border/50">
                      {cat.inputTypes}
                    </span>
                  </div>
                </div>

                {/* Tools Grid */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.name}
                        onClick={() => runWithQuery(tool.example)}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-cyber-bg/50 border border-cyber-border/30
                          hover:border-cyber-secondary/50 hover:bg-cyber-secondary/5 transition-all cursor-pointer text-left group"
                      >
                        <ToolIcon className="w-3.5 h-3.5 text-cyber-muted mt-0.5 shrink-0 group-hover:text-cyber-secondary transition-colors" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-cyber-text group-hover:text-cyber-secondary transition-colors">{tool.name}</span>
                            {tool.free ? (
                              <span className="text-[9px] font-mono px-1 py-px rounded bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20">
                                FREE
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1 py-px rounded bg-cyber-warning/10 text-cyber-warning border border-cyber-warning/20">
                                API KEY
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-cyber-muted mt-0.5 leading-tight">{tool.desc}</p>
                          <p className="text-[9px] text-cyber-secondary/60 mt-0.5 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            Try: {tool.example}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-[10px] text-cyber-muted text-center">
            Enter a query above — input type is auto-detected and relevant services are queried in parallel.
          </p>
        </div>
      )}

      {/* General detection error */}
      {response?.errors?.general && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-warning/10 border border-cyber-warning/30">
          <AlertCircle className="w-4 h-4 text-cyber-warning shrink-0" />
          <p className="text-xs text-cyber-warning">{response.errors.general}</p>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="space-y-3">
          {/* Detection Info */}
          <div className="text-xs text-cyber-muted">
            Detected:{" "}
            <span className="text-cyber-secondary font-mono">
              {getInputTypeLabel(response.detection.type, response.detection.subtype)}
            </span>
            {response.detection.confidence > 0 && (
              <span className="ml-2 text-cyber-muted">
                ({Math.round(response.detection.confidence * 100)}% confidence)
              </span>
            )}
          </div>

          {/* === Infrastructure Recon (IP/Domain) === */}
          {response.results.shodan &&
            renderServiceCard("shodan", "Shodan", <ShodanCard data={response.results.shodan} />)}

          {response.results.censys &&
            renderServiceCard("censys", "Censys", <CensysCard data={response.results.censys} />)}

          {response.results.greynoise &&
            renderServiceCard("greynoise", "GreyNoise", <GreyNoiseCard data={response.results.greynoise} />)}

          {response.results.abuseipdb &&
            renderServiceCard("abuseipdb", "AbuseIPDB", <AbuseIPDBCard data={response.results.abuseipdb} />)}

          {response.results.alienvault &&
            renderServiceCard("alienvault", "AlienVault OTX", <AlienVaultCard data={response.results.alienvault} />)}

          {response.results.crtsh &&
            renderServiceCard("crtsh", "Crt.sh (CT Logs)", <CrtshCard data={response.results.crtsh} />)}

          {response.results.dnsWhois &&
            renderServiceCard("dnsWhois", "DNS / WHOIS", <DNSWhoisCard data={response.results.dnsWhois} />)}

          {response.results.exploitdb &&
            renderServiceCard("exploitdb", "Exploit-DB", <ExploitDBCard data={response.results.exploitdb} />)}

          {/* === Threat Intel (Hash) === */}
          {response.results.virustotal &&
            renderServiceCard("virustotal", "VirusTotal", <VirusTotalCard data={response.results.virustotal} />)}

          {response.results.threatfox &&
            renderServiceCard("threatfox", "ThreatFox", <ThreatFoxCard data={response.results.threatfox} />)}

          {/* === Identity & Social (Email/Username) === */}
          {response.results.breachCheck &&
            renderServiceCard("breachCheck", "Breach Check (HIBP)", <BreachCheckCard data={response.results.breachCheck} />)}

          {response.results.epieos &&
            renderServiceCard("epieos", "Epieos", <EpieosCard data={response.results.epieos} />)}

          {response.results.usernameCheck &&
            renderServiceCard("usernameCheck", "Username Check", <UsernameCheckCard data={response.results.usernameCheck} />)}

          {/* Error-only services (no results but had errors) */}
          {response.errors &&
            Object.entries(response.errors)
              .filter(([k]) => {
                if (k === "general") return false;
                // Map service error keys to result keys
                const resultKeyMap: Record<string, string> = {
                  "dns-whois": "dnsWhois",
                  "breach-check": "breachCheck",
                  "username-check": "usernameCheck",
                };
                const resultKey = resultKeyMap[k] || k;
                return !(resultKey in (response.results || {}));
              })
              .map(([service, error]) =>
                renderServiceCard(
                  service,
                  getServiceLabel(service),
                  <p className="text-xs text-cyber-accent">{error}</p>
                )
              )}
        </div>
      )}
    </div>
  );
}
