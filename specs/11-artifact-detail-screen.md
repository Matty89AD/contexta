# Epic 11: Artifact Detail Screen

> **Status:** 🔲 pending

Add a dedicated artifact detail page (`/artifacts/[slug]`) that gives users a deep-dive view of a recommended PM artifact. On load, two parallel async calls fire: (1) an LLM call that generates the overview description, suitability metadata, thought leaders, how-to-use steps, and a personalised "Contexta Pro-Tipp"; (2) a keyword-based RAG call that finds up to 5 unique content items mentioning the artifact (the "who talks about it" carousel). A skeleton loader is shown while data loads. Navigation back to the recommendations list is provided.

---

## Scope

- **`app/artifacts/[slug]/page.tsx`:** New Next.js App Router page. Reads `slug` from route params and `cid` (challengeId) from search params. Renders the 3-column responsive layout with skeleton states.
- **`app/api/artifacts/[slug]/detail/route.ts`:** POST handler. Receives `{ challengeSummary, challengeDomains }`. Fetches the artifact row from DB, calls LLM to generate detail content, returns structured JSON.
- **`app/api/artifacts/[slug]/knowledge/route.ts`:** GET handler. Performs tsvector keyword search using the artifact title. Deduplicates to max 5 unique content items. Returns content card data.
- **`services/artifact-detail.ts`:** Business logic for both routes. `generateArtifactDetail(artifact, challengeContext, ai)` → LLM call. `getArtifactKnowledge(artifactTitle, supabase)` → keyword RAG + deduplication.
- **`core/prompts/artifact-detail.ts`:** Prompt template + Zod output schema for the LLM detail call.
- **`repositories/artifacts.ts`:** Extend (or confirm) `getArtifactBySlug(slug)` added in Epic 10.
- **UI (inline or `components/artifacts/`):** Header section, tab navigation (Overview / How to Use), metadata cards, how-to step list, sticky sidebar, knowledge base carousel. Skeleton states for both async data sources.

---

## Requirements

| Req | Title |
|-----|-------|
| 56 | New `/artifacts/[slug]` page route |
| 57 | `POST /api/artifacts/[slug]/detail` — LLM-generated artifact detail |
| 58 | `GET /api/artifacts/[slug]/knowledge` — RAG knowledge base |
| 59 | `services/artifact-detail.ts` — business logic for both routes |
| 60 | `core/prompts/artifact-detail.ts` — Zod schema + prompt |
| 61 | Page layout: header, tabs, sidebar, knowledge carousel |
| 62 | Skeleton loading states for both async data sources |
| 63 | Back navigation to recommendations |

---

## Key acceptance criteria

- Page layout and skeleton are visible in < 1 second; LLM data populates when ready without layout shift.
- Two async calls fire in parallel on page load — neither blocks the other.
- **Overview tab** shows: artifact title, domain badge(s), description ("Über dieses Framework"), suitability card (company_stage + domain), thought-leaders card.
- **How-to-use tab** shows: 1–3 sentence intro + numbered vertical step flow (step title + explanation), 3–8 steps.
- **Sidebar** shows "Contexta Pro-Tipp" — personalised to the user's challenge when `cid` is present; generic artifact guidance as fallback when not. "Save to Playbook" button renders but is non-functional (deferred).
- **Knowledge base section** shows a horizontal scrollable carousel, max 5 cards, each with: title, speaker/author, source, duration, content type badge. Empty state rendered if no results.
- Back button labelled **"Zurück zu den Empfehlungen"** returns to the previous view.
- All Overview + How-to data comes from the LLM. Knowledge base data comes from RAG only.
- `npm run lint && npm run build && npm run test:e2e` pass.

---

## LLM output schema (Zod)

```typescript
{
  description: string,            // 3–5 sentence overview
  company_stage: string,          // e.g. "Growth / Series A-B"
  thought_leaders: string[],      // 1–4 names
  pro_tip: string,                // 2–3 sentence personalised guidance
  how_to_intro: string,           // 1–3 sentence intro for the how-to tab
  how_to_steps: Array<{
    step_title: string,
    step_detail: string           // 1–2 sentences
  }>                              // 3–8 steps
}
```

---

## Knowledge base RAG logic

- Keyword query: artifact `title` (e.g. `"RICE scoring"`) passed to `findChunksByKeyword`.
- Deduplicate: keep only the highest-scoring chunk per `content_id`; discard all other chunks for the same content item.
- Return max 5 content items with fields: `id`, `title`, `author`, `source_type`, `url`, `duration`.
- Failure is non-fatal — carousel shows an empty state on error; no page-level error.

---

## Page data flow

```
/artifacts/[slug]?cid=[challengeId]
  ├─ DB: getArtifactBySlug(slug)          ← server-side, blocks render if not found (404)
  ├─ DB: getChallengeById(cid)            ← fetch challenge summary for pro-tip (optional)
  ├─ POST /api/artifacts/[slug]/detail    ← LLM call, skeleton shown until resolved
  └─ GET  /api/artifacts/[slug]/knowledge ← RAG call, skeleton carousel until resolved
```

---

## Page layout

**Desktop** (`lg:grid-cols-3`):
- Main content: `lg:col-span-2` — header, tabs (Overview / How to Use)
- Sidebar: `lg:col-span-1` — sticky (`sticky top-6`), "Contexta Pro-Tipp"
- Knowledge base: full width below the grid

**Mobile:** stacked — main content → sidebar (inline) → knowledge base

---

## Out of scope

- "Save to Playbook" functionality (button renders, does nothing — deferred to future epic).
- Content detail screen when clicking a knowledge base card (→ future epic).
- Artifact difficulty indicator, user progress, ratings, comments (→ PRD §8 future enhancements).
- Entry points from saved recommendations or knowledge base items (→ can be wired later).

---

## Dependencies

- Epic 10 complete (`artifacts` table seeded, `ResultsStep` links to `/artifacts/[slug]?cid=`).
- Epic 7 (hybrid RAG / tsvector) for `findChunksByKeyword` used in the knowledge base route.
- Epic 8 (content intelligence) for `author`, `source_type`, `duration` fields on content cards.

---

## Notes

- **`cid` is optional:** Page must render fully without it — the pro-tip falls back to generic guidance about the artifact.
- **Reuse existing patterns:** Use the same card, badge, and tab Tailwind patterns as `ResultsStep` and `ContextStep` for visual consistency.
- **Implementation touchpoints:** `app/artifacts/[slug]/page.tsx` (new), `app/api/artifacts/[slug]/detail/route.ts` (new), `app/api/artifacts/[slug]/knowledge/route.ts` (new), `services/artifact-detail.ts` (new), `core/prompts/artifact-detail.ts` (new), `repositories/artifacts.ts` (extend).
