"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  ScrollText,
  FileText,
  Image,
  TrendingUp,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  articles: { total: number; published: number; drafts: number };
  cheatsheets: { total: number; published: number; drafts: number };
  docs: { total: number; published: number; drafts: number };
  media: { total: number; totalSize: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          title: "Articles",
          icon: BookOpen,
          color: "cyber-primary",
          total: stats.articles.total,
          published: stats.articles.published,
          drafts: stats.articles.drafts,
          href: "/admin/content/articles",
        },
        {
          title: "Cheat Sheets",
          icon: ScrollText,
          color: "cyber-secondary",
          total: stats.cheatsheets.total,
          published: stats.cheatsheets.published,
          drafts: stats.cheatsheets.drafts,
          href: "/admin/content/cheatsheets",
        },
        {
          title: "Documentation",
          icon: FileText,
          color: "cyber-warning",
          total: stats.docs.total,
          published: stats.docs.published,
          drafts: stats.docs.drafts,
          href: "/admin/content/docs",
        },
        {
          title: "Media Files",
          icon: Image,
          color: "cyber-accent",
          total: stats.media.total,
          published: stats.media.total,
          drafts: 0,
          href: "/admin/media",
          extra: formatBytes(stats.media.totalSize),
        },
      ]
    : [];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-cyber-text mb-1">
          Admin <span className="text-cyber-accent">Dashboard</span>
        </h1>
        <p className="text-sm text-cyber-muted font-mono">
          Content management for shebang.az
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyber-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="cyber-card p-4 hover:border-cyber-accent/30 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 text-${card.color}`} />
                    <TrendingUp className="w-4 h-4 text-cyber-muted group-hover:text-cyber-accent transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-cyber-text">{card.total}</p>
                  <p className="text-xs text-cyber-muted mt-1">{card.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                    <span className="text-cyber-primary">{card.published} published</span>
                    {card.drafts > 0 && (
                      <span className="text-cyber-warning">{card.drafts} drafts</span>
                    )}
                    {card.extra && (
                      <span className="text-cyber-muted">{card.extra}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-sm font-mono uppercase tracking-wider text-cyber-muted mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/content/articles"
                className="cyber-card p-4 flex items-center gap-3 hover:border-cyber-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cyber-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyber-text">New Article</p>
                  <p className="text-xs text-cyber-muted">Write a blog post or research</p>
                </div>
              </Link>
              <Link
                href="/admin/content/cheatsheets"
                className="cyber-card p-4 flex items-center gap-3 hover:border-cyber-secondary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyber-secondary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cyber-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyber-text">New Cheat Sheet</p>
                  <p className="text-xs text-cyber-muted">Quick-reference technical guide</p>
                </div>
              </Link>
              <Link
                href="/admin/content/docs"
                className="cyber-card p-4 flex items-center gap-3 hover:border-cyber-warning/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyber-warning/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-cyber-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyber-text">New Document</p>
                  <p className="text-xs text-cyber-muted">System guide or troubleshooting</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
