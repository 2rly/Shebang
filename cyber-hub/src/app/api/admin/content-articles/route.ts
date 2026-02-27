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
    SELECT a.id, a.author_id as authorId, u.username as authorName,
           a.title, a.description, a.content, a.tags, a.status, a.created_at as createdAt
    FROM articles a
    JOIN users u ON u.id = a.author_id
    WHERE a.author_id = ?
    ORDER BY a.created_at DESC
  `).all(user.id) as Array<{
    id: number; authorId: number; authorName: string; title: string;
    description: string; content: string; tags: string; status: string; createdAt: string;
  }>;

  const articles = rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags || "[]"),
  }));

  return NextResponse.json({ articles });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, content, tags, status } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO articles (author_id, title, description, content, tags, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    title,
    description || "",
    content,
    JSON.stringify(tags || []),
    status === "approved" ? "approved" : "pending",
  );

  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}
