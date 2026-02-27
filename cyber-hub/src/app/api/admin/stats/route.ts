import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  const articles = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' OR status='approved' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' OR status='pending' THEN 1 ELSE 0 END) as drafts FROM articles").get() as { total: number; published: number; drafts: number };
  const cheatsheets = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as drafts FROM admin_cheatsheets").get() as { total: number; published: number; drafts: number };
  const docs = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as drafts FROM admin_docs").get() as { total: number; published: number; drafts: number };
  const media = db.prepare("SELECT COUNT(*) as total, COALESCE(SUM(size_bytes),0) as totalSize FROM media_uploads").get() as { total: number; totalSize: number };

  return NextResponse.json({
    articles: articles || { total: 0, published: 0, drafts: 0 },
    cheatsheets: cheatsheets || { total: 0, published: 0, drafts: 0 },
    docs: docs || { total: 0, published: 0, drafts: 0 },
    media: media || { total: 0, totalSize: 0 },
  });
}
