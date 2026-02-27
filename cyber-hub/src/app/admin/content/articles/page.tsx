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
  BookOpen,
  Clock,
  CheckCircle,
} from "lucide-react";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import TagInput from "@/components/admin/TagInput";

interface AdminArticle {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  status: string;
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminArticle | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const res = await fetch("/api/admin/content-articles");
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles || []);
    }
    setLoading(false);
  };

  const startNew = () => {
    setIsNew(true);
    setEditing(null);
    setTitle("");
    setDescription("");
    setContent("");
    setTags([]);
  };

  const startEdit = (article: AdminArticle) => {
    setIsNew(false);
    setEditing(article);
    setTitle(article.title);
    setDescription(article.description);
    setContent(article.content);
    setTags(article.tags);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const saveArticle = async (status: string) => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    if (isNew) {
      const res = await fetch("/api/admin/content-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, content, tags, status }),
      });
      if (res.ok) {
        await fetchArticles();
        cancelEdit();
      }
    } else if (editing) {
      const res = await fetch(`/api/admin/content-articles/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, content, tags, status }),
      });
      if (res.ok) {
        await fetchArticles();
        cancelEdit();
      }
    }
    setSaving(false);
  };

  const deleteArticle = async (id: number) => {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/admin/content-articles/${id}`, { method: "DELETE" });
    await fetchArticles();
  };

  // Editor view
  if (isNew || editing) {
    return (
      <div className="p-4 md:p-6 max-w-4xl">
        <button onClick={cancelEdit} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-text mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>

        <h1 className="text-xl font-bold text-cyber-text mb-6">
          {isNew ? "New Article" : "Edit Article"}
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2.5 text-cyber-text text-sm outline-none focus:border-cyber-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-cyber-muted mb-1">Content</label>
            <MarkdownEditor value={content} onChange={setContent} placeholder="Write your article in Markdown..." minHeight="400px" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => saveArticle("pending")}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-border/50 text-cyber-text text-sm rounded-lg hover:bg-cyber-border transition-colors disabled:opacity-50 font-mono"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={() => saveArticle("approved")}
              disabled={saving || !title.trim() || !content.trim()}
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
            <BookOpen className="w-5 h-5 text-cyber-primary" />
            Articles & Tutorials
          </h1>
          <p className="text-xs text-cyber-muted mt-1">Write and publish long-form content</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/20 text-cyber-primary text-sm rounded-lg hover:bg-cyber-primary/30 border border-cyber-primary/30 transition-colors font-mono"
        >
          <Plus className="w-4 h-4" /> New Article
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyber-primary animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="cyber-card p-8 text-center">
          <BookOpen className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
          <p className="text-cyber-muted mb-3">No articles yet</p>
          <button onClick={startNew} className="text-sm text-cyber-primary hover:underline font-mono">
            Create your first article
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {article.status === "approved" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-cyber-primary/10 text-cyber-primary rounded border border-cyber-primary/20">
                      <CheckCircle className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-cyber-warning/10 text-cyber-warning rounded border border-cyber-warning/20">
                      <Clock className="w-3 h-3" /> Draft
                    </span>
                  )}
                  <h3 className="text-sm font-medium text-cyber-text truncate">{article.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-cyber-muted">
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  {article.tags.length > 0 && (
                    <span className="flex gap-1">
                      {article.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-cyber-border/50 rounded text-[10px]">{t}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(article)}
                  className="p-2 text-cyber-muted hover:text-cyber-secondary transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const newStatus = article.status === "approved" ? "pending" : "approved";
                    fetch(`/api/admin/content-articles/${article.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: newStatus }),
                    }).then(() => fetchArticles());
                  }}
                  className="p-2 text-cyber-muted hover:text-cyber-warning transition-colors"
                  title={article.status === "approved" ? "Unpublish" : "Publish"}
                >
                  {article.status === "approved" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteArticle(article.id)}
                  className="p-2 text-cyber-muted hover:text-cyber-accent transition-colors"
                  title="Delete"
                >
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
