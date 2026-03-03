import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChallengeDomain } from "@/lib/db/types";
import type { ChunkWithContent } from "@/lib/db/types";

// ---------------------------------------------------------------------------
// hasDomainOverlap unit tests (pure function, no mocking needed)
// ---------------------------------------------------------------------------
import { hasDomainOverlap } from "@/services/matching";

describe("hasDomainOverlap", () => {
  it("returns true when challenge domain is in content domains", () => {
    expect(
      hasDomainOverlap(["strategy"], ["strategy", "leadership"], null)
    ).toBe(true);
  });

  it("returns true when one of multiple challenge domains matches", () => {
    expect(
      hasDomainOverlap(
        ["delivery", "growth"],
        ["growth", "discovery"],
        null
      )
    ).toBe(true);
  });

  it("returns false when no overlap exists", () => {
    expect(
      hasDomainOverlap(["strategy"], ["delivery", "growth"], null)
    ).toBe(false);
  });

  it("falls back to primary_domain when content domains array is empty", () => {
    expect(
      hasDomainOverlap(["leadership"], [], "leadership" as ChallengeDomain)
    ).toBe(true);
  });

  it("returns false when both arrays empty and primary_domain is null", () => {
    expect(hasDomainOverlap(["strategy"], [], null)).toBe(false);
  });

  it("handles multi-domain challenge against single content domain", () => {
    expect(
      hasDomainOverlap(["strategy", "discovery", "delivery"], ["discovery"], null)
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runMatching integration tests (mock DB + config)
// ---------------------------------------------------------------------------
// We test the ranking logic without a real Supabase connection.

vi.mock("@/core/config", () => ({
  getConfig: () => ({
    TOP_K: 5,
    STRUCTURED_FIT_WEIGHT: 0.3,
    EMBEDDING_SIMILARITY_WEIGHT: 0.7,
  }),
}));

vi.mock("@/repositories/embeddings", () => ({
  findSimilarChunks: vi.fn(),
}));

import { runMatching } from "@/services/matching";
import * as embeddingsRepo from "@/repositories/embeddings";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeChunk(
  contentId: string,
  similarity: number,
  contentDomains: ChallengeDomain[],
  primaryDomain: ChallengeDomain | null = null
): ChunkWithContent {
  return {
    chunk: {
      id: `chunk-${contentId}`,
      content_id: contentId,
      body: "sample chunk body",
      embedding: null,
      chunk_index: 0,
      created_at: "2025-01-01T00:00:00Z",
    },
    content: {
      id: contentId,
      source_type: "podcast",
      title: `Content ${contentId}`,
      url: null,
      summary: null,
      key_takeaways: null,
      metadata: {},
      primary_domain: primaryDomain,
      domains: contentDomains,
      created_at: "2025-01-01T00:00:00Z",
    },
    similarity,
  };
}

const fakeSupa = {} as SupabaseClient;

describe("runMatching – Epic 6 behavior", () => {
  beforeEach(() => {
    vi.mocked(embeddingsRepo.findSimilarChunks).mockReset();
  });

  it("returns empty array when no candidates exist", async () => {
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue([]);
    const result = await runMatching(fakeSupa, [0.1, 0.2], ["strategy"]);
    expect(result).toHaveLength(0);
  });

  it("all candidates participate – no hard domain exclusion (R3)", async () => {
    const candidates = [
      makeChunk("a", 0.9, ["strategy"]),     // overlaps
      makeChunk("b", 0.88, ["delivery"]),    // no overlap with challenge domains
      makeChunk("c", 0.85, ["growth"]),      // no overlap
    ];
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(fakeSupa, [0.1], ["strategy"]);

    // All three should be in results (not filtered out)
    const ids = result.map((r) => r.chunkWithContent.content.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toContain("c");
  });

  it("domain-overlapping content scores higher than non-overlapping (R4)", async () => {
    const candidates = [
      makeChunk("no-match", 0.80, ["delivery"]),   // high similarity, no domain match
      makeChunk("match", 0.75, ["strategy"]),       // lower similarity, domain match
    ];
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(fakeSupa, [0.1], ["strategy"]);

    // Domain-matching content should rank higher due to structured fit boost
    // finalScore(match)    = 0.3*1   + 0.7*0.75 = 0.300 + 0.525 = 0.825
    // finalScore(no-match) = 0.3*0.5 + 0.7*0.80 = 0.150 + 0.560 = 0.710
    expect(result[0].chunkWithContent.content.id).toBe("match");
    expect(result[1].chunkWithContent.content.id).toBe("no-match");
  });

  it("assigns structured_fit matchReason to domain-overlapping content", async () => {
    const candidates = [
      makeChunk("x", 0.8, ["strategy"]),
      makeChunk("y", 0.7, ["delivery"]),
    ];
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(fakeSupa, [0.1], ["strategy"]);
    const byId = Object.fromEntries(
      result.map((r) => [r.chunkWithContent.content.id, r])
    );
    expect(byId["x"].matchReason).toBe("structured_fit");
    expect(byId["y"].matchReason).toBe("semantic");
  });

  it("supports multi-domain challenge – overlap with any domain triggers boost", async () => {
    const candidates = [
      makeChunk("both", 0.6, ["leadership", "strategy"]),
      makeChunk("one",  0.6, ["growth"]),
      makeChunk("none", 0.6, ["delivery"]),
    ];
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(
      fakeSupa,
      [0.1],
      ["strategy", "leadership"]
    );

    const byId = Object.fromEntries(
      result.map((r) => [r.chunkWithContent.content.id, r])
    );
    expect(byId["both"].matchReason).toBe("structured_fit");
    expect(byId["one"].matchReason).toBe("semantic");
    expect(byId["none"].matchReason).toBe("semantic");
  });

  it("falls back to primary_domain when content.domains is empty (backward compat)", async () => {
    const candidates = [
      makeChunk("legacy", 0.75, [], "strategy" as ChallengeDomain),
    ];
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(fakeSupa, [0.1], ["strategy"]);
    expect(result[0].matchReason).toBe("structured_fit");
  });

  it("limits results to TOP_K", async () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeChunk(`c${i}`, 0.9 - i * 0.01, ["strategy"])
    );
    vi.mocked(embeddingsRepo.findSimilarChunks).mockResolvedValue(candidates);

    const result = await runMatching(fakeSupa, [0.1], ["strategy"]);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});
