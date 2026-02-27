import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT m.id, m.filename, m.original_name as originalName, m.mime_type as mimeType,
           m.size_bytes as sizeBytes, m.alt_text as altText, m.created_at as createdAt,
           u.username as authorName
    FROM media_uploads m
    JOIN users u ON u.id = m.author_id
    ORDER BY m.created_at DESC
  `).all();

  return NextResponse.json({ media: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const altText = (formData.get("altText") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate file type
  const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed (PNG, JPEG, GIF, WebP, SVG)" }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || ".png";
  const filename = `${nanoid(12)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO media_uploads (author_id, filename, original_name, mime_type, size_bytes, alt_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, filename, file.name, file.type, file.size, altText);

  return NextResponse.json({
    ok: true,
    id: result.lastInsertRowid,
    url: `/uploads/${filename}`,
    filename,
  });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare("SELECT filename FROM media_uploads WHERE id = ?").get(id) as { filename: string } | undefined;

  if (row) {
    try {
      await unlink(path.join(UPLOAD_DIR, row.filename));
    } catch {
      // file may not exist on disk
    }
    db.prepare("DELETE FROM media_uploads WHERE id = ?").run(id);
  }

  return NextResponse.json({ ok: true });
}
