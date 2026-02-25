"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  MessageCircle,
  TrendingUp,
  Clock,
  Eye,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Send,
  X,
  Award,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CommunityPost, Comment } from "@/types";

const CATEGORIES = [
  "General Discussion",
  "Threat Intelligence",
  "Tool Reviews",
  "Career & Certifications",
  "CTF & Challenges",
  "Incident Response",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CommunityPage() {
  const { user, setShowAuthModal } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // New post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  // Expanded post (comments view)
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : "";
    const res = await fetch(`/api/community/posts${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    }
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleNewPost = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory }),
    });
    if (res.ok) {
      setShowNewPost(false);
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    }
    setSubmitting(false);
  };

  const handleVote = async (postId: number, value: number) => {
    if (!user) { setShowAuthModal(true); return; }
    const res = await fetch(`/api/community/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote } : p
        )
      );
    }
  };

  const loadComments = async (postId: number) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    setLoadingComments(true);
    setCommentInput("");
    const res = await fetch(`/api/community/posts/${postId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
    setLoadingComments(false);
  };

  const submitComment = async (postId: number) => {
    if (!user) { setShowAuthModal(true); return; }
    if (!commentInput.trim()) return;
    const res = await fetch(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentInput }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCommentInput("");
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
      );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyber-text mb-2">
              <span className="text-cyber-accent">Community</span> Hub
            </h1>
            <p className="text-cyber-muted">
              Connect with security professionals, share knowledge, and learn from experts.
            </p>
          </div>
          <button
            onClick={() => {
              if (!user) { setShowAuthModal(true); return; }
              setShowNewPost(true);
            }}
            className="cyber-btn flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            New Discussion
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Threads", value: String(posts.length), icon: MessageCircle },
          { label: "Members", value: user ? "Online" : "—", icon: Users },
          { label: "Categories", value: String(CATEGORIES.length), icon: TrendingUp },
          { label: "Status", value: "LIVE", icon: Eye },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="cyber-card p-4 text-center">
              <Icon className="w-5 h-5 text-cyber-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-cyber-text">{stat.value}</p>
              <p className="text-xs text-cyber-muted">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-cyber-surface border border-cyber-border rounded-xl shadow-2xl p-6">
            <button onClick={() => setShowNewPost(false)} className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-cyber-text mb-4 font-mono">New Discussion</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono"
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">Content</label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono resize-none"
                  placeholder="Share details, ask a question, start a discussion..."
                />
              </div>
              <button
                onClick={handleNewPost}
                disabled={submitting || !newTitle.trim() || !newContent.trim()}
                className="w-full py-2.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider bg-cyber-primary/20 border border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Posting..." : "Post Discussion"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Categories */}
          <div className="cyber-card p-4">
            <h2 className="font-semibold text-cyber-text mb-3">Sub-shebangs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`p-3 rounded-lg border transition-colors text-left ${
                  !activeCategory ? "border-cyber-primary/50 bg-cyber-primary/10" : "border-cyber-border hover:border-cyber-primary/30"
                }`}
              >
                <p className="text-sm font-medium text-cyber-text">All</p>
                <p className="text-xs text-cyber-muted">{posts.length} threads</p>
              </button>
              {CATEGORIES.map((cat) => {
                const count = posts.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      activeCategory === cat ? "border-cyber-primary/50 bg-cyber-primary/10" : "border-cyber-border hover:border-cyber-primary/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-cyber-text">{cat}</p>
                    <p className="text-xs text-cyber-muted">{count} threads</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts */}
          <div>
            <h2 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyber-secondary" />
              {activeCategory || "All"} Discussions
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-cyber-primary animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="cyber-card p-8 text-center">
                <MessageCircle className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
                <p className="text-cyber-muted">No discussions yet. Be the first to start one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="cyber-card p-4">
                    <div className="flex gap-3">
                      {/* Vote column */}
                      <div className="flex flex-col items-center gap-0.5 pt-1">
                        <button
                          onClick={() => handleVote(post.id, post.userVote === 1 ? 0 : 1)}
                          className={`p-0.5 rounded transition-colors ${
                            post.userVote === 1 ? "text-cyber-primary" : "text-cyber-muted hover:text-cyber-primary"
                          }`}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <span className={`text-sm font-mono font-bold ${
                          post.upvotes - post.downvotes > 0 ? "text-cyber-primary" :
                          post.upvotes - post.downvotes < 0 ? "text-cyber-accent" : "text-cyber-muted"
                        }`}>
                          {post.upvotes - post.downvotes}
                        </span>
                        <button
                          onClick={() => handleVote(post.id, post.userVote === -1 ? 0 : -1)}
                          className={`p-0.5 rounded transition-colors ${
                            post.userVote === -1 ? "text-cyber-accent" : "text-cyber-muted hover:text-cyber-accent"
                          }`}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-cyber-text mb-1">{post.title}</h3>
                        <p className="text-sm text-cyber-muted line-clamp-2 mb-2">{post.content}</p>

                        <div className="flex items-center gap-3 text-xs text-cyber-muted">
                          <span className="px-2 py-0.5 bg-cyber-border/50 rounded text-[10px] font-mono uppercase">
                            {post.category}
                          </span>
                          <span>by <span className="text-cyber-secondary">{post.authorName}</span></span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(post.createdAt)}
                          </span>
                          <button
                            onClick={() => loadComments(post.id)}
                            className="flex items-center gap-1 hover:text-cyber-primary transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {post.commentCount} replies
                          </button>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </span>
                        </div>

                        {/* Expanded comments */}
                        {expandedPost === post.id && (
                          <div className="mt-4 pt-4 border-t border-cyber-border">
                            {loadingComments ? (
                              <div className="flex items-center gap-2 py-4">
                                <Loader2 className="w-4 h-4 text-cyber-primary animate-spin" />
                                <span className="text-xs text-cyber-muted">Loading replies...</span>
                              </div>
                            ) : (
                              <>
                                {comments.length === 0 && (
                                  <p className="text-xs text-cyber-muted py-2">No replies yet.</p>
                                )}
                                <div className="space-y-3 mb-3">
                                  {comments.map((c) => (
                                    <div key={c.id} className="pl-3 border-l-2 border-cyber-border">
                                      <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                                        <span className="text-cyber-secondary font-mono">{c.authorName}</span>
                                        <span>{timeAgo(c.createdAt)}</span>
                                      </div>
                                      <p className="text-sm text-cyber-text">{c.content}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                                    placeholder={user ? "Write a reply..." : "Sign in to reply"}
                                    className="flex-1 px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text focus:border-cyber-primary focus:outline-none font-mono placeholder:text-cyber-muted/40"
                                    disabled={!user}
                                  />
                                  <button
                                    onClick={() => submitComment(post.id)}
                                    disabled={!commentInput.trim()}
                                    className="p-1.5 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          {user && (
            <div className="cyber-card p-4">
              <h3 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-cyber-warning" />
                Your Profile
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyber-muted">Username</span>
                  <span className="text-cyber-secondary font-mono">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyber-muted">Role</span>
                  <span className={`font-mono ${user.role === "admin" ? "text-cyber-accent" : "text-cyber-primary"}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Community Rules */}
          <div className="cyber-card p-4">
            <h3 className="font-semibold text-cyber-text mb-3">
              Community Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-cyber-muted">
              <li>• Be respectful and professional</li>
              <li>• No sharing of malicious code</li>
              <li>• Credit original sources</li>
              <li>• Help others learn</li>
              <li>• Report violations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
