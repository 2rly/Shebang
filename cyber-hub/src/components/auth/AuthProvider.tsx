"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string, company: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Login failed";
    setUser(data.user);
    setShowAuthModal(false);
    return null;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, company: string): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, company }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Registration failed";
    setUser(data.user);
    setShowAuthModal(false);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, showAuthModal, setShowAuthModal, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
