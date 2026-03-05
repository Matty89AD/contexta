# Epic 10: Artifact-Optimized Recommendations

> **Status:** ✅ done  |  **As of:** 2026-03-05

Change the recommendations pipeline to surface PM **artifacts** (frameworks and methodologies like RICE, OST, JTBD) instead of raw content items. The matching engine continues to use hybrid RAG to retrieve top-k chunks, but the LLM step now maps those chunks against a curated list of known artifacts and returns the 3–5 most relevant artifacts for the user's challenge. The Results screen is updated to display artifact cards (title, domain badge(s), use-case), each linking to the new artifact detail page (Epic 11).

---

## Scope

- **DB — `artifacts` table:** New table with `id`, `slug`, `title`, `domains`, `use_case`. New Supabase migration. A seed script populates the initial set of known PM artifacts.
- **`repositories/artifacts.ts`:** New repository — `listArtifacts()` (returns full list for use in the recommendations prompt), `getArtifactBySlug(slug)` (returns one row or null).
- **`core/prompts/recommendations.ts`:** Update prompt to accept the known-artifacts list + top-k chunk bodies and output 3–5 matched artifacts (by slug) with explanation. Update `recommendationsOutputSchema` Zod schema to match the new output shape.
- **`services/challenge.ts`:** `runChallengePipeline` fetches the artifact list from the repository and passes it to the updated recommendations prompt. `ChallengeResult.recommendations` changes to `ArtifactRecommendation[]`.
- **`lib/db/types.ts`:** Add `Artifact` interface and `ArtifactRecommendation` type.
- **`components/flow/ResultsStep.tsx`:** Render artifact cards (title, domain badge(s), use_case). The "Open" action navigates internally to `/artifacts/[slug]?cid=[challengeId]` (not `window.open`).
- **Seed data:** `scripts/seed-artifacts.ts` — inserts the PM artifact list provided by the user. Idempotent (`ON CONFLICT (slug) DO NOTHING`).

---

## Requirements

| Req | Title |
|-----|-------|
| 50 | New `artifacts` DB table and migration |
| 51 | Seed script for known PM artifacts |
| 52 | `repositories/artifacts.ts` — `listArtifacts` + `getArtifactBySlug` |
| 53 | Recommendations prompt and Zod schema updated for artifact output |
| 54 | `runChallengePipeline` returns `ArtifactRecommendation[]` |
| 55 | `ResultsStep` renders artifact cards linking to detail page |

---

## Key acceptance criteria

- `artifacts` table exists and is seeded; each row has `id`, `slug` (URL-safe, unique), `title`, `domains[]`, `use_case`.
- After submitting a challenge, `ChallengeResult.recommendations` contains 3–5 `ArtifactRecommendation` objects — the LLM only picks from the seeded list (no invented artifact names).
- `ResultsStep` shows one card per artifact: title, domain badge(s), use_case. Clicking navigates to `/artifacts/[slug]?cid=[challengeId]`.
- Existing `ResultsStep` layout (challenge summary card, create-account card) is preserved.
- `npm run lint && npm run build && npm run test:e2e` pass.

---

## `ArtifactRecommendation` type

```typescript
export interface ArtifactRecommendation {
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  explanation: string;       // 1–2 sentences on why this artifact fits the challenge
  isMostRelevant: boolean;
}
```

---

## Recommendations prompt changes (summary)

**Current:** receives chunks `(contentId, title, body)` → outputs `content_id`-based recommendations.

**New:** receives:
1. Structured challenge summary + problem statement
2. Top-k chunk bodies as context (no contentId exposed to the LLM)
3. Known artifact list `(slug, title, domains, use_case)`

Outputs 3–5 artifacts by slug with a 1–2 sentence explanation of why each artifact helps with the specific challenge. The LLM must only reference slugs from the provided list.

---

## DB migration

File: `supabase/migrations/20260305000001_artifacts.sql`

```sql
CREATE TABLE artifacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  domains      text[] NOT NULL DEFAULT '{}',
  use_case     text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_domains ON artifacts USING GIN (domains);
```

---

## Out of scope

- Artifact detail page and LLM-generated detail content (→ Epic 11).
- "Save to Playbook" CTA (→ future epic).
- Changes to `services/matching.ts` — hybrid RAG retrieval remains chunk-based; only the LLM post-processing layer changes.
- Navigation to the detail page from saved recommendations or knowledge base (→ Epic 11 entry points can be extended later).

---

## Dependencies

- Epics 1–9 complete.
- User provides the artifact seed list before implementation begins.

---

## Notes

- **Seed command:** Add `"seed-artifacts": "tsx scripts/seed-artifacts.ts"` to `package.json` scripts.
- `challengeId` is already returned in `ChallengeResult` — pass it as `?cid=` query param on navigation.
- **Implementation touchpoints:** `supabase/migrations/20260305000001_artifacts.sql`, `scripts/seed-artifacts.ts` (new), `repositories/artifacts.ts` (new), `core/prompts/recommendations.ts`, `services/challenge.ts`, `lib/db/types.ts`, `components/flow/ResultsStep.tsx`.
