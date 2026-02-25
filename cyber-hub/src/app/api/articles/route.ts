import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET — public: only approved articles
export async function GET() {
  const db = getDb();

  const rows = db.prepare(`
    SELECT a.id, a.author_id, u.username AS author_name, a.title, a.description,
           a.content, a.tags, a.status, a.created_at
    FROM articles a
    JOIN users u ON u.id = a.author_id
    WHERE a.status = 'approved'
    ORDER BY a.created_at DESC
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

// POST — submit a new article (authenticated users)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, content, tags } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare("INSERT INTO articles (author_id, title, description, content, tags, status) VALUES (?, ?, ?, ?, ?, 'pending')")
      .run(user.id, title.trim(), (description || "").trim(), content.trim(), JSON.stringify(tags || []));

    return NextResponse.json({
      id: result.lastInsertRowid,
      message: "Article submitted for review",
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit article" }, { status: 500 });
  }
}
