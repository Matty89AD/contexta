# Epic 9: Challenge Test Dataset + Eval Harness

> **Status:** 🚧 in-progress  |  **As of:** 2026-03-04

Run the 15 test challenges from `data/ChallengeTestData.md` through the live matching engine and measure precision@3 / precision@5 against manually annotated ground truth. No UI changes; no DB schema changes.

## Scope

- **Eval dataset** (`data/eval-dataset.ts`): Typed TypeScript export of all 15 challenges with enum values and 3 ground-truth content matches each. Single source of truth; no markdown parsing at runtime.
- **Pure helpers**: `normalizeTitle`, `precisionAtK`, `hitAtK` — exported and unit-tested in isolation.
- **Eval script** (`scripts/eval-matching.ts`): CLI that connects to live Supabase + AI, generates embeddings, runs `runMatching`, deduplicates by content ID, compares top-5 unique content titles against ground truth, and prints per-challenge results + aggregate metrics.
- **Unit tests** (`__tests__/eval-harness.test.ts`): Cover all three pure helpers, including edge cases.
- **npm script**: `npm run eval` → runs the eval harness.

## Requirements

| # | Requirement |
|---|-------------|
| R1 | Eval dataset is a typed TypeScript file (`data/eval-dataset.ts`); no markdown parsing at runtime. |
| R2 | Script connects to live Supabase and generates real embeddings via `AIProvider`. |
| R3 | For each challenge, the script deduplicates retrieved chunks by content ID, then takes the top-5 unique content titles. Titles are normalised (trim, lowercase, strip `.txt` suffix) before comparison against ground truth. |
| R4 | Script outputs per-challenge: challenge ID, top-5 retrieved titles, precision@3, precision@5, hit@3, hit@5. |
| R5 | Script outputs aggregate: mean precision@3, mean precision@5, hit rate @3, hit rate @5, number of challenges run. |
| R6 | Challenge DB records are **not** created during eval (the pipeline calls `ai.generateEmbedding` + `runMatching` directly — skipping `challengesRepo.createChallenge`). |
| R7 | `normalizeTitle`, `precisionAtK`, `hitAtK` are pure functions covered by Vitest unit tests. |
| R8 | A `--dry-run` flag prints the dataset to stdout without making any DB or AI calls. |
| R9 | `npm run eval` runs the harness; `npm test` runs all unit tests (all pass). |

## Key acceptance criteria

- All 15 challenges run without error against the live DB.
- Aggregate precision@3 and precision@5 are printed to stdout.
- Unit tests for all pure helpers pass (`npm test`).
- No DB schema changes and no UI changes.
- `npm run lint && npm run build` pass cleanly.

## Out of scope

- CI integration or scheduled eval runs.
- Challenge record persistence during eval.
- UI for displaying eval results.
- Archetype boosting or new matching strategies.
- Precision targets (this is a baseline measurement only).
- Automated dataset generation (the 15 challenges are manually curated).

## Dependencies

- Epic 7 (hybrid RAG retrieval) — `runMatching` API used directly.
- Epic 8 (content intelligence, ingested content) — all 19 transcripts must be ingested into Supabase before running the eval so that ground truth titles resolve to real `content.title` rows.
