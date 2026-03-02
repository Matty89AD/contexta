/**
 * Ingest a podcast transcript into content + content_chunks (with embeddings).
 *
 * Usage:
 *   npm run ingest-transcript -- data/transcript.txt
 *   npm run ingest-transcript -- data/transcript.txt --title "Episode 1: Building roadmaps"
 *   npm run ingest-transcript -- data/transcript.txt --title "..." --url "https://..." --domain strategy
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 * Optional: --title (default: filename), --url, --summary, --domain (strategy|discovery|delivery|growth|leadership)
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { ingestContent } from "../services/ingest";
import type { ChallengeDomain } from "../lib/db/types";

const TARGET_CHUNK_CHARS = 1500;
const MAX_CHUNK_CHARS = 8000;

function chunkTranscript(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [normalized];

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > MAX_CHUNK_CHARS && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    if (current.length === 0) {
      current = p;
    } else {
      current += "\n\n" + p;
    }
    if (current.length >= TARGET_CHUNK_CHARS) {
      chunks.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function parseArgs(): {
  filePath: string;
  title?: string;
  url?: string;
  summary?: string;
  domain?: ChallengeDomain;
} {
  const args = process.argv.slice(2);
  const filePath = args[0] ?? "data/transcript.txt";
  const result: ReturnType<typeof parseArgs> = { filePath };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--title" && args[i + 1]) {
      result.title = args[++i];
    } else if (args[i] === "--url" && args[i + 1]) {
      result.url = args[++i];
    } else if (args[i] === "--summary" && args[i + 1]) {
      result.summary = args[++i];
    } else if (args[i] === "--domain" && args[i + 1]) {
      const d = args[++i];
      if (["strategy", "discovery", "delivery", "growth", "leadership"].includes(d)) {
        result.domain = d as ChallengeDomain;
      }
    }
  }
  return result;
}

async function main() {
  const { filePath, title, url, summary, domain } = parseArgs();

  const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlEnv || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    console.error("Failed to read file:", filePath, e);
    process.exit(1);
  }

  const chunks = chunkTranscript(raw);
  const displayTitle = title ?? filePath.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");

  console.log("Chunked transcript into", chunks.length, "segments");
  console.log("Ingesting as podcast:", displayTitle);

  const supabase = createClient(urlEnv, key);
  const ai = createOpenRouterProvider();

  const { contentId } = await ingestContent(supabase, ai, {
    source_type: "podcast",
    title: displayTitle,
    url: url ?? null,
    summary: summary ?? null,
    key_takeaways: null,
    primary_domain: domain ?? null,
    chunks,
  });

  console.log("Done. Content ID:", contentId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
