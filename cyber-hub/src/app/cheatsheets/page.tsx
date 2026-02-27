"use client";

import { useState } from "react";
import {
  Terminal,
  Code,
  Monitor,
  FileText,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Plus,
  X,
  Clock,
  ScrollText,
  Filter,
  Search,
} from "lucide-react";
import { defaultCheatsheets, Cheatsheet } from "@/data/cheatsheets";
import { TerminalSearch } from "@/components/ui/TerminalSearch";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  code: Code,
  monitor: Monitor,
  file: FileText,
};

/* Static Tailwind class maps — avoids dynamic template literals that JIT can't detect */
const colorStyles: Record<string, {
  activeBorder: string;
  activeBg: string;
  activeText: string;
  iconBg: string;
  iconText: string;
  badge: string;
}> = {
  "cyber-warning": {
    activeBorder: "border-cyber-warning",
    activeBg: "bg-cyber-warning/10",
    activeText: "text-cyber-warning",
    iconBg: "bg-cyber-warning/20",
    iconText: "text-cyber-warning",
    badge: "bg-cyber-warning/20 text-cyber-warning",
  },
  "cyber-secondary": {
    activeBorder: "border-cyber-secondary",
    activeBg: "bg-cyber-secondary/10",
    activeText: "text-cyber-secondary",
    iconBg: "bg-cyber-secondary/20",
    iconText: "text-cyber-secondary",
    badge: "bg-cyber-secondary/20 text-cyber-secondary",
  },
  "cyber-primary": {
    activeBorder: "border-cyber-primary",
    activeBg: "bg-cyber-primary/10",
    activeText: "text-cyber-primary",
    iconBg: "bg-cyber-primary/20",
    iconText: "text-cyber-primary",
    badge: "bg-cyber-primary/20 text-cyber-primary",
  },
  "cyber-accent": {
    activeBorder: "border-cyber-accent",
    activeBg: "bg-cyber-accent/10",
    activeText: "text-cyber-accent",
    iconBg: "bg-cyber-accent/20",
    iconText: "text-cyber-accent",
    badge: "bg-cyber-accent/20 text-cyber-accent",
  },
};

function getColorStyle(color: string) {
  return colorStyles[color] || colorStyles["cyber-primary"];
}

export default function CheatsheetsPage() {
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>(defaultCheatsheets);
  const [activeSheet, setActiveSheet] = useState<string>(defaultCheatsheets[0].id);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["0"]));
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheet, setNewSheet] = useState({ title: "", description: "", content: "" });
  const [expandAll, setExpandAll] = useState(false);

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

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedSections(new Set(["0"]));
    } else {
      const allIndices = currentSheet?.sections.map((_, i) => i.toString()) || [];
      setExpandedSections(new Set(allIndices));
    }
    setExpandAll(!expandAll);
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

  const totalCommands = currentSheet?.sections.reduce((acc, section) => {
    return acc + (section.commands?.length || 0);
  }, 0) || 0;

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

  const deleteCustomSheet = (id: string) => {
    const sheet = cheatsheets.find(s => s.id === id);
    if (!sheet?.isCustom) return;
    if (confirm(`Delete "${sheet.title}"?`)) {
      const newSheets = cheatsheets.filter(s => s.id !== id);
      setCheatsheets(newSheets);
      if (activeSheet === id) {
        setActiveSheet(newSheets[0]?.id || "");
      }
    }
  };

  const cs = currentSheet ? getColorStyle(currentSheet.color) : getColorStyle("cyber-primary");

  return (
    <div className="p-3 md:p-6 h-full flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-3">
            <div className="p-2 bg-cyber-secondary/20 rounded-lg">
              <ScrollText className="w-6 h-6 text-cyber-secondary" />
            </div>
            <span>
              Security <span className="text-cyber-secondary">Cheatsheets</span>
            </span>
          </h1>

          {/* Inline Stats Badges */}
          {currentSheet && (
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyber-surface border border-cyber-border text-cyber-secondary">
                {currentSheet.sections.length} sections
              </span>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyber-surface border border-cyber-border text-cyber-primary">
                {totalCommands} cmds
              </span>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyber-surface border border-cyber-border text-cyber-muted">
                <Clock className="w-3 h-3 inline mr-1" />
                {currentSheet.lastUpdated}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="cyber-btn flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Custom
        </button>
      </div>

      {/* Horizontal Category Tabs */}
      <div className="mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-cyber-border">
        <div className="flex flex-row gap-3 min-w-max pb-2">
          {cheatsheets.map((sheet) => {
            const Icon = iconMap[sheet.icon] || FileText;
            const isActive = activeSheet === sheet.id;
            const styles = getColorStyle(sheet.color);
            return (
              <div key={sheet.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveSheet(sheet.id);
                    setExpandedSections(new Set(["0"]));
                    setExpandAll(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all whitespace-nowrap
                    ${isActive
                      ? `${styles.activeBorder} ${styles.activeBg} ${styles.activeText}`
                      : "border-cyber-border bg-cyber-surface text-cyber-text hover:bg-cyber-border/50 hover:border-cyber-muted"
                    }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? styles.iconBg : "bg-cyber-bg"}`}>
                    <Icon className={`w-5 h-5 ${isActive ? styles.iconText : "text-cyber-muted"}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">
                      {sheet.title}
                    </p>
                    <p className="text-xs text-cyber-muted leading-tight mt-0.5">
                      {sheet.description}
                    </p>
                  </div>
                </button>
                {sheet.isCustom && (
                  <button
                    onClick={() => deleteCustomSheet(sheet.id)}
                    className="absolute -top-1 -right-1 p-1 bg-cyber-surface border border-cyber-border rounded-full text-cyber-muted hover:text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete custom cheatsheet"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-width Terminal Search */}
      <div className="flex gap-3 items-end mb-6">
        <TerminalSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="nmap, ssh, powershell..."
          prefix="cheatsheets"
          className="flex-1"
        />
        <button
          onClick={toggleExpandAll}
          className="px-4 py-3 bg-cyber-surface border border-cyber-border rounded-lg text-sm text-cyber-muted hover:text-cyber-text hover:border-cyber-primary transition-colors flex items-center gap-2 font-mono"
        >
          <Filter className="w-4 h-4" />
          {expandAll ? "collapse" : "expand"}
        </button>
      </div>

      {/* Command Sections — responsive grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {currentSheet && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSections?.map((section, idx) => (
              <div
                key={idx}
                className={`cyber-card overflow-hidden ${
                  /* Expand wide sections (code blocks or many commands) to full width */
                  section.code || (section.commands && section.commands.length > 8)
                    ? "lg:col-span-2 xl:col-span-3"
                    : ""
                }`}
              >
                <button
                  onClick={() => toggleSection(idx.toString())}
                  className="w-full flex items-center justify-between p-4 hover:bg-cyber-border/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyber-bg flex items-center justify-center text-cyber-muted font-mono text-sm">
                      {idx + 1}
                    </div>
                    <h3 className="font-semibold text-cyber-text">{section.title}</h3>
                    {section.commands && (
                      <span className="text-xs text-cyber-muted px-2 py-0.5 bg-cyber-bg rounded-full">
                        {section.commands.length} cmds
                      </span>
                    )}
                  </div>
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
                              className="flex items-center gap-4 p-3 hover:bg-cyber-bg/50 group cursor-pointer"
                              onClick={() => copyToClipboard(cmd.cmd)}
                            >
                              <code className="flex-1 text-sm font-mono text-cyber-primary bg-cyber-bg px-3 py-1.5 rounded border border-cyber-border/50">
                                {cmd.cmd}
                              </code>
                              <span className="flex-1 text-sm text-cyber-muted">{cmd.desc}</span>
                              <div className="p-1.5 text-cyber-muted group-hover:text-cyber-primary transition-colors">
                                {copiedCmd === cmd.cmd ? (
                                  <Check className="w-4 h-4 text-cyber-primary" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : section.code ? (
                      <div className="relative">
                        <button
                          onClick={() => copyToClipboard(section.code!)}
                          className="absolute top-3 right-3 p-2 bg-cyber-surface rounded hover:bg-cyber-border transition-colors z-10"
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

            {filteredSections?.length === 0 && (
              <div className="col-span-full text-center py-12 text-cyber-muted">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No commands found matching &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Custom Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-cyber-border">
              <h3 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyber-primary" />
                Add Custom Cheatsheet
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-cyber-muted hover:text-cyber-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-cyber-muted mb-1">Title *</label>
                <input
                  type="text"
                  value={newSheet.title}
                  onChange={(e) => setNewSheet({ ...newSheet, title: e.target.value })}
                  placeholder="e.g., Docker Security Commands"
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cyber-muted mb-1">Description</label>
                <input
                  type="text"
                  value={newSheet.description}
                  onChange={(e) => setNewSheet({ ...newSheet, description: e.target.value })}
                  placeholder="e.g., Essential Docker security commands and best practices"
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cyber-muted mb-1">
                  Commands * <span className="text-cyber-primary">(format: command - description)</span>
                </label>
                <textarea
                  value={newSheet.content}
                  onChange={(e) => setNewSheet({ ...newSheet, content: e.target.value })}
                  placeholder={`docker scan myimage - Scan image for vulnerabilities
docker run --read-only - Run container with read-only filesystem
docker run --cap-drop ALL - Drop all Linux capabilities
docker inspect --format='{{.Config.User}}' container - Check container user`}
                  rows={12}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 focus:border-cyber-primary focus:outline-none text-sm font-mono"
                />
                <p className="text-xs text-cyber-muted mt-1">One command per line. Use &quot; - &quot; to separate command from description.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-cyber-border">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-cyber-muted hover:text-cyber-text">
                Cancel
              </button>
              <button
                onClick={addCustomCheatsheet}
                disabled={!newSheet.title || !newSheet.content}
                className="cyber-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Cheatsheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
