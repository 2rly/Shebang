import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public GET — returns a single published document by slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const row = db.prepare(`
    SELECT d.id, d.title, d.slug, d.description, d.category, d.content,
           d.tags, d.created_at as createdAt, d.updated_at as updatedAt,
           u.username as authorName
    FROM admin_docs d
    JOIN users u ON u.id = d.author_id
    WHERE d.slug = ? AND d.status = 'published'
  `).get(slug) as {
    id: number; title: string; slug: string; description: string;
    category: string; content: string; tags: string;
    createdAt: string; updatedAt: string; authorName: string;
  } | undefined;

  if (!row) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    doc: {
      ...row,
      tags: JSON.parse(row.tags || "[]"),
    },
  });
}
