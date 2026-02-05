"use client";

import { Search, Bell, Settings, User, Command } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-16 bg-cyber-surface border-b border-cyber-border flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            searchFocused ? "scale-105" : ""
          }`}
        >
          <Search className="absolute left-3 w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            placeholder="Search documentation, articles, news..."
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-10 pr-16 py-2 text-sm
                     focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                     placeholder:text-cyber-muted transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="absolute right-3 flex items-center gap-1 text-cyber-muted">
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
      <div className="flex items-center gap-4 ml-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-bg rounded-lg border border-cyber-border">
          <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
          <span className="text-xs font-mono text-cyber-muted">LIVE</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-cyber-muted hover:text-cyber-primary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-accent rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-3 pl-4 border-l border-cyber-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-cyber-text">Operator</p>
            <p className="text-xs text-cyber-muted">Security Analyst</p>
          </div>
          <div className="w-9 h-9 bg-cyber-primary/20 border border-cyber-primary/50 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-cyber-primary" />
          </div>
        </button>
      </div>
    </header>
  );
}
