"use client";

import { ExternalLink, User } from "lucide-react";
import type { EpieosResult } from "@/types/intelligence";

export function EpieosCard({ data }: { data: EpieosResult }) {
  const existingAccounts = data.accountDetails.filter((a) => a.exists);

  return (
    <div className="space-y-3">
      <p className="text-xs text-cyber-muted">
        Email: <span className="text-cyber-secondary font-mono">{data.email}</span>
        {" — "}
        <span className="text-cyber-text">{existingAccounts.length}</span> account(s) found
      </p>

      {existingAccounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {existingAccounts.map((account, i) => (
            <div
              key={i}
              className="bg-cyber-bg rounded-lg p-2.5 border border-cyber-border/50 flex items-center gap-2.5"
            >
              {account.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full bg-cyber-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyber-border flex items-center justify-center">
                  <User className="w-4 h-4 text-cyber-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-cyber-text">{account.name}</p>
                {account.domain && (
                  <p className="text-[10px] text-cyber-muted">{account.domain}</p>
                )}
              </div>
              {account.profile && (
                <a
                  href={account.profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-secondary hover:text-cyber-primary shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {existingAccounts.length === 0 && (
        <p className="text-xs text-cyber-muted">No linked accounts found for this email.</p>
      )}
    </div>
  );
}
