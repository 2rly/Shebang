import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Public GET — returns all published documents
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const db = getDb();

  let query = `
    SELECT d.id, d.title, d.slug, d.description, d.category,
           d.tags, d.created_at as createdAt, d.updated_at as updatedAt,
           u.username as authorName
    FROM admin_docs d
    JOIN users u ON u.id = d.author_id
    WHERE d.status = 'published'
  `;
  const params: string[] = [];

  if (category) {
    query += ` AND d.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY d.updated_at DESC`;

  const rows = db.prepare(query).all(...params) as Array<{
    id: number; title: string; slug: string; description: string;
    category: string; tags: string; createdAt: string;
    updatedAt: string; authorName: string;
  }>;

  const docs = rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags || "[]"),
  }));

  return NextResponse.json({ docs });
}

// Admin POST — create a new document (delegates to /api/admin/docs for actual admin use,
// but also available here for convenience)
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

  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = db.prepare("SELECT id FROM admin_docs WHERE slug = ?").get(slug);
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const result = db.prepare(`
    INSERT INTO admin_docs (author_id, title, slug, description, category, content, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    title,
    slug,
    description || "",
    category || "General",
    content,
    JSON.stringify(tags || []),
    status || "draft",
  );

  return NextResponse.json({ ok: true, id: result.lastInsertRowid, slug });
}

// Admin DELETE — delete by id (passed as ?id=...)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Document id is required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM admin_docs WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
