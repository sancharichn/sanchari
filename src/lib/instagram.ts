import "server-only";
import { unstable_cache } from "next/cache";

/*
 * The latest posts from the group's Instagram, via the Instagram API with
 * Instagram Login (a long-lived token in INSTAGRAM_ACCESS_TOKEN). Long-lived
 * tokens last about 60 days; when it lapses the feed quietly falls back to a
 * link to the profile.
 */

export type InstagramPost = {
  id: string;
  caption: string;
  kind: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  imageUrl: string;
  permalink: string;
  timestamp: string;
};

type ApiMedia = {
  id: string;
  caption?: string;
  media_type: InstagramPost["kind"];
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

async function fetchPosts(limit: number): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return [];

  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    // Never log the URL: it carries the token.
    console.error(`[instagram] Feed request failed with ${response.status}. The access token may have expired.`);
    return [];
  }

  const data = (await response.json()) as { data?: ApiMedia[] };
  return (data.data ?? [])
    .map((m) => ({
      id: m.id,
      caption: (m.caption ?? "").trim(),
      kind: m.media_type,
      imageUrl: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "",
      permalink: m.permalink,
      timestamp: m.timestamp,
    }))
    .filter((p) => p.imageUrl && p.permalink.startsWith("https://"));
}

/** Cached for an hour; empty when no token is set or Instagram is unreachable. */
export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) return [];
  try {
    return await unstable_cache(() => fetchPosts(limit), ["instagram-feed", String(limit)], { revalidate: 3600 })();
  } catch (error) {
    console.error("[instagram] Could not load the feed", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}
