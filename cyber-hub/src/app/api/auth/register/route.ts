import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, email, password, company } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const db = getDb();

    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const existingUsername = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hash = hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (username, email, password_hash, role, company) VALUES (?, ?, ?, 'user', ?)")
      .run(username, email, hash, company || "");

    const userId = result.lastInsertRowid as number;
    const token = await signToken(userId);
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: userId, username, email, role: "user", company: company || "" },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
