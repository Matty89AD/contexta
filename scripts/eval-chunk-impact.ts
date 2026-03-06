/**
 * Chunk-impact experiment
 *
 * Tests whether the content-chunk context in the artifact selection prompt
 * actually changes which artifacts the LLM picks.
 *
 * For each eval challenge it runs the recommendations LLM call twice:
 *   A) WITH chunks  — the ranked content excerpts (current behaviour)
 *   B) WITHOUT chunks — empty array
 *
 * Then it compares the returned slug sets and reports per-challenge overlap
 * plus an aggregate summary.
 *
 * Usage:
 *   npx tsx scripts/eval-chunk-impact.ts
 *   npx tsx scripts/eval-chunk-impact.ts -- --challenge CH-001 --challenge CH-005
 *   npx tsx scripts/eval-chunk-impact.ts -- --verbose   (print full slug lists)
 *
 * Env (required):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OPENROUTER_API_KEY, TOP_K
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { runMatching } from "../services/matching";
import { listArtifacts } from "../repositories/artifacts";
import {
  buildRecommendationsPrompt,
  recommendationsOutputSchema,
} from "../core/prompts/recommendations";
import { EVAL_CHALLENGES } from "../data/eval-dataset";
import type { EvalChallenge } from "../data/eval-dataset";
import type { ChallengeDomain } from "../lib/db/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const intersection = b.filter((s) => setA.has(s)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union; // Jaccard similarity
}

async function callRecommendations(
  ai: ReturnType<typeof createOpenRouterProvider>,
  summary: string,
  problemStatement: string,
  chunks: { body: string }[],
  artifacts: { slug: string; title: string; domains: string[]; use_case: string }[]
): Promise<string[]> {
  const prompt = buildRecommendationsPrompt(summary, problemStatement, chunks, artifacts);
  const text = await ai.generateText(prompt, { jsonMode: true });
  const output = recommendationsOutputSchema.parse(JSON.parse(text));
  return output.recommendations.map((r) => r.slug);
}

// ---------------------------------------------------------------------------
// Per-challenge runner
// ---------------------------------------------------------------------------

interface ChallengeComparison {
  id: string;
  slugsWith: string[];
  slugsWithout: string[];
  overlap: number; // Jaccard [0,1]
  identical: boolean;
}

async function compareChallenge(
  supabase: SupabaseClient,
  ai: ReturnType<typeof createOpenRouterProvider>,
  challenge: EvalChallenge,
  verbose: boolean
): Promise<ChallengeComparison> {
  // 1. Embed the raw description
  const embedding = await ai.generateEmbedding(challenge.raw_description);

  // 2. Retrieve ranked chunks (same as production flow)
  const ranked = await runMatching(
    supabase,
    embedding,
    challenge.domains as ChallengeDomain[],
    challenge.raw_description
  );
  const chunks = ranked.map((r) => ({ body: r.chunkWithContent.chunk.body }));

  // 3. Fetch + domain-filter artifacts (same as production flow)
  const allArtifacts = await listArtifacts(supabase);
  const domainFiltered = allArtifacts.filter((a) =>
    a.domains.some((d) => (challenge.domains as string[]).includes(d))
  );
  const artifacts = domainFiltered.length > 0 ? domainFiltered : allArtifacts;

  // Use raw description as both summary and problem statement — sufficient for
  // comparing the A/B conditions since both calls receive identical summary text.
  const summary = challenge.raw_description;
  const problemStatement = challenge.raw_description;

  // 4A. WITH chunks
  const slugsWith = await callRecommendations(ai, summary, problemStatement, chunks, artifacts);

  // 4B. WITHOUT chunks
  const slugsWithout = await callRecommendations(ai, summary, problemStatement, [], artifacts);

  const overlap = slugOverlap(slugsWith, slugsWithout);

  if (verbose) {
    console.log(`  chunks retrieved: ${chunks.length}`);
    console.log(`  artifacts in scope: ${artifacts.length}`);
    console.log(`  WITH    slugs: ${slugsWith.join(", ")}`);
    console.log(`  WITHOUT slugs: ${slugsWithout.join(", ")}`);
  }

  return {
    id: challenge.id,
    slugsWith,
    slugsWithout,
    overlap,
    identical: overlap === 1,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");

  const challengeFilter = args
    .flatMap((arg, i, arr) => (arg === "--challenge" ? [arr[i + 1]] : []))
    .filter(Boolean)
    .map((id) => id.toUpperCase());

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY");
    process.exit(1);
  }
  if (!process.env.TOP_K) {
    console.error("Missing TOP_K");
    process.exit(1);
  }

  const supabase = createClient(urlEnv, key);
  const ai = createOpenRouterProvider();

  const challenges =
    challengeFilter.length > 0
      ? EVAL_CHALLENGES.filter((c) => challengeFilter.includes(c.id))
      : EVAL_CHALLENGES;

  if (challenges.length === 0) {
    console.error(`No challenges matched: ${challengeFilter.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n=== Chunk-Impact Experiment — ${challenges.length} challenge(s) ===`);
  console.log(`Each challenge runs the recommendations LLM call twice (with / without chunks).\n`);

  const results: ChallengeComparison[] = [];

  for (let i = 0; i < challenges.length; i++) {
    const challenge = challenges[i];
    process.stdout.write(`[${i + 1}/${challenges.length}] ${challenge.id} ... `);

    try {
      const result = await compareChallenge(supabase, ai, challenge, verbose);
      results.push(result);

      const overlapPct = (result.overlap * 100).toFixed(0);
      const tag = result.identical ? "IDENTICAL" : result.overlap >= 0.6 ? "similar" : "DIFFERENT";
      console.log(`overlap ${overlapPct}%  [${tag}]`);

      if (verbose || !result.identical) {
        console.log(`  WITH    : ${result.slugsWith.join(", ")}`);
        console.log(`  WITHOUT : ${result.slugsWithout.join(", ")}`);
      }
    } catch (e) {
      console.log("FAILED");
      console.error(`  `, e instanceof Error ? e.message : e);
    }
  }

  if (results.length === 0) {
    console.log("\nNo results collected.");
    return;
  }

  // ---------------------------------------------------------------------------
  // Aggregate summary
  // ---------------------------------------------------------------------------
  const identicalCount = results.filter((r) => r.identical).length;
  const similarCount = results.filter((r) => !r.identical && r.overlap >= 0.6).length;
  const differentCount = results.filter((r) => r.overlap < 0.6).length;
  const meanOverlap = results.reduce((s, r) => s + r.overlap, 0) / results.length;

  console.log(`\n${"=".repeat(60)}`);
  console.log("AGGREGATE RESULTS");
  console.log(`  Challenges run  : ${results.length}`);
  console.log(`  Mean Jaccard    : ${(meanOverlap * 100).toFixed(1)}%`);
  console.log(`  Identical       : ${identicalCount} / ${results.length} (${((identicalCount / results.length) * 100).toFixed(0)}%)`);
  console.log(`  Similar (≥60%)  : ${similarCount} / ${results.length} (${((similarCount / results.length) * 100).toFixed(0)}%)`);
  console.log(`  Different (<60%): ${differentCount} / ${results.length} (${((differentCount / results.length) * 100).toFixed(0)}%)`);

  console.log(`\nVERDICT`);
  if (meanOverlap >= 0.8) {
    console.log(`  Chunks have LOW impact — removing them is safe (mean overlap ${(meanOverlap * 100).toFixed(0)}%).`);
  } else if (meanOverlap >= 0.5) {
    console.log(`  Chunks have MODERATE impact — investigate the diverging cases before removing.`);
  } else {
    console.log(`  Chunks have HIGH impact — do not remove without further investigation.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
