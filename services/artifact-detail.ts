import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import type { Artifact } from "@/lib/db/types";
import { findSimilarChunks } from "@/repositories/embeddings";
import { updateArtifactDetail } from "@/repositories/artifacts";
import {
  buildArtifactDetailPrompt,
  buildProTipPrompt,
  artifactDetailOutputSchema,
  proTipOutputSchema,
  type ArtifactDetailOutput,
} from "@/core/prompts/artifact-detail";
import { AIProviderError } from "@/core/errors";
import { logger } from "@/core/logger";

export type { ArtifactDetailOutput };

export interface KnowledgeCard {
  id: string;
  title: string;
  author: string | null;
  source_type: string;
  url: string | null;
}

/**
 * Returns the full artifact detail.
 *
 * 1. If the artifact row already has a pre-generated `detail`, use it (instant).
 * 2. Otherwise generate via LLM and persist back to the DB (first-miss population).
 * 3. If a challengeSummary is provided, run a small LLM call to override pro_tip
 *    with a personalised version — only this call happens on most page loads.
 */
export async function generateArtifactDetail(
  supabase: SupabaseClient,
  artifact: Artifact,
  ai: AIProvider
): Promise<ArtifactDetailOutput> {
  // 1. Try DB-cached static detail
  let staticDetail: ArtifactDetailOutput | null = null;

  if (artifact.detail) {
    const cached = artifactDetailOutputSchema.safeParse(artifact.detail);
    if (cached.success) staticDetail = cached.data;
  }

  // 2. Generate static detail on cache miss
  if (!staticDetail) {
    const prompt = buildArtifactDetailPrompt(artifact);
    let text: string;
    try {
      text = await ai.generateText(prompt, { jsonMode: true });
    } catch (e) {
      throw new AIProviderError("Failed to generate artifact detail", e);
    }

    let parsed;
    try {
      parsed = artifactDetailOutputSchema.safeParse(JSON.parse(text));
    } catch {
      throw new AIProviderError("Invalid JSON in artifact detail response");
    }
    if (!parsed.success) {
      throw new AIProviderError(`Invalid artifact detail response: ${parsed.error.message}`);
    }
    staticDetail = parsed.data;

    // Persist async — does not block the response
    updateArtifactDetail(supabase, artifact.slug, staticDetail as Record<string, unknown>).catch(
      (e) => logger.warn("Failed to persist artifact detail", { slug: artifact.slug, error: e })
    );
  }

  return staticDetail;
}

/**
 * Generates a personalised pro_tip for a specific user challenge.
 * Called as a separate, parallel request so the static detail can render immediately.
 */
export async function generateProTip(
  artifact: Artifact,
  ai: AIProvider,
  challengeSummary: string,
  challengeDomains?: string[]
): Promise<string | null> {
  try {
    const text = await ai.generateText(
      buildProTipPrompt(artifact, challengeSummary, challengeDomains),
      { jsonMode: true }
    );
    const parsed = proTipOutputSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.pro_tip : null;
  } catch {
    return null;
  }
}

/**
 * Finds knowledge base content relevant to an artifact using vector similarity.
 * Embedding the artifact title + use_case finds semantically related content
 * even when the exact artifact name doesn't appear verbatim in chunk bodies.
 */
export async function getArtifactKnowledge(
  supabase: SupabaseClient,
  artifact: Artifact,
  ai: AIProvider
): Promise<KnowledgeCard[]> {
  const embedding = await ai.generateEmbedding(`${artifact.title}. ${artifact.use_case}`);
  const chunks = await findSimilarChunks(supabase, embedding, 20);

  // Deduplicate: keep first (highest similarity) chunk per content_id
  const seen = new Map<string, KnowledgeCard>();
  for (const { content } of chunks) {
    if (!seen.has(content.id)) {
      seen.set(content.id, {
        id: content.id,
        title: content.title,
        author: content.author ?? null,
        source_type: content.source_type,
        url: content.url ?? null,
      });
    }
  }

  return Array.from(seen.values()).slice(0, 5);
}
