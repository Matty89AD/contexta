/**
 * Transcript Extractor Service — uses @steipete/summarize programmatic API (Epic 17).
 * Uses createLinkPreviewClient instead of spawning the summarize CLI so that
 * it works in serverless environments (Vercel) where child_process.execFile
 * cannot spawn arbitrary binaries.
 */
import { createLinkPreviewClient } from "@steipete/summarize/content";

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface TranscriptResult {
  transcript: string;
  detectedTitle?: string;
  detectedAuthor?: string;
  duration?: number;
}

/**
 * Extract raw transcript/content from a URL using the summarize programmatic API.
 * Skips LLM summarization — returns raw content only.
 */
export async function extractTranscript(url: string): Promise<TranscriptResult> {
  const client = createLinkPreviewClient({
    env: {
      OPENAI_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
      OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
    },
    openaiApiKey: process.env.OPENROUTER_API_KEY ?? undefined,
  });

  const result = await client.fetchLinkContent(url, {
    youtubeTranscript: "auto",
    format: "text",
    timeoutMs: TIMEOUT_MS,
    maxCharacters: 50 * 1024 * 4, // ~200k chars for long transcripts
  });

  const transcript = result.content ?? "";

  return {
    transcript: cleanTranscript(transcript),
    detectedTitle: result.title ?? undefined,
    duration: result.mediaDurationSeconds ?? undefined,
  };
}

/**
 * Normalise raw content into clean prose:
 * - Strip leading "Transcript:" label
 * - Join short caption lines into continuous text
 * - Treat >> speaker-change markers as paragraph breaks
 */
function cleanTranscript(raw: string): string {
  // Remove leading "Transcript:" label (case-insensitive, optional whitespace)
  let text = raw.replace(/^\s*transcript\s*:?\s*/i, "").trim();

  // Split into lines and rebuild as paragraphs
  const lines = text.split("\n");
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped) continue;

    if (stripped.startsWith(">>")) {
      // Flush current paragraph, start new one with speaker content
      if (current.length) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      const content = stripped.replace(/^>>\s*/, "").trim();
      if (content) current.push(content);
    } else {
      current.push(stripped);
    }
  }
  if (current.length) paragraphs.push(current.join(" "));

  return paragraphs.join("\n\n").trim();
}
