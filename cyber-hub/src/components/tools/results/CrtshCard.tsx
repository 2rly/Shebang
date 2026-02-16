"use client";

import { Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { CrtshResult } from "@/types/intelligence";

export function CrtshCard({ data }: { data: CrtshResult }) {
  const [showAll, setShowAll] = useState(false);
  const visibleSubs = showAll ? data.subdomains : data.subdomains.slice(0, 10);

  return (
    <div className="space-y-3">
      <p className="text-xs text-cyber-muted">
        Discovered <span className="text-cyber-secondary font-mono">{data.total}</span> unique subdomain(s) via CT logs
      </p>

      {/* Quick subdomain list */}
      <div className="flex flex-wrap gap-1.5">
        {data.uniqueSubdomains.slice(0, showAll ? 100 : 15).map((sub) => (
          <span key={sub} className="inline-flex items-center gap-1 text-xs font-mono text-cyber-secondary bg-cyber-bg px-2 py-0.5 rounded">
            <Globe className="w-3 h-3 text-cyber-muted" />
            {sub}
          </span>
        ))}
      </div>

      {/* Detailed table */}
      {visibleSubs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-cyber-muted border-b border-cyber-border">
                <th className="text-left py-1.5 px-2 font-medium">Common Name</th>
                <th className="text-left py-1.5 px-2 font-medium">Issuer</th>
                <th className="text-left py-1.5 px-2 font-medium">Valid From</th>
                <th className="text-left py-1.5 px-2 font-medium">Valid To</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubs.map((entry, i) => (
                <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-border/20">
                  <td className="py-1.5 px-2 font-mono text-cyber-text">{entry.commonName}</td>
                  <td className="py-1.5 px-2 text-cyber-muted truncate max-w-[200px]">{entry.issuer}</td>
                  <td className="py-1.5 px-2 text-cyber-muted font-mono whitespace-nowrap">{entry.notBefore}</td>
                  <td className="py-1.5 px-2 text-cyber-muted font-mono whitespace-nowrap">{entry.notAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.subdomains.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-cyber-secondary hover:underline flex items-center gap-1"
        >
          {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAll ? "Show less" : `Show all ${data.subdomains.length} entries`}
        </button>
      )}
    </div>
  );
}
