import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET — admin only: list all articles (pending first)
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  const rows = db.prepare(`
    SELECT a.id, a.author_id, u.username AS author_name, a.title, a.description,
           a.content, a.tags, a.status, a.created_at
    FROM articles a
    JOIN users u ON u.id = a.author_id
    ORDER BY
      CASE a.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      a.created_at DESC
  `).all() as Array<{
    id: number; author_id: number; author_name: string; title: string;
    description: string; content: string; tags: string; status: string; created_at: string;
  }>;

  const articles = rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    title: r.title,
    description: r.description,
    content: r.content,
    tags: JSON.parse(r.tags || "[]"),
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ articles });
}
