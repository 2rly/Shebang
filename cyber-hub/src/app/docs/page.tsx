"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { TerminalSearchMini } from "@/components/ui/TerminalSearch";

interface PublishedDoc {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

const categoryMeta: Record<string, { icon: typeof FileText; color: string; bgColor: string; headerBg: string }> = {
  "SIEM Deployment": { icon: Eye, color: "text-cyber-primary", bgColor: "bg-cyber-primary/20", headerBg: "bg-cyber-primary/5" },
  "EDR Solutions": { icon: Shield, color: "text-cyber-secondary", bgColor: "bg-cyber-secondary/20", headerBg: "bg-cyber-secondary/5" },
  "Firewalls & Network Security": { icon: Network, color: "text-cyber-warning", bgColor: "bg-cyber-warning/20", headerBg: "bg-cyber-warning/5" },
  "System Hardening": { icon: Lock, color: "text-cyber-accent", bgColor: "bg-cyber-accent/20", headerBg: "bg-cyber-accent/5" },
  "Security Tools": { icon: Terminal, color: "text-cyber-primary", bgColor: "bg-cyber-primary/20", headerBg: "bg-cyber-primary/5" },
  "Cloud Security": { icon: Server, color: "text-cyber-secondary", bgColor: "bg-cyber-secondary/20", headerBg: "bg-cyber-secondary/5" },
  "Troubleshooting": { icon: Terminal, color: "text-cyber-warning", bgColor: "bg-cyber-warning/20", headerBg: "bg-cyber-warning/5" },
  "VirtualBox & VMs": { icon: Server, color: "text-cyber-accent", bgColor: "bg-cyber-accent/20", headerBg: "bg-cyber-accent/5" },
  "General": { icon: FileText, color: "text-cyber-muted", bgColor: "bg-cyber-border/50", headerBg: "bg-cyber-border/10" },
};

const defaultMeta = { icon: FileText, color: "text-cyber-primary", bgColor: "bg-cyber-primary/20", headerBg: "bg-cyber-primary/5" };

export default function DocsPage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [docs, setDocs] = useState<PublishedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((data) => setDocs(data.docs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Group docs by category
  const grouped = docs.reduce<Record<string, PublishedDoc[]>>((acc, doc) => {
    const cat = doc.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const filteredCategories = Object.entries(grouped).filter(([cat, items]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.toLowerCase().includes(q) ||
      items.some(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="p-3 md:p-6 h-full flex flex-col">
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

        <TerminalSearchMini
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="find /docs -name '*.md'"
        />
      </div>

      {/* Documentation Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyber-primary animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-cyber-muted mx-auto mb-3 opacity-30" />
            <p className="text-cyber-muted mb-2">No published documents yet</p>
            <p className="text-xs text-cyber-muted">Documents created in the admin panel will appear here once published.</p>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8">
              {filteredCategories.map(([category, items]) => {
                const meta = categoryMeta[category] || defaultMeta;
                const Icon = meta.icon;

                const filteredItems = searchQuery
                  ? items.filter(
                      (d) =>
                        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : items;

                if (filteredItems.length === 0) return null;

                return (
                  <div key={category} className="cyber-card overflow-hidden">
                    <div className={`p-4 border-b border-cyber-border ${meta.headerBg}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${meta.bgColor}`}>
                          <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>
                        <div>
                          <h2 className="font-semibold text-cyber-text">{category}</h2>
                          <p className="text-xs text-cyber-muted">{filteredItems.length} document{filteredItems.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {filteredItems.map((doc) => (
                        <Link
                          key={doc.slug}
                          href={`/docs/${doc.slug}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg
                                   text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50
                                   transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm block truncate">{doc.title}</span>
                              {doc.description && (
                                <span className="text-[10px] text-cyber-muted block truncate">{doc.description}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
          </>
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
