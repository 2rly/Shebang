import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare("SELECT product_name, current_version FROM user_product_versions WHERE user_id = ?")
    .all(user.id) as { product_name: string; current_version: string }[];

  const versions: Record<string, string> = {};
  for (const row of rows) {
    versions[row.product_name] = row.current_version;
  }

  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productName, currentVersion } = await req.json();

    if (!productName || !currentVersion) {
      return NextResponse.json({ error: "productName and currentVersion are required" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO user_product_versions (user_id, product_name, current_version, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, product_name)
       DO UPDATE SET current_version = excluded.current_version, updated_at = datetime('now')`
    ).run(user.id, productName, currentVersion);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save version" }, { status: 500 });
  }
}
