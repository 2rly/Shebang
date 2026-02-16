"use client";

import { ShieldCheck, ShieldAlert, CheckCircle } from "lucide-react";
import type { BreachCheckResult } from "@/types/intelligence";

export function BreachCheckCard({ data }: { data: BreachCheckResult }) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-3">
        {data.breached ? (
          <>
            <ShieldAlert className="w-8 h-8 text-cyber-accent" />
            <div>
              <p className="text-lg font-bold text-cyber-accent">Breached</p>
              <p className="text-xs text-cyber-muted">
                Found in <span className="text-cyber-accent font-mono">{data.breachCount}</span> breach(es)
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="w-8 h-8 text-cyber-primary" />
            <div>
              <p className="text-lg font-bold text-cyber-primary">No Breaches Found</p>
              <p className="text-xs text-cyber-muted">This email was not found in any known data breaches</p>
            </div>
          </>
        )}
      </div>

      {/* Breach List */}
      {data.breaches.length > 0 && (
        <div className="space-y-2">
          {data.breaches.map((breach) => (
            <div
              key={breach.name}
              className="bg-cyber-bg rounded-lg p-3 border border-cyber-border/50"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-medium text-cyber-text">{breach.title}</p>
                {breach.isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-cyber-primary">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyber-muted mb-2">
                <span>
                  Date: <span className="text-cyber-text font-mono">{breach.breachDate}</span>
                </span>
                <span>
                  Affected: <span className="text-cyber-text font-mono">{breach.pwnCount.toLocaleString()}</span>
                </span>
                {breach.domain && (
                  <span>
                    Domain: <span className="text-cyber-text font-mono">{breach.domain}</span>
                  </span>
                )}
              </div>
              {breach.dataClasses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {breach.dataClasses.map((dc) => (
                    <span key={dc} className="cyber-tag text-[10px]">{dc}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
