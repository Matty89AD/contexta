import { z } from "zod";

/** Epic 10 — artifact-based recommendation output schema */
export const artifactRecommendationItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  domains: z.array(z.string()),
  use_case: z.string(),
  explanation: z.string().describe("1–2 sentences on why this artifact fits the challenge"),
  is_most_relevant: z.boolean(),
});

export const recommendationsOutputSchema = z.object({
  recommendations: z.array(artifactRecommendationItemSchema).min(1).max(5),
});

export type ArtifactRecommendationItem = z.infer<typeof artifactRecommendationItemSchema>;
export type RecommendationsOutput = z.infer<typeof recommendationsOutputSchema>;

export function buildRecommendationsPrompt(
  challengeSummary: string,
  problemStatement: string,
  chunks: { body: string }[],
  artifacts: { slug: string; title: string; domains: string[]; use_case: string }[]
): string {
  const chunkList = chunks
    .map((c, i) => `[${i + 1}] ${c.body.slice(0, 400)}`)
    .join("\n\n");

  const artifactList = artifacts
    .map(
      (a) =>
        `- slug: "${a.slug}" | title: "${a.title}" | domains: [${a.domains.join(", ")}] | use_case: "${a.use_case}"`
    )
    .join("\n");

  return `You are a product management advisor. Given a challenge and relevant content excerpts, select the 3–5 most relevant PM frameworks or methodologies from the list below and explain why each fits the challenge.

Challenge summary: ${challengeSummary}
Problem statement: ${problemStatement}

Relevant content excerpts (for context only):
${chunkList}

Known PM artifacts — you MUST only select slugs from this list:
${artifactList}

Respond with a JSON object:
{
  "recommendations": [
    {
      "slug": "<slug from list>",
      "title": "<title from list>",
      "domains": ["<domain from list>"],
      "use_case": "<use_case from list>",
      "explanation": "<1–2 sentences on why this artifact fits this specific challenge>",
      "is_most_relevant": true|false
    }
  ]
}

Rules:
- Include 3–5 items.
- Exactly one item must have "is_most_relevant": true.
- Only use slugs, titles, domains, and use_case values from the list above — do not invent artifact names.
- The explanation must reference the specific challenge context.`;
}
