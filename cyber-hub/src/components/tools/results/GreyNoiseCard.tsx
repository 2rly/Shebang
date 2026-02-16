"use client";

import { Radio, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import type { GreyNoiseResult } from "@/types/intelligence";

export function GreyNoiseCard({ data }: { data: GreyNoiseResult }) {
  const classColors: Record<string, string> = {
    benign: "text-cyber-primary",
    malicious: "text-cyber-accent",
    unknown: "text-cyber-muted",
  };

  return (
    <div className="space-y-3">
      {/* Classification */}
      <div className="flex items-center gap-3">
        {data.classification === "malicious" ? (
          <ShieldAlert className="w-7 h-7 text-cyber-accent" />
        ) : data.classification === "benign" ? (
          <ShieldCheck className="w-7 h-7 text-cyber-primary" />
        ) : (
          <Radio className="w-7 h-7 text-cyber-muted" />
        )}
        <div>
          <p className={`text-lg font-bold capitalize ${classColors[data.classification] || "text-cyber-muted"}`}>
            {data.classification}
          </p>
          {data.message && <p className="text-xs text-cyber-muted">{data.message}</p>}
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Internet Noise</p>
          <p className={`text-sm font-mono font-bold ${data.noise ? "text-cyber-warning" : "text-cyber-primary"}`}>
            {data.noise ? "YES" : "NO"}
          </p>
        </div>
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">RIOT (Benign Service)</p>
          <p className={`text-sm font-mono font-bold ${data.riot ? "text-cyber-primary" : "text-cyber-muted"}`}>
            {data.riot ? "YES" : "NO"}
          </p>
        </div>
        {data.name && (
          <div className="bg-cyber-bg rounded-lg p-2.5">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Name</p>
            <p className="text-sm font-mono text-cyber-text mt-0.5">{data.name}</p>
          </div>
        )}
        {data.lastSeen && (
          <div className="bg-cyber-bg rounded-lg p-2.5">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Last Seen</p>
            <p className="text-sm font-mono text-cyber-text mt-0.5">{data.lastSeen}</p>
          </div>
        )}
      </div>

      {data.link && (
        <a
          href={data.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyber-secondary hover:underline inline-flex items-center gap-1"
        >
          View on GreyNoise <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
