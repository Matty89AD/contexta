/**
 * Transcript Extractor Service — wraps @steipete/summarize CLI (Epic 17).
 * Spawns the summarize CLI with --extract flag to get raw content without
 * LLM summarization (we run our own intelligence extraction).
 * Passes OPENROUTER_API_KEY as OPENAI_API_KEY so summarize routes
 * through OpenRouter for any Whisper-based audio transcription.
 */
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface TranscriptResult {
  transcript: string;
  detectedTitle?: string;
  detectedAuthor?: string;
  duration?: number;
}

/**
 * Extract raw transcript/content from a URL using the summarize CLI.
 * Uses --extract flag to skip LLM summarization — returns raw content only.
 */
export async function extractTranscript(url: string): Promise<TranscriptResult> {
  const summarizeBin = path.resolve(process.cwd(), "node_modules/.bin/summarize");

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OPENAI_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
    OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
    SUMMARIZE_MODEL: process.env.SUMMARIZE_MODEL ?? "google/gemini-2.0-flash-lite",
  };

  const { stdout } = await execFileAsync(
    summarizeBin,
    [url, "--extract", "--format", "text", "--plain", "--no-color"],
    {
      env,
      timeout: TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024, // 50 MB for long transcripts
    }
  );

  return {
    transcript: cleanTranscript(stdout),
  };
}

/**
 * Normalise raw CLI output into clean prose:
 * - Strip leading "Transcript:" label
 * - Join short caption lines into continuous text
 * - Treat >> speaker-change markers as paragraph breaks
 */
function cleanTranscript(raw: string): string {
  // Remove leading "Transcript:" label (case-insensitive, optional whitespace)
  let text = raw.replace(/^\s*transcript\s*:?\s*/i, "").trim();

  // Split into lines and rebuild as paragraphs
  const lines = text.split("\n");
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped) continue;

    if (stripped.startsWith(">>")) {
      // Flush current paragraph, start new one with speaker content
      if (current.length) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      const content = stripped.replace(/^>>\s*/, "").trim();
      if (content) current.push(content);
    } else {
      current.push(stripped);
    }
  }
  if (current.length) paragraphs.push(current.join(" "));

  return paragraphs.join("\n\n").trim();
}
