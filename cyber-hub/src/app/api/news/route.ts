import { NextRequest, NextResponse } from "next/server";
import { NEWS_SOURCES, ParsedNewsItem, NewsSourceKey } from "@/lib/news-sources";

// Simple XML parser for RSS feeds (no external dependency needed in API route)
function parseRSSItem(item: string): { title: string; link: string; pubDate: string; description: string } | null {
  const getTagContent = (tag: string, xml: string): string => {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '').trim() : '';
  };

  const title = getTagContent('title', item);
  const link = getTagContent('link', item) || getTagContent('guid', item);
  const pubDate = getTagContent('pubDate', item) || getTagContent('dc:date', item);
  const description = getTagContent('description', item) || getTagContent('content:encoded', item);

  if (!title || !link) return null;

  return {
    title: title.replace(/<[^>]*>/g, '').substring(0, 200),
    link: link.replace(/<[^>]*>/g, ''),
    pubDate,
    description: description.replace(/<[^>]*>/g, '').substring(0, 300),
  };
}

function parseRSS(xml: string): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];

  for (const match of matches) {
    const parsed = parseRSSItem(match);
    if (parsed) items.push(parsed);
  }

  return items;
}

async function fetchFeed(sourceKey: NewsSourceKey): Promise<ParsedNewsItem[]> {
  const source = NEWS_SOURCES[sourceKey];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(source.rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'shebang.az News Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${sourceKey}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const items = parseRSS(xml);

    return items.slice(0, 10).map((item, index) => ({
      id: `${sourceKey}-${Date.now()}-${index}`,
      title: item.title,
      link: item.link,
      source: sourceKey,
      sourceName: source.name,
      pubDate: item.pubDate || new Date().toISOString(),
      description: item.description,
    }));
  } catch (error) {
    console.error(`Error fetching ${sourceKey}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sourcesParam = searchParams.get("sources");
  const limitParam = searchParams.get("limit");

  const requestedSources = sourcesParam
    ? (sourcesParam.split(",") as NewsSourceKey[])
    : (Object.keys(NEWS_SOURCES) as NewsSourceKey[]);

  const limit = limitParam ? parseInt(limitParam, 10) : 30;

  try {
    // Fetch all feeds in parallel
    const feedPromises = requestedSources
      .filter((source) => source in NEWS_SOURCES)
      .map((source) => fetchFeed(source));

    const results = await Promise.all(feedPromises);

    // Flatten and sort by date
    const allItems = results
      .flat()
      .sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime() || 0;
        const dateB = new Date(b.pubDate).getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: allItems.length,
      items: allItems,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news feeds" },
      { status: 500 }
    );
  }
}
