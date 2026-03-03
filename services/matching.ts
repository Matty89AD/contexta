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
 * Determines whether any challenge domain overlaps with content domains.
 * Falls back to primary_domain if the domains array is empty (Epic 6 backward compat).
 */
export function hasDomainOverlap(
  challengeDomains: ChallengeDomain[],
  contentDomains: ChallengeDomain[],
  primaryDomain: ChallengeDomain | null
): boolean {
  const effective =
    contentDomains.length > 0
      ? contentDomains
      : primaryDomain
      ? [primaryDomain]
      : [];
  return challengeDomains.some((d) => effective.includes(d));
}

/**
 * Semantic similarity ranking with domain as a soft signal (Epic 6).
 * All embedding candidates participate — no hard domain filter.
 * Domain overlap contributes a structured-fit boost; non-matching content
 * still ranks via semantic similarity.
 */
export async function runMatching(
  supabase: SupabaseClient,
  embedding: number[],
  challengeDomains: ChallengeDomain[]
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

  // All candidates participate — no hard domain exclusion (Epic 6 R3)
  const ranked: RankedMatch[] = candidates.map((chunkWithContent) => {
    const contentDomains: ChallengeDomain[] = chunkWithContent.content.domains ?? [];
    const overlap = hasDomainOverlap(
      challengeDomains,
      contentDomains,
      chunkWithContent.content.primary_domain
    );
    // Domain overlap = structured fit boost; non-overlap = lower base score
    const structuredFitScore = overlap ? 1 : 0.5;
    const similarityScore = Math.max(0, chunkWithContent.similarity ?? 0);
    const finalScore =
      STRUCTURED_FIT_WEIGHT * structuredFitScore +
      EMBEDDING_SIMILARITY_WEIGHT * similarityScore;
    const matchReason: MatchReason = overlap ? "structured_fit" : "semantic";
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
