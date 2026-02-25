import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "./db";
import type { AuthUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "shebang-radar-secret-change-in-prod"
);
const COOKIE_NAME = "radar_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ── Password helpers ──

export function hashPassword(plain: string): string {
  return hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return compareSync(plain, hash);
}

// ── JWT helpers ──

export async function signToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub: string };
  } catch {
    return null;
  }
}

// ── Cookie helpers ──

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value;
}

// ── Get current user from cookie + DB ──

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  const db = getDb();
  const row = db
    .prepare("SELECT id, email, username, role, company FROM users WHERE id = ?")
    .get(Number(payload.sub)) as { id: number; email: string; username: string; role: string; company: string } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username || row.email.split("@")[0],
    role: row.role as "admin" | "user",
    company: row.company,
  };
}
