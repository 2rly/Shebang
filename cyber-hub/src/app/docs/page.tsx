"use client";

import { useState } from "react";
import {
  FileText,
  Terminal,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  Shield,
  Server,
  Network,
  Lock,
  Eye,
  Search,
} from "lucide-react";
import Link from "next/link";
import { TerminalSearchMini } from "@/components/ui/TerminalSearch";

const docCategories = [
  {
    id: "siem",
    title: "SIEM Deployment",
    description: "Security Information and Event Management setup guides",
    icon: Eye,
    headerBg: "bg-cyber-primary/5",
    iconBg: "bg-cyber-primary/20",
    iconText: "text-cyber-primary",
    docs: [
      { title: "Splunk Enterprise Setup", slug: "splunk-setup" },
      { title: "ELK Stack Configuration", slug: "elk-config" },
      { title: "Wazuh Installation Guide", slug: "wazuh-install" },
      { title: "QRadar Quick Start", slug: "qradar-start" },
    ],
  },
  {
    id: "edr",
    title: "EDR Solutions",
    description: "Endpoint Detection and Response implementation",
    icon: Shield,
    headerBg: "bg-cyber-secondary/5",
    iconBg: "bg-cyber-secondary/20",
    iconText: "text-cyber-secondary",
    docs: [
      { title: "CrowdStrike Falcon Deploy", slug: "crowdstrike-deploy" },
      { title: "Carbon Black Setup", slug: "carbonblack-setup" },
      { title: "Microsoft Defender ATP", slug: "defender-atp" },
      { title: "SentinelOne Configuration", slug: "sentinelone-config" },
    ],
  },
  {
    id: "firewalls",
    title: "Firewalls & Network Security",
    description: "Network perimeter defense configurations",
    icon: Network,
    headerBg: "bg-cyber-warning/5",
    iconBg: "bg-cyber-warning/20",
    iconText: "text-cyber-warning",
    docs: [
      { title: "pfSense Complete Guide", slug: "pfsense-guide" },
      { title: "Palo Alto Basics", slug: "paloalto-basics" },
      { title: "Fortinet FortiGate Setup", slug: "fortigate-setup" },
      { title: "Suricata IDS/IPS", slug: "suricata-ids" },
    ],
  },
  {
    id: "hardening",
    title: "System Hardening",
    description: "OS and application security hardening guides",
    icon: Lock,
    headerBg: "bg-cyber-accent/5",
    iconBg: "bg-cyber-accent/20",
    iconText: "text-cyber-accent",
    docs: [
      { title: "Linux Server Hardening", slug: "linux-hardening" },
      { title: "Windows Security Baseline", slug: "windows-baseline" },
      { title: "Docker Security Best Practices", slug: "docker-security" },
      { title: "Kubernetes Security", slug: "k8s-security" },
    ],
  },
  {
    id: "tools",
    title: "Security Tools",
    description: "Penetration testing and security assessment tools",
    icon: Terminal,
    headerBg: "bg-cyber-primary/5",
    iconBg: "bg-cyber-primary/20",
    iconText: "text-cyber-primary",
    docs: [
      { title: "Nmap Cheatsheet", slug: "nmap-cheatsheet" },
      { title: "Metasploit Framework", slug: "metasploit-guide" },
      { title: "Burp Suite Essentials", slug: "burp-suite" },
      { title: "Wireshark Analysis", slug: "wireshark-analysis" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud Security",
    description: "AWS, Azure, and GCP security configurations",
    icon: Server,
    headerBg: "bg-cyber-secondary/5",
    iconBg: "bg-cyber-secondary/20",
    iconText: "text-cyber-secondary",
    docs: [
      { title: "AWS Security Best Practices", slug: "aws-security" },
      { title: "Azure Security Center", slug: "azure-security" },
      { title: "GCP Security Command Center", slug: "gcp-security" },
      { title: "Multi-Cloud Security", slug: "multicloud-security" },
    ],
  },
];

export default function DocsPage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const copyToClipboard = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const filteredCategories = docCategories.filter((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.docs.some((d) => d.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyber-primary" />
            <span className="text-cyber-primary">Documentation</span> & Guides
          </h1>
          <p className="text-sm text-cyber-muted mt-1">
            Comprehensive technical documentation for security operations
          </p>
        </div>

        {/* Terminal Search — full width */}
        <TerminalSearchMini
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="find /docs -name '*.md'"
        />
      </div>

      {/* Documentation Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="cyber-card overflow-hidden">
                <div className={`p-4 border-b border-cyber-border ${category.headerBg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.iconBg}`}>
                      <Icon className={`w-5 h-5 ${category.iconText}`} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-cyber-text">{category.title}</h2>
                      <p className="text-xs text-cyber-muted">{category.description}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {category.docs
                    .filter((doc) =>
                      !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((doc) => (
                      <Link
                        key={doc.slug}
                        href={`/docs/${category.id}/${doc.slug}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg
                                 text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50
                                 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-cyber-muted">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No documentation found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* Quick Reference */}
        <div className="cyber-card p-6">
          <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-primary" />
            Quick Reference Commands
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cmd: "nmap -sV -sC target", desc: "Service version scan" },
              { cmd: "tcpdump -i eth0 -w capture.pcap", desc: "Packet capture" },
              { cmd: "fail2ban-client status", desc: "Check ban status" },
              { cmd: "ss -tulpn", desc: "List listening ports" },
              { cmd: "ausearch -m avc -ts recent", desc: "SELinux audit" },
              { cmd: "journalctl -u sshd -f", desc: "SSH logs live" },
            ].map((item, i) => (
              <div key={i} className="bg-cyber-bg p-3 rounded-lg border border-cyber-border group">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-cyber-primary font-mono">{item.cmd}</code>
                  <button
                    onClick={() => copyToClipboard(item.cmd)}
                    className="p-1 text-cyber-muted hover:text-cyber-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copiedCmd === item.cmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs text-cyber-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
