import { z } from "zod";

export const artifactDetailOutputSchema = z.object({
  description: z.string(),
  company_stage: z.string(),
  thought_leaders: z.array(z.string()).transform((arr) => arr.slice(0, 4)),
  pro_tip: z.string(),
  how_to_intro: z.string(),
  how_to_steps: z
    .array(
      z.object({
        step_title: z.string(),
        step_detail: z.string(),
      })
    )
    .transform((arr) => arr.slice(0, 8)),
});

export type ArtifactDetailOutput = z.infer<typeof artifactDetailOutputSchema>;

export const proTipOutputSchema = z.object({
  pro_tip: z.string(),
});

/**
 * Generates the full static artifact detail (description, how-to, thought leaders, generic pro_tip).
 * Used for DB pre-generation — no challenge context so output is reusable across all users.
 */
export function buildArtifactDetailPrompt(
  artifact: { title: string; domains: string[]; use_case: string }
): string {
  return `You are a senior product management advisor. Generate a detailed explanation of the following PM artifact.

Artifact: "${artifact.title}"
Use case: "${artifact.use_case}"
Domains: ${artifact.domains.join(", ")}

Respond with a JSON object:
{
  "description": "<3–5 sentence overview of what this artifact is and why PMs use it>",
  "company_stage": "<which company stages benefit most, e.g. 'Early stage / Seed to Series A'>",
  "thought_leaders": ["<name>"],
  "pro_tip": "<2–3 sentence guidance on using this artifact effectively>",
  "how_to_intro": "<1–3 sentence intro to the how-to section>",
  "how_to_steps": [
    { "step_title": "<short title>", "step_detail": "<1–2 sentence explanation>" }
  ]
}

Rules:
- description: 3–5 sentences
- thought_leaders: 1–4 real names known for this artifact or domain
- how_to_steps: 3–8 steps
- Respond with valid JSON only`;
}

/**
 * Generates a personalised pro_tip for a specific user challenge.
 * Called on demand at page load when a challengeSummary is available.
 */
export function buildProTipPrompt(
  artifact: { title: string; use_case: string },
  challengeSummary: string,
  challengeDomains?: string[]
): string {
  const domainCtx = challengeDomains?.length
    ? ` (domains: ${challengeDomains.join(", ")})`
    : "";
  return `You are a senior product management advisor. Write a 2–3 sentence personalised tip for applying "${artifact.title}" to the following challenge.

Challenge: ${challengeSummary}${domainCtx}
Artifact use case: ${artifact.use_case}

Respond with a JSON object: { "pro_tip": "<2–3 sentence personalised guidance>" }

Rules:
- Reference the specific challenge context
- Be concrete and actionable
- Respond with valid JSON only`;
}
