import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

// GET — load conversation history for the current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, role, content, created_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 100
    `).all(user.id) as Array<{
      id: number; role: string; content: string; created_at: string;
    }>;

    const messages = rows.map((r) => ({
      id: String(r.id),
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: r.created_at,
    }));

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// DELETE — clear conversation history for the current user
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    db.prepare("DELETE FROM conversations WHERE user_id = ?").run(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
