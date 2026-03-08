/**
 * Ingest a podcast transcript into content + content_chunks (with embeddings).
 *
 * Usage:
 *   npm run ingest-transcript -- data/transcript.txt
 *   npm run ingest-transcript -- data/transcript.txt --title "Episode 1: Building roadmaps"
 *   npm run ingest-transcript -- data/transcript.txt --title "..." --url "https://..." --domain strategy --domain leadership
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 *      CHUNK_SIZE (default 1500), MAX_CHUNK_CHARS (default 8000) — Epic 7 configurable chunking
 * Optional: --title (default: filename), --url
 *           --domain (strategy|discovery|delivery|growth|leadership) — can be repeated for multi-domain (Epic 6)
 *           --chunk-size N, --max-chunk-chars N — override chunking params (Epic 7)
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { ingestContent } from "../services/ingest";
import { chunkTranscript } from "../core/utils/chunking";
import type { ChallengeDomain } from "../lib/db/types";

const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_MAX_CHUNK_CHARS = 8000;

const VALID_DOMAINS = ["strategy", "discovery", "delivery", "growth", "leadership"];

function parseArgs(): {
  filePath: string;
  title?: string;
  url?: string;
  domains: ChallengeDomain[];
  chunkSize: number;
  maxChunkChars: number;
} {
  const args = process.argv.slice(2);
  const filePath = args[0] ?? "data/transcript.txt";

  // Env fallbacks for chunk params (Epic 7 configurable chunking)
  const envChunkSize = parseInt(process.env.CHUNK_SIZE ?? "", 10);
  const envMaxChunk = parseInt(process.env.MAX_CHUNK_CHARS ?? "", 10);

  const result: ReturnType<typeof parseArgs> = {
    filePath,
    domains: [],
    chunkSize: Number.isFinite(envChunkSize) && envChunkSize > 0 ? envChunkSize : DEFAULT_CHUNK_SIZE,
    maxChunkChars: Number.isFinite(envMaxChunk) && envMaxChunk > 0 ? envMaxChunk : DEFAULT_MAX_CHUNK_CHARS,
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--title" && args[i + 1]) {
      result.title = args[++i];
    } else if (args[i] === "--url" && args[i + 1]) {
      result.url = args[++i];
    } else if (args[i] === "--domain" && args[i + 1]) {
      const d = args[++i];
      if (VALID_DOMAINS.includes(d) && !result.domains.includes(d as ChallengeDomain)) {
        result.domains.push(d as ChallengeDomain);
      }
    } else if (args[i] === "--chunk-size" && args[i + 1]) {
      const n = parseInt(args[++i], 10);
      if (Number.isFinite(n) && n > 0) result.chunkSize = n;
    } else if (args[i] === "--max-chunk-chars" && args[i + 1]) {
      const n = parseInt(args[++i], 10);
      if (Number.isFinite(n) && n > 0) result.maxChunkChars = n;
    }
  }
  return result;
}

async function main() {
  const { filePath, title, url, domains, chunkSize, maxChunkChars } = parseArgs();

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

  const chunks = chunkTranscript(raw, chunkSize, maxChunkChars);
  const displayTitle = title ?? filePath.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");

  console.log("Chunked transcript into", chunks.length, "segments");
  console.log("Ingesting as podcast:", displayTitle);
  if (domains.length > 0) {
    console.log("Domains:", domains.join(", "));
  }

  const supabase = createClient(urlEnv, key);
  const ai = createOpenRouterProvider();

  const { contentId } = await ingestContent(supabase, ai, {
    source_type: "podcast",
    title: displayTitle,
    url: url ?? null,
    domains: domains.length > 0 ? domains : undefined,
    chunks,
  });

  console.log("Done. Content ID:", contentId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
