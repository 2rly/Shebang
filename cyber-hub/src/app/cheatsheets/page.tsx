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
} from "lucide-react";
import { defaultCheatsheets, Cheatsheet } from "@/data/cheatsheets";
import { TerminalSearch } from "@/components/ui/TerminalSearch";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  code: Code,
  monitor: Monitor,
  file: FileText,
};

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

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-3">
              <div className="p-2 bg-cyber-secondary/20 rounded-lg">
                <ScrollText className="w-6 h-6 text-cyber-secondary" />
              </div>
              <span>
                Security <span className="text-cyber-secondary">Cheatsheets</span>
              </span>
            </h1>
            <p className="text-sm text-cyber-muted mt-2">
              Quick reference commands for Linux, Python, Windows security operations
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="cyber-btn flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom
          </button>
        </div>

        {/* Terminal Search */}
        <div className="flex gap-3 items-end">
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
      </div>

      {/* Main Content */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar - Cheatsheet Selection */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 px-2">
              Available Cheatsheets
            </h3>
            <div className="space-y-1">
              {cheatsheets.map((sheet) => {
                const Icon = iconMap[sheet.icon] || FileText;
                const isActive = activeSheet === sheet.id;
                return (
                  <div key={sheet.id} className="relative group">
                    <button
                      onClick={() => {
                        setActiveSheet(sheet.id);
                        setExpandedSections(new Set(["0"]));
                        setExpandAll(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                        ${isActive
                          ? `bg-${sheet.color}/10 border border-${sheet.color}/30`
                          : "hover:bg-cyber-border/50"
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? `bg-${sheet.color}/20` : "bg-cyber-bg"}`}>
                        <Icon className={`w-4 h-4 ${isActive ? `text-${sheet.color}` : "text-cyber-muted"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? `text-${sheet.color}` : "text-cyber-text"}`}>
                          {sheet.title}
                        </p>
                        <p className="text-xs text-cyber-muted truncate">{sheet.description}</p>
                      </div>
                      {isActive && (
                        <ChevronRight className={`w-4 h-4 text-${sheet.color}`} />
                      )}
                    </button>
                    {sheet.isCustom && (
                      <button
                        onClick={() => deleteCustomSheet(sheet.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cyber-muted hover:text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Stats Card */}
          <div className="mt-4 bg-cyber-surface border border-cyber-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3">
              Current Sheet Stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-cyber-muted">Sections</span>
                <span className="text-cyber-secondary font-mono">{currentSheet?.sections.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Commands</span>
                <span className="text-cyber-primary font-mono">{totalCommands}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Last Updated</span>
                <span className="text-cyber-text font-mono text-xs">{currentSheet?.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="mt-4 bg-cyber-surface border border-cyber-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2">
              Pro Tips
            </h4>
            <ul className="space-y-2 text-xs text-cyber-muted">
              <li className="flex items-start gap-2">
                <span className="text-cyber-primary">•</span>
                Click any command to copy
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-secondary">•</span>
                Use search to filter commands
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-warning">•</span>
                Add custom sheets for your workflows
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content - Commands */}
        <div className="flex-1 overflow-y-auto pr-2">
          {currentSheet && (
            <div>
              {/* Sheet Header */}
              <div className="mb-6 pb-4 border-b border-cyber-border">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const Icon = iconMap[currentSheet.icon] || FileText;
                    return (
                      <div className={`p-2 rounded-lg bg-${currentSheet.color}/20`}>
                        <Icon className={`w-6 h-6 text-${currentSheet.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-xl font-bold text-cyber-text">{currentSheet.title}</h2>
                    <p className="text-sm text-cyber-muted">{currentSheet.description}</p>
                  </div>
                  {currentSheet.isCustom && (
                    <span className="px-2 py-1 text-xs bg-cyber-accent/20 text-cyber-accent rounded-full ml-auto">
                      Custom
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-cyber-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {currentSheet.lastUpdated}
                  </div>
                  <div className="flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    {totalCommands} commands
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {currentSheet.sections.length} sections
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {filteredSections?.map((section, idx) => (
                  <div key={idx} className="cyber-card overflow-hidden">
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
                  <div className="text-center py-12 text-cyber-muted">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No commands found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
                <p className="text-xs text-cyber-muted mt-1">One command per line. Use " - " to separate command from description.</p>
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
