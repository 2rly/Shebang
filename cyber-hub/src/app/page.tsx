import {
  Shield,
  Newspaper,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: FileText,
    title: "Documentation",
    description:
      "Comprehensive guides for SIEM, EDR, Firewalls, and security tool deployment",
    href: "/docs",
    color: "cyber-primary",
  },
  {
    icon: Newspaper,
    title: "Security News",
    description:
      "Real-time aggregated feeds from HackerNews, BleepingComputer & more",
    href: "/news",
    color: "cyber-secondary",
  },
  {
    icon: BookOpen,
    title: "Articles",
    description:
      "In-depth engineering articles with Markdown support for technical content",
    href: "/articles",
    color: "cyber-warning",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Connect with security professionals, share knowledge, ask questions",
    href: "/community",
    color: "cyber-accent",
  },
];

const recentAlerts = [
  {
    severity: "critical",
    title: "CVE-2024-XXXX: Critical RCE in Popular Framework",
    time: "2 hours ago",
  },
  {
    severity: "high",
    title: "New Ransomware Variant Targeting Healthcare",
    time: "5 hours ago",
  },
  {
    severity: "medium",
    title: "Zero-Day Exploit Kit Activity Detected",
    time: "8 hours ago",
  },
];

const stats = [
  { label: "Active Threats", value: "1,247", icon: AlertTriangle, trend: "+12%" },
  { label: "CVEs This Month", value: "342", icon: Shield, trend: "+8%" },
  { label: "Articles Published", value: "89", icon: BookOpen, trend: "+5%" },
  { label: "Community Posts", value: "2.4K", icon: Users, trend: "+23%" },
];

export default function HomePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyber-surface via-cyber-bg to-cyber-surface border border-cyber-border p-8">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyber-secondary/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-cyber-primary/20 border border-cyber-primary/30 rounded-full">
              <span className="text-xs font-mono text-cyber-primary">
                v1.0.0 OPERATIONAL
              </span>
            </div>
            <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-cyber-secondary font-mono">#!</span>
            <span className="text-cyber-primary">shebang</span>
            <span className="text-cyber-muted">.az</span>
            <br />
            <span className="text-cyber-text text-2xl md:text-3xl">Security Engineering Platform</span>
          </h1>

          <p className="text-lg text-cyber-muted mb-6 max-w-xl">
            <code className="text-cyber-primary">#!/bin/security</code> — Your execution point for
            documentation, threat intelligence, engineering articles, and community collaboration.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/docs" className="cyber-btn flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Get Started
            </Link>
            <Link
              href="/news"
              className="cyber-btn-secondary flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              Latest News
            </Link>
          </div>
        </div>

        {/* Terminal Window Decoration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block w-80">
          <div className="bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-cyber-surface border-b border-cyber-border">
              <div className="w-3 h-3 rounded-full bg-cyber-accent" />
              <div className="w-3 h-3 rounded-full bg-cyber-warning" />
              <div className="w-3 h-3 rounded-full bg-cyber-primary" />
              <span className="ml-2 text-xs font-mono text-cyber-muted">
                terminal
              </span>
            </div>
            <div className="p-4 font-mono text-sm">
              <p className="text-cyber-muted">
                $ <span className="text-cyber-secondary">#!/bin/bash</span>
              </p>
              <p className="text-cyber-muted">
                $ <span className="text-cyber-primary">shebang</span> --status
              </p>
              <p className="text-cyber-primary mt-2">[+] Systems Online</p>
              <p className="text-cyber-secondary">[+] Feeds Connected: 6</p>
              <p className="text-cyber-warning">[!] New Alerts: 12</p>
              <p className="text-cyber-muted mt-2">
                $ <span className="animate-terminal-blink">_</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="cyber-card p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-cyber-muted" />
                <span className="text-xs font-mono text-cyber-primary flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-cyber-text">{stat.value}</p>
              <p className="text-sm text-cyber-muted">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Features Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cyber-text">
            Platform Modules
          </h2>
          <div className="h-px flex-1 mx-4 bg-gradient-to-r from-cyber-border to-transparent" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="cyber-card p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg bg-${feature.color}/10 border border-${feature.color}/30`}
                  >
                    <Icon className={`w-6 h-6 text-${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cyber-text mb-1 group-hover:text-cyber-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-cyber-muted">
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyber-muted group-hover:text-cyber-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Alerts & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cyber-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyber-warning" />
              Recent Security Alerts
            </h3>
            <Link
              href="/news"
              className="text-sm text-cyber-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 bg-cyber-bg rounded-lg border border-cyber-border hover:border-cyber-warning/50 transition-colors cursor-pointer"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-cyber-accent"
                      : alert.severity === "high"
                      ? "bg-cyber-warning"
                      : "bg-cyber-secondary"
                  }`}
                />
                <p className="flex-1 text-sm text-cyber-text">{alert.title}</p>
                <span className="text-xs text-cyber-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Promo */}
        <div className="cyber-card p-6 bg-gradient-to-br from-cyber-surface to-cyber-primary/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyber-primary/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-cyber-primary" />
            </div>
            <h3 className="font-semibold text-cyber-text">#! Assistant</h3>
          </div>

          <p className="text-sm text-cyber-muted mb-4">
            Get instant answers to security questions, threat analysis, and
            remediation guidance.
          </p>

          <Link href="/assistant" className="cyber-btn w-full justify-center flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Launch Assistant
          </Link>

          <div className="mt-4 p-3 bg-cyber-bg rounded-lg border border-cyber-border">
            <p className="text-xs font-mono text-cyber-muted">
              &gt; Analyze CVE-2024-XXXX impact...
            </p>
            <p className="text-xs font-mono text-cyber-primary mt-1">
              Processing threat intelligence...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
