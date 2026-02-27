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
  FileText,
  Clock,
  CheckCircle,
  FolderOpen,
} from "lucide-react";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import TagInput from "@/components/admin/TagInput";

interface AdminDoc {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const DOC_CATEGORIES = [
  "SIEM Deployment",
  "EDR Solutions",
  "Firewalls & Network Security",
  "System Hardening",
  "Security Tools",
  "Cloud Security",
  "Troubleshooting",
  "VirtualBox & VMs",
  "General",
];

export default function AdminDocsPage() {
  const [items, setItems] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminDoc | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const res = await fetch("/api/admin/docs");
    if (res.ok) {
      const data = await res.json();
      setItems(data.docs || []);
    }
    setLoading(false);
  };

  const startNew = () => {
    setIsNew(true); setEditing(null);
    setTitle(""); setDescription(""); setCategory("General");
    setContent(""); setTags([]);
  };

  const startEdit = (item: AdminDoc) => {
    setIsNew(false); setEditing(item);
    setTitle(item.title); setDescription(item.description);
    setCategory(item.category); setContent(item.content); setTags(item.tags);
  };

  const cancelEdit = () => { setEditing(null); setIsNew(false); };

  const saveItem = async (status: string) => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    const body = { title, description, category, content, tags, status };

    if (isNew) {
      const res = await fetch("/api/admin/docs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { await fetchItems(); cancelEdit(); }
    } else if (editing) {
      const res = await fetch(`/api/admin/docs/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { await fetchItems(); cancelEdit(); }
    }
    setSaving(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/admin/docs/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  const filteredItems = filterCat ? items.filter((d) => d.category === filterCat) : items;
  const categories = [...new Set(items.map((d) => d.category))];

  // Editor view
  if (isNew || editing) {
    return (
      <div className="p-4 md:p-6 max-w-4xl">
        <button onClick={cancelEdit} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-text mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>

        <h1 className="text-xl font-bold text-cyber-text mb-6">
          {isNew ? "New Document" : "Edit Document"}
        </h1>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VirtualBox Kali Linux Fix"
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Category</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors font-mono"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Description</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this document..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Content</label>
            <MarkdownEditor value={content} onChange={setContent} placeholder="Write documentation in Markdown..." minHeight="400px" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => saveItem("draft")}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-border/50 text-cyber-text text-sm rounded-lg hover:bg-cyber-border transition-colors disabled:opacity-50 font-mono"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={() => saveItem("published")}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-warning/20 text-cyber-warning text-sm rounded-lg hover:bg-cyber-warning/30 border border-cyber-warning/30 transition-colors disabled:opacity-50 font-mono"
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
            <FileText className="w-5 h-5 text-cyber-warning" />
            Documentation
          </h1>
          <p className="text-xs text-cyber-muted mt-1">System guides and troubleshooting docs</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 bg-cyber-warning/20 text-cyber-warning text-sm rounded-lg hover:bg-cyber-warning/30 border border-cyber-warning/30 transition-colors font-mono">
          <Plus className="w-4 h-4" /> New Document
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterCat("")}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${!filterCat ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30" : "text-cyber-muted hover:text-cyber-text bg-cyber-border/30"}`}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${filterCat === cat ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30" : "text-cyber-muted hover:text-cyber-text bg-cyber-border/30"}`}
            >
              {cat} ({items.filter((d) => d.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyber-primary animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="cyber-card p-8 text-center">
          <FileText className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
          <p className="text-cyber-muted mb-3">No documents yet</p>
          <button onClick={startNew} className="text-sm text-cyber-warning hover:underline font-mono">Create your first document</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyber-warning/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-cyber-warning" />
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
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyber-border/50 text-cyber-muted rounded">{item.category}</span>
                  <h3 className="text-sm font-medium text-cyber-text truncate">{item.title}</h3>
                </div>
                <p className="text-xs text-cyber-muted truncate">{item.description || "No description"}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 text-cyber-muted hover:text-cyber-secondary transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                <button
                  onClick={() => {
                    const newStatus = item.status === "published" ? "draft" : "published";
                    fetch(`/api/admin/docs/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) }).then(() => fetchItems());
                  }}
                  className="p-2 text-cyber-muted hover:text-cyber-warning transition-colors"
                  title={item.status === "published" ? "Unpublish" : "Publish"}
                >
                  {item.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-2 text-cyber-muted hover:text-cyber-accent transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
