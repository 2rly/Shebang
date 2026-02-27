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
    SELECT d.id, d.author_id as authorId, u.username as authorName,
           d.title, d.description, d.category, d.content, d.tags,
           d.status, d.created_at as createdAt, d.updated_at as updatedAt
    FROM admin_docs d
    JOIN users u ON u.id = d.author_id
    ORDER BY d.updated_at DESC
  `).all() as Array<{
    id: number; authorId: number; authorName: string; title: string;
    description: string; category: string; content: string;
    tags: string; status: string; createdAt: string; updatedAt: string;
  }>;

  const docs = rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags || "[]"),
  }));

  return NextResponse.json({ docs });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, category, content, tags, status } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO admin_docs (author_id, title, description, category, content, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    title,
    description || "",
    category || "General",
    content,
    JSON.stringify(tags || []),
    status || "draft",
  );

  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}
