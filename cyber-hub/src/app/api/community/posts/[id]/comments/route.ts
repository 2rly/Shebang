import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = Number(id);
  const db = getDb();

  // Increment view count
  db.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(postId);

  const rows = db.prepare(`
    SELECT c.id, c.author_id, u.username AS author_name, c.content, c.created_at
    FROM comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(postId) as Array<{
    id: number; author_id: number; author_name: string; content: string; created_at: string;
  }>;

  const comments = rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    content: r.content,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const postId = Number(id);
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const db = getDb();

    const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const result = db
      .prepare("INSERT INTO comments (author_id, post_id, content) VALUES (?, ?, ?)")
      .run(user.id, postId, content.trim());

    return NextResponse.json({
      comment: {
        id: result.lastInsertRowid,
        authorId: user.id,
        authorName: user.username,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
