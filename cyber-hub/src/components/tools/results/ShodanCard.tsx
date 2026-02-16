"use client";

import { Server, Globe, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ShodanResult } from "@/types/intelligence";

export function ShodanCard({ data }: { data: ShodanResult }) {
  const [showAllServices, setShowAllServices] = useState(false);
  const visibleServices = showAllServices ? data.services : data.services.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Host Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "IP", value: data.ip },
          { label: "Organization", value: data.org },
          { label: "ISP", value: data.isp },
          { label: "ASN", value: data.asn },
          { label: "Location", value: [data.city, data.country].filter(Boolean).join(", ") },
          { label: "OS", value: data.os },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <div key={item.label} className="bg-cyber-bg rounded-lg p-2.5">
              <p className="text-[10px] text-cyber-muted uppercase tracking-wider">{item.label}</p>
              <p className="text-sm text-cyber-text font-mono mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
      </div>

      {/* Hostnames */}
      {data.hostnames.length > 0 && (
        <div>
          <p className="text-xs text-cyber-muted mb-1.5">Hostnames</p>
          <div className="flex flex-wrap gap-1.5">
            {data.hostnames.map((h) => (
              <span key={h} className="cyber-tag text-xs">
                <Globe className="w-3 h-3" />
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ports & Services */}
      {data.services.length > 0 && (
        <div>
          <p className="text-xs text-cyber-muted mb-1.5 flex items-center gap-1.5">
            <Server className="w-3 h-3" />
            Open Ports & Services ({data.services.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-1.5 px-2 font-medium">Port</th>
                  <th className="text-left py-1.5 px-2 font-medium">Protocol</th>
                  <th className="text-left py-1.5 px-2 font-medium">Product</th>
                  <th className="text-left py-1.5 px-2 font-medium">Version</th>
                </tr>
              </thead>
              <tbody>
                {visibleServices.map((svc, i) => (
                  <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-border/20">
                    <td className="py-1.5 px-2 font-mono text-cyber-secondary">{svc.port}</td>
                    <td className="py-1.5 px-2 font-mono">{svc.protocol}</td>
                    <td className="py-1.5 px-2">{svc.product || "—"}</td>
                    <td className="py-1.5 px-2 text-cyber-muted">{svc.version || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.services.length > 5 && (
            <button
              onClick={() => setShowAllServices(!showAllServices)}
              className="mt-2 text-xs text-cyber-secondary hover:underline flex items-center gap-1"
            >
              {showAllServices ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAllServices ? "Show less" : `Show all ${data.services.length} services`}
            </button>
          )}
        </div>
      )}

      {/* Vulnerabilities */}
      {data.vulns.length > 0 && (
        <div>
          <p className="text-xs text-cyber-muted mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-cyber-accent" />
            Vulnerabilities ({data.vulns.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.vulns.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono
                  bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
