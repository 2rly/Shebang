"use client";

import { useState } from "react";
import {
  FileText,
  Terminal,
  Code,
  Monitor,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Plus,
  X,
  Clock,
  BookOpen,
  Shield,
  Server,
  Network,
  Lock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { defaultCheatsheets, Cheatsheet } from "@/data/cheatsheets";
import { TerminalSearchMini } from "@/components/ui/TerminalSearch";

// Documentation categories (original)
const docCategories = [
  {
    id: "siem",
    title: "SIEM Deployment",
    description: "Security Information and Event Management setup guides",
    icon: Eye,
    color: "cyber-primary",
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
    color: "cyber-secondary",
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
    color: "cyber-warning",
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
    color: "cyber-accent",
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
    color: "cyber-primary",
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
    color: "cyber-secondary",
    docs: [
      { title: "AWS Security Best Practices", slug: "aws-security" },
      { title: "Azure Security Center", slug: "azure-security" },
      { title: "GCP Security Command Center", slug: "gcp-security" },
      { title: "Multi-Cloud Security", slug: "multicloud-security" },
    ],
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  code: Code,
  monitor: Monitor,
  file: FileText,
};

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"docs" | "cheatsheets">("docs");
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>(defaultCheatsheets);
  const [activeSheet, setActiveSheet] = useState<string>(defaultCheatsheets[0].id);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["0"]));
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheet, setNewSheet] = useState({ title: "", description: "", content: "" });

  const currentSheet = cheatsheets.find((s) => s.id === activeSheet);

  const toggleSection = (index: string) => {
    const next = new Set(expandedSections);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedSections(next);
  };

  const copyToClipboard = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const filteredSections = currentSheet?.sections.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (section.title.toLowerCase().includes(query)) return true;
    if (section.commands) {
      return section.commands.some(
        (c) => c.cmd.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)
      );
    }
    if (section.code) {
      return section.code.toLowerCase().includes(query);
    }
    return false;
  });

  const addCustomCheatsheet = () => {
    if (!newSheet.title || !newSheet.content) return;
    const customSheet: Cheatsheet = {
      id: `custom-${Date.now()}`,
      title: newSheet.title,
      description: newSheet.description || "Custom cheatsheet",
      icon: "file",
      color: "cyber-accent",
      lastUpdated: new Date().toISOString().split("T")[0],
      isCustom: true,
      sections: [
        {
          title: "Custom Commands",
          commands: newSheet.content.split("\n").filter(Boolean).map((line) => {
            const [cmd, ...descParts] = line.split(" - ");
            return { cmd: cmd.trim(), desc: descParts.join(" - ").trim() || "No description" };
          }),
        },
      ],
    };
    setCheatsheets([...cheatsheets, customSheet]);
    setActiveSheet(customSheet.id);
    setNewSheet({ title: "", description: "", content: "" });
    setShowAddModal(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyber-primary" />
              <span className="text-cyber-primary">Documentation</span> & Guides
            </h1>
            <p className="text-sm text-cyber-muted mt-1">
              Comprehensive technical documentation and quick reference cheatsheets
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              activeTab === "docs"
                ? "bg-cyber-primary text-cyber-bg"
                : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text"
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab("cheatsheets")}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              activeTab === "cheatsheets"
                ? "bg-cyber-secondary text-cyber-bg"
                : "bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text"
            }`}
          >
            Cheatsheets
          </button>
        </div>

        {/* Terminal Search */}
        <TerminalSearchMini
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeTab === "docs" ? "find /docs -name '*.md'" : "grep -r 'command'"}
        />
      </div>

      {/* Documentation Tab */}
      {activeTab === "docs" && (
        <div className="flex-1 overflow-y-auto">
          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {docCategories
              .filter((cat) =>
                !searchQuery ||
                cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.docs.some((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="cyber-card overflow-hidden">
                    <div className={`p-4 border-b border-cyber-border bg-${category.color}/5`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${category.color}/20`}>
                          <Icon className={`w-5 h-5 text-${category.color}`} />
                        </div>
                        <div>
                          <h2 className="font-semibold text-cyber-text">{category.title}</h2>
                          <p className="text-xs text-cyber-muted">{category.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {category.docs.map((doc) => (
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
      )}

      {/* Cheatsheets Tab */}
      {activeTab === "cheatsheets" && (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Sidebar - Cheatsheet Selection */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-cyber-surface border border-cyber-border rounded-lg p-3 sticky top-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">
                  Available Sheets
                </h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-1 text-cyber-muted hover:text-cyber-primary"
                  title="Add custom cheatsheet"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {cheatsheets.map((sheet) => {
                  const Icon = iconMap[sheet.icon] || FileText;
                  const isActive = activeSheet === sheet.id;
                  return (
                    <button
                      key={sheet.id}
                      onClick={() => {
                        setActiveSheet(sheet.id);
                        setExpandedSections(new Set(["0"]));
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                        ${isActive
                          ? "bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30"
                          : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                        }`}
                    >
                      <Icon className={`w-4 h-4`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sheet.title}</p>
                        {sheet.isCustom && (
                          <span className="text-[10px] text-cyber-accent">Custom</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pr-2">
            {currentSheet && (
              <div>
                <div className="mb-6 pb-4 border-b border-cyber-border">
                  <h2 className="text-xl font-bold text-cyber-text">{currentSheet.title}</h2>
                  <p className="text-sm text-cyber-muted">{currentSheet.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-cyber-muted">
                    <Clock className="w-3 h-3" />
                    Last updated: {currentSheet.lastUpdated}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredSections?.map((section, idx) => (
                    <div key={idx} className="cyber-card overflow-hidden">
                      <button
                        onClick={() => toggleSection(idx.toString())}
                        className="w-full flex items-center justify-between p-4 hover:bg-cyber-border/30 transition-colors"
                      >
                        <h3 className="font-semibold text-cyber-text">{section.title}</h3>
                        {expandedSections.has(idx.toString()) ? (
                          <ChevronDown className="w-5 h-5 text-cyber-muted" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-cyber-muted" />
                        )}
                      </button>

                      {expandedSections.has(idx.toString()) && (
                        <div className="border-t border-cyber-border">
                          {section.commands ? (
                            <div className="divide-y divide-cyber-border">
                              {section.commands
                                .filter((c) =>
                                  !searchQuery ||
                                  c.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  c.desc.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((cmd, cmdIdx) => (
                                  <div
                                    key={cmdIdx}
                                    className="flex items-center gap-4 p-3 hover:bg-cyber-bg/50 group"
                                  >
                                    <code className="flex-1 text-sm font-mono text-cyber-primary bg-cyber-bg px-3 py-1.5 rounded">
                                      {cmd.cmd}
                                    </code>
                                    <span className="flex-1 text-sm text-cyber-muted">{cmd.desc}</span>
                                    <button
                                      onClick={() => copyToClipboard(cmd.cmd)}
                                      className="p-1.5 text-cyber-muted hover:text-cyber-primary transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      {copiedCmd === cmd.cmd ? (
                                        <Check className="w-4 h-4 text-cyber-primary" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                ))}
                            </div>
                          ) : section.code ? (
                            <div className="relative">
                              <button
                                onClick={() => copyToClipboard(section.code!)}
                                className="absolute top-3 right-3 p-2 bg-cyber-surface rounded hover:bg-cyber-border transition-colors"
                              >
                                {copiedCmd === section.code ? (
                                  <Check className="w-4 h-4 text-cyber-primary" />
                                ) : (
                                  <Copy className="w-4 h-4 text-cyber-muted" />
                                )}
                              </button>
                              <pre className="p-4 bg-cyber-bg overflow-x-auto">
                                <code className="text-sm font-mono text-cyber-text whitespace-pre">
                                  {section.code}
                                </code>
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-cyber-border">
              <h3 className="text-lg font-semibold text-cyber-text">Add Custom Cheatsheet</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-cyber-muted hover:text-cyber-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-cyber-muted mb-1">Title</label>
                <input
                  type="text"
                  value={newSheet.title}
                  onChange={(e) => setNewSheet({ ...newSheet, title: e.target.value })}
                  placeholder="e.g., Docker Commands"
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cyber-muted mb-1">Description</label>
                <input
                  type="text"
                  value={newSheet.description}
                  onChange={(e) => setNewSheet({ ...newSheet, description: e.target.value })}
                  placeholder="e.g., Essential Docker commands"
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cyber-muted mb-1">
                  Commands (format: <code className="text-cyber-primary">command - description</code>)
                </label>
                <textarea
                  value={newSheet.content}
                  onChange={(e) => setNewSheet({ ...newSheet, content: e.target.value })}
                  placeholder={`docker ps -a - List all containers\ndocker images - List images`}
                  rows={10}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-cyber-border">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-cyber-muted hover:text-cyber-text">
                Cancel
              </button>
              <button onClick={addCustomCheatsheet} className="cyber-btn">
                Add Cheatsheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
