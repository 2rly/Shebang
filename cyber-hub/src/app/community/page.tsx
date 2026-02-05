import {
  Users,
  MessageCircle,
  TrendingUp,
  Clock,
  Eye,
  PlusCircle,
  Pin,
  Award,
} from "lucide-react";
import Link from "next/link";

const forumCategories = [
  { name: "General Discussion", count: 234, color: "cyber-primary" },
  { name: "Threat Intelligence", count: 156, color: "cyber-secondary" },
  { name: "Tool Reviews", count: 89, color: "cyber-warning" },
  { name: "Career & Certifications", count: 178, color: "cyber-accent" },
  { name: "CTF & Challenges", count: 67, color: "cyber-primary" },
  { name: "Incident Response", count: 45, color: "cyber-secondary" },
];

const forumPosts = [
  {
    id: "1",
    title: "Best practices for SOC automation in 2024?",
    author: "SecurityPro",
    authorBadge: "Expert",
    replies: 23,
    views: 456,
    createdAt: "2 hours ago",
    tags: ["SOC", "Automation", "SOAR"],
    pinned: true,
  },
  {
    id: "2",
    title: "Experiences with CrowdStrike vs SentinelOne",
    author: "BlueTeamer",
    authorBadge: "Contributor",
    replies: 45,
    views: 892,
    createdAt: "5 hours ago",
    tags: ["EDR", "Comparison"],
    pinned: false,
  },
  {
    id: "3",
    title: "How to prepare for OSCP in 3 months?",
    author: "PentestNewbie",
    authorBadge: null,
    replies: 67,
    views: 1234,
    createdAt: "1 day ago",
    tags: ["OSCP", "Career", "Certification"],
    pinned: false,
  },
  {
    id: "4",
    title: "Analyzing the latest ransomware variant",
    author: "MalwareAnalyst",
    authorBadge: "Expert",
    replies: 12,
    views: 345,
    createdAt: "1 day ago",
    tags: ["Malware", "Analysis", "Ransomware"],
    pinned: false,
  },
  {
    id: "5",
    title: "Setting up a home security lab - complete guide",
    author: "HomeLab_Hero",
    authorBadge: "Contributor",
    replies: 89,
    views: 2341,
    createdAt: "2 days ago",
    tags: ["Homelab", "Learning", "Setup"],
    pinned: false,
  },
];

const topContributors = [
  { name: "SecurityPro", points: 12450, badge: "Expert" },
  { name: "MalwareAnalyst", points: 9820, badge: "Expert" },
  { name: "BlueTeamer", points: 7650, badge: "Contributor" },
  { name: "CloudSecGuru", points: 6890, badge: "Contributor" },
  { name: "HomeLab_Hero", points: 5430, badge: "Contributor" },
];

export const metadata = {
  title: "Community | shebang.az",
  description: "Connect with cybersecurity professionals and share knowledge",
};

export default function CommunityPage() {
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
              Connect with security professionals, share knowledge, and learn
              from experts.
            </p>
          </div>
          <button className="cyber-btn flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Discussion
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Members", value: "12.4K", icon: Users },
          { label: "Discussions", value: "3.2K", icon: MessageCircle },
          { label: "This Week", value: "234", icon: TrendingUp },
          { label: "Online Now", value: "156", icon: Eye },
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Categories */}
          <div className="cyber-card p-4">
            <h2 className="font-semibold text-cyber-text mb-3">Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {forumCategories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/community/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`p-3 rounded-lg border border-cyber-border hover:border-${cat.color}/50 transition-colors`}
                >
                  <p className="text-sm font-medium text-cyber-text">
                    {cat.name}
                  </p>
                  <p className="text-xs text-cyber-muted">
                    {cat.count} discussions
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Discussions */}
          <div>
            <h2 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyber-secondary" />
              Recent Discussions
            </h2>
            <div className="space-y-3">
              {forumPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/post/${post.id}`}
                  className="cyber-card p-4 block group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.pinned && (
                          <Pin className="w-4 h-4 text-cyber-warning" />
                        )}
                        <h3 className="font-medium text-cyber-text group-hover:text-cyber-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-cyber-muted mb-2">
                        <span className="flex items-center gap-1">
                          by {post.author}
                          {post.authorBadge && (
                            <span className="px-1.5 py-0.5 bg-cyber-primary/20 text-cyber-primary rounded text-[10px]">
                              {post.authorBadge}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.createdAt}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="cyber-tag text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-cyber-muted text-sm">
                        <MessageCircle className="w-4 h-4" />
                        {post.replies}
                      </div>
                      <div className="flex items-center gap-1 text-cyber-muted text-sm">
                        <Eye className="w-4 h-4" />
                        {post.views}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Contributors */}
          <div className="cyber-card p-4">
            <h3 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyber-warning" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {topContributors.map((user, i) => (
                <div
                  key={user.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center text-xs font-mono text-cyber-muted">
                      #{i + 1}
                    </span>
                    <span className="text-sm text-cyber-text">{user.name}</span>
                    <span className="px-1.5 py-0.5 bg-cyber-primary/20 text-cyber-primary rounded text-[10px]">
                      {user.badge}
                    </span>
                  </div>
                  <span className="text-xs text-cyber-muted font-mono">
                    {user.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

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
