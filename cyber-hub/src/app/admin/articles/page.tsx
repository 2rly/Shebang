"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DbArticle } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function AdminArticlesPage() {
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return;

    fetch("/api/admin/articles")
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleAction = async (articleId: number, status: "approved" | "rejected") => {
    setActionLoading(articleId);
    const res = await fetch(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, status } : a))
      );
    }
    setActionLoading(null);
  };

  if (authLoading || !user || user.role !== "admin") {
    return null; // Layout handles auth guard
  }

  const pending = articles.filter((a) => a.status === "pending");
  const approved = articles.filter((a) => a.status === "approved");
  const rejected = articles.filter((a) => a.status === "rejected");

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-cyber-accent" />
          <h1 className="text-2xl md:text-3xl font-bold text-cyber-text">
            Article <span className="text-cyber-accent">Moderation</span>
          </h1>
        </div>
        <p className="text-cyber-muted">
          Review and approve community-submitted articles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="cyber-card p-4 text-center">
          <Clock className="w-5 h-5 text-cyber-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-cyber-warning">{pending.length}</p>
          <p className="text-xs text-cyber-muted">Pending Review</p>
        </div>
        <div className="cyber-card p-4 text-center">
          <CheckCircle className="w-5 h-5 text-cyber-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-cyber-primary">{approved.length}</p>
          <p className="text-xs text-cyber-muted">Approved</p>
        </div>
        <div className="cyber-card p-4 text-center">
          <XCircle className="w-5 h-5 text-cyber-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-cyber-accent">{rejected.length}</p>
          <p className="text-xs text-cyber-muted">Rejected</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyber-primary animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="cyber-card p-8 text-center">
          <FileText className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
          <p className="text-cyber-muted">No articles submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending first */}
          {pending.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-cyber-warning flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Review ({pending.length})
              </h2>
              {pending.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  expanded={expandedId === article.id}
                  onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                />
              ))}
            </>
          )}

          {approved.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-cyber-primary flex items-center gap-2 mt-8">
                <CheckCircle className="w-5 h-5" />
                Approved ({approved.length})
              </h2>
              {approved.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  expanded={expandedId === article.id}
                  onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                />
              ))}
            </>
          )}

          {rejected.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-cyber-accent flex items-center gap-2 mt-8">
                <XCircle className="w-5 h-5" />
                Rejected ({rejected.length})
              </h2>
              {rejected.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  expanded={expandedId === article.id}
                  onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  expanded,
  onToggle,
  onAction,
  actionLoading,
}: {
  article: DbArticle;
  expanded: boolean;
  onToggle: () => void;
  onAction: (id: number, status: "approved" | "rejected") => void;
  actionLoading: number | null;
}) {
  const statusColors = {
    pending: "text-cyber-warning border-cyber-warning/30 bg-cyber-warning/10",
    approved: "text-cyber-primary border-cyber-primary/30 bg-cyber-primary/10",
    rejected: "text-cyber-accent border-cyber-accent/30 bg-cyber-accent/10",
  };

  return (
    <div className="cyber-card overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${statusColors[article.status]}`}>
                {article.status}
              </span>
              <h3 className="font-medium text-cyber-text truncate">{article.title}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-cyber-muted">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {article.authorName}
              </span>
              <span>{timeAgo(article.createdAt)}</span>
              {article.tags.length > 0 && (
                <span className="flex gap-1">
                  {article.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-cyber-border/50 rounded text-[10px]">{t}</span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {article.status === "pending" && (
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onAction(article.id, "approved"); }}
                disabled={actionLoading === article.id}
                className="p-1.5 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition-colors disabled:opacity-50"
                title="Approve"
              >
                {actionLoading === article.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction(article.id, "rejected"); }}
                disabled={actionLoading === article.id}
                className="p-1.5 bg-cyber-accent/20 text-cyber-accent rounded-lg hover:bg-cyber-accent/30 transition-colors disabled:opacity-50"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-cyber-border pt-3">
          {article.description && (
            <p className="text-sm text-cyber-muted mb-3 italic">{article.description}</p>
          )}
          <div className="bg-cyber-bg rounded-lg p-4 text-sm text-cyber-text font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {article.content}
          </div>
          {article.status !== "pending" && (
            <div className="mt-3 flex gap-2">
              {article.status === "rejected" && (
                <button
                  onClick={() => onAction(article.id, "approved")}
                  className="px-3 py-1.5 text-xs font-mono bg-cyber-primary/20 border border-cyber-primary/50 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition-all"
                >
                  Re-approve
                </button>
              )}
              {article.status === "approved" && (
                <button
                  onClick={() => onAction(article.id, "rejected")}
                  className="px-3 py-1.5 text-xs font-mono bg-cyber-accent/20 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/30 transition-all"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
