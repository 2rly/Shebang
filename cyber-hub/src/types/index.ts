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

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: "admin" | "user";
  company: string;
}

// ── Community ──

export interface CommunityPost {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  downvotes: number;
  views: number;
  commentCount: number;
  userVote: number; // -1, 0, or 1
  createdAt: string;
}

export interface Comment {
  id: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

// ── Moderated Articles ──

export interface DbArticle {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
