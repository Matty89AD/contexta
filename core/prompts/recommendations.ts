import { z } from "zod";

export const recommendationItemSchema = z.object({
  content_id: z.string().uuid(),
  title: z.string(),
  explanation: z.string().describe("Short 1-2 sentence explanation of why this helps the user's challenge"),
  is_most_relevant: z.boolean(),
});

export const recommendationsOutputSchema = z.object({
  recommendations: z.array(recommendationItemSchema).min(1).max(5),
});

export type RecommendationItem = z.infer<typeof recommendationItemSchema>;
export type RecommendationsOutput = z.infer<typeof recommendationsOutputSchema>;

export function buildRecommendationsPrompt(
  challengeSummary: string,
  problemStatement: string,
  chunks: { contentId: string; title: string; body: string }[]
): string {
  const chunkList = chunks
    .map(
      (c) => `- Content ID: ${c.contentId}\n  Title: ${c.title}\n  Excerpt: ${c.body.slice(0, 400)}...`
    )
    .join("\n\n");

  return `You are a product management advisor. Given a challenge and curated content excerpts, recommend 3-5 content items with short relevance explanations. Mark exactly one as "most relevant".

Challenge summary: ${challengeSummary}
Problem statement: ${problemStatement}

Curated content excerpts:
${chunkList}

Respond with a JSON object: { "recommendations": [ { "content_id": "<uuid>", "title": "<title>", "explanation": "<1-2 sentences>", "is_most_relevant": true|false } ] }
- Include 3-5 items.
- Exactly one item must have "is_most_relevant": true.
- Use the exact content_id (UUID) and title from the list above.`;
}
