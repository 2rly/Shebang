"use client";

import { useState } from "react";
import {
  Wrench,
  Binary,
  Hash,
  Globe,
  Shield,
  Search,
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
    shortDesc: "Encode & decode strings",
    icon: Binary,
    activeClasses: "border-cyber-primary bg-cyber-primary/10 text-cyber-primary",
    iconBg: "bg-cyber-primary/20",
    iconColor: "text-cyber-primary",
    component: Base64Tool,
  },
  {
    id: "hash",
    name: "Hash Generator",
    shortDesc: "MD5, SHA-1, SHA-256 hashes",
    icon: Hash,
    activeClasses: "border-cyber-secondary bg-cyber-secondary/10 text-cyber-secondary",
    iconBg: "bg-cyber-secondary/20",
    iconColor: "text-cyber-secondary",
    component: HashGenerator,
  },
  {
    id: "ip",
    name: "IP Lookup",
    shortDesc: "Geolocation & org info",
    icon: Globe,
    activeClasses: "border-cyber-warning bg-cyber-warning/10 text-cyber-warning",
    iconBg: "bg-cyber-warning/20",
    iconColor: "text-cyber-warning",
    component: IPLookup,
  },
  {
    id: "password",
    name: "Password Strength",
    shortDesc: "Analyze complexity",
    icon: Shield,
    activeClasses: "border-cyber-accent bg-cyber-accent/10 text-cyber-accent",
    iconBg: "bg-cyber-accent/20",
    iconColor: "text-cyber-accent",
    component: PasswordStrength,
  },
  {
    id: "osint",
    name: "OSINT Lookup",
    shortDesc: "Shodan, VirusTotal & more",
    icon: Search,
    activeClasses: "border-cyber-secondary bg-cyber-secondary/10 text-cyber-secondary",
    iconBg: "bg-cyber-secondary/20",
    iconColor: "text-cyber-secondary",
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
      <div className="mb-4">
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

      {/* Horizontal Tool Selector */}
      <div className="mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-cyber-border">
        <div className="flex flex-row gap-3 min-w-max pb-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all whitespace-nowrap
                  ${isActive
                    ? tool.activeClasses
                    : "border-cyber-border bg-cyber-surface text-cyber-text hover:bg-cyber-border/50 hover:border-cyber-muted"
                  }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? tool.iconBg : "bg-cyber-bg"}`}>
                  <Icon className={`w-5 h-5 ${isActive ? tool.iconColor : "text-cyber-muted"}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">
                    {tool.name}
                  </p>
                  <p className="text-xs text-cyber-muted leading-tight mt-0.5">
                    {tool.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Content */}
      <div className="flex-1 min-h-0">
        <div className="bg-cyber-surface border border-cyber-border rounded-lg h-full flex flex-col">
          {/* Tool Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            <ToolComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
