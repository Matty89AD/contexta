import { z } from "zod";

export const challengeSummaryOutputSchema = z.object({
  structured_summary: z.string().describe("Short 2-3 sentence summary of the challenge"),
  problem_statement: z.string().describe("Clear one-sentence problem statement"),
  desired_outcome_statement: z.string().describe("What success looks like in one sentence"),
});

export type ChallengeSummaryOutput = z.infer<typeof challengeSummaryOutputSchema>;

export function buildChallengeSummaryPrompt(rawDescription: string, domain: string): string {
  return `You are a product management advisor. Given a raw challenge description and domain, produce a structured summary.

Domain: ${domain}

Raw challenge description:
"""
${rawDescription}
"""

Respond with a JSON object containing exactly:
- structured_summary: 2-3 sentence summary of the challenge
- problem_statement: one clear sentence stating the problem
- desired_outcome_statement: one sentence describing the desired outcome`;
}
