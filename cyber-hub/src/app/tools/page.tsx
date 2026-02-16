"use client";

import { useState } from "react";
import {
  Wrench,
  Binary,
  Hash,
  Globe,
  Shield,
  Search,
  ChevronRight,
} from "lucide-react";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { IPLookup } from "@/components/tools/IPLookup";
import { PasswordStrength } from "@/components/tools/PasswordStrength";
import { OSINTLookup } from "@/components/tools/OSINTLookup";

const tools = [
  {
    id: "base64",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings in real-time",
    icon: Binary,
    color: "cyber-primary",
    component: Base64Tool,
  },
  {
    id: "hash",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes",
    icon: Hash,
    color: "cyber-secondary",
    component: HashGenerator,
  },
  {
    id: "ip",
    name: "IP Lookup",
    description: "Get geolocation and organization info for any IP",
    icon: Globe,
    color: "cyber-warning",
    component: IPLookup,
  },
  {
    id: "password",
    name: "Password Strength",
    description: "Analyze password complexity and get suggestions",
    icon: Shield,
    color: "cyber-accent",
    component: PasswordStrength,
  },
  {
    id: "osint",
    name: "OSINT Lookup",
    description: "Shodan, VirusTotal, DNS/WHOIS & more",
    icon: Search,
    color: "cyber-secondary",
    component: OSINTLookup,
  },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState(tools[0].id);
  const currentTool = tools.find((t) => t.id === activeTool)!;
  const ToolComponent = currentTool.component;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-3">
          <div className="p-2 bg-cyber-primary/20 rounded-lg">
            <Wrench className="w-6 h-6 text-cyber-primary" />
          </div>
          <span>
            Cyber-<span className="text-cyber-primary">Tools</span> Suite
          </span>
        </h1>
        <p className="text-sm text-cyber-muted mt-2">
          Essential security utilities — the Swiss Army Knife for security professionals
        </p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Tool Selector */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 px-2">
              Available Tools
            </h3>
            <div className="space-y-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group
                      ${isActive
                        ? `bg-${tool.color}/10 border border-${tool.color}/30`
                        : "hover:bg-cyber-border/50"
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? `bg-${tool.color}/20` : "bg-cyber-bg"}`}>
                      <Icon className={`w-5 h-5 ${isActive ? `text-${tool.color}` : "text-cyber-muted group-hover:text-cyber-text"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? `text-${tool.color}` : "text-cyber-text"}`}>
                        {tool.name}
                      </p>
                      <p className="text-xs text-cyber-muted truncate">
                        {tool.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all ${isActive ? `text-${tool.color}` : "text-cyber-muted opacity-0 group-hover:opacity-100"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-4 bg-cyber-surface border border-cyber-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2">
              Pro Tips
            </h4>
            <ul className="space-y-2 text-xs text-cyber-muted">
              <li className="flex items-start gap-2">
                <span className="text-cyber-primary">•</span>
                All tools run client-side for privacy
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-secondary">•</span>
                No data is sent to external servers (except IP lookup)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-warning">•</span>
                Click output to copy to clipboard
              </li>
            </ul>
          </div>
        </div>

        {/* Tool Content */}
        <div className="flex-1 min-h-0">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg h-full flex flex-col">
            {/* Tool Header */}
            <div className={`p-4 border-b border-cyber-border bg-${currentTool.color}/5`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${currentTool.color}/20`}>
                  <currentTool.icon className={`w-5 h-5 text-${currentTool.color}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-cyber-text">{currentTool.name}</h2>
                  <p className="text-xs text-cyber-muted">{currentTool.description}</p>
                </div>
              </div>
            </div>

            {/* Tool Body */}
            <div className="flex-1 p-4 overflow-y-auto">
              <ToolComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
