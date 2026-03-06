# Epic 13: Your Journey

> **Status:** ✅ done  |  **As of:** 2026-03-06

Build the `/journey` page — a personal workspace showing a user's full challenge history, key stats, and quick re-entry into active work. The page stub already exists; this epic replaces it with the full implementation.

---

## Scope

- **`app/journey/page.tsx`:** Replace stub with full page implementation (auth-guarded, redirects to `/login?next=/journey`).
- **`supabase/migrations/20260306000001_challenge_status.sql`:** Add `status` column to `challenges` table: `open | in_progress | completed | archived | abandoned` (default `open`).
- **`lib/db/types.ts`:** Add `ChallengeStatus` enum + extend `Challenge` interface with `status`.
- **`repositories/challenges.ts`:** Add `getChallengesByUserId` (already exists — confirm it returns `status`), add `getChallengeSummaryStats(userId)` for aggregated counts.
- **`app/api/journey/route.ts`:** `GET` handler — returns the current user's challenges list (ordered by `created_at` desc) and stats. Auth-required; returns 401 if unauthenticated.
- **`services/journey.ts`:** Business logic — fetches challenges, computes stats (total, active, completed).
- **`components/journey/`:** UI components for the three page sections (see layout below).
- **`app/flow/page.tsx`:** Add `?resume=[challengeId]` support — fetches challenge from DB, jumps directly to the results step (re-runs phase 2 recommendations).
- **`app/api/challenges/[id]/resume/route.ts`:** `GET` handler — returns stored challenge fields (`summary`, `problem_statement`, `desired_outcome_statement`, `domains`, `raw_description`) needed to reconstruct a `ChallengePhase1Result` on the client.
- **`components/layout/Nav.tsx`:** Add "Your Journey" link to desktop nav for authenticated users (mobile already has it).
- **Auth redirect:** After successful login, redirect to `/journey` (already partially wired in `app/journey/page.tsx` — confirm and extend to login callback).
- **Post-save redirect:** After challenge claim (`PATCH /api/challenges/[id]/claim`), redirect to `/journey` (already happens via `/journey?cid=` — confirm).

---

## Page layout

Three sections rendered top to bottom in a single-page layout (no tabs).

### Section 1 — Journey Insights (placeholder data)

Stats row (4 cards): Total Challenges, Active, Completed, Saved Artifacts — values hardcoded as `0` with a "Coming soon" label variant until real aggregation is added.

Content Type Distribution bar chart — placeholder with static data labeled as illustrative.

Top Thought Leaders strip — placeholder with 2–3 static names (Marty Cagan, Lenny Rachitsky, Teresa Torres).

> These three sub-components use placeholder data in this epic. Real aggregation is deferred.

### Section 2 — Active Challenges

Horizontally scrollable card row (or 1–3 column grid) showing challenges where `status = 'in_progress'` or `status = 'open'`.

Each card:
- Challenge title
- Short summary (`summary` field, truncated to 2 lines)
- Domain badge(s)
- Status badge
- "Continue" button → navigates to `/flow?resume=[challengeId]`

Empty state: "No active challenges yet — [Start a Challenge]" linking to `/flow`.

### Section 3 — Challenge History Table

Full table of all challenges for the user, ordered by `created_at` desc.

Columns: Title + summary, Domain, Status badge, Created date, Action chevron.

Filter: status dropdown (`All | Open | In Progress | Completed | Archived | Abandoned`). Client-side filter on the already-fetched list.

Row click → navigates to `/flow?resume=[challengeId]`.

Empty state: "You haven't submitted any challenges yet."

---

## Requirements

| Req | Title |
|-----|-------|
| 64 | DB migration: add `status` column to `challenges` |
| 65 | `ChallengeStatus` enum + `Challenge.status` in `lib/db/types.ts` |
| 66 | `GET /api/journey` — returns user's challenges + stats (auth-required) |
| 67 | `services/journey.ts` — fetches challenges, computes counts |
| 68 | `GET /api/challenges/[id]/resume` — returns stored phase-1 fields for flow re-entry |
| 69 | `/flow?resume=[id]` support — skip context+challenge steps, re-run recommendations |
| 70 | Section 1: placeholder stats + content type + thought leaders |
| 71 | Section 2: active challenges cards with "Continue" button |
| 72 | Section 3: challenge history table with status filter |
| 73 | Empty states for both Section 2 and Section 3 |
| 74 | Auth guard on `/journey` — redirect to `/login?next=/journey` if unauthenticated |
| 75 | "Your Journey" link added to desktop nav for authenticated users |

---

## Key acceptance criteria

- Unauthenticated users who visit `/journey` are redirected to `/login?next=/journey`; after login they land on `/journey`.
- After successful challenge save (claim), user ends up on `/journey`.
- Section 1 renders with clearly labeled placeholder values — no broken/empty state; "real data coming soon" is acceptable UX.
- Section 2 shows cards for challenges with `status IN (open, in_progress)`, or an empty state if none exist.
- Section 3 table renders all user challenges; status dropdown filters the visible rows client-side.
- Clicking "Continue" or a table row navigates to `/flow?resume=[id]`, which skips context and challenge steps and shows the results step directly.
- The resume flow re-runs phase 2 (recommendations) — it does NOT require phase 1 to be re-run if the challenge already has `summary`, `problem_statement`, and `desired_outcome_statement` stored.
- Desktop nav shows "Your Journey" link when user is authenticated.
- `npm run lint && npm run build && npm run test:e2e` pass.

---

## DB migration

```sql
-- 20260306000001_challenge_status.sql
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open','in_progress','completed','archived','abandoned'));
```

No data backfill needed — existing challenges default to `open`.

---

## Resume flow (flow page)

```
/flow?resume=[challengeId]
  1. FlowContent detects `resume` param on mount
  2. GET /api/challenges/[id]/resume → { id, summary, problem_statement, desired_outcome_statement, domains, raw_description }
  3. Constructs ChallengePhase1Result from stored fields
  4. Sets step = "results", fires phase 2 (/api/challenges/[id]/recommendations POST)
  5. Shows ResultsStep while recommendations load (skeleton state already exists)
```

If the resume fetch fails (e.g. 404 — challenge not owned by user), fall back to the normal `context` step start.

---

## Data flow

```
/journey (client component)
  └─ GET /api/journey  →  services/journey.ts
       └─ repositories/challenges.ts: getChallengesByUserId(userId)
            └─ Supabase: challenges WHERE user_id = auth.uid ORDER BY created_at DESC
```

Stats (total, active, completed) computed in `services/journey.ts` from the challenge list — no separate DB aggregation query needed at this stage.

---

## Out of scope

- Real aggregation for Section 1 stats, content type distribution, and thought leaders (deferred).
- Challenge status update UI — no dropdowns or modals to change status (read-only display only).
- Abandon flow with reason capture (deferred).
- Pagination for the history table (deferred).
- Sorting options beyond `created_at` desc (deferred).
- Category/artifact type/date range filters (deferred).
- "Save to Playbook" or any artifact-saving action (deferred).

---

## Dependencies

- Epic 12 complete (auth, login, profile, `/journey` stub + claim flow).
- Epic 10 complete (`artifacts` table, `ResultsStep`, recommendations pipeline).
- Epic 11 complete (`getChallengeById` used in resume route).

---

## Notes

- Reuse existing Tailwind card, badge, and button patterns from `ResultsStep`, `ContextStep`, and `app/artifacts/[slug]/page.tsx` for visual consistency.
- The `/journey` page already has the auth redirect skeleton and `cid` claim logic — keep and build on it; do not replace.
- `Nav.tsx` mobile menu already has a "Your Journey" link — only the desktop nav needs updating.
- Implementation touchpoints: `app/journey/page.tsx` (extend), `app/api/journey/route.ts` (new), `app/api/challenges/[id]/resume/route.ts` (new), `services/journey.ts` (new), `repositories/challenges.ts` (extend), `components/journey/` (new), `app/flow/page.tsx` (extend), `components/layout/Nav.tsx` (extend), `lib/db/types.ts` (extend), `supabase/migrations/20260306000001_challenge_status.sql` (new).
