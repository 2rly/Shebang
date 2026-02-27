import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id, c.author_id as authorId, u.username as authorName,
           c.title, c.description, c.icon, c.color, c.content, c.tags,
           c.status, c.created_at as createdAt, c.updated_at as updatedAt
    FROM admin_cheatsheets c
    JOIN users u ON u.id = c.author_id
    ORDER BY c.updated_at DESC
  `).all() as Array<{
    id: number; authorId: number; authorName: string; title: string;
    description: string; icon: string; color: string; content: string;
    tags: string; status: string; createdAt: string; updatedAt: string;
  }>;

  const cheatsheets = rows.map((r) => ({
    ...r,
    content: JSON.parse(r.content || "[]"),
    tags: JSON.parse(r.tags || "[]"),
  }));

  return NextResponse.json({ cheatsheets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, icon, color, content, tags, status } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO admin_cheatsheets (author_id, title, description, icon, color, content, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    title,
    description || "",
    icon || "Terminal",
    color || "cyber-primary",
    JSON.stringify(content || []),
    JSON.stringify(tags || []),
    status || "draft",
  );

  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}
