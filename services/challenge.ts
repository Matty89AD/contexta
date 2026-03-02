import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import * as challengesRepo from "@/repositories/challenges";
import * as embeddingsRepo from "@/repositories/embeddings";
import { getConfig } from "@/core/config";
import {
  buildChallengeSummaryPrompt,
  challengeSummaryOutputSchema,
} from "@/core/prompts/challenge-summary";
import {
  buildRecommendationsPrompt,
  recommendationsOutputSchema,
} from "@/core/prompts/recommendations";
import { ValidationError, AIProviderError } from "@/core/errors";
import { logger } from "@/core/logger";
import type { ChunkWithContent } from "@/lib/db/types";
import type { ChallengeDomain } from "@/lib/db/types";

const challengeInputSchema = z.object({
  raw_description: z.string().min(10).max(5000),
  domain: z.enum(["strategy", "discovery", "delivery", "growth", "leadership"]),
  subdomain: z.string().max(200).optional(),
  impact_reach: z.string().max(1000).optional(),
});

export type ChallengeInput = z.infer<typeof challengeInputSchema>;

export interface ChallengeResult {
  challengeId: string;
  summary: string;
  problemStatement: string;
  desiredOutcomeStatement: string;
  matches: ChunkWithContent[];
  recommendations: {
    contentId: string;
    title: string;
    explanation: string;
    isMostRelevant: boolean;
    url?: string | null;
  }[];
}

export async function runChallengePipeline(
  supabase: SupabaseClient,
  ai: AIProvider,
  input: unknown,
  userId: string | null
): Promise<ChallengeResult> {
  const parsed = challengeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const { raw_description, domain, subdomain, impact_reach } = parsed.data;
  const { TOP_K } = getConfig();

  // 1. Create challenge record (summary updated after LLM)
  const challenge = await challengesRepo.createChallenge(supabase, {
    user_id: userId,
    raw_description,
    domain: domain as ChallengeDomain,
    subdomain: subdomain ?? null,
    impact_reach: impact_reach ?? null,
  });

  // 2. Generate structured summary
  const summaryPrompt = buildChallengeSummaryPrompt(raw_description, domain);
  let summaryText: string;
  try {
    summaryText = await ai.generateText(summaryPrompt, { jsonMode: true });
  } catch (e) {
    logger.error("AI summary failed", { challengeId: challenge.id, error: e });
    throw new AIProviderError("Failed to generate challenge summary", e);
  }
  const summaryParsed = challengeSummaryOutputSchema.safeParse(
    JSON.parse(summaryText)
  );
  const structured_summary = summaryParsed.success
    ? summaryParsed.data.structured_summary
    : summaryText;
  const problem_statement = summaryParsed.success
    ? summaryParsed.data.problem_statement
    : raw_description.slice(0, 200);
  const desired_outcome_statement = summaryParsed.success
    ? summaryParsed.data.desired_outcome_statement
    : "";

  await challengesRepo.updateChallengeSummary(
    supabase,
    challenge.id,
    structured_summary
  );

  // 3. Embedding for search (combine summary + problem + outcome)
  const textToEmbed = [structured_summary, problem_statement, desired_outcome_statement]
    .filter(Boolean)
    .join("\n");
  let embedding: number[];
  try {
    embedding = await ai.generateEmbedding(textToEmbed);
  } catch (e) {
    logger.error("Embedding failed", { challengeId: challenge.id, error: e });
    throw new AIProviderError("Failed to generate embedding", e);
  }

  // 4. Vector similarity search
  const matches = await embeddingsRepo.findSimilarChunks(supabase, embedding, TOP_K);

  // 5. Generate recommendations (3-5 items, one most relevant)
  const chunkPayloads = matches.map((m) => ({
    contentId: m.content.id,
    title: m.content.title,
    body: m.chunk.body,
  }));
  let recommendationsOutput: ReturnType<typeof recommendationsOutputSchema.parse>;
  if (chunkPayloads.length > 0) {
    const recPrompt = buildRecommendationsPrompt(
      structured_summary,
      problem_statement,
      chunkPayloads
    );
    try {
      const recText = await ai.generateText(recPrompt, { jsonMode: true });
      recommendationsOutput = recommendationsOutputSchema.parse(
        JSON.parse(recText)
      );
    } catch (e) {
      logger.warn("Recommendations parse failed, using order", {
        challengeId: challenge.id,
        error: e,
      });
      recommendationsOutput = {
        recommendations: chunkPayloads.slice(0, 5).map((c, i) => ({
          content_id: c.contentId,
          title: c.title,
          explanation: "Relevant to your challenge based on semantic match.",
          is_most_relevant: i === 0,
        })),
      };
    }
  } else {
    recommendationsOutput = { recommendations: [] };
  }

  const contentById = new Map(matches.map((m) => [m.content.id, m.content]));
  const recommendations = recommendationsOutput.recommendations.map((r) => {
    const content = contentById.get(r.content_id);
    return {
      contentId: r.content_id,
      title: r.title,
      explanation: r.explanation,
      isMostRelevant: r.is_most_relevant,
      url: content?.url ?? null,
    };
  });

  return {
    challengeId: challenge.id,
    summary: structured_summary,
    problemStatement: problem_statement,
    desiredOutcomeStatement: desired_outcome_statement,
    matches,
    recommendations,
  };
}
