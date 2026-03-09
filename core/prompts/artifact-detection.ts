import { z } from "zod";
import { CHALLENGE_DOMAINS } from "@/lib/db/types";

export const detectedArtifactSchema = z.object({
  title: z.string().describe("Canonical name, e.g. 'RICE Scoring'"),
  slug: z.string().describe("kebab-case identifier, e.g. 'rice-scoring'"),
  domains: z
    .array(z.enum(CHALLENGE_DOMAINS))
    .min(1)
    .transform((arr) => arr.slice(0, 3))
    .describe("1–3 relevant PM domains"),
  use_case: z.string().describe("1–2 sentences: what it is and when to use it"),
  description: z.string().describe("3–5 sentence overview for detail page"),
  how_to_intro: z.string().describe("1–2 sentence intro for how-to tab"),
  how_to_steps: z
    .array(
      z.object({
        step_title: z.string(),
        step_detail: z.string().describe("1–2 sentences"),
      })
    )
    .min(3)
    .transform((arr) => arr.slice(0, 8))
    .describe("3–8 actionable steps"),
  is_possible_duplicate: z.boolean().default(false),
  possible_duplicate_of: z
    .string()
    .nullable()
    .default(null)
    .describe("Slug of existing artifact if this is a near-duplicate"),
});

export const artifactDetectionOutputSchema = z.object({
  artifacts: z.array(detectedArtifactSchema),
});

export type DetectedArtifact = z.infer<typeof detectedArtifactSchema>;
export type ArtifactDetectionOutput = z.infer<typeof artifactDetectionOutputSchema>;

const MAX_CHUNK_CHARS = 12000;

export function buildArtifactDetectionPrompt(
  contentTitle: string,
  contentSourceType: string,
  chunks: string,
  existingArtifactTitles: string[]
): string {
  const existingList =
    existingArtifactTitles.length > 0
      ? existingArtifactTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  const truncatedChunks = chunks.slice(0, MAX_CHUNK_CHARS);

  return `You are a product management expert. Analyse the following ${contentSourceType} content and identify all distinct PM artifacts, frameworks, methodologies, or tools that are mentioned or explained in depth.

Content title: "${contentTitle}"

---CONTENT START---
${truncatedChunks}
---CONTENT END---

Existing artifacts already in the knowledge base (do NOT return these unless you believe the content introduces a meaningfully distinct variant):
${existingList}

Instructions:
1. Return only genuinely NEW artifacts not already in the list above.
2. If an artifact is very similar to an existing one but differs meaningfully, include it with is_possible_duplicate=true and set possible_duplicate_of to the slug of the most similar existing artifact.
3. Skip artifacts that are only briefly mentioned; include only those explained or demonstrated in depth.
4. For each artifact, generate a complete entry including how-to steps derived from the content.
5. Slugs must be lowercase kebab-case with no special characters.
6. If no new artifacts are detected, return an empty artifacts array.

Return valid JSON matching the schema.`;
}
