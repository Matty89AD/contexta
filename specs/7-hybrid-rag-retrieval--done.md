# Epic 7: Hybrid RAG retrieval

> **Status:** ✅ done  |  **As of:** 2026-03-03

Add hybrid retrieval (vector + keyword) and merge/rerank to the matching engine so that both semantic similarity and exact term match improve the candidate set for recommendations. The existing challenge → recommendations flow and output (3–5 items with explanations) remain; only retrieval and ranking evolve. Content and chunk schema are extended with full-text index (tsvector) and optional raw text storage.

## Scope

- **Keyword_Matcher:** Full-text search on chunk text (tsvector/tsquery); top-K keyword results.
- **Matching_Engine:** Run vector and keyword retrieval; merge and deduplicate; rerank with configurable weights; pass top 6–8 chunks to existing recommendation pipeline.
- **Content_Indexer / ingestion:** Add tsvector column and GIN index on chunks; populate during ingest; optional raw_text (or equivalent) on content. Chunking parameters (size, overlap) configurable.
- **Config:** Weights for semantic vs keyword in rerank (e.g. env); default 0.7 / 0.3.

## Requirements (from spec)

| Req | Title |
|-----|--------|
| 37 | Full-Text Search on Chunks |
| 38 | Hybrid Retrieval and Rerank |
| 39 | Content and Chunk Schema Extension for Hybrid RAG |
| 40 | Ingestion Pipeline for Hybrid RAG |

## Key acceptance criteria (summary)

- Chunks have tsvector column and GIN index; ingestion populates both embedding and tsvector.
- Matching runs vector search and keyword search; merges and deduplicates; reranks with configurable formula; returns top 6–8 chunks to existing flow.
- Recommendation output remains 3–5 items with explanations; no Q&A or cited-answer format in this epic.
- Ingestion: chunk size and overlap configurable; single pipeline for embed + tsvector; atomic where possible.
- Optional: raw text storage per content for future use.

## Out of scope

- Q&A flow or cited-answer output (PRD's "answer + sources" format).
- New tables (episodes, transcripts as separate entities); evolve content/chunks only.
- Agent orchestration, graph DB, multi-hop reasoning (per PRD non-goals).

## Dependencies

- Epic 3 (schemas, embeddings), Epic 4 (matching engine). Epic 6 (multi-domain) is independent but may be implemented in any order.

## Notes

- **DB migration:** Add `tsv tsvector` (or equivalent) to content_chunks; GIN index; backfill from `body` for existing rows. Optional: `raw_text text` on content.
- **Latency:** Vector query and full-text query each < 150ms target; end-to-end recommendation latency target unchanged (e.g. < 5s where applicable).
- **Implementation touchpoints:** repositories/embeddings.ts or new keyword repo, services/matching.ts, services/challenge.ts, ingest service and scripts, Supabase migration, config (env for weights and chunk params).
