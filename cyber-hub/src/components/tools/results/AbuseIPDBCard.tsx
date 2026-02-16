"use client";

import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AbuseIPDBResult } from "@/types/intelligence";

// AbuseIPDB category names
const CATEGORY_NAMES: Record<number, string> = {
  1: "DNS Compromise",
  2: "DNS Poisoning",
  3: "Fraud Orders",
  4: "DDoS Attack",
  5: "FTP Brute-Force",
  6: "Ping of Death",
  7: "Phishing",
  8: "Fraud VoIP",
  9: "Open Proxy",
  10: "Web Spam",
  11: "Email Spam",
  12: "Blog Spam",
  14: "Port Scan",
  15: "Hacking",
  16: "SQL Injection",
  17: "Spoofing",
  18: "Brute-Force",
  19: "Bad Web Bot",
  20: "Exploited Host",
  21: "Web App Attack",
  22: "SSH",
  23: "IoT Targeted",
};

export function AbuseIPDBCard({ data }: { data: AbuseIPDBResult }) {
  const [showReports, setShowReports] = useState(false);
  const score = data.abuseConfidenceScore;

  const scoreColor =
    score >= 75 ? "text-cyber-accent" :
    score >= 25 ? "text-cyber-warning" :
    "text-cyber-primary";

  return (
    <div className="space-y-3">
      {/* Confidence Score */}
      <div className="flex items-center gap-4">
        {score >= 50 ? (
          <ShieldAlert className="w-8 h-8 text-cyber-accent" />
        ) : (
          <ShieldCheck className="w-8 h-8 text-cyber-primary" />
        )}
        <div>
          <p className="text-xs text-cyber-muted">Abuse Confidence Score</p>
          <p className={`text-2xl font-bold font-mono ${scoreColor}`}>
            {score}%
          </p>
        </div>
        {/* Bar */}
        <div className="flex-1 max-w-xs">
          <div className="h-3 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border">
            <div
              className={`h-full rounded-full transition-all ${
                score >= 75 ? "bg-cyber-accent" : score >= 25 ? "bg-cyber-warning" : "bg-cyber-primary"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { label: "IP Address", value: data.ipAddress },
          { label: "ISP", value: data.isp },
          { label: "Domain", value: data.domain },
          { label: "Country", value: data.countryCode },
          { label: "Usage", value: data.usageType },
          { label: "Total Reports", value: String(data.totalReports) },
          { label: "Last Reported", value: data.lastReportedAt },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <div key={item.label} className="bg-cyber-bg rounded-lg p-2">
              <p className="text-[10px] text-cyber-muted uppercase tracking-wider">{item.label}</p>
              <p className="text-xs text-cyber-text font-mono mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
      </div>

      {/* Reports */}
      {data.reports.length > 0 && (
        <div>
          <button
            onClick={() => setShowReports(!showReports)}
            className="text-xs text-cyber-secondary hover:underline flex items-center gap-1"
          >
            {showReports ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Recent Reports ({data.reports.length})
          </button>

          {showReports && (
            <div className="mt-2 space-y-2">
              {data.reports.map((report, i) => (
                <div key={i} className="bg-cyber-bg rounded-lg p-2.5 border border-cyber-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-cyber-muted font-mono">{report.reportedAt}</span>
                    {report.reporterCountryCode && (
                      <span className="text-[10px] text-cyber-muted">{report.reporterCountryCode}</span>
                    )}
                  </div>
                  {report.comment && (
                    <p className="text-xs text-cyber-text mb-1">{report.comment}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {report.categories.map((cat) => (
                      <span key={cat} className="cyber-tag text-[10px]">
                        {CATEGORY_NAMES[cat] || `Cat ${cat}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
