"use client";

import { ShieldAlert, ShieldCheck, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { VirusTotalResult } from "@/types/intelligence";

export function VirusTotalCard({ data }: { data: VirusTotalResult }) {
  const [showEngines, setShowEngines] = useState(false);
  const ratio = data.total > 0 ? data.positives / data.total : 0;
  const detectedEngines = data.engines.filter((e) => e.detected);
  const cleanEngines = data.engines.filter((e) => !e.detected);

  return (
    <div className="space-y-4">
      {/* Detection Ratio */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {data.positives > 0 ? (
            <ShieldAlert className="w-8 h-8 text-cyber-accent" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-cyber-primary" />
          )}
          <div>
            <p className="text-2xl font-bold font-mono">
              <span className={data.positives > 0 ? "text-cyber-accent" : "text-cyber-primary"}>
                {data.positives}
              </span>
              <span className="text-cyber-muted text-lg">/{data.total}</span>
            </p>
            <p className="text-xs text-cyber-muted">engines detected</p>
          </div>
        </div>

        {/* Bar */}
        <div className="flex-1 max-w-xs">
          <div className="h-3 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border">
            <div
              className={`h-full rounded-full transition-all ${
                ratio > 0.5 ? "bg-cyber-accent" : ratio > 0.1 ? "bg-cyber-warning" : "bg-cyber-primary"
              }`}
              style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs">
        {data.scanDate && (
          <span className="text-cyber-muted">
            Scanned: <span className="text-cyber-text">{data.scanDate}</span>
          </span>
        )}
        {data.permalink && (
          <a
            href={data.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-secondary hover:underline inline-flex items-center gap-1"
          >
            View on VirusTotal <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Engine Results */}
      {data.engines.length > 0 && (
        <div>
          <button
            onClick={() => setShowEngines(!showEngines)}
            className="text-xs text-cyber-secondary hover:underline flex items-center gap-1"
          >
            {showEngines ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showEngines ? "Hide" : "Show"} engine results ({detectedEngines.length} detected, {cleanEngines.length} clean)
          </button>

          {showEngines && (
            <div className="mt-2 max-h-60 overflow-y-auto space-y-0.5">
              {detectedEngines.length > 0 && (
                <>
                  <p className="text-[10px] text-cyber-accent uppercase tracking-wider mt-2 mb-1">Detected</p>
                  {detectedEngines.map((e) => (
                    <div key={e.name} className="flex items-center justify-between py-1 px-2 rounded bg-cyber-accent/5 text-xs">
                      <span className="text-cyber-text">{e.name}</span>
                      <span className="text-cyber-accent font-mono">{e.result || "malicious"}</span>
                    </div>
                  ))}
                </>
              )}
              {cleanEngines.length > 0 && (
                <>
                  <p className="text-[10px] text-cyber-primary uppercase tracking-wider mt-2 mb-1">Clean</p>
                  <div className="flex flex-wrap gap-1">
                    {cleanEngines.map((e) => (
                      <span key={e.name} className="text-[10px] text-cyber-muted px-1.5 py-0.5 bg-cyber-bg rounded">
                        {e.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
