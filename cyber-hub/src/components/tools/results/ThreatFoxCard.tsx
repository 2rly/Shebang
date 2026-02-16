"use client";

import { Bug, ExternalLink } from "lucide-react";
import type { ThreatFoxResult } from "@/types/intelligence";

export function ThreatFoxCard({ data }: { data: ThreatFoxResult }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-cyber-muted">
        Found <span className={`font-mono ${data.total > 0 ? "text-cyber-warning" : "text-cyber-primary"}`}>{data.total}</span> IoC(s) in ThreatFox
      </p>

      {data.iocs.length > 0 ? (
        <div className="space-y-2">
          {data.iocs.map((ioc) => (
            <div key={ioc.id} className="bg-cyber-bg rounded-lg p-2.5 border border-cyber-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="w-3.5 h-3.5 text-cyber-warning" />
                <span className="text-xs font-medium text-cyber-text font-mono">{ioc.ioc}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cyber-muted mb-1.5">
                <span>
                  Threat: <span className="text-cyber-text">{ioc.threatType}</span>
                </span>
                {ioc.malwarePrintable && (
                  <span>
                    Malware: <span className="text-cyber-accent">{ioc.malwarePrintable}</span>
                  </span>
                )}
                <span>
                  Confidence: <span className="text-cyber-text">{ioc.confidence}%</span>
                </span>
                {ioc.firstSeen && (
                  <span>
                    First seen: <span className="text-cyber-text font-mono">{ioc.firstSeen}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {ioc.tags.map((tag) => (
                  <span key={tag} className="cyber-tag text-[10px]">{tag}</span>
                ))}
              </div>
              {ioc.reference && (
                <a
                  href={ioc.reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 text-[10px] text-cyber-secondary hover:underline inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Reference
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-cyber-primary">No known Indicators of Compromise found.</p>
      )}
    </div>
  );
}
