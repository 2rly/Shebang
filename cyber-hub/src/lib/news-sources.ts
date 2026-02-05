export const NEWS_SOURCES = {
  hackernews: {
    name: "Hacker News",
    rssUrl: "https://hnrss.org/frontpage",
    website: "https://news.ycombinator.com",
    color: "#ff6600",
  },
  bleepingcomputer: {
    name: "BleepingComputer",
    rssUrl: "https://www.bleepingcomputer.com/feed/",
    website: "https://www.bleepingcomputer.com",
    color: "#2962ff",
  },
  threatpost: {
    name: "Threatpost",
    rssUrl: "https://threatpost.com/feed/",
    website: "https://threatpost.com",
    color: "#e53935",
  },
  darkreading: {
    name: "Dark Reading",
    rssUrl: "https://www.darkreading.com/rss.xml",
    website: "https://www.darkreading.com",
    color: "#7b1fa2",
  },
  thehackernews: {
    name: "The Hacker News",
    rssUrl: "https://feeds.feedburner.com/TheHackersNews",
    website: "https://thehackernews.com",
    color: "#00c853",
  },
  securityweek: {
    name: "SecurityWeek",
    rssUrl: "https://feeds.feedburner.com/securityweek",
    website: "https://www.securityweek.com",
    color: "#1565c0",
  },
} as const;

export type NewsSourceKey = keyof typeof NEWS_SOURCES;

export interface ParsedNewsItem {
  id: string;
  title: string;
  link: string;
  source: NewsSourceKey;
  sourceName: string;
  pubDate: string;
  description?: string;
  categories?: string[];
}
