import type { AIProvider } from "@/core/ai/types";
import type { ChunkType } from "@/lib/db/types";
import {
  buildContentIntelligencePrompt,
  contentIntelligenceOutputSchema,
  type ContentIntelligenceOutput,
  type ChunkIntelligenceOutput,
} from "@/core/prompts/content-intelligence";
import { logger } from "@/core/logger";

export type { ContentIntelligenceOutput, ChunkIntelligenceOutput };

/**
 * Extract document-level and chunk-level metadata from ingested content
 * using a single LLM call. Falls back gracefully on parse or validation errors.
 */
export async function extractContentIntelligence(
  ai: AIProvider,
  title: string,
  chunks: string[],
  sourceType: string
): Promise<ContentIntelligenceOutput> {
  if (chunks.length === 0) {
    return buildFallback(0);
  }

  const prompt = buildContentIntelligencePrompt(title, chunks, sourceType);

  let raw: string;
  try {
    raw = await ai.generateText(prompt, { jsonMode: true });
  } catch (e) {
    logger.error("Content intelligence: LLM call failed", { title, error: e });
    return buildFallback(chunks.length);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.error("Content intelligence: invalid JSON", { title, raw: raw.slice(0, 300) });
    return buildFallback(chunks.length);
  }

  const result = contentIntelligenceOutputSchema.safeParse(parsed);
  if (!result.success) {
    logger.error("Content intelligence: schema validation failed", {
      title,
      errors: result.error.errors,
    });
    return buildFallback(chunks.length);
  }

  const data = result.data;

  // Reconcile chunk count: pad or trim so it always matches input length
  if (data.chunks.length !== chunks.length) {
    logger.warn("Content intelligence: chunk count mismatch — reconciling", {
      title,
      expected: chunks.length,
      got: data.chunks.length,
    });
    while (data.chunks.length < chunks.length) {
      data.chunks.push({ chunk_type: "introduction" as ChunkType, key_concepts: [] });
    }
    data.chunks = data.chunks.slice(0, chunks.length);
  }

  return data;
}

function buildFallback(chunkCount: number): ContentIntelligenceOutput {
  return {
    topics: [],
    keywords: [],
    author: null,
    publication_date: null,
    language: "en",
    extraction_confidence: 0,
    chunks: Array.from({ length: chunkCount }, () => ({
      chunk_type: "introduction" as ChunkType,
      key_concepts: [],
    })),
  };
}
