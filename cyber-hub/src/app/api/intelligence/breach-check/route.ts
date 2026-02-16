import { NextRequest, NextResponse } from "next/server";
import { checkBreaches } from "@/lib/intelligence/services/breach-check";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "query parameter required" } },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(query)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid email format" } },
      { status: 400 }
    );
  }

  const result = await checkBreaches(query);

  if (!result.success && result.error?.code === "API_KEY_MISSING") {
    return NextResponse.json(result, { status: 503 });
  }
  if (!result.success && result.error?.code === "RATE_LIMIT") {
    return NextResponse.json(result, { status: 429 });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
