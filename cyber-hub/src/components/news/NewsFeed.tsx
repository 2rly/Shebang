"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Filter,
  Loader2,
  AlertCircle,
  Newspaper,
  CheckCircle,
} from "lucide-react";
import { NewsCard } from "./NewsCard";
import { NEWS_SOURCES, ParsedNewsItem, NewsSourceKey } from "@/lib/news-sources";
import { TerminalSearchInline } from "@/components/ui/TerminalSearch";

export function NewsFeed() {
  const [news, setNews] = useState<ParsedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<NewsSourceKey>>(
    new Set(Object.keys(NEWS_SOURCES) as NewsSourceKey[])
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sourcesParam = Array.from(selectedSources).join(",");
      const response = await fetch(`/api/news?sources=${sourcesParam}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setNews(data.items);
        setLastFetched(new Date(data.fetchedAt));
      } else {
        throw new Error(data.error || "Failed to fetch news");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedSources]);

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const toggleSource = (source: NewsSourceKey) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        if (next.size > 1) next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  const filteredNews = news.filter((item) => {
    if (!selectedSources.has(item.source)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Terminal Search */}
      <TerminalSearchInline
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="ransomware, CVE-2024, threat..."
        className="w-full"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-cyber-text flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-cyber-primary" />
            Security News Feed
          </h2>
          {lastFetched && (
            <span className="text-xs text-cyber-muted font-mono">
              Updated: {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`cyber-btn flex items-center gap-2 ${
              showFilters ? "bg-cyber-primary text-cyber-bg" : ""
            }`}
          >
            <Filter className="w-4 h-4" />
            Sources ({selectedSources.size})
          </button>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="cyber-btn-secondary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Source Filters */}
      {showFilters && (
        <div className="cyber-card p-4">
          <p className="text-sm text-cyber-muted mb-3">Filter by source:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(NEWS_SOURCES) as [NewsSourceKey, typeof NEWS_SOURCES[NewsSourceKey]][]).map(
              ([key, source]) => (
                <button
                  key={key}
                  onClick={() => toggleSource(key)}
                  className={`px-3 py-1.5 text-sm font-mono rounded-lg border transition-all flex items-center gap-2 ${
                    selectedSources.has(key)
                      ? "bg-cyber-primary/20 border-cyber-primary text-cyber-primary"
                      : "bg-cyber-surface border-cyber-border text-cyber-muted hover:border-cyber-primary/50"
                  }`}
                >
                  {selectedSources.has(key) && <CheckCircle className="w-3 h-3" />}
                  {source.name}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="cyber-card p-4 border-cyber-accent bg-cyber-accent/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cyber-accent" />
            <p className="text-cyber-text">{error}</p>
            <button
              onClick={fetchNews}
              className="ml-auto text-sm text-cyber-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyber-primary animate-spin mb-4" />
          <p className="text-cyber-muted font-mono">
            Fetching security intelligence...
          </p>
        </div>
      )}

      {/* News Grid */}
      {!loading && filteredNews.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-cyber-muted mx-auto mb-4" />
          <p className="text-cyber-muted">No news items found</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredNews.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* Load indicator */}
      {filteredNews.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-cyber-muted font-mono">
            Showing {filteredNews.length} articles from {selectedSources.size}{" "}
            sources
          </p>
        </div>
      )}
    </div>
  );
}
