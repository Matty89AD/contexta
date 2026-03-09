# Epic 18 — Content Card Enrichment: Summary Overlay + View Tracking

> **Status:** ✅ done  |  **As of:** 2026-03-09

## Goal

When a user views an artifact detail page, clicking a knowledge card opens an overlay with a generated summary, key metadata, and topics. Authenticated users have their view history tracked and surfaced on cards and in the overlay.

## Out of Scope

- Summary generation for existing content (user will backfill manually)
- View history page or analytics dashboard
- Anonymous view tracking

---

## 1. DB Migrations

### Migration A — Add `summary` to content

```sql
ALTER TABLE content ADD COLUMN summary text;
```

### Migration B — Create `user_content_views`

```sql
CREATE TABLE user_content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  view_count int NOT NULL DEFAULT 1,
  UNIQUE(user_id, content_id)
);

ALTER TABLE user_content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own views"
  ON user_content_views
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 2. Summary Generation

### Prompt (`core/prompts/content-summary.ts`)

- Input: `title`, `source_type`, `author`, selected chunk bodies
- Output: `{ summary: string }` — Zod schema, 2–4 sentences
- Tone: concise, professional, third-person

### Chunk selection strategy

1. Prefer chunks where `chunk_type = 'summary'` — use all of them
2. Fallback: first 2 chunks (intro) + last 2 chunks (conclusion)
3. If no chunks available (manual ingest without transcript): synthesize from `title + topics + keywords`

### Service integration (`services/ingest.ts`)

- Extend `ingestContent()`: after embedding + intelligence pass, run summary generation using chunk selection strategy above; store result in `content.summary`
- Also extend `processContentById()` to regenerate summary on reprocess
- Non-fatal — ingest succeeds even if summary generation fails; `summary` remains null

---

## 3. Type Changes (`lib/db/types.ts`)

### Extend `Content` interface

```ts
export interface Content {
  // ... existing fields ...
  summary: string | null; // new
}
```

### Extend `KnowledgeCard` interface

```ts
export interface KnowledgeCard {
  id: string;
  title: string;
  author: string | null;
  source_type: ContentSourceType;
  url: string | null;
  // new fields:
  topics: string[];
  keywords: string[];
  domains: ChallengeDomain[];
  publication_date: string | null;
  summary: string | null;
  extraction_confidence: number | null;
}
```

### New `ContentView` interface

```ts
export interface ContentView {
  id: string;
  user_id: string;
  content_id: string;
  first_viewed_at: string;
  last_viewed_at: string;
  view_count: number;
}
```

---

## 4. Repositories

### `repositories/content.ts` — additions

- `updateContentSummary(id: string, summary: string): Promise<void>` — used by ingest

### `repositories/content-views.ts` — new file

- `upsertView(userId: string, contentId: string): Promise<ContentView>` — insert or increment `view_count`, update `last_viewed_at`
- `getView(userId: string, contentId: string): Promise<ContentView | null>`
- `getViewsForContents(userId: string, contentIds: string[]): Promise<ContentView[]>` — batch fetch, used to hydrate all cards at once on page load

---

## 5. Service Changes

### `services/artifact-detail.ts`

- Update `getArtifactKnowledge()` to return the full `KnowledgeCard` shape (join additional fields from content table: `topics`, `keywords`, `domains`, `publication_date`, `summary`, `extraction_confidence`)

---

## 6. API Routes

### `GET /api/content/[id]`

Returns full content metadata for the overlay. Calls `getContentById()`.

Response:
```ts
{
  id, title, author, source_type, url,
  publication_date, domains, topics, keywords,
  summary, extraction_confidence
}
```

### `POST /api/content/[id]/view`

Records a view for the authenticated user. Requires auth — returns 401 if not authenticated (silent fail on client). Calls `upsertView()`.

Response: `{ ok: true }`

### `GET /api/content/[id]/view`

Returns view status for the authenticated user. Returns 401 if not authenticated.

Response:
```ts
{
  viewed: boolean;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number | null;
}
```

---

## 7. UI Changes

### `KnowledgeCard` (in `ArtifactDetailClient.tsx`)

- Add `cursor-pointer`, hover ring, and a small info icon (or subtle label) to indicate the card is clickable
- View status indicator: if viewed → small filled dot + `"Viewed"` label in muted style, positioned bottom-left of card; if not viewed → no indicator (keep cards clean)
- On click → open `ContentOverlay` with the card's content id

### View status hydration

On knowledge cards load (after `fetchKnowledge` resolves), if user is authenticated: batch-fetch view status for all returned content IDs via `GET /api/content/[id]/view` (one request per card, run in parallel). Store results in component state. Re-hydrate after overlay fires a view.

### `ContentOverlay` — new component (`components/artifacts/ContentOverlay.tsx`)

Centered modal, dismissible by clicking the backdrop or pressing Escape.

**Header**
- Source type badge (podcast / video / website / book)
- Title (large, wraps)
- Author · Publication date (if available)
- Estimated read/listen time — derived from transcript word count: video/podcast use 130 wpm, website/book use 200 wpm; shown as "~N min read" or "~N min listen"; omit if no transcript

**Body**
- Summary paragraph — skeleton loader while fetching; graceful placeholder `"No summary available"` if null
- Topics — pill list (`content.topics`)
- Keywords — secondary pill list (`content.keywords`)
- Domain badges (`content.domains`)

**Footer**
- View status line (auth only): `"First seen [date]  ·  Viewed [N] times"` — hidden for unauthenticated users
- CTA button: `"Open [source type]"` → opens `content.url` in new tab; disabled + tooltip `"No link available"` if url is null

**On overlay open**
- Fire `POST /api/content/[id]/view` (auth only, silent fail)
- Update local view state for the corresponding card

---

## 8. Acceptance Criteria

- [ ] `content.summary` column exists; new ingests populate it via smart chunk selection
- [ ] `processContentById()` regenerates summary on reprocess
- [ ] Clicking a knowledge card opens the overlay with summary, topics, keywords, and metadata
- [ ] If summary is null, overlay shows `"No summary available"` gracefully
- [ ] Overlay is dismissible via backdrop click or Escape key
- [ ] Authenticated users: view is recorded on overlay open; view badge appears on card after first open
- [ ] View status is shared across artifact pages for the same content item
- [ ] Unauthenticated users: overlay works fully, no view tracking, no view status shown
- [ ] Est. read/listen time shown when transcript data is available
- [ ] `npm run lint && npm run build && npm run test:e2e` pass
