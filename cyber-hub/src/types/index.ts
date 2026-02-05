export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: "hackernews" | "bleepingcomputer" | "threatpost" | "darkreading";
  pubDate: string;
  description?: string;
  category?: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: number;
}

export interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  content: string;
  replies: number;
  views: number;
  createdAt: string;
  tags: string[];
}
