import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH — approve or reject an article
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const articleId = Number(id);
    const { status } = await req.json();

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
    }

    const db = getDb();

    const article = db.prepare("SELECT id FROM articles WHERE id = ?").get(articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    db.prepare("UPDATE articles SET status = ? WHERE id = ?").run(status, articleId);

    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}
