import {
  BookOpen,
  Clock,
  User,
  Tag,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const articles = [
  {
    slug: "zero-trust-architecture",
    title: "Implementing Zero Trust Architecture in 2024",
    description:
      "A comprehensive guide to designing and deploying zero trust security models in enterprise environments.",
    author: "Security Team",
    date: "2024-01-15",
    readTime: 12,
    tags: ["Zero Trust", "Architecture", "Enterprise"],
    featured: true,
  },
  {
    slug: "threat-hunting-elastic",
    title: "Advanced Threat Hunting with Elastic Stack",
    description:
      "Learn how to use ELK stack for proactive threat hunting and incident investigation.",
    author: "SOC Analyst",
    date: "2024-01-10",
    readTime: 15,
    tags: ["Threat Hunting", "ELK", "SIEM"],
    featured: true,
  },
  {
    slug: "kubernetes-security-hardening",
    title: "Kubernetes Security Hardening Checklist",
    description:
      "Essential security configurations and best practices for production Kubernetes clusters.",
    author: "DevSecOps Lead",
    date: "2024-01-08",
    readTime: 10,
    tags: ["Kubernetes", "DevSecOps", "Containers"],
    featured: false,
  },
  {
    slug: "incident-response-playbooks",
    title: "Building Effective Incident Response Playbooks",
    description:
      "Step-by-step guide to creating and maintaining IR playbooks for common security incidents.",
    author: "IR Team",
    date: "2024-01-05",
    readTime: 8,
    tags: ["Incident Response", "Playbooks", "SOC"],
    featured: false,
  },
  {
    slug: "api-security-best-practices",
    title: "API Security: OWASP Top 10 Deep Dive",
    description:
      "Understanding and mitigating the most critical API security vulnerabilities.",
    author: "AppSec Engineer",
    date: "2024-01-03",
    readTime: 14,
    tags: ["API Security", "OWASP", "Web Security"],
    featured: false,
  },
  {
    slug: "cloud-native-security",
    title: "Cloud-Native Security Monitoring Strategies",
    description:
      "Modern approaches to security monitoring in cloud-native and serverless architectures.",
    author: "Cloud Security Architect",
    date: "2024-01-01",
    readTime: 11,
    tags: ["Cloud Security", "Serverless", "Monitoring"],
    featured: false,
  },
];

const popularTags = [
  "SIEM",
  "Threat Hunting",
  "Kubernetes",
  "Cloud Security",
  "Zero Trust",
  "DevSecOps",
  "Incident Response",
  "API Security",
];

export const metadata = {
  title: "Articles | shebang.az",
  description: "In-depth cybersecurity engineering articles and guides",
};

export default function ArticlesPage() {
  const featuredArticles = articles.filter((a) => a.featured);
  const recentArticles = articles.filter((a) => !a.featured);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyber-text mb-2">
          <span className="text-cyber-warning">Engineering</span> Articles
        </h1>
        <p className="text-cyber-muted max-w-2xl">
          In-depth technical articles on cybersecurity engineering, best
          practices, and emerging threats. All content is Markdown-powered for
          easy reading and code examples.
        </p>
      </div>

      {/* Featured Articles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyber-primary" />
          Featured Articles
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {featuredArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="cyber-card p-6 group block"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 text-xs font-mono bg-cyber-warning/20 text-cyber-warning rounded">
                  FEATURED
                </span>
                <span className="text-xs text-cyber-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime} min read
                </span>
              </div>

              <h3 className="text-xl font-semibold text-cyber-text mb-2 group-hover:text-cyber-primary transition-colors">
                {article.title}
              </h3>

              <p className="text-sm text-cyber-muted mb-4 line-clamp-2">
                {article.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-cyber-muted">
                  <User className="w-4 h-4" />
                  {article.author}
                </div>
                <div className="flex items-center gap-2 text-sm text-cyber-muted">
                  <Calendar className="w-4 h-4" />
                  {article.date}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag) => (
                  <span key={tag} className="cyber-tag text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyber-secondary" />
            Recent Articles
          </h2>
          <div className="space-y-4">
            {recentArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="cyber-card p-4 flex gap-4 group block"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-cyber-text mb-1 group-hover:text-cyber-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-cyber-muted line-clamp-2 mb-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-cyber-muted">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Tags */}
          <div className="cyber-card p-4">
            <h3 className="font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyber-primary" />
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${tag}`}
                  className="cyber-tag hover:bg-cyber-primary/20 hover:text-cyber-primary transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Write Article CTA */}
          <div className="cyber-card p-4 bg-gradient-to-br from-cyber-surface to-cyber-secondary/5">
            <h3 className="font-semibold text-cyber-text mb-2">
              Contribute an Article
            </h3>
            <p className="text-sm text-cyber-muted mb-3">
              Share your security knowledge with the community. All articles
              support Markdown formatting.
            </p>
            <button className="cyber-btn-secondary w-full justify-center">
              Submit Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
