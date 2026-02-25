"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!showAuthModal) return null;

  const reset = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setCompany("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const err = mode === "login"
        ? await login(email, password)
        : await register(username, email, password, company);
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-cyber-surface border border-cyber-border rounded-xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <h2 className="text-xl font-bold text-cyber-text mb-1 font-mono">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-cyber-muted mb-6">
            {mode === "login"
              ? "Sign in to access the community"
              : "Register to join the community"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text
                           focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                           placeholder:text-cyber-muted font-mono"
                  placeholder="h4cker"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text
                         focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                         placeholder:text-cyber-muted font-mono"
                placeholder="operator@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text
                         focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                         placeholder:text-cyber-muted font-mono"
                placeholder="Min 6 characters"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-mono text-cyber-muted uppercase tracking-wider mb-1.5">
                  Company <span className="text-cyber-muted/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg text-sm text-cyber-text
                           focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                           placeholder:text-cyber-muted font-mono"
                  placeholder="Acme Corp"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider
                       bg-cyber-primary/20 border border-cyber-primary/50 text-cyber-primary
                       hover:bg-cyber-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-cyber-secondary hover:text-cyber-primary transition-colors font-mono"
            >
              {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
