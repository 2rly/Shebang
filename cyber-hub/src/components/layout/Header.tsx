"use client";

import { Search, Bell, Settings, User, Command, LogOut, Menu, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMobileSidebar } from "./MobileSidebarContext";

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, loading, setShowAuthModal, logout } = useAuth();
  const { toggle } = useMobileSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  return (
    <header className="h-14 md:h-16 bg-cyber-surface border-b border-cyber-border flex items-center justify-between px-3 md:px-6 gap-2 md:gap-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggle}
        className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors md:hidden flex-shrink-0"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Back button — visible on all internal pages */}
      {!isHome && (
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-cyber-border bg-cyber-bg text-cyber-muted hover:text-cyber-primary hover:border-cyber-primary/50 transition-all flex-shrink-0 flex items-center justify-center"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Search Bar */}
      <div className="flex-1 max-w-xl min-w-0">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            searchFocused ? "md:scale-105" : ""
          }`}
        >
          <Search className="absolute left-3 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-10 pr-4 md:pr-16 py-2 text-sm
                     focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                     placeholder:text-cyber-muted transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {/* Keyboard shortcut hint — desktop only */}
          <div className="absolute right-3 items-center gap-1 text-cyber-muted hidden md:flex">
            <kbd className="px-1.5 py-0.5 text-xs bg-cyber-border rounded font-mono">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-cyber-border rounded font-mono">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-6 flex-shrink-0">
        {/* Live Indicator — hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyber-bg rounded-lg border border-cyber-border">
          <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
          <span className="text-xs font-mono text-cyber-muted">LIVE</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-cyber-muted hover:text-cyber-primary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-accent rounded-full" />
        </button>

        {/* Settings — hidden on mobile */}
        <button className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors hidden sm:block">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu — auth-aware */}
        {loading ? (
          <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-cyber-border">
            <div className="w-9 h-9 bg-cyber-border rounded-lg animate-pulse" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-cyber-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-cyber-text truncate max-w-[140px]">{user.username}</p>
              <p className="text-xs text-cyber-muted">{user.role === "admin" ? "Admin" : user.company || "Operator"}</p>
            </div>
            <div className="w-9 h-9 bg-cyber-primary/20 border border-cyber-primary/50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-cyber-primary" />
            </div>
            <button
              onClick={logout}
              className="p-2 text-cyber-muted hover:text-cyber-accent transition-colors hidden sm:block"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-cyber-border group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-cyber-muted group-hover:text-cyber-primary transition-colors">Sign In</p>
              <p className="text-xs text-cyber-muted">Sync versions</p>
            </div>
            <div className="w-9 h-9 bg-cyber-border/50 border border-cyber-border rounded-lg flex items-center justify-center group-hover:border-cyber-primary/50 transition-colors">
              <User className="w-5 h-5 text-cyber-muted group-hover:text-cyber-primary transition-colors" />
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
