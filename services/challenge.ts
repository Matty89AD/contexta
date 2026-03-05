import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import * as challengesRepo from "@/repositories/challenges";
import * as artifactsRepo from "@/repositories/artifacts";
import { runMatching } from "@/services/matching";
import {
  buildChallengeSummaryPrompt,
  challengeSummaryOutputSchema,
} from "@/core/prompts/challenge-summary";
import {
  buildRecommendationsPrompt,
  recommendationsOutputSchema,
} from "@/core/prompts/recommendations";
import { ValidationError, AIProviderError, NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";
import type { ArtifactRecommendation } from "@/lib/db/types";
import type { ChallengeDomain } from "@/lib/db/types";

/** Turn OpenAI/API errors into a short, user-safe message for the UI. */
function aiErrorToUserMessage(e: unknown): string {
  const err = e as { status?: number; message?: string } | undefined;
  const status = err?.status;
  const msg = err?.message ?? (e instanceof Error ? e.message : String(e));
  if (status === 401) {
    return "Invalid or missing API key. Add a valid OPENROUTER_API_KEY to .env.local.";
  }
  if (status === 429) {
    return "Rate limit exceeded. Please try again in a moment.";
  }
  if (status === 500 || status === 502) {
    return "AI service is temporarily unavailable. Please try again.";
  }
  if (msg && typeof msg === "string" && msg.length < 120 && !msg.includes("sk-")) {
    return msg;
  }
  return "Failed to generate challenge summary. Check the server logs for details.";
}

const DOMAIN_VALUES = ["strategy", "discovery", "delivery", "growth", "leadership"] as const;

const contextSchema = z
  .object({
    role: z.string().optional(),
    company_stage: z.string().optional(),
    team_size: z.string().optional(),
    experience_level: z.string().optional(),
  })
  .optional();

const challengeInputSchema = z.object({
  raw_description: z.string().min(10).max(5000),
  /** Multi-domain support (Epic 6): at least one domain required. */
  domains: z.array(z.enum(DOMAIN_VALUES)).min(1).max(5),
  subdomain: z.string().max(200).optional(),
  impact_reach: z.string().max(1000).optional(),
  context: contextSchema,
});

export type ChallengeInput = z.infer<typeof challengeInputSchema>;

/** Returned by phase 1 — summary available immediately after first LLM call. */
export interface ChallengePhase1Result {
  challengeId: string;
  summary: string;
  problemStatement: string;
  desiredOutcomeStatement: string;
}

/** Returned by phase 2 — artifact recommendations after second LLM call. */
export interface ChallengePhase2Result {
  recommendations: ArtifactRecommendation[];
}

/**
 * Phase 1: parse input → create DB record → generate summary → persist.
 * Returns as soon as the summary LLM call completes (~10-12s).
 */
export async function runChallengePhase1(
  supabase: SupabaseClient,
  ai: AIProvider,
  input: unknown,
  userId: string | null
): Promise<ChallengePhase1Result> {
  const parsed = challengeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const { raw_description, domains, subdomain, impact_reach, context } = parsed.data;
  const primaryDomain = domains[0] as ChallengeDomain;

  // 1. Create challenge record
  const challenge = await challengesRepo.createChallenge(supabase, {
    user_id: userId,
    raw_description,
    domain: primaryDomain,
    domains: domains as ChallengeDomain[],
    subdomain: subdomain ?? null,
    impact_reach: impact_reach ?? null,
  });

  // 2. Generate structured summary (context-aware when provided)
  const summaryPrompt = buildChallengeSummaryPrompt(raw_description, domains, context);
  let summaryText: string;
  try {
    summaryText = await ai.generateText(summaryPrompt, { jsonMode: true });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    logger.error("AI summary failed", {
      challengeId: challenge.id,
      detail,
      cause: e instanceof Error ? e.cause : undefined,
    });
    throw new AIProviderError(aiErrorToUserMessage(e), e);
  }

  const summaryParsed = challengeSummaryOutputSchema.safeParse(JSON.parse(summaryText));
  const structured_summary = summaryParsed.success
    ? summaryParsed.data.structured_summary
    : summaryText;
  const problem_statement = summaryParsed.success
    ? summaryParsed.data.problem_statement
    : raw_description.slice(0, 200);
  const desired_outcome_statement = summaryParsed.success
    ? summaryParsed.data.desired_outcome_statement
    : "";

  // 3. Persist all three fields for phase-2 use
  await challengesRepo.updateChallengeAnalysis(supabase, challenge.id, {
    summary: structured_summary,
    problem_statement,
    desired_outcome_statement,
  });

  return {
    challengeId: challenge.id,
    summary: structured_summary,
    problemStatement: problem_statement,
    desiredOutcomeStatement: desired_outcome_statement,
  };
}

/**
 * Phase 2: embed summary → hybrid matching → LLM recommendations.
 * Runs after phase 1; challengeId fetches stored summary/problem fields from DB.
 */
export async function runChallengePhase2(
  supabase: SupabaseClient,
  ai: AIProvider,
  challengeId: string
): Promise<ChallengePhase2Result> {
  const challenge = await challengesRepo.getChallengeById(supabase, challengeId);
  if (!challenge) throw new NotFoundError(`Challenge not found: ${challengeId}`);

  const textToEmbed = [
    challenge.summary,
    challenge.problem_statement,
    challenge.desired_outcome_statement,
  ]
    .filter(Boolean)
    .join("\n");

  // Embedding + artifact list in parallel
  let embedding: number[];
  let allArtifacts: Awaited<ReturnType<typeof artifactsRepo.listArtifacts>>;
  try {
    [embedding, allArtifacts] = await Promise.all([
      ai.generateEmbedding(textToEmbed),
      artifactsRepo.listArtifacts(supabase),
    ]);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    logger.error("Embedding or artifact fetch failed", { challengeId, detail });
    throw new AIProviderError(aiErrorToUserMessage(e), e);
  }

  // Hybrid matching
  const ranked = await runMatching(
    supabase,
    embedding,
    challenge.domains as ChallengeDomain[],
    textToEmbed
  );

  // Filter artifacts by domain overlap (~70% token reduction)
  const domainFiltered = allArtifacts.filter((a) =>
    a.domains.some((d) => (challenge.domains as string[]).includes(d))
  );
  const artifacts = domainFiltered.length > 0 ? domainFiltered : allArtifacts;

  // LLM recommendations
  const chunkPayloads = ranked.map((r) => ({ body: r.chunkWithContent.chunk.body }));
  let recommendations: ArtifactRecommendation[] = [];

  if (artifacts.length > 0) {
    const recPrompt = buildRecommendationsPrompt(
      challenge.summary ?? "",
      challenge.problem_statement ?? "",
      chunkPayloads,
      artifacts
    );
    try {
      const recText = await ai.generateText(recPrompt, { jsonMode: true });
      const recOutput = recommendationsOutputSchema.parse(JSON.parse(recText));
      const artifactBySlug = new Map(artifacts.map((a) => [a.slug, a]));
      recommendations = recOutput.recommendations
        .map((r) => {
          const artifact = artifactBySlug.get(r.slug);
          if (!artifact) return null;
          return {
            slug: artifact.slug,
            title: artifact.title,
            domains: artifact.domains,
            use_case: artifact.use_case,
            explanation: r.explanation,
            isMostRelevant: r.is_most_relevant,
          } satisfies ArtifactRecommendation;
        })
        .filter((r): r is ArtifactRecommendation => r !== null);
    } catch (e) {
      logger.warn("Recommendations parse failed, falling back to first artifacts", {
        challengeId,
        error: e,
      });
      recommendations = artifacts.slice(0, 3).map((a, i) => ({
        slug: a.slug,
        title: a.title,
        domains: a.domains,
        use_case: a.use_case,
        explanation: "Relevant to your challenge based on domain match.",
        isMostRelevant: i === 0,
      }));
    }
  }

  return { recommendations };
}
