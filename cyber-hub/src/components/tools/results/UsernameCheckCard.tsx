"use client";

import { ExternalLink, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { UsernameCheckResult } from "@/types/intelligence";

export function UsernameCheckCard({ data }: { data: UsernameCheckResult }) {
  const [showNotFound, setShowNotFound] = useState(false);

  // Group found results by category
  const byCategory = data.found.reduce<Record<string, typeof data.found>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Username</p>
          <p className="text-sm font-mono text-cyber-secondary">{data.username}</p>
        </div>
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Found On</p>
          <p className="text-lg font-bold font-mono text-cyber-primary">{data.found.length}</p>
        </div>
        <div className="bg-cyber-bg rounded-lg p-2.5">
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider">Checked</p>
          <p className="text-lg font-bold font-mono text-cyber-muted">{data.total}</p>
        </div>
      </div>

      {/* Found — grouped by category */}
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-1.5">{category}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <a
                key={item.platform}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono
                  bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 hover:bg-cyber-primary/20 transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                {item.platform}
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Not Found */}
      {data.notFound.length > 0 && (
        <div>
          <button
            onClick={() => setShowNotFound(!showNotFound)}
            className="text-xs text-cyber-muted hover:text-cyber-text flex items-center gap-1"
          >
            {showNotFound ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <XCircle className="w-3 h-3" />
            Not found on {data.notFound.length} platforms
          </button>
          {showNotFound && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.notFound.map((name) => (
                <span key={name} className="text-[10px] text-cyber-muted px-1.5 py-0.5 bg-cyber-bg rounded">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
