# Epic 14 — Save & Revisit Challenge Results

> **Status:** ✅ done  |  **As of:** 2026-03-06

## Goal

Results are currently ephemeral: generated inside the `/flow` stepper, never explicitly saved, and lost on navigation. Challenges are auto-written to the DB the moment phase 1 starts — meaning junk/abandoned records pollute the journey. This epic makes saving intentional, moves results out of the flow into a dedicated page, and enables revisiting saved challenges without re-running the AI pipeline.

---

## Scope

1. DB migration: add `is_saved`, `saved_at`, `title`, `recommendations` to `challenges`
2. New `/results` page — transient, shown immediately after generation
3. Save button (logged-in) / "Create account to save" CTA (guest) on `/results`
4. New `/challenges/[id]` page — loads stored data, no re-generation
5. Rerun flow from a saved challenge — prefills context + challenge text, context step optional
6. Journey page — filter to `is_saved = true` only; each row links to `/challenges/[id]`
7. `PATCH /api/challenges/[id]` — save action (set is_saved, saved_at, title, recommendations)
8. Auto-generated title; inline rename on `/challenges/[id]`
9. Flow: redirect to `/results?cid=[id]` after phase 2 instead of rendering ResultsStep in-flow

---

## Out of scope

- Sharing / public URLs for challenges
- Deleting saved challenges (future)
- Storing artifact detail content (intentionally regenerated fresh — see artifact details note)

---

## Data model

### Migration `20260307000001_save_results.sql`

```sql
ALTER TABLE challenges
  ADD COLUMN is_saved     boolean      NOT NULL DEFAULT false,
  ADD COLUMN saved_at     timestamptz,
  ADD COLUMN title        text,
  ADD COLUMN recommendations jsonb;

-- Only saved challenges are indexed for journey queries
CREATE INDEX challenges_saved_user_idx
  ON challenges (user_id, saved_at DESC)
  WHERE is_saved = true;
```

### What gets stored in `recommendations` JSONB

Array of `ArtifactRecommendation` (slug, title, domains, use_case, explanation, isMostRelevant).
Artifact detail content (the "who speaks about it" / "pro-tip" sections on `/artifacts/[slug]`) is **not** stored — it is always regenerated from current DB content, as chunk associations change over time.

### Title auto-generation

On save: truncate `raw_description` to the first complete sentence or 72 chars, whichever is shorter. No LLM call. User can rename inline on the challenge page.

---

## Routes

| Route | State | Auth |
|---|---|---|
| `/flow` | unchanged entry + challenge steps; results step removed | any |
| `/results?cid=[id]` | transient post-generation; reads sessionStorage | any |
| `/challenges/[id]` | saved challenge view; loads from DB | auth required |
| `/journey` | now filters `is_saved = true` | auth required |

---

## Flow changes

### After phase 2 completes

Instead of transitioning to `ResultsStep` inside the flow:

1. Store results in `sessionStorage` under key `results:[challengeId]`:
   ```json
   { "phase1": { challengeId, summary, problemStatement, desiredOutcomeStatement },
     "recommendations": [...],
     "context": { role, company_stage, team_size, experience_level },
     "domains": ["strategy"] }
   ```
2. `router.push('/results?cid=[challengeId]')`

### `/results` page behaviour

- On mount: read `sessionStorage['results:[cid]']`. If missing → redirect to `/flow`.
- Clear sessionStorage entry after reading (one-time use).
- Render the same UI as the current ResultsStep.
- **Logged-in user**: show "Save Challenge" button (primary).
- **Guest**: show existing "Create account to save" CTA (already designed).
- Clicking "Save":
  1. `PATCH /api/challenges/[cid]` with `{ is_saved: true, recommendations, title }`
  2. On success → `router.push('/challenges/[cid]')`

### Context step — optional for logged-in users

When a logged-in user starts the flow (fresh or rerun), the context step shows pre-filled values from their profile (role, company_stage, team_size, experience_level). A "Skip" button lets them proceed without changing anything. Context is still submitted to phase 1 (from profile data if skipped).

For rerun specifically: the `/flow?rerun=[id]` URL causes:
- Context step: pre-filled from profile (skippable)
- Challenge step: pre-filled with `raw_description` from the saved challenge
- User edits freely, then submits → creates a **new** challenge record

---

## API

### `PATCH /api/challenges/[id]`

**Auth**: required (challenge must belong to the requesting user).

**Body**:
```json
{
  "is_saved": true,
  "title": "Improving cross-functional alignment in a Series B...",
  "recommendations": [...]
}
```

**Service** (`services/challenge.ts`): new `saveChallenge(supabase, id, userId, payload)` — validates ownership, updates `is_saved`, `saved_at`, `title`, `recommendations`.

**Repository** (`repositories/challenges.ts`): new `saveChallenge(supabase, id, fields)`.

### `GET /api/challenges/[id]`

**Auth**: required. Returns full challenge including `recommendations` JSONB.
Used by `/challenges/[id]` page.

### Existing `GET /api/journey`

Add `WHERE is_saved = true` filter to the challenges query.

---

## `/challenges/[id]` page

- Server component (or client with auth check). Redirect to `/login` if not authenticated.
- Load challenge + recommendations from DB via `GET /api/challenges/[id]`.
- Render same layout as ResultsStep (challenge summary card + artifact recommendation cards).
- **Rerun button**: navigates to `/flow?rerun=[id]`. Visible only to owner.
- **Rename**: inline edit on the title (click-to-edit, `PATCH` on blur/enter). Optimistic update.
- No "Save" button (already saved).

---

## Journey page changes

- Filter to `is_saved = true` — drop unsaved/abandoned records from all queries.
- Each row in `ChallengeHistoryTable` links to `/challenges/[id]` instead of... nothing (currently no link exists).
- Stats (total, active, completed) recalculated against saved challenges only.
- "Active Challenges" section: only saved challenges with `status = open | in_progress`.

---

## Artifact detail pages (unchanged)

`/artifacts/[slug]?cid=[id]` continues to regenerate "who speaks about it" and "pro-tip" from current DB state on every load. This is intentional — content items are updated frequently and fresh context provides ongoing value.

---

## Acceptance criteria

- [ ] Guest completes flow → lands on `/results` → can click "Create account to save"
- [ ] Logged-in user completes flow → lands on `/results` → "Save Challenge" button visible
- [ ] Clicking Save → challenge persisted with recommendations → redirect to `/challenges/[id]`
- [ ] `/challenges/[id]` loads stored recommendations without any LLM call
- [ ] "Rerun" on `/challenges/[id]` → `/flow?rerun=[id]` → challenge text prefilled, context prefilled from profile
- [ ] Rerun submits → new challenge record created (original unchanged)
- [ ] Journey only shows saved challenges; each row links to `/challenges/[id]`
- [ ] Unsaved challenges (abandoned flows) do NOT appear in journey
- [ ] Title auto-generated on save; user can rename inline
- [ ] `/results` without valid sessionStorage → redirects to `/flow`
- [ ] Artifact detail pages continue to work (no regression)
- [ ] `npm run lint && npm run build && npm run test:e2e` pass

---

## Implementation order

1. DB migration
2. Repository + service methods (`saveChallenge`, `getChallengeWithRecommendations`)
3. `PATCH /api/challenges/[id]` + `GET /api/challenges/[id]`
4. Update journey API (`is_saved` filter)
5. `/results` page (move ResultsStep out of flow)
6. Flow redirect after phase 2
7. Context step "Skip" for logged-in users + `?rerun` prefill
8. `/challenges/[id]` page
9. Journey table row links + stat recalculation
10. E2E tests
