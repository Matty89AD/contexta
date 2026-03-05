/**
 * Pre-generates static LLM detail for all artifacts and persists to DB.
 * Run: npm run backfill-artifact-details
 * Options:
 *   --force   Re-generate even if detail already exists
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { buildArtifactDetailPrompt, artifactDetailOutputSchema } from "../core/prompts/artifact-detail";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const force = process.argv.includes("--force");
const supabase = createClient(url, key);
const ai = createOpenRouterProvider();

async function run() {
  const { data: artifacts, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, domains, use_case, detail, created_at")
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to fetch artifacts:", error.message);
    process.exit(1);
  }

  const toProcess = force
    ? artifacts
    : artifacts.filter((a) => !a.detail);

  console.log(
    `[backfill-artifact-details] ${toProcess.length} artifact(s) to process` +
      (force ? " (--force)" : "")
  );

  let done = 0;
  let failed = 0;

  for (const artifact of toProcess) {
    try {
      const prompt = buildArtifactDetailPrompt(artifact);
      const text = await ai.generateText(prompt, { jsonMode: true });
      const parsed = artifactDetailOutputSchema.safeParse(JSON.parse(text));

      if (!parsed.success) {
        console.warn(`  [SKIP] ${artifact.slug} — invalid LLM output: ${parsed.error.message}`);
        failed++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("artifacts")
        .update({ detail: parsed.data })
        .eq("slug", artifact.slug);

      if (updateError) {
        console.warn(`  [FAIL] ${artifact.slug} — DB update failed: ${updateError.message}`);
        failed++;
        continue;
      }

      done++;
      console.log(`  [OK]   ${artifact.slug} (${done}/${toProcess.length})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  [FAIL] ${artifact.slug} — ${msg}`);
      failed++;
    }
  }

  console.log(
    `\n[backfill-artifact-details] Done: ${done} succeeded, ${failed} failed out of ${toProcess.length} processed.`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
