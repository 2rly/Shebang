import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "docs");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/octet-stream",
];
const ALLOWED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".pdf", ".txt", ".md", ".json", ".excalidraw",
];

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

// GET — list attachments for a document
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ error: "Invalid doc ID" }, { status: 400 });
  }

  const db = getDb();
  const attachments = db
    .prepare(
      `SELECT id, filename, original_name as originalName, mime_type as mimeType,
              size_bytes as size, url, alt_text as altText, created_at as createdAt
       FROM media_uploads WHERE doc_id = ? ORDER BY created_at DESC`
    )
    .all(docId);

  return NextResponse.json({ attachments });
}

// POST — upload a new attachment for a document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ error: "Invalid doc ID" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type "${file.type}" (${ext}) is not allowed.` },
        { status: 400 }
      );
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const sanitized = sanitizeFilename(file.name);
    const filename = `${timestamp}-${sanitized}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/docs/${filename}`;
    const isImage = file.type.startsWith("image/");

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO media_uploads (author_id, filename, original_name, mime_type, size_bytes, url, doc_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(user.id, filename, file.name, file.type, file.size, url, docId);

    return NextResponse.json({
      id: result.lastInsertRowid,
      url,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      isImage,
      markdown: isImage
        ? `![${file.name}](${url})`
        : `[${file.name}](${url})`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE — remove an attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ error: "Invalid doc ID" }, { status: 400 });
  }

  const { attachmentId } = await req.json();
  if (!attachmentId) {
    return NextResponse.json({ error: "Missing attachmentId" }, { status: 400 });
  }

  const db = getDb();
  const attachment = db
    .prepare("SELECT filename FROM media_uploads WHERE id = ? AND doc_id = ?")
    .get(attachmentId, docId) as { filename: string } | undefined;

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Delete file from disk
  const filepath = path.join(UPLOAD_DIR, attachment.filename);
  try {
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  } catch {
    // File may already be gone
  }

  // Delete DB record
  db.prepare("DELETE FROM media_uploads WHERE id = ?").run(attachmentId);

  return NextResponse.json({ success: true });
}
