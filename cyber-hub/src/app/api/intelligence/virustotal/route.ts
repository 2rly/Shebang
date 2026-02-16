import { NextRequest, NextResponse } from "next/server";
import { lookupHash, lookupUrl } from "@/lib/intelligence/services/virustotal";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const type = request.nextUrl.searchParams.get("type") || "hash";

  if (!query) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "query parameter required" } },
      { status: 400 }
    );
  }

  const result = type === "url" ? await lookupUrl(query) : await lookupHash(query);

  if (!result.success && result.error?.code === "API_KEY_MISSING") {
    return NextResponse.json(result, { status: 503 });
  }
  if (!result.success && result.error?.code === "RATE_LIMIT") {
    return NextResponse.json(result, { status: 429 });
  }
  if (!result.success && result.error?.code === "NOT_FOUND") {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
