import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const db = getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 0;

  let query = `
    SELECT
      p.id, p.author_id, u.username AS author_name, p.title, p.content,
      p.category, p.upvotes, p.downvotes, p.views, p.created_at,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
      COALESCE((SELECT v.value FROM votes v WHERE v.post_id = p.id AND v.user_id = ?), 0) AS user_vote
    FROM posts p
    JOIN users u ON u.id = p.author_id
  `;
  const params: (string | number)[] = [userId];

  if (category) {
    query += " WHERE p.category = ?";
    params.push(category);
  }

  query += " ORDER BY p.created_at DESC LIMIT 50";

  const rows = db.prepare(query).all(...params) as Array<{
    id: number; author_id: number; author_name: string; title: string; content: string;
    category: string; upvotes: number; downvotes: number; views: number;
    comment_count: number; user_vote: number; created_at: string;
  }>;

  const posts = rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    title: r.title,
    content: r.content,
    category: r.category,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    views: r.views,
    commentCount: r.comment_count,
    userVote: r.user_vote,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, category } = await req.json();
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare("INSERT INTO posts (author_id, title, content, category) VALUES (?, ?, ?, ?)")
      .run(user.id, title.trim(), content.trim(), category || "General Discussion");

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
