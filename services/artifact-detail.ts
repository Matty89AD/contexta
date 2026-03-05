import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import type { Artifact } from "@/lib/db/types";
import { findChunksByKeyword } from "@/repositories/embeddings";
import {
  buildArtifactDetailPrompt,
  artifactDetailOutputSchema,
  type ArtifactDetailOutput,
} from "@/core/prompts/artifact-detail";
import { AIProviderError } from "@/core/errors";

export type { ArtifactDetailOutput };

export interface KnowledgeCard {
  id: string;
  title: string;
  author: string | null;
  source_type: string;
  url: string | null;
}

export async function generateArtifactDetail(
  artifact: Artifact,
  ai: AIProvider,
  challengeSummary?: string,
  challengeDomains?: string[]
): Promise<ArtifactDetailOutput> {
  const prompt = buildArtifactDetailPrompt(artifact, challengeSummary, challengeDomains);
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
  return parsed.data;
}

export async function getArtifactKnowledge(
  supabase: SupabaseClient,
  artifactTitle: string
): Promise<KnowledgeCard[]> {
  const chunks = await findChunksByKeyword(supabase, artifactTitle, 20);

  // Deduplicate: keep highest-scoring chunk per content_id
  const seen = new Map<string, { score: number; card: KnowledgeCard }>();
  for (const { content, keywordScore } of chunks) {
    const score = keywordScore ?? 0;
    const existing = seen.get(content.id);
    if (!existing || score > existing.score) {
      seen.set(content.id, {
        score,
        card: {
          id: content.id,
          title: content.title,
          author: content.author ?? null,
          source_type: content.source_type,
          url: content.url ?? null,
        },
      });
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((e) => e.card);
}
