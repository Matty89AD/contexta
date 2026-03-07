# Epic 15: Artifact Vault

> **Status:** ✅ done  |  **As of:** 2026-03-08

## Goal
Allow users to manually save artifacts to a personal vault from the artifact detail screen, then view and access those artifacts from a new "My Artifacts Vault" tab on the Journey page.

---

## Scope

**In scope:**
- New DB table `user_saved_artifacts`
- New API routes: `POST /api/artifacts/[slug]/save`, `DELETE /api/artifacts/[slug]/save`, `GET /api/artifacts/[slug]/save`
- Rename "Save to Playbook" → "Add to Artifact Vault" and make it functional (toggle save/unsave)
- New "My Artifacts Vault" tab on `/journey` (sub-navigation alongside existing "Challenges & Progress")
- Vault tab: card grid of saved artifacts, click → `/artifacts/[slug]`
- Fix "Saved Artifacts" stat card to show real count
- Extend `/api/journey` to return saved artifacts + count

**Out of scope:**
- Progress bars, download PDF, author/type metadata
- "Find More" / external artifact browsing
- Any artifact discovery beyond what's already in the system

---

## DB Migration (`20260308000001_artifact_vault.sql`)

```sql
CREATE TABLE IF NOT EXISTS user_saved_artifacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_slug text NOT NULL REFERENCES artifacts(slug) ON DELETE CASCADE,
  saved_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artifact_slug)
);

ALTER TABLE user_saved_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved artifacts"
  ON user_saved_artifacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Repository (`repositories/saved-artifacts.ts`)

- `saveArtifact(supabase, userId, slug)` — upsert (ignore conflict)
- `unsaveArtifact(supabase, userId, slug)` — delete row
- `isArtifactSaved(supabase, userId, slug)` → `boolean`
- `getSavedArtifacts(supabase, userId)` → `SavedArtifact[]` (join with `artifacts` table for `title`, `domains`, `use_case`; include `saved_at`)

New type in `lib/db/types.ts`:
```ts
export interface SavedArtifact {
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  saved_at: string;
}
```

---

## API Routes

### `POST /api/artifacts/[slug]/save`
- Auth required (401 if not)
- Call `saveArtifact(supabase, userId, slug)` → 200 `{ saved: true }`

### `DELETE /api/artifacts/[slug]/save`
- Auth required (401 if not)
- Call `unsaveArtifact(supabase, userId, slug)` → 200 `{ saved: false }`

### `GET /api/artifacts/[slug]/save`
- Auth required (401 if not)
- Returns `{ saved: boolean }` — used by detail page to hydrate button state on mount

---

## `ArtifactDetailClient.tsx` changes

1. On mount, `GET /api/artifacts/[slug]/save` to check current saved state. If unauthenticated (401), leave button disabled — no error shown.
2. Rename button label:
   - Not saved: "Add to Artifact Vault"
   - Saved: "Saved to Vault" (clicking again unsaves)
3. Remove `disabled` attribute; enable toggle via `POST` / `DELETE` on click.
4. Show a brief loading state (spinner or opacity) during the toggle request.

---

## `services/journey.ts` changes

Extend `JourneyStats` and `JourneyData`:

```ts
export interface JourneyStats {
  total: number;
  active: number;
  completed: number;
  savedArtifacts: number;
}

export interface JourneyData {
  challenges: Challenge[];
  stats: JourneyStats;
  savedArtifacts: SavedArtifact[];
}
```

`getJourneyData` fetches challenges and saved artifacts in parallel:
```ts
const [challenges, savedArtifacts] = await Promise.all([
  challengesRepo.getSavedChallengesByUserId(supabase, userId),
  savedArtifactsRepo.getSavedArtifacts(supabase, userId),
]);
```

---

## Journey page changes

### `app/journey/page.tsx`
- Thread `savedArtifacts` from API response into components.

### `JourneyInsights.tsx`
- Remove "Real data coming soon" disclaimer from stat cards.
- "Saved Artifacts" stat reads from `stats.savedArtifacts` (real count).

### Sub-navigation tabs (in `app/journey/page.tsx` or a thin wrapper)
- Two tabs below the page header:
  - **Challenges & Progress** (default active)
  - **My Artifacts Vault** — with count badge showing `savedArtifacts.length`
- Challenges tab renders existing `ActiveChallenges` + `ChallengeHistoryTable`.
- Vault tab renders new `ArtifactVault` component.

### New `components/journey/ArtifactVault.tsx`
- Props: `artifacts: SavedArtifact[]`
- Empty state: "No artifacts saved yet. Open any artifact and tap 'Add to Artifact Vault'." with a link to `/flow`.
- Card grid (match existing card style in the codebase — white bg, zinc border, rounded-2xl):
  - Title, domain badge(s), `use_case` as subtitle, `saved_at` date
  - Entire card is a `Link` to `/artifacts/[slug]`
- No star, no download, no extra action buttons.

---

## Acceptance Criteria

1. "Save to Playbook" is renamed "Add to Artifact Vault" on the artifact detail screen.
2. Clicking it saves the artifact; label changes to "Saved to Vault" and clicking again unsaves.
3. Saved artifacts appear in the "My Artifacts Vault" tab on `/journey`.
4. The Vault tab count badge reflects the real number of saved artifacts.
5. "Saved Artifacts" stat card shows the real number (from DB).
6. Clicking a vault card opens the correct `/artifacts/[slug]` page.
7. Unauthenticated users see the button disabled (no 401 error surfaced in UI).
8. E2E tests cover: save from detail page → verify appears in vault → unsave → verify removed.
