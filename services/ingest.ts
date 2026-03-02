import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import * as contentRepo from "@/repositories/content";
import type { ContentInsert, ContentSourceType } from "@/lib/db/types";
import { ChallengeDomain } from "@/lib/db/types";
import { logger } from "@/core/logger";

export interface ContentToIngest {
  source_type: ContentSourceType;
  title: string;
  url?: string | null;
  summary?: string | null;
  key_takeaways?: string | null;
  primary_domain?: ChallengeDomain | null;
  metadata?: Record<string, unknown>;
  chunks: string[];
}

export async function ingestContent(
  supabase: SupabaseClient,
  ai: AIProvider,
  input: ContentToIngest
): Promise<{ contentId: string }> {
  const content = await contentRepo.createContent(supabase, {
    source_type: input.source_type,
    title: input.title,
    url: input.url ?? null,
    summary: input.summary ?? null,
    key_takeaways: input.key_takeaways ?? null,
    metadata: input.metadata ?? {},
    primary_domain: input.primary_domain ?? null,
  } as ContentInsert);

  for (let i = 0; i < input.chunks.length; i++) {
    const body = input.chunks[i];
    let embedding: number[];
    try {
      embedding = await ai.generateEmbedding(body);
    } catch (e) {
      logger.error("Embedding failed for chunk", {
        contentId: content.id,
        chunkIndex: i,
        error: e,
      });
      throw e;
    }
    await contentRepo.createContentChunk(supabase, {
      content_id: content.id,
      body,
      embedding,
      chunk_index: i,
    });
  }

  logger.info("Ingested content", {
    contentId: content.id,
    title: content.title,
    chunks: input.chunks.length,
  });
  return { contentId: content.id };
}
