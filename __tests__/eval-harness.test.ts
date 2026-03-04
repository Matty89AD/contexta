import { describe, it, expect } from "vitest";

/**
 * Unit tests for eval harness pure helpers (Epic 9).
 *
 * The helpers are re-defined here (mirroring scripts/eval-matching.ts) following
 * the codebase pattern of challenge-schema.test.ts which re-creates logic for
 * isolation rather than importing from the script module.
 */

// ---------------------------------------------------------------------------
// Pure helpers (mirrored from scripts/eval-matching.ts)
// ---------------------------------------------------------------------------

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\.txt$/i, "");
}

function precisionAtK(
  retrieved: string[],
  groundTruth: string[],
  k: number
): number {
  if (groundTruth.length === 0) return 0;
  const topK = retrieved.slice(0, k);
  const hits = topK.filter((t) => groundTruth.includes(t)).length;
  return hits / groundTruth.length;
}

function hitAtK(
  retrieved: string[],
  groundTruth: string[],
  k: number
): boolean {
  return precisionAtK(retrieved, groundTruth, k) > 0;
}

// ---------------------------------------------------------------------------
// normalizeTitle
// ---------------------------------------------------------------------------

describe("normalizeTitle", () => {
  it("strips .txt suffix (lowercase)", () => {
    expect(normalizeTitle("Brian Chesky.txt")).toBe("brian chesky");
  });

  it("strips .txt suffix (uppercase)", () => {
    expect(normalizeTitle("Brian Chesky.TXT")).toBe("brian chesky");
  });

  it("lowercases title without extension", () => {
    expect(normalizeTitle("Brian Chesky")).toBe("brian chesky");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeTitle("  Petra Wille  ")).toBe("petra wille");
  });

  it("handles compound name with + character", () => {
    expect(normalizeTitle("Aishwarya Naresh Reganti + Kiriti Badam.txt")).toBe(
      "aishwarya naresh reganti + kiriti badam"
    );
  });

  it("handles versioned names like Elena Verna 2.0.txt", () => {
    expect(normalizeTitle("Elena Verna 2.0.txt")).toBe("elena verna 2.0");
  });

  it("does not strip non-.txt extensions", () => {
    expect(normalizeTitle("content.md")).toBe("content.md");
  });

  it("handles empty string", () => {
    expect(normalizeTitle("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// precisionAtK
// ---------------------------------------------------------------------------

describe("precisionAtK", () => {
  const gt = ["brian chesky", "petra wille", "john cutler"];

  it("returns 1.0 when all three ground truth items are in top-3", () => {
    const retrieved = ["brian chesky", "petra wille", "john cutler", "other"];
    expect(precisionAtK(retrieved, gt, 3)).toBe(1.0);
  });

  it("returns 1.0 when all three ground truth items are in top-5", () => {
    const retrieved = ["brian chesky", "other", "petra wille", "another", "john cutler"];
    expect(precisionAtK(retrieved, gt, 5)).toBe(1.0);
  });

  it("returns 0.0 when no ground truth items are in top-3", () => {
    const retrieved = ["ryan singer", "teresa torres", "adam fishman"];
    expect(precisionAtK(retrieved, gt, 3)).toBe(0.0);
  });

  it("returns 1/3 when exactly one item matches in top-3", () => {
    const retrieved = ["brian chesky", "ryan singer", "teresa torres"];
    expect(precisionAtK(retrieved, gt, 3)).toBeCloseTo(1 / 3);
  });

  it("returns 2/3 when two items match in top-3", () => {
    const retrieved = ["brian chesky", "petra wille", "ryan singer"];
    expect(precisionAtK(retrieved, gt, 3)).toBeCloseTo(2 / 3);
  });

  it("returns higher precision@5 than precision@3 when later results match", () => {
    const retrieved = [
      "ryan singer",
      "teresa torres",
      "adam fishman",
      "brian chesky",
      "petra wille",
    ];
    const p3 = precisionAtK(retrieved, gt, 3);
    const p5 = precisionAtK(retrieved, gt, 5);
    expect(p5).toBeGreaterThan(p3);
  });

  it("returns 0 when ground truth is empty", () => {
    expect(precisionAtK(["a", "b", "c"], [], 3)).toBe(0);
  });

  it("handles k larger than retrieved list length", () => {
    const retrieved = ["brian chesky"]; // only one result
    expect(precisionAtK(retrieved, gt, 5)).toBeCloseTo(1 / 3);
  });

  it("does not count items beyond position k", () => {
    const retrieved = ["ryan singer", "teresa torres", "adam fishman", "brian chesky"];
    expect(precisionAtK(retrieved, gt, 3)).toBe(0.0);
  });

  it("returns 0 when retrieved is empty", () => {
    expect(precisionAtK([], gt, 3)).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// hitAtK
// ---------------------------------------------------------------------------

describe("hitAtK", () => {
  const gt = ["brian chesky", "petra wille", "john cutler"];

  it("returns true when one GT item is the first result", () => {
    const retrieved = ["brian chesky", "other", "another"];
    expect(hitAtK(retrieved, gt, 3)).toBe(true);
  });

  it("returns true when one GT item is exactly at position k", () => {
    const retrieved = ["other1", "other2", "brian chesky"];
    expect(hitAtK(retrieved, gt, 3)).toBe(true);
  });

  it("returns false when GT item appears beyond position k", () => {
    const retrieved = ["other1", "other2", "other3", "brian chesky"];
    expect(hitAtK(retrieved, gt, 3)).toBe(false);
  });

  it("returns false when no GT item appears in results", () => {
    const retrieved = ["ryan singer", "teresa torres", "adam fishman"];
    expect(hitAtK(retrieved, gt, 3)).toBe(false);
  });

  it("returns false when retrieved is empty", () => {
    expect(hitAtK([], gt, 3)).toBe(false);
  });

  it("returns true for hit@5 even when hit@3 is false", () => {
    const retrieved = ["other1", "other2", "other3", "brian chesky", "other4"];
    expect(hitAtK(retrieved, gt, 3)).toBe(false);
    expect(hitAtK(retrieved, gt, 5)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Eval dataset integrity
// ---------------------------------------------------------------------------

import { EVAL_CHALLENGES } from "@/data/eval-dataset";

describe("EVAL_CHALLENGES dataset", () => {
  const VALID_DOMAINS = ["strategy", "discovery", "delivery", "growth", "leadership"];
  const VALID_ROLES = ["founder", "cpo_director", "head_of_product", "sr_pm", "associate_pm"];
  const VALID_STAGES = [
    "preseed_seed",
    "series_a_b",
    "growth_series_c_plus",
    "enterprise",
    "corporate",
  ];
  const VALID_TEAM_SIZES = ["1-5", "6-15", "16-50", "51+"];
  const VALID_EXPERIENCE = ["junior", "mid", "senior", "lead"];

  it("contains exactly 15 challenges", () => {
    expect(EVAL_CHALLENGES).toHaveLength(15);
  });

  it("all challenge IDs are unique", () => {
    const ids = EVAL_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all challenge IDs follow CH-NNN format", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(c.id).toMatch(/^CH-\d{3}$/);
    }
  });

  it("all domains are valid enum values", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(VALID_DOMAINS).toContain(c.domain);
      for (const d of c.domains) {
        expect(VALID_DOMAINS).toContain(d);
      }
    }
  });

  it("primary domain matches first entry in domains array", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(c.domain).toBe(c.domains[0]);
    }
  });

  it("all roles are valid enum values", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(VALID_ROLES).toContain(c.role);
    }
  });

  it("all company stages are valid enum values", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(VALID_STAGES).toContain(c.company_stage);
    }
  });

  it("all team sizes are valid enum values", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(VALID_TEAM_SIZES).toContain(c.team_size);
    }
  });

  it("all experience levels are valid enum values", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(VALID_EXPERIENCE).toContain(c.experience_level);
    }
  });

  it("each challenge has exactly 3 ground truth items", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(c.ground_truth).toHaveLength(3);
    }
  });

  it("all raw descriptions are non-empty strings", () => {
    for (const c of EVAL_CHALLENGES) {
      expect(c.raw_description.trim().length).toBeGreaterThan(10);
    }
  });
});
