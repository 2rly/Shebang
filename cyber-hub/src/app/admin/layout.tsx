"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  ScrollText,
  FileText,
  Image,
  Gavel,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/content/articles", icon: BookOpen, label: "Articles" },
  { href: "/admin/content/cheatsheets", icon: ScrollText, label: "Cheat Sheets" },
  { href: "/admin/content/docs", icon: FileText, label: "Documentation" },
  { href: "/admin/media", icon: Image, label: "Media Library" },
  { href: "/admin/articles", icon: Gavel, label: "Moderation" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-cyber-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cyber-text mb-2">Access Denied</h2>
          <p className="text-cyber-muted">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Admin Sub-Navigation */}
      <nav className="w-full md:w-56 bg-cyber-surface border-b md:border-b-0 md:border-r border-cyber-border flex-shrink-0 overflow-x-auto md:overflow-x-visible">
        <div className="p-3 md:p-4 border-b border-cyber-border hidden md:block">
          <h2 className="text-xs font-mono uppercase tracking-wider text-cyber-accent flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Admin Panel
          </h2>
        </div>
        <div className="flex md:flex-col gap-1 p-2 md:p-3">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap
                  ${isActive
                    ? "bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50"
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-cyber-accent" : ""}`} />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden text-xs">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
