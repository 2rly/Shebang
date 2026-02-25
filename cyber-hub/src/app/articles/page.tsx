"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  User,
  Tag,
  TrendingUp,
  Calendar,
  PenTool,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DbArticle } from "@/types";

const popularTags = [
  "SIEM",
  "Threat Hunting",
  "Kubernetes",
  "Cloud Security",
  "Zero Trust",
  "DevSecOps",
  "Incident Response",
  "API Security",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ArticlesPage() {
  const { user, setShowAuthModal } = useAuth();
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Submit form
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitArticle = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      setSubmitted(true);
      setTitle("");
      setDescription("");
      setContent("");
      setTags("");
    }
    setSubmitting(false);
  };

  const filtered = activeTag
    ? articles.filter((a) => a.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : articles;

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyber-text mb-2">
          <span className="text-cyber-warning">Engineering</span> Articles
        </h1>
        <p className="text-cyber-muted max-w-2xl">
          In-depth technical articles on cybersecurity engineering, best
          practices, and emerging threats. Community-submitted, admin-reviewed.
        </p>
      </div>

      {/* Submit Article Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 bg-cyber-surface border border-cyber-border rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowSubmit(false); setSubmitted(false); }} className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text">
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-cyber-primary mx-auto mb-4" />
                <h2 className="text-lg font-bold text-cyber-text mb-2 font-mono">Article Submitted!</h2>
                <p className="text-sm text-cyber-muted">
                  Your article is pending review. An admin will approve it before it appears publicly.
                </p>
                <button
                  onClick={() => { setShowSubmit(false); setSubmitted(false); }}
                  className="mt-4 px-6 py-2 rounded-lg font-mono text-sm bg-cyber-primary/20 border border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/30 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-cyber-text mb-4 font-mono flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-cyber-warning" />
                  Submit Article
                </h2>
                <p className="text-xs text-cyber-muted mb-4">
                  Articles are reviewed by an admin before publishing. Markdown is supported in the content field.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono"
                      placeholder="Implementing Zero Trust Architecture"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Short Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono"
                      placeholder="A comprehensive guide to..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Content (Markdown)</label>
                    <textarea
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono resize-none"
                      placeholder="## Introduction&#10;&#10;Write your article content here..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">
                      Tags <span className="text-cyber-muted/60">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono"
                      placeholder="Zero Trust, Architecture, Enterprise"
                    />
                  </div>
                  <button
                    onClick={handleSubmitArticle}
                    disabled={submitting || !title.trim() || !content.trim()}
                    className="w-full py-2.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider bg-cyber-warning/20 border border-cyber-warning/50 text-cyber-warning hover:bg-cyber-warning/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyber-primary animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        /* Empty state — show CTA and placeholder when no articles exist in DB */
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-cyber-muted/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-cyber-text mb-2">No articles yet</h2>
          <p className="text-cyber-muted mb-6 max-w-md mx-auto">
            Be the first to contribute! Submit an article and it will appear here once approved by an admin.
          </p>
          <button
            onClick={() => {
              if (!user) { setShowAuthModal(true); return; }
              setShowSubmit(true);
            }}
            className="cyber-btn-secondary inline-flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            Submit Article
          </button>
        </div>
      ) : (
        <>
          {/* Featured Articles */}
          {featured.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyber-primary" />
                {activeTag ? `Tagged: ${activeTag}` : "Latest Articles"}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featured.map((article) => (
                  <div key={article.id} className="cyber-card p-6 group">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-1 text-xs font-mono bg-cyber-primary/20 text-cyber-primary rounded">
                        APPROVED
                      </span>
                      <span className="text-xs text-cyber-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.ceil(article.content.length / 1500)} min read
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-cyber-text mb-2 group-hover:text-cyber-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-cyber-muted mb-4 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-cyber-muted">
                        <User className="w-4 h-4" />
                        {article.authorName}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-cyber-muted">
                        <Calendar className="w-4 h-4" />
                        {timeAgo(article.createdAt)}
                      </div>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {article.tags.map((tag) => (
                          <span key={tag} className="cyber-tag text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* More Articles */}
            <div className="lg:col-span-2">
              {rest.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyber-secondary" />
                    More Articles
                  </h2>
                  <div className="space-y-4">
                    {rest.map((article) => (
                      <div key={article.id} className="cyber-card p-4 flex gap-4 group">
                        <div className="flex-1">
                          <h3 className="font-medium text-cyber-text mb-1 group-hover:text-cyber-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-cyber-muted line-clamp-2 mb-2">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-cyber-muted">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.authorName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {timeAgo(article.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.ceil(article.content.length / 1500)} min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Tags */}
              <div className="cyber-card p-4">
                <h3 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyber-primary" />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`cyber-tag transition-colors ${!activeTag ? "bg-cyber-primary/20 text-cyber-primary" : ""}`}
                  >
                    All
                  </button>
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                      className={`cyber-tag transition-colors ${activeTag === tag ? "bg-cyber-primary/20 text-cyber-primary" : ""}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Write Article CTA */}
              <div className="cyber-card p-4 bg-gradient-to-br from-cyber-surface to-cyber-warning/5">
                <h3 className="font-semibold text-cyber-text mb-2">
                  Contribute an Article
                </h3>
                <p className="text-sm text-cyber-muted mb-3">
                  Share your security knowledge with the community. Articles are reviewed before publishing.
                </p>
                <button
                  onClick={() => {
                    if (!user) { setShowAuthModal(true); return; }
                    setShowSubmit(true);
                  }}
                  className="cyber-btn-secondary w-full justify-center"
                >
                  Submit Article
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
