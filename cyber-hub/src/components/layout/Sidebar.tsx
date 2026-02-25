"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Newspaper,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Network,
  Wrench,
  ScrollText,
  ShieldCheck,
  SearchCode,
  Radar,
  Radio,
  Gavel,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { href: "/", icon: Shield, label: "Dashboard", shortLabel: "Home" },
  { href: "/news", icon: Newspaper, label: "News Feed", shortLabel: "News" },
  { href: "/docs", icon: FileText, label: "Documentation", shortLabel: "Docs" },
  { href: "/cheatsheets", icon: ScrollText, label: "Cheatsheets", shortLabel: "Cheats" },
  { href: "/topology", icon: Network, label: "Topology", shortLabel: "Topo" },
  { href: "/tools", icon: Wrench, label: "Cyber-Tools", shortLabel: "Tools" },
  { href: "/security-audit", icon: ShieldCheck, label: "Code Auditor", shortLabel: "Audit" },
  { href: "/shell-anatomy", icon: SearchCode, label: "Shell Anatomy", shortLabel: "Shell" },
  { href: "/binary-intel", icon: Radar, label: "Binary Intel", shortLabel: "Intel" },
  { href: "/release-radar", icon: Radio, label: "Release Radar", shortLabel: "Radar" },
  { href: "/articles", icon: BookOpen, label: "Articles", shortLabel: "Blog" },
  { href: "/community", icon: Users, label: "Community", shortLabel: "Forum" },
  {
    href: "/assistant",
    icon: MessageSquare,
    label: "#! Assistant",
    shortLabel: "AI",
  },
];

const adminItems = [
  { href: "/admin/articles", icon: Gavel, label: "Moderation", shortLabel: "Mod" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-cyber-surface border-r border-cyber-border flex flex-col transition-all duration-300 relative`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-cyber-border px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <Terminal className="w-8 h-8 text-cyber-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-primary rounded-full animate-pulse" />
          </div>
          {!collapsed && (
            <span className="font-mono font-bold text-lg tracking-wider">
              <span className="text-cyber-secondary">#!</span><span className="text-cyber-primary">shebang</span><span className="text-cyber-muted">.az</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30"
                        : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? "text-cyber-primary"
                        : "group-hover:text-cyber-secondary"
                    }`}
                  />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-cyber-primary rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}

          {/* Admin section — only visible to admins */}
          {user?.role === "admin" && (
            <>
              <li className="pt-3 pb-1 px-3">
                {!collapsed && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyber-accent/60">
                    Admin
                  </span>
                )}
              </li>
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30"
                            : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                        }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive
                            ? "text-cyber-accent"
                            : "group-hover:text-cyber-accent"
                        }`}
                      />
                      {!collapsed && (
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 bg-cyber-accent rounded-full animate-pulse" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div className="p-4 border-t border-cyber-border">
          <div className="bg-cyber-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
              <span className="text-xs font-mono text-cyber-muted">
                SYSTEM STATUS
              </span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-cyber-muted">Feeds</span>
                <span className="text-cyber-primary">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">API</span>
                <span className="text-cyber-primary">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Threats</span>
                <span className="text-cyber-warning">12 NEW</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-cyber-surface border border-cyber-border rounded-full flex items-center justify-center hover:border-cyber-primary hover:text-cyber-primary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
