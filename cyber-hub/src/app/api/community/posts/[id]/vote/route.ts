import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    const { value } = await req.json();

    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json({ error: "Vote value must be -1, 0, or 1" }, { status: 400 });
    }

    const db = getDb();

    // Check post exists
    const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = db.prepare("SELECT id, value FROM votes WHERE user_id = ? AND post_id = ?")
      .get(user.id, postId) as { id: number; value: number } | undefined;

    if (value === 0) {
      // Remove vote
      if (existing) {
        db.prepare("DELETE FROM votes WHERE id = ?").run(existing.id);
        if (existing.value === 1) {
          db.prepare("UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?").run(postId);
        } else {
          db.prepare("UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?").run(postId);
        }
      }
    } else if (existing) {
      if (existing.value !== value) {
        db.prepare("UPDATE votes SET value = ? WHERE id = ?").run(value, existing.id);
        if (value === 1) {
          db.prepare("UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?").run(postId);
        } else {
          db.prepare("UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?").run(postId);
        }
      }
    } else {
      db.prepare("INSERT INTO votes (user_id, post_id, value) VALUES (?, ?, ?)").run(user.id, postId, value);
      if (value === 1) {
        db.prepare("UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?").run(postId);
      } else {
        db.prepare("UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?").run(postId);
      }
    }

    const updated = db.prepare("SELECT upvotes, downvotes FROM posts WHERE id = ?")
      .get(postId) as { upvotes: number; downvotes: number };

    return NextResponse.json({ upvotes: updated.upvotes, downvotes: updated.downvotes, userVote: value });
  } catch {
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}
