# Epic 4: Matching engine

Implement the first two layers of the matching architecture (structured filter, semantic similarity) and produce a final ranked list of content for the Content_Recommender. Archetype classification and boosting are deferred to a follow-up.

## Scope

- **Matching_Engine**: Orchestrate two layers (MVP); combine scores; return top 3–5 items. Archetype layer out of scope for MVP.
- **Structured_Filter**: Filter by taxonomy and context overlap (domain, capability_tag, company_stage, role, solves_blockers where available); progressive relaxation when no content passes.
- **Semantic_Matcher**: Embedding-based similarity between challenge and content; rank by similarity.
- **Archetype_Classifier**: Deferred to post-MVP (no classification or boosting in MVP).

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 26 | Three-Layer Matching Architecture |
| 27 | Structured Filtering Layer |
| 28 | Semantic Similarity Layer |
| 29 | Archetype Classification and Alignment |
| 30 | Final Score Composition |

## Key acceptance criteria (summary)

- **Layer 1 – Structured_Filter**: Filter by primary_domain match; capability_tag overlap; company_stage compatibility; role compatibility; solves_blockers overlap with Challenge core_blockers. If no content passes, relax constraints progressively (e.g. secondary criteria first).
- **Layer 2 – Semantic_Matcher**: Generate embeddings for Challenge (problem_statement, desired_outcome_statement) and Content (summary, key_takeaways); compute similarity scores; rank filtered content by similarity descending.
- **Layer 3 – Archetype_Classifier**: Not in MVP; add in follow-up.
- **Matching_Engine (MVP)**: Combine scores: structured_fit_weight + embedding_similarity_weight (no archetype_alignment in MVP); normalize component scores; rank by final score descending; return top 3–5; use credibility_weight as tiebreaker when scores tie.

## Out of scope for this epic

- Recommendation presentation and explainability (Epic 5).
- Schema and archetype definition (Epic 3).

## Dependencies

- Epic 3 (Challenge and Content schemas, embeddings, archetype definitions and content mappings).

## Notes

- MVP: structured filter + semantic similarity only; archetype boosting in follow-up (per q-and-a).
- Weights (structured_fit_weight, embedding_similarity_weight) should be configurable (e.g. env or config).
