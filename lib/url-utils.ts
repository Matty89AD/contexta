/**
 * Client-safe URL utilities (no Node.js imports).
 * Used by both client components and server services.
 */
import type { TranscriptJobUrlType } from "@/lib/db/types";

/** Detect URL type from URL pattern. Pure function — safe for client and server. */
export function detectUrlType(url: string): TranscriptJobUrlType {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const pathname = u.pathname.toLowerCase();

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }
    if (
      pathname.endsWith(".mp3") ||
      pathname.endsWith(".m4a") ||
      pathname.endsWith(".ogg") ||
      pathname.endsWith(".wav")
    ) {
      return "podcast_episode";
    }
    if (
      pathname.endsWith(".xml") ||
      pathname.endsWith(".rss") ||
      pathname.includes("/feed") ||
      pathname.includes("/rss")
    ) {
      return "podcast_rss";
    }
    return "webpage";
  } catch {
    return "webpage";
  }
}
