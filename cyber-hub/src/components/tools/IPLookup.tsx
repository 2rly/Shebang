"use client";

import { useState } from "react";
import { Search, Globe, MapPin, Building, Shield, Loader2, AlertCircle } from "lucide-react";

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  country_name?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: string;
  hostname?: string;
}

export function IPLookup() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IPInfo | null>(null);

  const lookupIP = async () => {
    if (!ip.trim()) {
      setError("Please enter an IP address");
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/;
    if (!ipRegex.test(ip.trim())) {
      setError("Invalid IP address format");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Using ipinfo.io free API (no key required for basic info)
      const response = await fetch(`https://ipinfo.io/${ip.trim()}/json`);

      if (!response.ok) {
        throw new Error("Failed to lookup IP");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "IP lookup failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lookup IP address");
    } finally {
      setLoading(false);
    }
  };

  const getMyIP = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      setIp(data.ip);
      setResult(data);
    } catch (err) {
      setError("Failed to get your IP address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupIP()}
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm
                     focus:border-cyber-primary focus:outline-none"
          />
        </div>
        <button
          onClick={lookupIP}
          disabled={loading}
          className="cyber-btn flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Lookup
        </button>
        <button
          onClick={getMyIP}
          disabled={loading}
          className="cyber-btn-secondary"
        >
          My IP
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-cyber-accent" />
          <span className="text-sm text-cyber-accent">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-cyber-border bg-cyber-surface">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-primary/20 rounded-lg">
                <Globe className="w-5 h-5 text-cyber-primary" />
              </div>
              <div>
                <h3 className="font-mono text-lg text-cyber-primary">{result.ip}</h3>
                {result.hostname && (
                  <p className="text-xs text-cyber-muted">{result.hostname}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-4">
            {result.city && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyber-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-muted">Location</p>
                  <p className="text-sm text-cyber-text">
                    {result.city}, {result.region}
                  </p>
                  <p className="text-xs text-cyber-muted">{result.country_name || result.country}</p>
                </div>
              </div>
            )}

            {result.org && (
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-cyber-warning mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-muted">Organization</p>
                  <p className="text-sm text-cyber-text">{result.org}</p>
                </div>
              </div>
            )}

            {result.loc && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyber-accent mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-muted">Coordinates</p>
                  <p className="text-sm text-cyber-text font-mono">{result.loc}</p>
                </div>
              </div>
            )}

            {result.timezone && (
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-cyber-primary mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-muted">Timezone</p>
                  <p className="text-sm text-cyber-text">{result.timezone}</p>
                </div>
              </div>
            )}

            {result.postal && (
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-cyber-muted mt-0.5" />
                <div>
                  <p className="text-xs text-cyber-muted">Postal Code</p>
                  <p className="text-sm text-cyber-text">{result.postal}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder */}
      {!result && !error && !loading && (
        <div className="text-center py-12 text-cyber-muted">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter an IP address to lookup geolocation and organization info</p>
          <p className="text-xs mt-1">Or click "My IP" to check your current IP</p>
        </div>
      )}
    </div>
  );
}
