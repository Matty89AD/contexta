import type { SupabaseClient } from "@supabase/supabase-js";
import * as embeddingsRepo from "@/repositories/embeddings";
import { getConfig } from "@/core/config";
import type { ChunkWithContent } from "@/lib/db/types";
import type { ChallengeDomain } from "@/lib/db/types";

/** Match reason for explainability (Epic 5) */
export type MatchReason = "structured_fit" | "semantic";

export interface RankedMatch {
  chunkWithContent: ChunkWithContent;
  /** Normalized 0–1 */
  structuredFitScore: number;
  /** Cosine similarity 0–1 */
  similarityScore: number;
  /** Combined score used for ranking */
  finalScore: number;
  matchReason: MatchReason;
}

const CANDIDATE_COUNT = 20;
const RETURN_TOP = 5;

/**
 * Layer 1: Structured filter (primary_domain). Progressive relaxation if no match.
 * Layer 2: Semantic similarity. Combine scores with configurable weights.
 * Returns top 3–5 with match reason (Epic 4).
 */
export async function runMatching(
  supabase: SupabaseClient,
  embedding: number[],
  challengeDomain: ChallengeDomain
): Promise<RankedMatch[]> {
  const {
    TOP_K,
    STRUCTURED_FIT_WEIGHT,
    EMBEDDING_SIMILARITY_WEIGHT,
  } = getConfig();

  const candidates = await embeddingsRepo.findSimilarChunks(
    supabase,
    embedding,
    Math.max(CANDIDATE_COUNT, TOP_K)
  );

  if (candidates.length === 0) return [];

  // Progressive relaxation: prefer domain match, then allow all
  const domainMatch = candidates.filter(
    (c) => c.content.primary_domain === challengeDomain
  );
  const toRank = domainMatch.length > 0 ? domainMatch : candidates;

  const ranked: RankedMatch[] = toRank.map((chunkWithContent) => {
    const structuredFitScore =
      chunkWithContent.content.primary_domain === challengeDomain ? 1 : 0.5;
    const similarityScore = Math.max(0, chunkWithContent.similarity ?? 0);
    const finalScore =
      STRUCTURED_FIT_WEIGHT * structuredFitScore +
      EMBEDDING_SIMILARITY_WEIGHT * similarityScore;
    const matchReason: MatchReason =
      chunkWithContent.content.primary_domain === challengeDomain
        ? "structured_fit"
        : "semantic";
    return {
      chunkWithContent,
      structuredFitScore,
      similarityScore,
      finalScore,
      matchReason,
    };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  return ranked.slice(0, Math.min(RETURN_TOP, TOP_K));
}
