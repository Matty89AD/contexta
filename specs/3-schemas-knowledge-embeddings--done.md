# Epic 3: Schemas, knowledge & embeddings

> **Status:** ✅ done  |  **As of:** 2026-03-02

Define and maintain structured Challenge and Content schemas (reduced/minimal set for MVP), a minimal set of problem archetypes (5–7), curated source material, and embedding generation/storage. Decision patterns ("When X → do Y") are deferred to post-MVP.

## Scope

- **Challenge_Processor**: Transform raw challenge input into structured Challenge_Schema; validate schema fields; use defaults when needed.
- **Content_Indexer**: Maintain structured Content_Schema for all curated materials; validate; store archetype mappings.
- **Knowledge_Curator**: Minimal set of problem archetypes (5–7) for MVP; curated sources per archetype. Decision patterns ("When X → do Y (unless Z)") deferred to post-MVP.
- **Archetype_Classifier**: Problem_Archetype definitions (minimal set for MVP); typical blockers, context, outcomes, solution paths.
- **Semantic_Matcher / Content_Indexer**: Embedding generation for challenges (problem_statement, desired_outcome) and for content (summary, key_takeaways); storage; consistent model.

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 18 | Canonical Problem Archetype Set |
| 19 | Curated Source Material per Archetype |
| 20 | Normalized Decision Patterns |
| 23 | Structured Challenge Schema |
| 24 | Structured Content Schema |
| 25 | Problem Archetype Definitions |
| 31 | Archetype-Based Content Mapping |
| 34 | Challenge Schema Validation |
| 35 | Content Schema Validation |
| 36 | Embedding Generation and Storage |

## Key acceptance criteria (summary)

- **Challenge_Schema (MVP reduced)**: Extract/normalize raw_input, structured_summary, primary_domain, problem_statement, desired_outcome_statement; Context_Layer from context step (role, experience_level, company_stage, team_size). Use reasonable defaults for fields not collected or extractable. Full taxonomy/constraint layers can be added later.
- **Content_Schema (MVP minimal)**: Title, summary, key_takeaways, source_type, content_format, primary_domain, plus embedding-ready text. Optional: designed_for_outcome, solves_blockers, context_fit fields for structured filter. Extend with full schema later.
- **Archetypes**: Minimal set of 5–7 for MVP; each with problem description, context signals, constraints/failure modes; mapped to product outcomes; expand post-launch.
- **Curated sources**: 3–5 trusted references per archetype; decision heuristics, trade-offs, mistakes; tagged by archetype, stage, role.
- **Decision patterns**: Deferred to post-MVP (no "When X → do Y (unless Z)" storage or use in MVP).
- **Validation**: Challenge_Processor validates domain, challenge_type, core_blockers, experience_level, company_stage; fallback values on failure. Content_Indexer validates domain, content_format, outcomes, blockers; reject and log on failure.
- **Embeddings**: Generate for challenge (problem_statement, desired_outcome_statement) on submission; pre-generate and store for content (summary, key_takeaways) during ingestion; same model; cosine similarity; log and exclude item if generation fails.

## Out of scope for this epic

- Three-layer matching logic (Epic 4).
- Recommendation generation UI and activation (Epic 5).

## Dependencies

- Epic 1 (context available for Challenge context layer).
- Epic 2 (challenge submission triggers processing).

## Notes

- Challenge schema: reduced set for MVP; Content schema: minimal set. See q-and-a.md resolved decisions.
- Archetype count: 5–7 for MVP. Decision patterns: deferred.
