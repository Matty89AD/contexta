import { z } from "zod";

export const contentSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe("2–4 sentence summary of the content, concise, professional, third-person"),
});

export type ContentSummaryOutput = z.infer<typeof contentSummaryOutputSchema>;

const MAX_BODY_CHARS = 6000;

export function buildContentSummaryPrompt(
  title: string,
  sourceType: string,
  author: string | null,
  selectedChunks: string[],
  topics: string[],
  keywords: string[]
): string {
  const hasChunks = selectedChunks.length > 0;
  const bodySection = hasChunks
    ? `Content excerpts:\n"""\n${selectedChunks.join("\n\n").slice(0, MAX_BODY_CHARS)}\n"""`
    : `Topics: ${topics.join(", ") || "N/A"}\nKeywords: ${keywords.join(", ") || "N/A"}`;

  const authorLine = author ? `Author/Speaker: ${author}` : "";

  return `You are a content summariser specialising in product management resources. Write a concise summary for the following ${sourceType}.

Title: "${title}"
${authorLine}
${bodySection}

Return a single JSON object with one field:
- summary: 2–4 sentences, written in third person, professional tone. Describe what this resource covers and why it is valuable to product managers. Do not start with "This [source type]…". Focus on the substance.`;
}
