import { z } from "zod";

export const challengeSummaryOutputSchema = z.object({
  structured_summary: z.string().describe("Short 2-3 sentence summary of the challenge"),
  problem_statement: z.string().describe("Clear one-sentence problem statement"),
  desired_outcome_statement: z.string().describe("What success looks like in one sentence"),
});

export type ChallengeSummaryOutput = z.infer<typeof challengeSummaryOutputSchema>;

type ContextInput = {
  role?: string;
  company_stage?: string;
  team_size?: string;
  experience_level?: string;
} | undefined;

export function buildChallengeSummaryPrompt(
  rawDescription: string,
  domains: string | string[],
  context?: ContextInput
): string {
  const domainLabel = Array.isArray(domains) ? domains.join(", ") : domains;
  const contextBlock =
    context &&
    (context.role || context.company_stage || context.team_size || context.experience_level)
      ? `
Context (for tailoring): role=${context.role ?? "—"}, company_stage=${context.company_stage ?? "—"}, team_size=${context.team_size ?? "—"}, experience_level=${context.experience_level ?? "—"}
`
      : "";

  return `You are a product management advisor. Given a raw challenge description and domain(s), produce a structured summary.

Domain(s): ${domainLabel}
${contextBlock}

Raw challenge description:
"""
${rawDescription}
"""

Respond with a JSON object containing exactly:
- structured_summary: 2-3 sentence summary of the challenge
- problem_statement: one clear sentence stating the problem
- desired_outcome_statement: one sentence describing the desired outcome`;
}
