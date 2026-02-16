"use client";

import { Server } from "lucide-react";
import type { CensysResult } from "@/types/intelligence";

export function CensysCard({ data }: { data: CensysResult }) {
  return (
    <div className="space-y-3">
      {/* Host Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { label: "IP", value: data.ip },
          { label: "OS", value: data.operatingSystem },
          { label: "Last Updated", value: data.lastUpdated },
          { label: "ASN", value: data.autonomousSystem ? `AS${data.autonomousSystem.asn}` : undefined },
          { label: "AS Name", value: data.autonomousSystem?.name },
          { label: "BGP Prefix", value: data.autonomousSystem?.bgpPrefix },
          { label: "Location", value: [data.location?.city, data.location?.country].filter(Boolean).join(", ") || undefined },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <div key={item.label} className="bg-cyber-bg rounded-lg p-2">
              <p className="text-[10px] text-cyber-muted uppercase tracking-wider">{item.label}</p>
              <p className="text-xs text-cyber-text font-mono mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
      </div>

      {/* Services */}
      {data.services.length > 0 && (
        <div>
          <p className="text-xs text-cyber-muted mb-1.5 flex items-center gap-1.5">
            <Server className="w-3 h-3" />
            Services ({data.services.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-1.5 px-2 font-medium">Port</th>
                  <th className="text-left py-1.5 px-2 font-medium">Service</th>
                  <th className="text-left py-1.5 px-2 font-medium">Protocol</th>
                  <th className="text-left py-1.5 px-2 font-medium">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {data.services.map((svc, i) => (
                  <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-border/20">
                    <td className="py-1.5 px-2 font-mono text-cyber-secondary">{svc.port}</td>
                    <td className="py-1.5 px-2">{svc.serviceName}</td>
                    <td className="py-1.5 px-2 font-mono text-cyber-muted">{svc.transportProtocol}</td>
                    <td className="py-1.5 px-2 text-cyber-muted truncate max-w-[200px]">{svc.certificate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
