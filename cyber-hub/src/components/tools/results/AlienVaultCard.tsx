"use client";

import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AlienVaultResult } from "@/types/intelligence";

export function AlienVaultCard({ data }: { data: AlienVaultResult }) {
  const [showPulses, setShowPulses] = useState(data.pulses.length <= 3);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Pulses</p>
          <p className={`text-lg font-bold font-mono ${data.pulseCount > 0 ? "text-cyber-warning" : "text-cyber-primary"}`}>
            {data.pulseCount}
          </p>
        </div>
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Reputation</p>
          <p className="text-lg font-bold font-mono text-cyber-text">{data.reputation}</p>
        </div>
        {data.country && (
          <div className="bg-cyber-bg rounded-lg p-2.5">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Country</p>
            <p className="text-sm font-mono text-cyber-text mt-0.5">{data.country}</p>
          </div>
        )}
        {data.asn && (
          <div className="bg-cyber-bg rounded-lg p-2.5">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider">ASN</p>
            <p className="text-sm font-mono text-cyber-text mt-0.5">{data.asn}</p>
          </div>
        )}
      </div>

      {/* Threat Pulses */}
      {data.pulses.length > 0 && (
        <div>
          <button
            onClick={() => setShowPulses(!showPulses)}
            className="text-xs text-cyber-secondary hover:underline flex items-center gap-1 mb-2"
          >
            <AlertTriangle className="w-3 h-3" />
            {showPulses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Threat Pulses ({data.pulses.length})
          </button>

          {showPulses && (
            <div className="space-y-2">
              {data.pulses.map((pulse) => (
                <div key={pulse.id} className="bg-cyber-bg rounded-lg p-2.5 border border-cyber-border/50">
                  <p className="text-xs font-medium text-cyber-text">{pulse.name}</p>
                  {pulse.description && (
                    <p className="text-[11px] text-cyber-muted mt-1 line-clamp-2">{pulse.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {pulse.tags.map((tag) => (
                      <span key={tag} className="cyber-tag text-[10px]">{tag}</span>
                    ))}
                  </div>
                  {pulse.references.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {pulse.references.slice(0, 2).map((ref, i) => (
                        <a
                          key={i}
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyber-secondary hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Ref
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.pulseCount === 0 && (
        <p className="text-xs text-cyber-primary">No threat intelligence pulses found — indicator appears clean.</p>
      )}
    </div>
  );
}
