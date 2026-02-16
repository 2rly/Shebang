import type { UsernameCheckResult } from "@/types/intelligence";
import type { ServiceResponse } from "../types";
import { checkRateLimit } from "../rate-limiter";

// Curated list of popular platforms to check.
// We check by making HEAD requests and interpreting status codes.
const PLATFORMS: Array<{
  name: string;
  url: (u: string) => string;
  category: string;
  notFoundStatus?: number[];
}> = [
  { name: "GitHub", url: (u) => `https://github.com/${u}`, category: "Development" },
  { name: "GitLab", url: (u) => `https://gitlab.com/${u}`, category: "Development" },
  { name: "Reddit", url: (u) => `https://www.reddit.com/user/${u}`, category: "Social" },
  { name: "X (Twitter)", url: (u) => `https://x.com/${u}`, category: "Social" },
  { name: "Instagram", url: (u) => `https://www.instagram.com/${u}/`, category: "Social" },
  { name: "LinkedIn", url: (u) => `https://www.linkedin.com/in/${u}`, category: "Social" },
  { name: "YouTube", url: (u) => `https://www.youtube.com/@${u}`, category: "Social" },
  { name: "TikTok", url: (u) => `https://www.tiktok.com/@${u}`, category: "Social" },
  { name: "Pinterest", url: (u) => `https://www.pinterest.com/${u}/`, category: "Social" },
  { name: "Medium", url: (u) => `https://medium.com/@${u}`, category: "Blog" },
  { name: "Dev.to", url: (u) => `https://dev.to/${u}`, category: "Development" },
  { name: "HackerOne", url: (u) => `https://hackerone.com/${u}`, category: "Security" },
  { name: "Bugcrowd", url: (u) => `https://bugcrowd.com/${u}`, category: "Security" },
  { name: "Keybase", url: (u) => `https://keybase.io/${u}`, category: "Security" },
  { name: "Steam", url: (u) => `https://steamcommunity.com/id/${u}`, category: "Gaming" },
  { name: "Twitch", url: (u) => `https://www.twitch.tv/${u}`, category: "Gaming" },
  { name: "Telegram", url: (u) => `https://t.me/${u}`, category: "Messaging" },
  { name: "Docker Hub", url: (u) => `https://hub.docker.com/u/${u}`, category: "Development" },
  { name: "npm", url: (u) => `https://www.npmjs.com/~${u}`, category: "Development" },
  { name: "PyPI", url: (u) => `https://pypi.org/user/${u}/`, category: "Development" },
];

async function checkPlatform(
  username: string,
  platform: (typeof PLATFORMS)[number]
): Promise<{ found: boolean; url: string }> {
  const url = platform.url(username);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "CyberHub-OSINT-Platform/1.0",
      },
    });
    // Most platforms return 404 when user doesn't exist
    return { found: res.ok, url };
  } catch {
    // Network error / timeout — treat as inconclusive, skip
    return { found: false, url };
  }
}

export async function checkUsername(
  username: string
): Promise<ServiceResponse<UsernameCheckResult>> {
  if (!checkRateLimit("username-check", 2, 30_000)) {
    return {
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Username check rate limit exceeded (2/30s)",
        retryAfter: 30,
      },
    };
  }

  try {
    const results = await Promise.allSettled(
      PLATFORMS.map((p) => checkPlatform(username, p))
    );

    const found: UsernameCheckResult["found"] = [];
    const notFound: string[] = [];

    results.forEach((result, i) => {
      const platform = PLATFORMS[i];
      if (result.status === "fulfilled" && result.value.found) {
        found.push({
          platform: platform.name,
          url: result.value.url,
          category: platform.category,
        });
      } else {
        notFound.push(platform.name);
      }
    });

    return {
      success: true,
      data: {
        username,
        found,
        notFound,
        total: PLATFORMS.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: "API_ERROR", message: err.message ?? "Unknown error" },
    };
  }
}
