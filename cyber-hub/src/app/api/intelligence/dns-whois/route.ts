import { NextRequest, NextResponse } from "next/server";
import { lookupDomain } from "@/lib/intelligence/services/dns-whois";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "query parameter required" } },
      { status: 400 }
    );
  }

  // Basic domain validation
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(query)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid domain format" } },
      { status: 400 }
    );
  }

  const result = await lookupDomain(query);

  if (!result.success && result.error?.code === "RATE_LIMIT") {
    return NextResponse.json(result, { status: 429 });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
