import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = getDb();
    const row = db
      .prepare("SELECT id, username, email, password_hash, role, company FROM users WHERE email = ?")
      .get(email) as { id: number; username: string; email: string; password_hash: string; role: string; company: string } | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken(row.id);
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: row.id,
        username: row.username || row.email.split("@")[0],
        email: row.email,
        role: row.role,
        company: row.company,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
