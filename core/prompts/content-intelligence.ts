import { z } from "zod";
import { CHUNK_TYPES } from "@/lib/db/types";

/** Per-chunk intelligence extracted by the LLM. */
export const chunkIntelligenceSchema = z.object({
  chunk_type: z.enum(CHUNK_TYPES).describe(
    "Type of content in this chunk: framework | example | principle | case_study | tool | warning | summary | introduction"
  ),
  key_concepts: z
    .array(z.string())
    .transform((arr) => arr.slice(0, 8))
    .describe("0–5 specific concepts, frameworks, or named methods in this chunk"),
});

/** Full output schema for a single content intelligence extraction call.
 *  Array limits use transform() to truncate gracefully rather than fail validation —
 *  the LLM sometimes returns slightly more items than requested. */
export const contentIntelligenceOutputSchema = z.object({
  topics: z
    .array(z.string())
    .transform((arr) => arr.slice(0, 8))
    .describe("2–6 high-level topic tags, e.g. 'product discovery', 'stakeholder alignment'"),
  keywords: z
    .array(z.string())
    .transform((arr) => arr.slice(0, 15))
    .describe("4–10 specific terms, methodologies, or frameworks mentioned"),
  author: z.string().nullable().describe("Primary speaker or author name, or null if not detectable"),
  publication_date: z
    .string()
    .nullable()
    .describe("ISO date string (YYYY-MM-DD) if detectable, else null"),
  language: z.string().default("en").describe("ISO 639-1 language code"),
  extraction_confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("0.0–1.0 — how complete and reliable this extraction is"),
  chunks: z
    .array(chunkIntelligenceSchema)
    .describe("One entry per input chunk, in the same order"),
});

export type ContentIntelligenceOutput = z.infer<typeof contentIntelligenceOutputSchema>;
export type ChunkIntelligenceOutput = z.infer<typeof chunkIntelligenceSchema>;

const MAX_BODY_PREVIEW_CHARS = 8000;
const MAX_CHARS_PER_CHUNK = 600;

export function buildContentIntelligencePrompt(
  title: string,
  chunks: string[],
  sourceType: string
): string {
  const bodyPreview = chunks.join("\n\n").slice(0, MAX_BODY_PREVIEW_CHARS);
  const chunkList = chunks
    .map((c, i) => `[Chunk ${i}]\n${c.slice(0, MAX_CHARS_PER_CHUNK)}`)
    .join("\n\n");

  return `You are a content analyst specialising in product management. Extract structured metadata from this ${sourceType} content.

Title: "${title}"

Content preview (first ~8000 chars):
"""
${bodyPreview}
"""

Chunks (${chunks.length} total — classify each one in order):
${chunkList}

Return a single JSON object with exactly these fields:
- topics: array of 2–6 high-level topic tags (e.g. "continuous discovery", "opportunity solution tree", "roadmap prioritization")
- keywords: array of 4–10 specific terms, frameworks, or methodologies mentioned (e.g. "RICE scoring", "Shape Up", "Jobs-to-be-Done")
- author: name of the primary speaker or author if clearly identifiable, else null
- publication_date: ISO date string (YYYY-MM-DD) if detectable from the text, else null
- language: ISO 639-1 code (almost always "en")
- extraction_confidence: float 0.0–1.0 reflecting how complete and reliable the extraction is
- chunks: array of exactly ${chunks.length} objects (one per chunk, same order), each with:
    - chunk_type: classify based on WHAT IS BEING DISCUSSED, not the conversational format. For podcasts/interviews, most chunks contain substantive content — even if the text is dialogue. Rules:
        "introduction" — STRICTLY for host opening words, guest introductions, and sponsor/ad reads. Only applies to the first 1–2 chunks of a transcript. A chunk with a timestamp in the middle of the episode is NEVER introduction.
        "discussion"   — default for substantive interview dialogue that doesn't fit a more specific type: back-and-forth Q&A, general conversation about a topic, context-building mid-episode.
        "framework"    — describes a named, structured model, method, or process (e.g. Shape Up, OST, RICE, Jobs-to-be-Done)
        "principle"    — a rule, mental model, or guideline stated as general advice ("always do X", "the key insight is…")
        "example"      — a concrete story, anecdote, or specific illustration of how something was applied
        "case_study"   — extended real-world application with context and outcome (usually multi-paragraph)
        "tool"         — a specific technique, template, or tactical action a practitioner can directly apply
        "warning"      — an anti-pattern, common mistake, trap, or caveat to watch out for
        "summary"      — synthesises or recaps the broader content of the episode
    - key_concepts: array of 0–5 specific named concepts, frameworks, or methods mentioned in this chunk

Important: the chunks array must contain exactly ${chunks.length} entries.`;
}
