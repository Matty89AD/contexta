/**
 * Backfill content intelligence metadata for all content records
 * that have not yet been processed (extraction_confidence IS NULL).
 *
 * Idempotent: skips records where extraction_confidence IS NOT NULL.
 *
 * Usage:
 *   npm run backfill-intelligence             # only unprocessed or failed (confidence = 0)
 *   npm run backfill-intelligence -- --force  # re-process all records
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import * as contentRepo from "../repositories/content";
import { extractContentIntelligence } from "../services/content-intelligence";

async function main() {
  const force = process.argv.includes("--force");

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(urlEnv, key);
  const ai = createOpenRouterProvider();

  // --force re-processes all records; otherwise only unprocessed or failed (confidence = 0)
  const query = supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: true });

  if (!force) {
    query.or("extraction_confidence.is.null,extraction_confidence.eq.0");
  } else {
    console.log("--force: re-processing all content records.");
  }

  const { data: allContent, error } = await query;

  if (error) {
    console.error("Failed to load content:", error.message);
    process.exit(1);
  }

  if (!allContent || allContent.length === 0) {
    console.log("No content records to backfill.");
    return;
  }

  console.log(`Backfilling ${allContent.length} content record(s)...`);

  let succeeded = 0;
  let failed = 0;

  for (const content of allContent) {
    process.stdout.write(`  [${content.id}] "${content.title}" ... `);

    try {
      const chunks = await contentRepo.listChunksByContentId(supabase, content.id);

      if (chunks.length === 0) {
        console.log("skipped (no chunks)");
        continue;
      }

      const chunkBodies = chunks.map((c) => c.body);

      const intel = await extractContentIntelligence(
        ai,
        content.title,
        chunkBodies,
        content.source_type
      );

      await contentRepo.updateContentIntelligence(supabase, content.id, {
        topics: intel.topics,
        keywords: intel.keywords,
        author: intel.author,
        publication_date: intel.publication_date,
        language: intel.language,
        extraction_confidence: intel.extraction_confidence,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunkIntel = intel.chunks[i];
        if (chunkIntel) {
          await contentRepo.updateChunkIntelligence(supabase, chunks[i].id, {
            chunk_type: chunkIntel.chunk_type,
            key_concepts: chunkIntel.key_concepts,
          });
        }
      }

      console.log(`done (confidence=${intel.extraction_confidence.toFixed(2)}, topics=[${intel.topics.join(", ")}])`);
      succeeded++;
    } catch (e) {
      console.log("FAILED");
      console.error("    Error:", e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(`\nBackfill complete: ${succeeded} succeeded, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
