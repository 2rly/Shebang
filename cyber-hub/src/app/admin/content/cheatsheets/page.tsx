"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Loader2,
  ArrowLeft,
  ScrollText,
  Clock,
  CheckCircle,
  PlusCircle,
  X,
} from "lucide-react";
import TagInput from "@/components/admin/TagInput";

interface CheatsheetSection {
  title: string;
  commands?: { cmd: string; desc: string }[];
  code?: string;
}

interface AdminCheatsheet {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: CheatsheetSection[];
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const COLOR_OPTIONS = [
  { value: "cyber-primary", label: "Green", cls: "bg-cyber-primary" },
  { value: "cyber-secondary", label: "Cyan", cls: "bg-cyber-secondary" },
  { value: "cyber-accent", label: "Pink", cls: "bg-cyber-accent" },
  { value: "cyber-warning", label: "Yellow", cls: "bg-cyber-warning" },
];

export default function AdminCheatsheetsPage() {
  const [items, setItems] = useState<AdminCheatsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminCheatsheet | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("cyber-primary");
  const [tags, setTags] = useState<string[]>([]);
  const [sections, setSections] = useState<CheatsheetSection[]>([]);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/admin/cheatsheets");
    if (res.ok) {
      const data = await res.json();
      setItems(data.cheatsheets || []);
    }
    setLoading(false);
  };

  const startNew = () => {
    setIsNew(true); setEditing(null);
    setTitle(""); setDescription(""); setColor("cyber-primary");
    setTags([]); setSections([{ title: "Getting Started", commands: [{ cmd: "", desc: "" }] }]);
  };

  const startEdit = (item: AdminCheatsheet) => {
    setIsNew(false); setEditing(item);
    setTitle(item.title); setDescription(item.description);
    setColor(item.color); setTags(item.tags);
    setSections(item.content.length > 0 ? item.content : [{ title: "", commands: [{ cmd: "", desc: "" }] }]);
  };

  const cancelEdit = () => { setEditing(null); setIsNew(false); };

  const saveItem = async (status: string) => {
    if (!title.trim()) return;
    setSaving(true);

    const body = { title, description, color, icon: "Terminal", content: sections, tags, status };

    if (isNew) {
      const res = await fetch("/api/admin/cheatsheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { await fetchItems(); cancelEdit(); }
    } else if (editing) {
      const res = await fetch(`/api/admin/cheatsheets/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { await fetchItems(); cancelEdit(); }
    }
    setSaving(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this cheat sheet?")) return;
    await fetch(`/api/admin/cheatsheets/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  // Section management helpers
  const addSection = () => {
    setSections([...sections, { title: "", commands: [{ cmd: "", desc: "" }] }]);
  };

  const removeSection = (i: number) => {
    setSections(sections.filter((_, idx) => idx !== i));
  };

  const updateSectionTitle = (i: number, val: string) => {
    const updated = [...sections];
    updated[i] = { ...updated[i], title: val };
    setSections(updated);
  };

  const addCommand = (secIdx: number) => {
    const updated = [...sections];
    const cmds = updated[secIdx].commands || [];
    updated[secIdx] = { ...updated[secIdx], commands: [...cmds, { cmd: "", desc: "" }] };
    setSections(updated);
  };

  const removeCommand = (secIdx: number, cmdIdx: number) => {
    const updated = [...sections];
    const cmds = (updated[secIdx].commands || []).filter((_, i) => i !== cmdIdx);
    updated[secIdx] = { ...updated[secIdx], commands: cmds };
    setSections(updated);
  };

  const updateCommand = (secIdx: number, cmdIdx: number, field: "cmd" | "desc", val: string) => {
    const updated = [...sections];
    const cmds = [...(updated[secIdx].commands || [])];
    cmds[cmdIdx] = { ...cmds[cmdIdx], [field]: val };
    updated[secIdx] = { ...updated[secIdx], commands: cmds };
    setSections(updated);
  };

  const updateSectionCode = (i: number, val: string) => {
    const updated = [...sections];
    updated[i] = { ...updated[i], code: val, commands: undefined };
    setSections(updated);
  };

  const toggleSectionMode = (i: number) => {
    const updated = [...sections];
    if (updated[i].code !== undefined) {
      // Switch to commands mode
      updated[i] = { ...updated[i], code: undefined, commands: [{ cmd: "", desc: "" }] };
    } else {
      // Switch to code block mode
      updated[i] = { ...updated[i], commands: undefined, code: "" };
    }
    setSections(updated);
  };

  // Editor view
  if (isNew || editing) {
    return (
      <div className="p-4 md:p-6 max-w-4xl">
        <button onClick={cancelEdit} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-text mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>

        <h1 className="text-xl font-bold text-cyber-text mb-6">
          {isNew ? "New Cheat Sheet" : "Edit Cheat Sheet"}
        </h1>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Nmap Commands"
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Color</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value} type="button" onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-lg ${c.cls} ${color === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-cyber-bg" : "opacity-50 hover:opacity-80"} transition-all`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Description</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-cyber-muted">Sections</label>
              <button type="button" onClick={addSection} className="flex items-center gap-1 text-xs text-cyber-primary hover:text-cyber-primary/80 font-mono">
                <PlusCircle className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, si) => (
                <div key={si} className="cyber-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={section.title} onChange={(e) => updateSectionTitle(si, e.target.value)}
                      placeholder="Section title..."
                      className="flex-1 bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-sm text-cyber-text outline-none focus:border-cyber-accent/50 font-mono"
                    />
                    <button
                      type="button" onClick={() => toggleSectionMode(si)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-cyber-border/50 text-cyber-muted hover:text-cyber-text transition-colors"
                    >
                      {section.code !== undefined ? "Cmd/Desc" : "Code Block"}
                    </button>
                    {sections.length > 1 && (
                      <button type="button" onClick={() => removeSection(si)} className="text-cyber-muted hover:text-cyber-accent transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {section.code !== undefined ? (
                    <textarea
                      value={section.code} onChange={(e) => updateSectionCode(si, e.target.value)}
                      placeholder="Paste code block here..."
                      className="w-full bg-cyber-bg border border-cyber-border rounded p-3 text-xs text-cyber-primary font-mono outline-none resize-y min-h-[100px]"
                    />
                  ) : (
                    <div className="space-y-2">
                      {(section.commands || []).map((cmd, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <input
                            value={cmd.cmd} onChange={(e) => updateCommand(si, ci, "cmd", e.target.value)}
                            placeholder="command"
                            className="flex-1 bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-xs text-cyber-primary font-mono outline-none focus:border-cyber-accent/50"
                          />
                          <input
                            value={cmd.desc} onChange={(e) => updateCommand(si, ci, "desc", e.target.value)}
                            placeholder="description"
                            className="flex-1 bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-xs text-cyber-text outline-none focus:border-cyber-accent/50"
                          />
                          {(section.commands || []).length > 1 && (
                            <button type="button" onClick={() => removeCommand(si, ci)} className="text-cyber-muted hover:text-cyber-accent transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addCommand(si)} className="text-[10px] font-mono text-cyber-secondary hover:text-cyber-secondary/80 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add command
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => saveItem("draft")}
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-border/50 text-cyber-text text-sm rounded-lg hover:bg-cyber-border transition-colors disabled:opacity-50 font-mono"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={() => saveItem("published")}
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/20 text-cyber-primary text-sm rounded-lg hover:bg-cyber-primary/30 border border-cyber-primary/30 transition-colors disabled:opacity-50 font-mono"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cyber-text flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyber-secondary" />
            Cheat Sheets
          </h1>
          <p className="text-xs text-cyber-muted mt-1">Quick-reference technical guides</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 bg-cyber-secondary/20 text-cyber-secondary text-sm rounded-lg hover:bg-cyber-secondary/30 border border-cyber-secondary/30 transition-colors font-mono">
          <Plus className="w-4 h-4" /> New Sheet
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyber-primary animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="cyber-card p-8 text-center">
          <ScrollText className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
          <p className="text-cyber-muted mb-3">No cheat sheets yet</p>
          <button onClick={startNew} className="text-sm text-cyber-secondary hover:underline font-mono">Create your first cheat sheet</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="cyber-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center flex-shrink-0`}>
                <ScrollText className={`w-5 h-5 text-${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.status === "published" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-cyber-primary/10 text-cyber-primary rounded border border-cyber-primary/20">
                      <CheckCircle className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-cyber-warning/10 text-cyber-warning rounded border border-cyber-warning/20">
                      <Clock className="w-3 h-3" /> Draft
                    </span>
                  )}
                  <h3 className="text-sm font-medium text-cyber-text truncate">{item.title}</h3>
                </div>
                <p className="text-xs text-cyber-muted truncate">{item.description || "No description"}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 text-cyber-muted hover:text-cyber-secondary transition-colors" title="Edit">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const newStatus = item.status === "published" ? "draft" : "published";
                    fetch(`/api/admin/cheatsheets/${item.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: newStatus }),
                    }).then(() => fetchItems());
                  }}
                  className="p-2 text-cyber-muted hover:text-cyber-warning transition-colors"
                  title={item.status === "published" ? "Unpublish" : "Publish"}
                >
                  {item.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-2 text-cyber-muted hover:text-cyber-accent transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
