import { describe, it, expect } from "vitest";
import { artifactDetailOutputSchema } from "@/core/prompts/artifact-detail";
import { buildArtifactDetailPrompt } from "@/core/prompts/artifact-detail";

describe("artifactDetailOutputSchema (Epic 11)", () => {
  const validInput = {
    description: "RICE scoring is a prioritization framework used by PMs to rank features. It helps teams make data-driven decisions about what to build next. By scoring items on Reach, Impact, Confidence, and Effort, PMs can compare unlike features objectively. It removes gut-feel from roadmap decisions. Teams at all stages use it to cut through noise.",
    company_stage: "Growth / Series A-B",
    thought_leaders: ["Sean McBride", "Lenny Rachitsky"],
    pro_tip: "Apply RICE after you have a shortlist of candidates, not before. This keeps the scoring fast and focused.",
    how_to_intro: "Follow these steps to apply RICE scoring to your backlog.",
    how_to_steps: [
      { step_title: "List candidates", step_detail: "Write down all feature candidates you want to evaluate." },
      { step_title: "Score Reach", step_detail: "Estimate how many users will be affected in a given period." },
      { step_title: "Score Impact", step_detail: "Rate the expected impact on your goal (1–3 scale)." },
      { step_title: "Score Confidence", step_detail: "Express how confident you are in your estimates as a percentage." },
      { step_title: "Score Effort", step_detail: "Estimate person-months required to ship the feature." },
      { step_title: "Calculate the score", step_detail: "Divide (Reach × Impact × Confidence) by Effort." },
      { step_title: "Rank and review", step_detail: "Sort by RICE score and sanity-check the top results with your team." },
    ],
  };

  it("accepts a valid full artifact detail response", () => {
    const result = artifactDetailOutputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("trims thought_leaders to max 4", () => {
    const input = {
      ...validInput,
      thought_leaders: ["A", "B", "C", "D", "E", "F"],
    };
    const result = artifactDetailOutputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.thought_leaders).toHaveLength(4);
    }
  });

  it("trims how_to_steps to max 8", () => {
    const tenSteps = Array.from({ length: 10 }, (_, i) => ({
      step_title: `Step ${i + 1}`,
      step_detail: "Some detail here.",
    }));
    const result = artifactDetailOutputSchema.safeParse({
      ...validInput,
      how_to_steps: tenSteps,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.how_to_steps).toHaveLength(8);
    }
  });

  it("rejects missing description", () => {
    const { description: _, ...rest } = validInput;
    const result = artifactDetailOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing how_to_steps", () => {
    const { how_to_steps: _, ...rest } = validInput;
    const result = artifactDetailOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a step without step_title", () => {
    const result = artifactDetailOutputSchema.safeParse({
      ...validInput,
      how_to_steps: [{ step_detail: "Missing title" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildArtifactDetailPrompt (Epic 11)", () => {
  const artifact = {
    title: "RICE Scoring",
    domains: ["strategy", "delivery"],
    use_case: "Prioritise your backlog using a data-driven scoring system",
  };

  it("includes artifact title in prompt", () => {
    const prompt = buildArtifactDetailPrompt(artifact);
    expect(prompt).toContain("RICE Scoring");
  });

  it("includes challenge context when provided", () => {
    const prompt = buildArtifactDetailPrompt(
      artifact,
      "We have too many features and cannot agree on priorities",
      ["strategy"]
    );
    expect(prompt).toContain("We have too many features");
    expect(prompt).toContain("strategy");
    expect(prompt).toContain("personalised");
  });

  it("does not mention challenge when not provided", () => {
    const prompt = buildArtifactDetailPrompt(artifact);
    expect(prompt).not.toContain("User's challenge context");
  });
});
