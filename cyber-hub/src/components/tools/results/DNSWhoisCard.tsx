"use client";

import { Database, FileText } from "lucide-react";
import type { DNSWhoisResult } from "@/types/intelligence";

export function DNSWhoisCard({ data }: { data: DNSWhoisResult }) {
  const { dns, whois } = data;

  const dnsRecords: { type: string; values: string[] }[] = [
    { type: "A", values: dns.A },
    { type: "AAAA", values: dns.AAAA },
    { type: "MX", values: dns.MX.map((r) => `${r.priority} ${r.exchange}`) },
    { type: "NS", values: dns.NS },
    { type: "TXT", values: dns.TXT },
    ...(dns.CNAME ? [{ type: "CNAME", values: [dns.CNAME] }] : []),
  ].filter((r) => r.values.length > 0);

  return (
    <div className="space-y-4">
      {/* DNS Records */}
      {dnsRecords.length > 0 && (
        <div>
          <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            DNS Records
          </p>
          <div className="space-y-2">
            {dnsRecords.map((record) => (
              <div key={record.type} className="flex gap-3">
                <span className="text-xs font-mono text-cyber-secondary w-12 shrink-0 pt-0.5">
                  {record.type}
                </span>
                <div className="flex flex-wrap gap-1">
                  {record.values.map((val, i) => (
                    <span key={i} className="text-xs font-mono text-cyber-text bg-cyber-bg px-2 py-0.5 rounded">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHOIS */}
      <div>
        <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          WHOIS Information
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Registrar", value: whois.registrar },
            { label: "Created", value: whois.createdDate },
            { label: "Updated", value: whois.updatedDate },
            { label: "Expires", value: whois.expiryDate },
            { label: "Registrant", value: whois.registrant?.organization || whois.registrant?.name },
            { label: "Country", value: whois.registrant?.country },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <div key={item.label} className="bg-cyber-bg rounded-lg p-2">
                <p className="text-[10px] text-cyber-muted uppercase tracking-wider">{item.label}</p>
                <p className="text-xs text-cyber-text font-mono mt-0.5 truncate">{item.value}</p>
              </div>
            ))}
        </div>

        {/* Nameservers */}
        {whois.nameServers.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Nameservers</p>
            <div className="flex flex-wrap gap-1">
              {whois.nameServers.map((ns) => (
                <span key={ns} className="text-xs font-mono text-cyber-secondary bg-cyber-bg px-2 py-0.5 rounded">
                  {ns}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {whois.status.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Status</p>
            <div className="flex flex-wrap gap-1">
              {whois.status.map((s) => (
                <span key={s} className="cyber-tag text-[10px]">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
