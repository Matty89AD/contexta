import type { SupabaseClient } from "@supabase/supabase-js";
import * as embeddingsRepo from "@/repositories/embeddings";
import { getConfig } from "@/core/config";
import type { ChunkWithContent } from "@/lib/db/types";
import type { ChallengeDomain } from "@/lib/db/types";

/** Match reason for explainability (Epic 5 + Epic 7) */
export type MatchReason = "structured_fit" | "semantic" | "keyword" | "hybrid";

export interface RankedMatch {
  chunkWithContent: ChunkWithContent;
  /** Normalized 0–1 */
  structuredFitScore: number;
  /** Cosine similarity 0–1 */
  similarityScore: number;
  /** Full-text keyword relevance score 0–1 (Epic 7) */
  keywordScore: number;
  /** Combined score used for ranking */
  finalScore: number;
  matchReason: MatchReason;
}

/** Number of candidates fetched per retrieval method (vector + keyword each). */
const CANDIDATE_COUNT = 20;
/** Top N chunks passed to the recommendations LLM (Epic 7: 6–8). */
const RETURN_TOP = 8;

/** Determines whether any challenge domain overlaps with content domains. */
export function hasDomainOverlap(
  challengeDomains: ChallengeDomain[],
  contentDomains: ChallengeDomain[]
): boolean {
  return challengeDomains.some((d) => contentDomains.includes(d));
}

/**
 * Determine match reason from retrieval signals.
 * "hybrid"         — appeared in both vector and keyword results
 * "structured_fit" — domain overlap (regardless of retrieval source)
 * "keyword"        — keyword-only match (no vector similarity)
 * "semantic"       — vector-only match
 */
function resolveMatchReason(
  domainOverlap: boolean,
  fromVector: boolean,
  fromKeyword: boolean
): MatchReason {
  if (domainOverlap) return "structured_fit";
  if (fromVector && fromKeyword) return "hybrid";
  if (fromKeyword) return "keyword";
  return "semantic";
}

/**
 * Hybrid retrieval and reranking (Epic 7).
 *
 * 1. Vector search (pgvector cosine): top CANDIDATE_COUNT chunks.
 * 2. Keyword search (tsvector ts_rank_cd): top CANDIDATE_COUNT chunks.
 * 3. Merge and deduplicate by chunk ID.
 * 4. Score each merged candidate: structuredFit + semantic + keyword.
 * 5. Sort descending; return top RETURN_TOP (6–8) to the recommendations pipeline.
 *
 * Keyword search failure is non-fatal — the system gracefully falls back to
 * vector-only retrieval (e.g. before tsvector is backfilled).
 */
export async function runMatching(
  supabase: SupabaseClient,
  embedding: number[],
  challengeDomains: ChallengeDomain[],
  challengeText: string
): Promise<RankedMatch[]> {
  const {
    TOP_K,
    STRUCTURED_FIT_WEIGHT,
    EMBEDDING_SIMILARITY_WEIGHT,
    KEYWORD_RELEVANCE_WEIGHT,
  } = getConfig();

  const fetchCount = Math.max(CANDIDATE_COUNT, TOP_K);

  // Run both retrievals concurrently
  const [vectorCandidates, keywordCandidates] = await Promise.all([
    embeddingsRepo.findSimilarChunks(supabase, embedding, fetchCount),
    embeddingsRepo.findChunksByKeyword(supabase, challengeText, fetchCount),
  ]);

  if (vectorCandidates.length === 0 && keywordCandidates.length === 0) return [];

  // Merge: track which retrieval method each chunk came from
  const mergedMap = new Map<
    string,
    {
      chunkWithContent: ChunkWithContent;
      similarity: number;
      keywordScore: number;
      fromVector: boolean;
      fromKeyword: boolean;
    }
  >();

  for (const c of vectorCandidates) {
    mergedMap.set(c.chunk.id, {
      chunkWithContent: c,
      similarity: c.similarity ?? 0,
      keywordScore: 0,
      fromVector: true,
      fromKeyword: false,
    });
  }

  for (const c of keywordCandidates) {
    const existing = mergedMap.get(c.chunk.id);
    if (existing) {
      existing.keywordScore = c.keywordScore ?? 0;
      existing.fromKeyword = true;
    } else {
      mergedMap.set(c.chunk.id, {
        chunkWithContent: c,
        similarity: 0,
        keywordScore: c.keywordScore ?? 0,
        fromVector: false,
        fromKeyword: true,
      });
    }
  }

  // Rerank merged candidates
  const ranked: RankedMatch[] = Array.from(mergedMap.values()).map(
    ({ chunkWithContent, similarity, keywordScore, fromVector, fromKeyword }) => {
      const contentDomains: ChallengeDomain[] = chunkWithContent.content.domains ?? [];
      const overlap = hasDomainOverlap(challengeDomains, contentDomains);
      const structuredFitScore = overlap ? 1 : 0.5;
      const finalScore =
        STRUCTURED_FIT_WEIGHT * structuredFitScore +
        EMBEDDING_SIMILARITY_WEIGHT * Math.max(0, similarity) +
        KEYWORD_RELEVANCE_WEIGHT * Math.max(0, keywordScore);
      const matchReason = resolveMatchReason(overlap, fromVector, fromKeyword);

      return {
        chunkWithContent: {
          ...chunkWithContent,
          similarity,
          keywordScore,
        },
        structuredFitScore,
        similarityScore: Math.max(0, similarity),
        keywordScore: Math.max(0, keywordScore),
        finalScore,
        matchReason,
      };
    }
  );

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  return ranked.slice(0, Math.min(RETURN_TOP, Math.max(TOP_K, RETURN_TOP)));
}
