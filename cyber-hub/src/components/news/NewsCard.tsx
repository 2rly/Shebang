"use client";

import { ExternalLink, Clock, Tag } from "lucide-react";
import { ParsedNewsItem } from "@/lib/news-sources";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  item: ParsedNewsItem;
}

const sourceColors: Record<string, string> = {
  hackernews: "border-l-orange-500",
  bleepingcomputer: "border-l-blue-500",
  threatpost: "border-l-red-500",
  darkreading: "border-l-purple-500",
  thehackernews: "border-l-green-500",
  securityweek: "border-l-cyan-500",
};

const sourceBadgeColors: Record<string, string> = {
  hackernews: "bg-orange-500/20 text-orange-400",
  bleepingcomputer: "bg-blue-500/20 text-blue-400",
  threatpost: "bg-red-500/20 text-red-400",
  darkreading: "bg-purple-500/20 text-purple-400",
  thehackernews: "bg-green-500/20 text-green-400",
  securityweek: "bg-cyan-500/20 text-cyan-400",
};

export function NewsCard({ item }: NewsCardProps) {
  const timeAgo = item.pubDate
    ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
    : "Unknown";

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`block cyber-card p-4 border-l-4 ${
        sourceColors[item.source] || "border-l-cyber-primary"
      } hover:translate-x-1 transition-transform`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                sourceBadgeColors[item.source] || "bg-cyber-primary/20 text-cyber-primary"
              }`}
            >
              {item.sourceName}
            </span>
            <span className="text-xs text-cyber-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>

          <h3 className="font-medium text-cyber-text mb-2 line-clamp-2 group-hover:text-cyber-primary transition-colors">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-cyber-muted line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <ExternalLink className="w-4 h-4 text-cyber-muted flex-shrink-0 mt-1" />
      </div>
    </a>
  );
}
