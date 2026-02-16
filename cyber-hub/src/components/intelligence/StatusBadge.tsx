"use client";

import { Loader2, CheckCircle, AlertCircle, ShieldCheck, Clock } from "lucide-react";
import type { IntelligenceStatus } from "@/types/intelligence";

const config: Record<
  IntelligenceStatus,
  { label: string; color: string; icon: typeof Loader2 }
> = {
  idle: { label: "IDLE", color: "cyber-muted", icon: Clock },
  scanning: { label: "SCANNING", color: "cyber-primary", icon: Loader2 },
  success: { label: "FOUND", color: "cyber-secondary", icon: CheckCircle },
  error: { label: "ERROR", color: "cyber-accent", icon: AlertCircle },
  rate_limited: { label: "RATE LIMITED", color: "cyber-warning", icon: Clock },
  no_key: { label: "NO API KEY", color: "cyber-warning", icon: AlertCircle },
};

export function StatusBadge({ status }: { status: IntelligenceStatus }) {
  const { label, color, icon: Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider
        bg-${color}/10 text-${color} border border-${color}/30`}
    >
      <Icon
        className={`w-3 h-3 ${status === "scanning" ? "animate-spin" : ""}`}
      />
      {label}
    </span>
  );
}
