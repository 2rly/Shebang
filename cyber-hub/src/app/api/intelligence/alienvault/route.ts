import { NextRequest, NextResponse } from "next/server";
import { lookupIndicator } from "@/lib/intelligence/services/alienvault-otx";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const type = request.nextUrl.searchParams.get("type") as "ip" | "domain" | null;

  if (!query || !type) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "query and type parameters required" } },
      { status: 400 }
    );
  }

  const result = await lookupIndicator(query, type);

  if (!result.success && result.error?.code === "API_KEY_MISSING") {
    return NextResponse.json(result, { status: 503 });
  }
  if (!result.success && result.error?.code === "RATE_LIMIT") {
    return NextResponse.json(result, { status: 429 });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
