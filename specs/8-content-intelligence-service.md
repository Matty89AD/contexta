# Epic 8: Content Intelligence Service

> **Status:** ✅ done  |  **As of:** 2026-03-04

Introduce automated metadata extraction for ingested content via a new `services/content-intelligence.ts` module. During ingestion, an LLM extracts document-level metadata (topics, keywords, author, publication date, content category, language, confidence score) and chunk-level metadata (chunk type, key concepts). All fields are stored in dedicated typed columns (not jsonb). The tsvector index is extended to include topics and key concepts, enriching keyword retrieval. A backfill script re-processes existing content. Audience-targeting fields (`target_roles`, `target_stages`, `target_experience_levels`) are **out of scope** for this epic.

## Scope

- **Content_Intelligence_Service:** New module `services/content-intelligence.ts` that calls the LLM to extract document-level and chunk-level metadata from raw content text.
- **DB Schema — content:** Add dedicated typed columns: `topics text[]`, `keywords text[]`, `author text`, `publication_date date`, `content_category text`, `language text`, `extraction_confidence float`.
- **DB Schema — content_chunks:** Add `chunk_type text` and `key_concepts text[]` columns.
- **Indexes:** GIN indexes on `topics`, `keywords`, `key_concepts` for metadata filtering. Extend the tsvector trigger to incorporate `topics` and `key_concepts` into the full-text index.
- **Ingest pipeline:** Update `services/ingest.ts` to call the intelligence service; pass extracted metadata to repositories. Single LLM call per content item covers both document metadata and all its chunks.
- **Prompts:** New `core/prompts/content-intelligence.ts` with extraction prompt and Zod output schema.
- **Types:** Update `lib/db/types.ts` — add new fields to `Content` and `ContentChunk` interfaces and to `ContentToIngest`.
- **Backfill script:** `scripts/backfill-intelligence.ts` — processes all existing content records and chunks through the intelligence service; idempotent (skip if already extracted).

## Requirements

| Req | Title |
|-----|-------|
| 41 | Content metadata extraction (document-level) |
| 42 | Chunk metadata extraction (chunk_type + key_concepts) |
| 43 | DB schema extension — content columns |
| 44 | DB schema extension — content_chunks columns |
| 45 | Ingest pipeline integration |
| 46 | Enhanced tsvector (include topics + key_concepts) |
| 47 | Backfill script for existing content |

## Key acceptance criteria

- After ingestion, every new content record has `topics` (≥1 item), `keywords` (≥1 item), `language`, `content_category`, and `extraction_confidence` populated.
- Every new chunk record has `chunk_type` (one of: `framework` | `example` | `principle` | `case_study` | `tool` | `warning` | `summary` | `introduction`) and `key_concepts` (≥0 items) populated.
- GIN indexes exist on `topics`, `keywords`, `key_concepts`.
- tsvector trigger covers `body || topics || key_concepts` so keyword search benefits from the new fields without code changes in the query layer.
- Ingest uses a single LLM call per content item (document metadata + all chunk classifications in one request) to keep latency and token cost manageable.
- Backfill script is idempotent: skips records that already have `extraction_confidence IS NOT NULL`.
- All existing `npm run seed` and `npm run ingest-transcript` commands continue to work.
- `npm run lint && npm run build && npm run test:e2e` pass.

## Chunk type enum (fixed)

| Value | Meaning |
|-------|---------|
| `framework` | Describes a structured approach, model, or method |
| `example` | Concrete illustration or case |
| `principle` | Rule, guideline, or mental model |
| `case_study` | Extended real-world application |
| `tool` | Specific technique, template, or tactical action |
| `warning` | Anti-pattern, common mistake, or caveat |
| `summary` | Synthesises the broader content |
| `introduction` | Context-setting or scene-setting passage — for transcripts: ONLY host intro and sponsor reads (first 1–2 chunks) |
| `discussion` | Substantive interview dialogue that doesn't fit a more specific type; the default for mid-episode podcast Q&A |

## LLM extraction contract (Zod schema)

```typescript
// Document-level output
{
  topics: string[],              // 2–6 high-level topic tags
  keywords: string[],            // 4–10 specific terms (incl. methodologies, tools)
  author: string | null,         // name of author/speaker if detectable
  publication_date: string | null, // ISO date string if detectable, else null
  content_category: string,      // e.g. "product strategy", "user research"
  language: string,              // ISO 639-1 code, e.g. "en"
  extraction_confidence: number, // 0.0–1.0 — how complete/reliable the extraction is
  chunks: [                      // one entry per input chunk, in order
    {
      chunk_type: ChunkType,
      key_concepts: string[]     // 0–5 specific concepts mentioned in this chunk
    }
  ]
}
```

## Out of scope

- Audience-targeting fields (`target_roles`, `target_stages`, `target_experience_levels`).
- Updating the matching engine's structured fit score (no change to `services/matching.ts` scoring weights).
- Challenge test dataset and evaluation harness (→ Epic 9).
- Entity extraction, relationship extraction, knowledge graph (→ future phases per PRD).

## Dependencies

- Epic 3 (content/chunk schema), Epic 7 (hybrid RAG / tsvector). All prior epics must be complete.

## Notes

- **DB migration file:** `supabase/migrations/20260304000001_content_intelligence.sql`
- **Single LLM call per content item:** Pass title, full body, and all chunk bodies together; parse a single structured JSON response. Reduces cost vs. one call per chunk.
- **Token budget:** For long transcripts, truncate the body passed to the LLM (e.g. first 8k chars) for document metadata; pass each chunk body individually within the same batched request.
- **Implementation touchpoints:** `services/content-intelligence.ts` (new), `core/prompts/content-intelligence.ts` (new), `scripts/backfill-intelligence.ts` (new), `scripts/ingest-content-batch.ts` (new), `services/ingest.ts`, `repositories/content.ts`, `lib/db/types.ts`, Supabase migration.

## Post-implementation notes

- **Zod `.max()` on arrays causes full fallback** — the LLM occasionally returns more items than the schema allows (e.g. 11 keywords). Hard `.max()` fails the whole parse → fallback → `extraction_confidence = 0` and all chunks become `"introduction"`. Fixed by switching to `.transform(arr => arr.slice(0, N))` for graceful truncation.
- **`"introduction"` overuse** — the LLM defaults to `"introduction"` when a chunk is generic Q&A dialogue. Fixed by adding `"discussion"` as a dedicated type and tightening the prompt: `"introduction"` is now strictly limited to the first 1–2 chunks (host intro + sponsor reads). Mid-episode chunks with timestamps should never be `"introduction"`.
- **Backfill script** — idempotent by default (skips `extraction_confidence > 0`). Use `--force` to re-process all records after prompt changes: `npm run backfill-intelligence -- --force`.
- **API timeout** — the LLM call has no timeout guard; long transcripts can cause the script to hang. Two of 19 transcripts needed manual re-run. Future fix: add `AbortSignal` timeout to `ai.generateText`.
- **Content corpus:** 19 Lenny podcast transcripts ingested into `data/content_test/`. Ground truth annotations added to `data/ChallengeTestData.md` (15 challenges, 3 expected matches each) for Epic 9 eval harness.
