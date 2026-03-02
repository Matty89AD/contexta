# Epic 6: Multi-domain and matching

Challenges and content (especially podcasts) often span multiple domains; a single `primary_domain` is limiting. Over-relying on domain match is risky—users can pick the wrong domain, and suitable advice can be missed when content is tagged with a different domain. This epic adds multi-domain modeling and makes matching safer by treating domain as a soft signal rather than a hard filter.

## Scope

- **Schema (Challenge):** Support multiple domains per challenge (array or primary + secondary); update Challenge_Processor / extraction to populate; update UI (e.g. multi-select in ChallengeStep) so users can select one or more domains.
- **Schema (Content):** Support multiple domains per content piece (array or primary + secondary); update Content_Indexer and ingest (ingest-transcript, ingest service) to accept and store multiple domains.
- **Matching_Engine:** Remove the hard filter that drops all candidates without a domain match when any match exists; rank all embedding candidates; treat domain as a soft signal (overlap = boost) or explainability-only; keep or lower `STRUCTURED_FIT_WEIGHT` so semantic relevance dominates.

## Requirements (from spec)

| Req | Title |
|-----|--------|
| R1 | Multi-domain Challenge schema (store and use list of domains) |
| R2 | Multi-domain Content schema (store and use list of domains) |
| R3 | Matching ranks all semantic candidates; no exclusion by domain |
| R4 | Domain used as soft score (overlap) or for explainability only; configurable weight |

## Key acceptance criteria (summary)

- **Challenge:** At least one domain required; multiple domains supported (UI multi-select or similar); API and DB store array (or primary + secondary_domains). Challenge_Processor / summary step can populate from user selection or LLM extraction.
- **Content:** Ingest and API accept multiple domains; DB stores array (or primary + secondary_domains); existing content can be migrated or defaulted (e.g. `primary_domain` → `domains = ARRAY[primary_domain]`).
- **Matching:** All candidates from vector search participate in ranking; domain overlap (if any) contributes a small bonus or only to `matchReason`; no step that removes candidates solely because of domain mismatch. Structured fit score reflects overlap (e.g. any challenge-domain in content-domains = structured fit) when used.
- **Config:** `STRUCTURED_FIT_WEIGHT` remains configurable; default remains low (e.g. 0.2 or 0.3) so semantic similarity dominates.

## Out of scope for this epic

- Chunk-level domain (e.g. per-chunk domain on `content_chunks`); can be a later extension.
- Full taxonomy beyond domain (e.g. capability_tag, company_stage) multi-value changes; only domain in this epic.

## Dependencies

- Epic 3 (schemas, embeddings), Epic 4 (matching engine). This epic refines both.

## Notes

- **DB:** Add `domains challenge_domain[]` (or `primary_domain` + `secondary_domains`) to `challenges` and `content`; migration for existing rows (e.g. `primary_domain` → `domains = ARRAY[primary_domain]` or keep backward compatibility during transition).
- **Backward compatibility:** If keeping `primary_domain` on content for a transition, matching can treat "any overlap of challenge domains with content domains" as structured fit; remove the hard filter in the matching service so all semantic candidates are ranked.
- **Implementation touchpoints:** DB migrations, lib/db/types, content and challenge repositories/APIs, services/matching, services/challenge, services/ingest, ingest scripts, ChallengeStep UI.
