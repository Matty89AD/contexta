/**
 * Epic 9 — Challenge Eval Harness
 *
 * Runs the 15 challenge test cases from data/eval-dataset.ts through the live
 * matching engine (embedding + hybrid retrieval) and measures precision@3 /
 * precision@5 against manually annotated ground truth.
 *
 * Usage:
 *   npm run eval                  — run full eval
 *   npm run eval -- --dry-run    — print dataset only; no DB/AI calls
 *   npm run eval -- --check-db   — check which ground truth titles exist in the DB
 *
 * Env (required unless --dry-run):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OPENROUTER_API_KEY, TOP_K  (not required for --check-db)
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { runMatching } from "../services/matching";
import { EVAL_CHALLENGES } from "../data/eval-dataset";
import type { EvalChallenge } from "../data/eval-dataset";
import type { ChallengeDomain } from "../lib/db/types";

// ---------------------------------------------------------------------------
// Pure helpers (logic mirrored in __tests__/eval-harness.test.ts)
// ---------------------------------------------------------------------------

/** Normalise a content title for comparison: trim, lowercase, strip .txt suffix. */
export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\.txt$/i, "");
}

/**
 * Compute precision@K.
 *
 * Returns the fraction of ground truth items found within the top-K retrieved titles.
 * Value is in [0, 1]; 1.0 means every expected item was found in the top-K results.
 *
 * Formula: hits_in_top_K / |ground_truth|
 * (equivalent to recall@K when |ground_truth| is fixed at 3)
 */
export function precisionAtK(
  retrieved: string[], // normalised titles in rank order
  groundTruth: string[], // normalised expected titles
  k: number
): number {
  if (groundTruth.length === 0) return 0;
  const topK = retrieved.slice(0, k);
  const hits = topK.filter((t) => groundTruth.includes(t)).length;
  return hits / groundTruth.length;
}

/** Returns true if at least one ground truth item appears in the top-K results. */
export function hitAtK(
  retrieved: string[],
  groundTruth: string[],
  k: number
): boolean {
  return precisionAtK(retrieved, groundTruth, k) > 0;
}

// ---------------------------------------------------------------------------
// Eval runner
// ---------------------------------------------------------------------------

interface ChallengeResult {
  id: string;
  retrievedTitles: string[]; // top-5 unique content titles (normalised)
  groundTruth: string[]; // normalised ground truth
  p3: number;
  p5: number;
  hit3: boolean;
  hit5: boolean;
}

async function evalChallenge(
  supabase: SupabaseClient,
  ai: ReturnType<typeof createOpenRouterProvider>,
  challenge: EvalChallenge
): Promise<ChallengeResult> {
  // Generate embedding for the raw challenge description
  const embedding = await ai.generateEmbedding(challenge.raw_description);

  // Run hybrid retrieval (vector + keyword) — no DB record created (R6)
  const ranked = await runMatching(
    supabase,
    embedding,
    challenge.domains as ChallengeDomain[],
    challenge.raw_description
  );

  // Deduplicate by content ID, preserving rank order; keep top 5 unique contents
  const seenIds = new Set<string>();
  const uniqueTitles: string[] = [];
  for (const match of ranked) {
    const contentId = match.chunkWithContent.content.id;
    if (!seenIds.has(contentId)) {
      seenIds.add(contentId);
      uniqueTitles.push(
        normalizeTitle(match.chunkWithContent.content.title ?? "")
      );
    }
    if (uniqueTitles.length >= 5) break;
  }

  const normalizedGT = challenge.ground_truth.map(normalizeTitle);

  return {
    id: challenge.id,
    retrievedTitles: uniqueTitles,
    groundTruth: normalizedGT,
    p3: precisionAtK(uniqueTitles, normalizedGT, 3),
    p5: precisionAtK(uniqueTitles, normalizedGT, 5),
    hit3: hitAtK(uniqueTitles, normalizedGT, 3),
    hit5: hitAtK(uniqueTitles, normalizedGT, 5),
  };
}

function printResult(r: ChallengeResult, index: number): void {
  const p3Label = r.p3.toFixed(2);
  const p5Label = r.p5.toFixed(2);
  console.log(`\n[${index + 1}/15] ${r.id}`);
  console.log(`  Ground truth:   ${r.groundTruth.join(", ")}`);
  console.log(`  Retrieved (5):  ${r.retrievedTitles.slice(0, 5).join(", ") || "(none)"}`);
  console.log(
    `  precision@3: ${p3Label}  precision@5: ${p5Label}  hit@3: ${r.hit3}  hit@5: ${r.hit5}`
  );
}

// ---------------------------------------------------------------------------
// --check-db mode
// ---------------------------------------------------------------------------

async function checkDb(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase
    .from("content")
    .select("title")
    .order("title");

  if (error) {
    console.error("Failed to query content table:", error.message);
    process.exit(1);
  }

  const dbTitles: string[] = (data ?? []).map((r: { title: string }) => r.title);
  const dbNormalized = new Set(dbTitles.map(normalizeTitle));

  console.log(`\n=== DB TITLE CHECK ===`);
  console.log(`\nDB has ${dbTitles.length} content item(s). Normalised titles:`);
  for (const t of dbTitles) {
    console.log(`  • ${normalizeTitle(t)}  (raw: "${t}")`);
  }

  // Collect every unique ground truth title across all challenges
  const gtTitles = new Map<string, string>(); // normalised → original
  for (const c of EVAL_CHALLENGES) {
    for (const gt of c.ground_truth) {
      const norm = normalizeTitle(gt);
      if (!gtTitles.has(norm)) gtTitles.set(norm, gt);
    }
  }

  console.log(`\nGROUND TRUTH COVERAGE (${gtTitles.size} unique expected titles):\n`);

  const missing: string[] = [];
  for (const [norm, original] of Array.from(gtTitles.entries()).sort()) {
    if (dbNormalized.has(norm)) {
      console.log(`  ✓  ${norm}`);
    } else {
      console.log(`  ✗  ${norm}  ← MISSING`);
      missing.push(original);

      // Show closest DB titles (any DB title that shares the first word)
      const firstWord = norm.split(" ")[0];
      const candidates = dbTitles
        .map(normalizeTitle)
        .filter((t) => t.startsWith(firstWord));
      if (candidates.length > 0) {
        console.log(`       closest in DB: ${candidates.join(", ")}`);
      }
    }
  }

  console.log(`\nSUMMARY`);
  console.log(`  Unique GT titles:   ${gtTitles.size}`);
  console.log(`  Found in DB:        ${gtTitles.size - missing.length}`);
  console.log(`  Missing from DB:    ${missing.length}`);
  if (missing.length > 0) {
    console.log(`  Missing:            ${missing.join(", ")}`);
  }

  // Show challenges impacted by missing titles
  if (missing.length > 0) {
    const missingNorm = new Set(missing.map(normalizeTitle));
    console.log(`\nCHALLENGES AFFECTED BY MISSING TITLES:`);
    for (const c of EVAL_CHALLENGES) {
      const affected = c.ground_truth.filter((gt) => missingNorm.has(normalizeTitle(gt)));
      if (affected.length > 0) {
        console.log(`  ${c.id}: missing ${affected.join(", ")}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const isCheckDb = process.argv.includes("--check-db");

  if (isDryRun) {
    console.log("=== DRY RUN — dataset only, no DB/AI calls ===\n");
    for (const c of EVAL_CHALLENGES) {
      console.log(`${c.id}: ${c.raw_description.slice(0, 80)}`);
      console.log(
        `  domain=${c.domain}  role=${c.role}  GT: ${c.ground_truth.join(", ")}\n`
      );
    }
    return;
  }

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabaseForCheck = createClient(urlEnv, key);

  if (isCheckDb) {
    await checkDb(supabaseForCheck);
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY");
    process.exit(1);
  }
  if (!process.env.TOP_K) {
    console.error("Missing TOP_K");
    process.exit(1);
  }

  const supabase = supabaseForCheck; // reuse client already created above
  const ai = createOpenRouterProvider();

  console.log(`=== Contexta Eval Harness — ${EVAL_CHALLENGES.length} challenges ===`);

  const results: ChallengeResult[] = [];
  for (let i = 0; i < EVAL_CHALLENGES.length; i++) {
    const challenge = EVAL_CHALLENGES[i];
    try {
      const result = await evalChallenge(supabase, ai, challenge);
      results.push(result);
      printResult(result, i);
    } catch (e) {
      console.error(`\n[${i + 1}/15] ${challenge.id} FAILED:`, e);
    }
  }

  if (results.length === 0) {
    console.log("\nNo results collected.");
    return;
  }

  const meanP3 = results.reduce((s, r) => s + r.p3, 0) / results.length;
  const meanP5 = results.reduce((s, r) => s + r.p5, 0) / results.length;
  const hitRate3 = results.filter((r) => r.hit3).length / results.length;
  const hitRate5 = results.filter((r) => r.hit5).length / results.length;

  console.log(`\n${"=".repeat(60)}`);
  console.log("AGGREGATE RESULTS");
  console.log(`  Challenges run:   ${results.length} / ${EVAL_CHALLENGES.length}`);
  console.log(`  mean precision@3: ${meanP3.toFixed(3)}`);
  console.log(`  mean precision@5: ${meanP5.toFixed(3)}`);
  console.log(`  hit rate @3:      ${(hitRate3 * 100).toFixed(1)}%`);
  console.log(`  hit rate @5:      ${(hitRate5 * 100).toFixed(1)}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
