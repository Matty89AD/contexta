import type { AIProvider } from "@/core/ai/types";
import type { ChunkType } from "@/lib/db/types";
import {
  buildContentSummaryPrompt,
  contentSummaryOutputSchema,
} from "@/core/prompts/content-summary";
import { logger } from "@/core/logger";

export interface ChunkForSummary {
  body: string;
  chunk_type: ChunkType | null;
  chunk_index: number;
}

/**
 * Selects the best chunks to use for summary generation.
 *
 * Strategy:
 * 1. Use all chunks with chunk_type = 'summary'
 * 2. Fallback: first 2 chunks + last 2 chunks (by chunk_index)
 * 3. If no chunks at all: returns empty array (caller synthesises from title/topics/keywords)
 */
export function selectChunksForSummary(chunks: ChunkForSummary[]): string[] {
  if (chunks.length === 0) return [];

  const summaryChunks = chunks.filter((c) => c.chunk_type === "summary");
  if (summaryChunks.length > 0) {
    return summaryChunks.map((c) => c.body);
  }

  // Fallback: first 2 + last 2 (deduped if ≤4 total)
  const sorted = [...chunks].sort((a, b) => a.chunk_index - b.chunk_index);
  const first = sorted.slice(0, 2);
  const last = sorted.slice(-2);
  const selected = [...first];
  for (const c of last) {
    if (!selected.find((x) => x.chunk_index === c.chunk_index)) {
      selected.push(c);
    }
  }
  return selected.map((c) => c.body);
}

/**
 * Generates a 2–4 sentence summary for a content item.
 * Returns null if generation fails (non-fatal).
 */
export async function generateContentSummary(
  ai: AIProvider,
  title: string,
  sourceType: string,
  author: string | null,
  chunks: ChunkForSummary[],
  topics: string[],
  keywords: string[]
): Promise<string | null> {
  try {
    const selectedChunks = selectChunksForSummary(chunks);
    const prompt = buildContentSummaryPrompt(
      title,
      sourceType,
      author,
      selectedChunks,
      topics,
      keywords
    );
    const text = await ai.generateText(prompt, { jsonMode: true });
    const parsed = contentSummaryOutputSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      logger.warn("Content summary parse failed", { title, error: parsed.error.message });
      return null;
    }
    return parsed.data.summary;
  } catch (e) {
    logger.warn("Content summary generation failed (non-fatal)", { title, error: e });
    return null;
  }
}
