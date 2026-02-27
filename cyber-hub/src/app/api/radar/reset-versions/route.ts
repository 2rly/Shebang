import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

/**
 * POST /api/radar/reset-versions
 * Clears old version values from the database.
 * Admin-only endpoint.
 *
 * Body (optional):
 *   { scope: "all" | "user" | "vendor", productName?: string }
 *
 *   - "all"    (default) — clears both user_product_versions and vendor_product_updates
 *   - "user"   — clears only user-saved current versions
 *   - "vendor" — clears only vendor-published latest versions
 *   - productName — if provided, only clears data for that specific product
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: only admins can reset version data" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const scope: string = body.scope || "all";
    const productName: string | undefined = body.productName;

    const db = getDb();
    const results: { userRowsDeleted: number; vendorRowsDeleted: number } = {
      userRowsDeleted: 0,
      vendorRowsDeleted: 0,
    };

    if (scope === "all" || scope === "user") {
      if (productName) {
        const r = db
          .prepare("DELETE FROM user_product_versions WHERE product_name = ?")
          .run(productName);
        results.userRowsDeleted = r.changes;
      } else {
        const r = db.prepare("DELETE FROM user_product_versions").run();
        results.userRowsDeleted = r.changes;
      }
    }

    if (scope === "all" || scope === "vendor") {
      if (productName) {
        const r = db
          .prepare("DELETE FROM vendor_product_updates WHERE product_name = ?")
          .run(productName);
        results.vendorRowsDeleted = r.changes;
      } else {
        const r = db.prepare("DELETE FROM vendor_product_updates").run();
        results.vendorRowsDeleted = r.changes;
      }
    }

    return NextResponse.json({
      ok: true,
      scope,
      productName: productName || null,
      ...results,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset version data" },
      { status: 500 },
    );
  }
}
