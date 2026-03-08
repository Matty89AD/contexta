import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import * as contentRepo from "@/repositories/content";
import type { ContentChunk, ContentInsert, ContentSourceType } from "@/lib/db/types";
import { ChallengeDomain } from "@/lib/db/types";
import { extractContentIntelligence } from "@/services/content-intelligence";
import { chunkTranscript } from "@/core/utils/chunking";
import { NotFoundError, ValidationError } from "@/core/errors";
import { logger } from "@/core/logger";

export interface ContentToIngest {
  source_type: ContentSourceType;
  title: string;
  url?: string | null;
  /** Primary domain for backward compat. Use `domains` for multi-domain (Epic 6). */
  primary_domain?: ChallengeDomain | null;
  /** Multi-domain support (Epic 6). When provided, overrides primary_domain derivation. */
  domains?: ChallengeDomain[];
  chunks: string[];
}

export async function ingestContent(
  supabase: SupabaseClient,
  ai: AIProvider,
  input: ContentToIngest
): Promise<{ contentId: string }> {
  // Build effective domains: explicit array takes precedence; fall back to primary_domain
  const effectiveDomains: ChallengeDomain[] =
    input.domains && input.domains.length > 0
      ? input.domains
      : input.primary_domain
      ? [input.primary_domain]
      : [];

  const content = await contentRepo.createContent(supabase, {
    source_type: input.source_type,
    title: input.title,
    url: input.url ?? null,
    primary_domain: effectiveDomains[0] ?? null,
    domains: effectiveDomains,
  } as ContentInsert);

  const createdChunks: ContentChunk[] = [];
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
    const chunk = await contentRepo.createContentChunk(supabase, {
      content_id: content.id,
      body,
      embedding,
      chunk_index: i,
    });
    createdChunks.push(chunk);
  }

  // Epic 8: extract and store content intelligence (non-fatal — ingest succeeds even if this fails)
  try {
    const intel = await extractContentIntelligence(
      ai,
      input.title,
      input.chunks,
      input.source_type
    );

    await contentRepo.updateContentIntelligence(supabase, content.id, {
      topics: intel.topics,
      keywords: intel.keywords,
      author: intel.author,
      publication_date: intel.publication_date,
      language: intel.language,
      extraction_confidence: intel.extraction_confidence,
    });

    for (let i = 0; i < createdChunks.length; i++) {
      const chunkIntel = intel.chunks[i];
      if (chunkIntel) {
        await contentRepo.updateChunkIntelligence(supabase, createdChunks[i].id, {
          chunk_type: chunkIntel.chunk_type,
          key_concepts: chunkIntel.key_concepts,
        });
      }
    }

    logger.info("Content intelligence extracted", {
      contentId: content.id,
      topics: intel.topics,
      confidence: intel.extraction_confidence,
    });
  } catch (e) {
    logger.error("Content intelligence extraction failed (non-fatal)", {
      contentId: content.id,
      error: e,
    });
  }

  logger.info("Ingested content", {
    contentId: content.id,
    title: content.title,
    chunks: input.chunks.length,
  });
  return { contentId: content.id };
}

/**
 * Process an existing content row by chunking its transcript_raw,
 * generating embeddings, extracting intelligence, and advancing
 * the status to 'pending_review'.
 * Epic 16 — Admin UI "Process now" trigger.
 */
export async function processContentById(
  supabase: SupabaseClient,
  ai: AIProvider,
  contentId: string
): Promise<{ chunk_count: number }> {
  const content = await contentRepo.getContentById(supabase, contentId);
  if (!content) throw new NotFoundError(`Content ${contentId} not found`);

  if (!content.transcript_raw?.trim()) {
    throw new ValidationError("Content has no transcript_raw to process");
  }

  // Delete existing chunks before re-processing
  await contentRepo.deleteChunksByContentId(supabase, contentId);

  const chunks = chunkTranscript(content.transcript_raw);
  logger.info("Processing content", { contentId, chunks: chunks.length });

  const createdChunks: ContentChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const body = chunks[i];
    const embedding = await ai.generateEmbedding(body);
    const chunk = await contentRepo.createContentChunk(supabase, {
      content_id: contentId,
      body,
      embedding,
      chunk_index: i,
    });
    createdChunks.push(chunk);
  }

  // Extract intelligence (non-fatal)
  try {
    const intel = await extractContentIntelligence(
      ai,
      content.title,
      chunks,
      content.source_type
    );
    await contentRepo.updateContentIntelligence(supabase, contentId, {
      topics: intel.topics,
      keywords: intel.keywords,
      author: intel.author,
      publication_date: intel.publication_date,
      language: intel.language,
      extraction_confidence: intel.extraction_confidence,
    });
    for (let i = 0; i < createdChunks.length; i++) {
      const chunkIntel = intel.chunks[i];
      if (chunkIntel) {
        await contentRepo.updateChunkIntelligence(supabase, createdChunks[i].id, {
          chunk_type: chunkIntel.chunk_type,
          key_concepts: chunkIntel.key_concepts,
        });
      }
    }
  } catch (e) {
    logger.error("Intelligence extraction failed (non-fatal)", { contentId, error: e });
  }

  // Advance status to pending_review
  const { error } = await supabase
    .from("content")
    .update({ status: "pending_review" })
    .eq("id", contentId);
  if (error) throw error;

  logger.info("Processed content", { contentId, chunk_count: createdChunks.length });
  return { chunk_count: createdChunks.length };
}
