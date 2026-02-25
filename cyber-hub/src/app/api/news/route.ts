import { NextRequest, NextResponse } from "next/server";
import RSSParser from "rss-parser";
import { NEWS_SOURCES, NewsSourceKey, ParsedNewsItem } from "@/lib/news-sources";

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ShebangAZ/1.0; +https://shebang.az)",
  },
});

async function fetchFeed(sourceKey: NewsSourceKey): Promise<ParsedNewsItem[]> {
  const source = NEWS_SOURCES[sourceKey];

  try {
    const feed = await parser.parseURL(source.rssUrl);

    return (feed.items || []).slice(0, 15).map((item, index) => ({
      id: `${sourceKey}-${Date.now()}-${index}`,
      title: (item.title || "Untitled").substring(0, 200),
      link: item.link || item.guid || "",
      source: sourceKey,
      sourceName: source.name,
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      description: (item.contentSnippet || item.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 300),
      categories: item.categories || [],
    }));
  } catch (error) {
    console.error(`[news] Failed to fetch ${sourceKey}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourcesParam = searchParams.get("sources");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  let sourceKeys: NewsSourceKey[];
  if (sourcesParam) {
    sourceKeys = sourcesParam
      .split(",")
      .filter((s): s is NewsSourceKey => s in NEWS_SOURCES);
  } else {
    sourceKeys = Object.keys(NEWS_SOURCES) as NewsSourceKey[];
  }

  const results = await Promise.allSettled(sourceKeys.map((s) => fetchFeed(s)));

  const items = results
    .filter((r): r is PromiseFulfilledResult<ParsedNewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, limit);

  return NextResponse.json({
    items,
    count: items.length,
    sources: sourceKeys,
    fetchedAt: new Date().toISOString(),
  });
}
