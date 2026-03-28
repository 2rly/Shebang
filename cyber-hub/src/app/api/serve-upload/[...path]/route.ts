import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".excalidraw": "application/json",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(UPLOAD_ROOT, ...segments);

  // Prevent directory traversal
  if (!filePath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
