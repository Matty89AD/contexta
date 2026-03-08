/**
 * URL Metadata Service — per-type metadata extraction (Epic 17).
 * Extracts title, author, description, published_date from YouTube oEmbed,
 * RSS feeds, and Open Graph tags on web pages.
 */
import type { TranscriptJobUrlType, ContentSourceType } from "@/lib/db/types";
export { detectUrlType } from "@/lib/url-utils";

export interface UrlMetadata {
  title: string | null;
  author: string | null;
  description: string | null;
  published_date: string | null;
  source_type: ContentSourceType;
  thumbnail_url: string | null;
}

export interface RssEpisode {
  title: string;
  description: string | null;
  pubDate: string | null;
  audioUrl: string | null;
  duration: string | null;
}

export interface RssFeedData {
  feedTitle: string | null;
  feedAuthor: string | null;
  episodes: RssEpisode[];
}

/** Extract metadata for a YouTube URL via oEmbed. */
export async function extractYouTubeMetadata(url: string): Promise<UrlMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return emptyMeta("video");
    const data = await res.json();
    return {
      title: data.title ?? null,
      author: data.author_name ?? null,
      description: null,
      published_date: null,
      source_type: "video",
      thumbnail_url: data.thumbnail_url ?? null,
    };
  } catch {
    return emptyMeta("video");
  }
}

/** Parse an RSS feed and return the feed info + up to 50 recent episodes. */
export async function extractRssFeed(url: string): Promise<RssFeedData> {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    const episodes: RssEpisode[] = (feed.items ?? []).slice(0, 50).map((item) => ({
      title: item.title ?? "Untitled",
      description: item.contentSnippet ?? (item.content ?? null),
      pubDate: item.pubDate ?? item.isoDate ?? null,
      audioUrl: (item.enclosure as { url?: string } | undefined)?.url ?? null,
      duration:
        (item as Record<string, unknown>)["itunes:duration"] as string | null ?? null,
    }));
    return {
      feedTitle: feed.title ?? null,
      feedAuthor: feed.itunes?.author ?? (feed as Record<string, unknown>).creator as string | null ?? null,
      episodes,
    };
  } catch {
    return { feedTitle: null, feedAuthor: null, episodes: [] };
  }
}

/** Extract Open Graph metadata from a web page. */
export async function extractWebpageMetadata(url: string): Promise<UrlMetadata> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Contexta/1.0)" },
    });
    if (!res.ok) return emptyMeta("website");
    const html = await res.text();
    const { load } = await import("cheerio");
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content") ?? null;
    const ogDescription = $('meta[property="og:description"]').attr("content") ?? null;
    const ogSiteName = $('meta[property="og:site_name"]').attr("content") ?? null;
    const articleDate = $('meta[property="article:published_time"]').attr("content") ?? null;
    const rawTitle = $("title").first().text().trim() || null;
    const title = ogTitle ?? rawTitle;
    return {
      title,
      author: ogSiteName,
      description: ogDescription,
      published_date: articleDate,
      source_type: "website",
      thumbnail_url: $('meta[property="og:image"]').attr("content") ?? null,
    };
  } catch {
    return emptyMeta("website");
  }
}

/** Extract metadata appropriate for the given URL type. */
export async function extractMetadata(
  url: string,
  urlType: TranscriptJobUrlType
): Promise<UrlMetadata> {
  switch (urlType) {
    case "youtube":
      return extractYouTubeMetadata(url);
    case "podcast_rss":
    case "podcast_episode":
      return emptyMeta("podcast");
    case "webpage":
    default:
      return extractWebpageMetadata(url);
  }
}

function emptyMeta(source_type: ContentSourceType): UrlMetadata {
  return {
    title: null,
    author: null,
    description: null,
    published_date: null,
    source_type,
    thumbnail_url: null,
  };
}
