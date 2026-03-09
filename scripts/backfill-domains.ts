/**
 * Backfill domain assignments on all 19 content items ingested from
 * data/content_test/. Matches by normalised title (lowercase, .txt stripped).
 *
 * Idempotent: safe to run multiple times. Items already having domains set
 * are skipped unless --force is passed.
 *
 * Usage:
 *   npm run backfill-domains             # skip items that already have domains
 *   npm run backfill-domains -- --force  # overwrite all items
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { ChallengeDomain } from "../lib/db/types";

// ---------------------------------------------------------------------------
// Domain assignments — derived from challenge ground truth and speaker focus
// ---------------------------------------------------------------------------
// Format: normalised title → domains[]

const DOMAIN_MAP: Record<string, ChallengeDomain[]> = {
  "ada chen rekhi":                              ["discovery", "leadership"],
  "adam fishman":                                ["growth"],
  "adam grenier":                                ["growth", "strategy"],
  "adriel frederick":                            ["delivery", "leadership"],
  "aishwarya naresh reganti + kiriti badam":     ["delivery"],
  "albert cheng":                                ["delivery", "leadership"],
  "alex hardimen":                               ["discovery", "strategy"],
  "alex komoroske":                              ["delivery", "strategy"],
  "brian balfour":                               ["growth", "strategy"],
  "brian chesky":                                ["strategy", "leadership"],
  "casey winters":                               ["growth"],
  "elena verna 2.0":                             ["growth"],
  "elena verna 3.0":                             ["growth", "strategy"],
  "elena verna 4.0":                             ["growth"],
  "john cutler":                                 ["strategy", "discovery", "delivery", "leadership"],
  "keith coleman & jay baxter":                  ["leadership", "strategy"],
  "petra wille":                                 ["leadership", "strategy"],
  "ryan singer":                                 ["delivery", "discovery"],
  "teresa torres":                               ["discovery"],
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\.txt$/i, "");
}

async function main() {
  const force = process.argv.includes("--force");

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(urlEnv, key);

  const { data, error } = await supabase
    .from("content")
    .select("id, title, domains")
    .order("title");

  if (error) {
    console.error("Failed to fetch content:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  console.log(`Found ${rows.length} content items.\n`);

  let updated = 0;
  let skipped = 0;
  let unknown = 0;

  for (const row of rows) {
    const norm = normalizeTitle(row.title ?? "");
    const domains = DOMAIN_MAP[norm];

    if (!domains) {
      console.log(`  ? UNKNOWN  "${row.title}" — not in domain map, skipping`);
      unknown++;
      continue;
    }

    const alreadySet = Array.isArray(row.domains) && row.domains.length > 0;

    if (alreadySet && !force) {
      console.log(`  ~ SKIP     "${row.title}" — already has domains (use --force to overwrite)`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("content")
      .update({ domains })
      .eq("id", row.id);

    if (updateError) {
      console.error(`  ✗ FAILED   "${row.title}":`, updateError.message);
    } else {
      console.log(`  ✓ UPDATED  "${row.title}" → ${domains.join(", ")}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}  Unknown: ${unknown}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
