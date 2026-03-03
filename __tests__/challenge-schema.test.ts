import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-create the schema here to test it in isolation.
// This mirrors the schema defined in services/challenge.ts (Epic 6).
const DOMAIN_VALUES = [
  "strategy",
  "discovery",
  "delivery",
  "growth",
  "leadership",
] as const;

const contextSchema = z
  .object({
    role: z.string().optional(),
    company_stage: z.string().optional(),
    team_size: z.string().optional(),
    experience_level: z.string().optional(),
  })
  .optional();

const challengeInputSchema = z.object({
  raw_description: z.string().min(10).max(5000),
  domains: z.array(z.enum(DOMAIN_VALUES)).min(1).max(5),
  subdomain: z.string().max(200).optional(),
  impact_reach: z.string().max(1000).optional(),
  context: contextSchema,
});

describe("challengeInputSchema – multi-domain validation (Epic 6 R1)", () => {
  it("accepts a single valid domain", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: ["strategy"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple valid domains", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "Cross-functional challenges blocking our roadmap.",
      domains: ["strategy", "delivery", "leadership"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty domains array", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 domains", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: [
        "strategy",
        "discovery",
        "delivery",
        "growth",
        "leadership",
        "strategy", // 6th – schema max is 5
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid domain value", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: ["invalid_domain"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description that is too short", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "Too short",
      domains: ["strategy"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing domains field", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid domains together", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: ["strategy", "discovery", "delivery", "growth", "leadership"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional context fields", () => {
    const result = challengeInputSchema.safeParse({
      raw_description: "We cannot prioritize our backlog effectively.",
      domains: ["strategy"],
      context: {
        role: "founder",
        company_stage: "preseed_seed",
        team_size: "1-5",
        experience_level: "junior",
      },
    });
    expect(result.success).toBe(true);
  });
});
