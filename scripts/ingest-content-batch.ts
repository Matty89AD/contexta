/**
 * Batch-ingest all transcript files from a directory as podcast content.
 * The author name is derived from the filename (e.g. "Teresa Torres.txt" → author "Teresa Torres").
 * Content intelligence metadata is extracted automatically per the Epic 8 pipeline.
 *
 * Usage:
 *   npm run ingest-content-batch                          # defaults to data/content_test/
 *   npm run ingest-content-batch -- data/content_test/
 *
 * Options:
 *   --dry-run        Print files that would be ingested without making DB calls
 *   --domain <d>     Tag all files with this domain (can repeat); e.g. --domain discovery
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 *      CHUNK_SIZE (default 1500), MAX_CHUNK_CHARS (default 8000)
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { readdirSync, readFileSync } from "fs";
import { join, basename, extname } from "path";
import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { ingestContent } from "../services/ingest";
import type { ChallengeDomain } from "../lib/db/types";

const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_MAX_CHUNK_CHARS = 8000;
const VALID_DOMAINS = ["strategy", "discovery", "delivery", "growth", "leadership"] as const;

function chunkTranscript(text: string, targetChars: number, maxChars: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [normalized];

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current = current.length === 0 ? p : current + "\n\n" + p;
    if (current.length >= targetChars) {
      chunks.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dir = args[0] && !args[0].startsWith("--") ? args[0] : "data/content_test";
  const domains: ChallengeDomain[] = [];
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--domain" && args[i + 1]) {
      const d = args[++i];
      if (VALID_DOMAINS.includes(d as ChallengeDomain) && !domains.includes(d as ChallengeDomain)) {
        domains.push(d as ChallengeDomain);
      }
    }
  }

  const envChunkSize = parseInt(process.env.CHUNK_SIZE ?? "", 10);
  const envMaxChunk = parseInt(process.env.MAX_CHUNK_CHARS ?? "", 10);
  const chunkSize = Number.isFinite(envChunkSize) && envChunkSize > 0 ? envChunkSize : DEFAULT_CHUNK_SIZE;
  const maxChunkChars = Number.isFinite(envMaxChunk) && envMaxChunk > 0 ? envMaxChunk : DEFAULT_MAX_CHUNK_CHARS;

  return { dir, domains, dryRun, chunkSize, maxChunkChars };
}

async function main() {
  const { dir, domains, dryRun, chunkSize, maxChunkChars } = parseArgs();

  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => extname(f).toLowerCase() === ".txt")
      .sort();
  } catch (e) {
    console.error(`Cannot read directory: ${dir}`, e);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(`No .txt files found in ${dir}`);
    return;
  }

  console.log(`Found ${files.length} file(s) in ${dir}`);
  if (dryRun) {
    files.forEach((f) => console.log("  •", f));
    console.log("Dry-run: no changes made.");
    return;
  }

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(urlEnv, key);
  const ai = createOpenRouterProvider();

  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    // Derive author and title from filename: "Teresa Torres.txt" → "Teresa Torres"
    const nameWithoutExt = basename(file, extname(file));
    const title = nameWithoutExt;

    process.stdout.write(`[${succeeded + failed + 1}/${files.length}] "${title}" ... `);

    try {
      const raw = readFileSync(filePath, "utf-8");
      const chunks = chunkTranscript(raw, chunkSize, maxChunkChars);

      const { contentId } = await ingestContent(supabase, ai, {
        source_type: "podcast",
        title,
        url: null,
        summary: null,
        key_takeaways: null,
        domains: domains.length > 0 ? domains : undefined,
        chunks,
      });

      console.log(`done — ${chunks.length} chunks, id=${contentId}`);
      succeeded++;
    } catch (e) {
      console.log("FAILED");
      console.error("  Error:", e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(`\nBatch ingest complete: ${succeeded} succeeded, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
