import { z } from "zod";

export const newsProposalOutputSchema = z.object({
  type: z.enum(["podcast", "artifact", "article"]),
  title: z.string().max(80).describe("Engaging headline for the news card"),
  description: z.string().max(200).describe("1–2 sentence teaser"),
  published_date: z.string().describe("Display string, e.g. 'Mar 2026'"),
});

export type NewsProposalOutput = z.infer<typeof newsProposalOutputSchema>;

export function buildNewsProposalPrompt(params: {
  itemType: "content" | "artifact";
  title: string;
  author?: string | null;
  domains?: string[];
  use_case?: string;
  description?: string;
  source_type?: string;
}): string {
  const { itemType, title, author, domains, use_case, description, source_type } = params;

  const domainList = domains?.join(", ") ?? "";
  const authorLine = author ? `Author/Speaker: ${author}` : "";
  const domainLine = domainList ? `Domains: ${domainList}` : "";
  const useCaseLine = use_case ? `Use case: ${use_case}` : "";
  const descLine = description ? `Description: ${description}` : "";
  const sourceTypeLine = source_type ? `Source type: ${source_type}` : "";

  const itemKind =
    itemType === "artifact"
      ? "new PM framework or methodology"
      : source_type === "podcast"
      ? "podcast episode"
      : "article or resource";

  return `You are writing a short news card for the Contexta Journey feed, announcing a ${itemKind} that has just been added to the knowledge base.

Item details:
- Title: "${title}"
${authorLine}
${domainLine}
${useCaseLine}
${descLine}
${sourceTypeLine}

Write an engaging, concise news card. The tone should be helpful and professional — like a smart newsletter update for senior product managers.

Rules:
- title: max 80 characters. Write a compelling headline (not just the item title).
- description: 1–2 sentences, max 200 characters. Highlight the key insight or benefit.
- type: choose from podcast | artifact | article based on the item type and source.
- published_date: use today's date in "Mon YYYY" format (e.g. "Mar 2026").

Return valid JSON matching the schema.`;
}
