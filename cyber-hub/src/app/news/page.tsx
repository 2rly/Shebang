import { NewsFeed } from "@/components/news/NewsFeed";
import { Rss, Bell, Settings } from "lucide-react";

export const metadata = {
  title: "Security News | shebang.az",
  description: "Real-time aggregated cybersecurity news from trusted sources",
};

export default function NewsPage() {
  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-cyber-text mb-2">
              <span className="text-cyber-secondary">Security</span> News
            </h1>
            <p className="text-cyber-muted">
              Real-time aggregated feeds from HackerNews, BleepingComputer, Dark
              Reading, and more.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-cyber-surface border border-cyber-border rounded-lg">
              <Rss className="w-4 h-4 text-cyber-primary" />
              <span className="text-sm font-mono text-cyber-text">
                6 Active Feeds
              </span>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="cyber-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
              <span className="text-sm text-cyber-muted">Auto-refresh: 5min</span>
            </div>
            <div className="h-4 w-px bg-cyber-border" />
            <span className="text-sm text-cyber-muted">
              Click any article to read on source
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors" title="Feed Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* News Feed Component */}
      <NewsFeed />
    </div>
  );
}
