import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (body.title !== undefined) { sets.push("title = ?"); values.push(body.title); }
  if (body.description !== undefined) { sets.push("description = ?"); values.push(body.description); }
  if (body.category !== undefined) { sets.push("category = ?"); values.push(body.category); }
  if (body.content !== undefined) { sets.push("content = ?"); values.push(body.content); }
  if (body.tags !== undefined) { sets.push("tags = ?"); values.push(JSON.stringify(body.tags)); }
  if (body.status !== undefined) { sets.push("status = ?"); values.push(body.status); }

  values.push(id);
  db.prepare(`UPDATE admin_docs SET ${sets.join(", ")} WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM admin_docs WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
