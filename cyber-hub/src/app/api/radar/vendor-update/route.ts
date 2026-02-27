import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { securityProducts } from "@/data/security-products";

/**
 * POST /api/radar/vendor-update
 * Allows authorized vendors (users whose company matches the product vendor)
 * or admins to update the latest version for a product.
 *
 * When a new version is posted, old "current version" entries for that product
 * are cleared from all users' saved versions, keeping the latest as focus.
 *
 * Body: { productName: string, latestVersion: string }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productName, latestVersion } = await req.json();

    if (!productName || !latestVersion) {
      return NextResponse.json(
        { error: "productName and latestVersion are required" },
        { status: 400 },
      );
    }

    // Find the product in our registry
    const product = securityProducts.find((p) => p.name === productName);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization: admin or user whose company matches the vendor
    const isAdmin = user.role === "admin";
    const isVendor =
      user.company &&
      product.vendor.toLowerCase() === user.company.toLowerCase();

    if (!isAdmin && !isVendor) {
      return NextResponse.json(
        {
          error:
            "Forbidden: only admins or authorized vendors can update product versions",
        },
        { status: 403 },
      );
    }

    const db = getDb();

    // Get the existing vendor update record (if any) to build version history
    const existing = db
      .prepare(
        "SELECT latest_version, previous_versions FROM vendor_product_updates WHERE product_name = ?",
      )
      .get(productName) as
      | { latest_version: string; previous_versions: string }
      | undefined;

    let previousVersions: string[] = [];
    if (existing) {
      try {
        previousVersions = JSON.parse(existing.previous_versions);
      } catch {
        previousVersions = [];
      }
      // Push the old latest into the history (if different from new)
      if (existing.latest_version !== latestVersion) {
        previousVersions.unshift(existing.latest_version);
        // Keep only last 10 entries
        previousVersions = previousVersions.slice(0, 10);
      }
    }

    // Upsert the vendor product update
    db.prepare(
      `INSERT INTO vendor_product_updates (vendor_user_id, product_name, latest_version, previous_versions, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(product_name)
       DO UPDATE SET vendor_user_id = excluded.vendor_user_id,
                     latest_version = excluded.latest_version,
                     previous_versions = excluded.previous_versions,
                     updated_at = datetime('now')`,
    ).run(user.id, productName, latestVersion, JSON.stringify(previousVersions));

    // Clear all users' current versions for this product
    // so the latest stays as the primary focus
    db.prepare(
      "DELETE FROM user_product_versions WHERE product_name = ?",
    ).run(productName);

    return NextResponse.json({
      ok: true,
      latestVersion,
      previousVersions,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update product version" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/radar/vendor-update?product=ProductName
 * Returns the vendor-updated version info (latest + history) for a product,
 * or all products if no query param.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productName = searchParams.get("product");

  const db = getDb();

  if (productName) {
    const row = db
      .prepare(
        "SELECT product_name, latest_version, previous_versions, updated_at FROM vendor_product_updates WHERE product_name = ?",
      )
      .get(productName) as
      | {
          product_name: string;
          latest_version: string;
          previous_versions: string;
          updated_at: string;
        }
      | undefined;

    if (!row) {
      return NextResponse.json({ update: null });
    }

    return NextResponse.json({
      update: {
        productName: row.product_name,
        latestVersion: row.latest_version,
        previousVersions: JSON.parse(row.previous_versions || "[]"),
        updatedAt: row.updated_at,
      },
    });
  }

  // Return all vendor updates
  const rows = db
    .prepare(
      "SELECT product_name, latest_version, previous_versions, updated_at FROM vendor_product_updates",
    )
    .all() as {
    product_name: string;
    latest_version: string;
    previous_versions: string;
    updated_at: string;
  }[];

  const updates: Record<
    string,
    {
      latestVersion: string;
      previousVersions: string[];
      updatedAt: string;
    }
  > = {};
  for (const row of rows) {
    updates[row.product_name] = {
      latestVersion: row.latest_version,
      previousVersions: JSON.parse(row.previous_versions || "[]"),
      updatedAt: row.updated_at,
    };
  }

  return NextResponse.json({ updates });
}
