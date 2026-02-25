import { ParsedNewsItem, NewsSourceKey } from "./news-sources";

export async function fetchAllFeeds(
  sources: NewsSourceKey[],
  limit: number = 50
): Promise<ParsedNewsItem[]> {
  const params = new URLSearchParams({
    sources: sources.join(","),
    limit: String(limit),
  });

  const response = await fetch(`/api/news?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }

  const data = await response.json();
  return data.items as ParsedNewsItem[];
}
