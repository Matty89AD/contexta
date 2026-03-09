# Epic 19 — Smart Artifact Detection + News Proposal Pipeline

> **Status:** 🔲 planned

## Goal

Extend the ingestion pipeline with two automated intelligence layers:

1. **Artifact detection** — after a content piece is ingested (Run Ingestion), the system scans the chunks for PM artifacts/frameworks not yet in the knowledge base, creates draft `artifacts` records (fully pre-filled by LLM), and notifies the admin.
2. **News proposal generation** — whenever a content piece or an artifact transitions to `status = 'active'`, the system auto-generates a `news_posts` draft and notifies the admin via the bell icon.

**Q33 resolved:** Detection runs automatically during "Run Ingestion" (option b). Chunk content is available at that point, giving the LLM maximum context for accurate detection. A "Re-detect artifacts" button is also exposed on the content edit page for reprocessing.

---

## Out of scope

- Batch back-filling artifact detection on already-ingested content (admin can trigger per-item via "Re-detect" button)
- Automatically publishing news proposals (always requires admin review)
- User-facing artifact discovery or browsing beyond the existing artifact detail page
- Bulk status changes on artifacts
- Email / push / webhook notifications

---

## DB migrations

### Migration 1 — Extend `artifacts` table

```sql
ALTER TABLE artifacts
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'pending_review', 'active', 'archived')),
  ADD COLUMN is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN source_content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  ADD COLUMN possible_duplicate_of text REFERENCES artifacts(slug) ON DELETE SET NULL;

-- Existing seeded artifacts are already active
CREATE INDEX idx_artifacts_status ON artifacts (status);
```

Status semantics for artifacts:
- `draft` — AI-generated, not yet reviewed by admin
- `pending_review` — admin has made partial edits; awaiting final sign-off
- `active` — published and returned in recommendations / artifact detail
- `archived` — removed from active use

### Migration 2 — Extend `news_posts` table

```sql
ALTER TABLE news_posts
  ADD COLUMN is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN source_type text CHECK (source_type IN ('content', 'artifact')),
  ADD COLUMN source_id uuid;
```

### Migration 3 — `admin_notifications` table

```sql
CREATE TABLE admin_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL CHECK (type IN (
               'artifact_detected',
               'news_proposal_generated'
             )),
  title      text NOT NULL,
  body       text,
  link_url   text,         -- e.g. /admin/artifacts/[id] or /admin/news/[id]
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notifications_is_read ON admin_notifications (is_read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications (created_at DESC);

-- RLS: only admins can access
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_notifications"
  ON admin_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

## Architecture

### New files

```
services/artifact-detection.ts          # detect + deduplicate + insert draft artifacts
services/news-proposal.ts               # generate + insert news post drafts
core/prompts/artifact-detection.ts      # prompt + Zod schema for artifact extraction
core/prompts/news-proposal.ts           # prompt + Zod schema for news post drafts
repositories/admin-notifications.ts     # CRUD for admin_notifications
app/api/admin/artifacts/route.ts        # GET (list), POST (manual create)
app/api/admin/artifacts/[id]/route.ts   # GET, PATCH, DELETE
app/api/admin/artifacts/[id]/detect/route.ts  # POST — re-run detection for a content item
app/api/admin/notifications/route.ts    # GET (list unread + recent), PATCH (mark read)
components/admin/ArtifactList.tsx
components/admin/ArtifactEditor.tsx
```

### Modified files

```
services/ingest.ts                      # call detectArtifactsFromContent() after ingestion
app/api/admin/content/[id]/process/route.ts  # ditto (processContentById path)
app/api/admin/content/[id]/route.ts     # PATCH: trigger news proposal on status → active
app/api/admin/artifacts/[id]/route.ts   # PATCH: trigger news proposal on status → active
components/admin/NotificationBell.tsx   # subscribe to admin_notifications + existing transcript_jobs
components/admin/AdminLayout.tsx        # add "Artifacts" nav item
repositories/admin.ts                   # add artifact counts to getStats()
lib/db/types.ts                         # new types
```

---

## Service: `services/artifact-detection.ts`

### `detectArtifactsFromContent(contentId, ai, supabase)`

1. Load content chunks from DB (`getChunksByContentId`).
2. Load existing artifact titles/slugs from DB (`listArtifacts`).
3. Build prompt: pass chunk bodies (concatenated, max ~12K tokens) + existing artifact titles list.
4. LLM returns `DetectedArtifact[]` (see prompt schema below).
5. For each returned artifact:
   - If `is_duplicate = true` or `possible_duplicate_of` is set → insert with `status = 'draft'` and `possible_duplicate_of` slug populated.
   - If genuinely new → insert with `status = 'draft'`, `is_ai_generated = true`, `source_content_id = contentId`.
   - Skip silently if an artifact with the same slug already exists (`ON CONFLICT DO NOTHING`).
6. For each inserted artifact → call `createNotification('artifact_detected', { title, id })`.
7. Return count of newly inserted artifacts (non-fatal — ingest succeeds even if detection fails).

### `createNotification(type, data, supabase)`

Inserts a row into `admin_notifications`. Called by both `artifact-detection.ts` and `news-proposal.ts`.

---

## Prompt: `core/prompts/artifact-detection.ts`

**Input context:**
- `existing_artifact_titles: string[]` — full list of existing artifact titles in the DB
- `chunks: string` — concatenated chunk bodies from the content piece
- `content_title: string`
- `content_source_type: string`

**LLM instruction (summary):** Identify all distinct PM artifacts, frameworks, methodologies, or tools mentioned or explained in depth in this content. For each, determine if it is already in the existing list (fuzzy match on meaning, not just exact text). Return only genuinely new ones plus borderline cases flagged as possible duplicates.

**Zod output schema:**

```typescript
z.object({
  artifacts: z.array(z.object({
    title: z.string(),                   // canonical name, e.g. "RICE Scoring"
    slug: z.string(),                    // kebab-case, e.g. "rice-scoring"
    domains: z.array(z.enum([            // one or more
      'strategy','discovery','delivery','growth','leadership'
    ])).min(1).max(3),
    use_case: z.string(),                // 1–2 sentences: what it is and when to use it
    description: z.string(),            // 3–5 sentence overview (stored in detail.description)
    how_to_intro: z.string(),            // 1–2 sentence intro for how-to tab
    how_to_steps: z.array(z.object({
      step_title: z.string(),
      step_detail: z.string(),           // 1–2 sentences
    })).min(3).max(8),
    is_possible_duplicate: z.boolean().default(false),
    possible_duplicate_of: z.string().nullable().default(null),  // slug of existing artifact
  }))
})
```

---

## Service: `services/news-proposal.ts`

### `generateNewsProposal(source, ai, supabase)`

**`source`** is:
```ts
interface ProposalSource {
  type: 'content' | 'artifact';
  id: string;
  title: string;
  author?: string | null;
  source_type?: ContentSourceType;  // for content items
  domains?: string[];
  use_case?: string;                 // for artifacts
}
```

1. Build prompt with source metadata.
2. LLM returns `{ type, title, description, published_date }`.
3. Map `source.source_type` to `news_posts.type`:
   - `podcast` → `'podcast'`
   - `video` / `website` / `book` → `'article'`
   - artifact → `'artifact'`
4. Insert into `news_posts` with `status = 'draft'`, `is_ai_generated = true`, `source_type`, `source_id`.
5. Call `createNotification('news_proposal_generated', { title, newsPostId })`.
6. Non-fatal — activation succeeds even if proposal generation fails.

### Trigger points

Both routes call `generateNewsProposal()` when they detect `status` transitioning to `'active'`:

- `PATCH /api/admin/content/[id]` — checks `body.status === 'active'` and previous status was not `'active'`
- `PATCH /api/admin/artifacts/[id]` — same check

Every activation triggers a new proposal (per Q39 decision — even re-activations).

---

## Prompt: `core/prompts/news-proposal.ts`

**Input context:** item type (content or artifact), title, author, domains, use_case/description, source_type.

**LLM instruction (summary):** Write a short, engaging news card for the Contexta Journey feed announcing this new [framework / episode / article]. Match the tone of existing news posts.

**Zod output schema:**

```typescript
z.object({
  type: z.enum(['podcast', 'artifact', 'article']),
  title: z.string().max(80),
  description: z.string().max(200),  // 1–2 sentences
  published_date: z.string(),        // display string, e.g. "Mar 2026"
})
```

---

## Repository: `repositories/admin-notifications.ts`

- `createNotification(data)` — insert row
- `listUnreadNotifications()` → `AdminNotification[]` (all `is_read = false`, ordered by `created_at DESC`, max 50)
- `markAllRead()` — `UPDATE SET is_read = true WHERE is_read = false`
- `markRead(id)` — single row

---

## Repository: `repositories/artifacts.ts` additions

- `listArtifactsAdmin(filters, page)` — all artifacts with status filter, paginated (50/page)
- `getArtifactById(id)` — single artifact by id (for admin edit)
- `createArtifact(data)` — insert
- `updateArtifact(id, data)` — partial update
- `deleteArtifact(id)` — hard delete; guard: reject if `status = 'active'`
- `getArtifactTitlesAndSlugs()` — lightweight query returning `{ title, slug }[]` for dedup prompt

---

## API routes

### Artifacts

```
GET  /api/admin/artifacts                  → paginated list (filters: status, domain, q, is_ai_generated)
GET  /api/admin/artifacts/[id]             → single artifact
PATCH /api/admin/artifacts/[id]            → update fields + status; triggers news proposal on → active
DELETE /api/admin/artifacts/[id]           → hard delete (guard active)
POST /api/admin/artifacts/[id]/detect      → re-run artifact detection from source_content_id
```

All routes require `is_admin = true`; return 403 otherwise.

### Notifications

```
GET   /api/admin/notifications             → unread + recent (max 50), ordered newest first
PATCH /api/admin/notifications             → mark all as read
PATCH /api/admin/notifications/[id]        → mark single as read
```

---

## Admin UI

### Sidebar nav update

Add **"Artifacts"** between "Content" and "News" in the admin sidebar.

### `/admin/artifacts` — Artifact list

- Table columns: Title, Domains, Status, Source, Created at, Actions
- "Source" column: badge — "AI detected" (is_ai_generated = true) or "Manual"
- Duplicate warning: if `possible_duplicate_of` is set, show a yellow ⚠ icon; tooltip shows the conflicting artifact slug
- Filter bar: status tabs (All / Draft / Pending review / Active / Archived), domain dropdown, "AI only" toggle
- Search: title filter (client-side)
- Row actions: Edit, Change status (inline dropdown), Delete (with confirmation; only draft/archived allowed)
- "New artifact" button → `/admin/artifacts/new` (manual creation; pre-fills an empty form)

### `/admin/artifacts/[id]` — Artifact editor

**Editable fields:**

| Field | Notes |
|---|---|
| Title | Text input |
| Slug | Text input (auto-derived on create; editable) |
| Domains | Multi-select (ChallengeDomain enum) |
| Use case | Textarea (1–2 sentences) |
| Description | Textarea (3–5 sentences; stored in `detail.description`) |
| How-to intro | Textarea (stored in `detail.how_to_intro`) |
| How-to steps | Repeatable field list: step_title + step_detail (stored in `detail.how_to_steps`) |
| Status | Select: draft / pending_review / active / archived |

**Read-only info panel:**
- Source: "AI detected" / "Manual"
- Source content link (if `source_content_id` set): "Detected from: [content title]" → `/admin/content/[id]`
- Possible duplicate warning: if `possible_duplicate_of` set, banner: "Possible duplicate of [slug] — review before activating" with link to that artifact

**Actions:**
- Save
- Delete (with confirmation; guard active)

### `/admin/news` — AI draft badge

- AI-generated proposals get an "AI draft" badge (purple pill) in the Title column
- No separate page or tab — they appear inline with manually created drafts
- The "AI draft" badge is cosmetic only; editing and publishing work identically

### Dashboard (`/admin`) — stats update

Add to the stats page:
- Total artifacts / broken down by status (draft, pending_review, active, archived)
- Unread notification count

### `NotificationBell` — extension

Existing bell subscribes to `transcript_jobs` (Epic 17). Extend to also:
1. On mount: `GET /api/admin/notifications` → show combined unread count (transcript jobs in-progress + unread admin_notifications)
2. Subscribe to Supabase Realtime on `admin_notifications` table
3. On new `artifact_detected` row: show toast "New artifact detected: [title]" with link to `/admin/artifacts/[id]`; increment badge
4. On new `news_proposal_generated` row: show toast "News draft ready: [title]" with link to `/admin/news/[id]`; increment badge
5. Bell dropdown: show transcript job items (existing) + new notification rows together, newest first
6. "Mark all read" action in the dropdown header

---

## Types (`lib/db/types.ts` additions)

```ts
export const ARTIFACT_STATUSES = ['draft', 'pending_review', 'active', 'archived'] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export interface Artifact {
  id: string;
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  detail: Record<string, unknown> | null;
  status: ArtifactStatus;                      // new
  is_ai_generated: boolean;                    // new
  source_content_id: string | null;            // new
  possible_duplicate_of: string | null;        // new
  created_at: string;
}

export const ADMIN_NOTIFICATION_TYPES = ['artifact_detected', 'news_proposal_generated'] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

// Extend NewsPost with new fields
export interface NewsPost {
  // ... existing fields ...
  is_ai_generated: boolean;         // new
  source_type: 'content' | 'artifact' | null;  // new
  source_id: string | null;         // new
}
```

Also update `listArtifacts` return type and `getArtifactBySlug` to include new columns.

---

## Ingest integration (`services/ingest.ts`)

After `processContentById(id)` completes successfully (chunks + embeddings generated):

```ts
// Non-blocking, non-fatal
try {
  const detected = await detectArtifactsFromContent(id, ai, supabase);
  // detected.count logged to console for analytics
} catch (err) {
  console.error('[artifact-detection] failed for content', id, err);
}
```

The same block runs in the `/api/admin/content/[id]/process` route handler (both the manual process button and the transcript job pipeline).

---

## Acceptance criteria

- [ ] DB migrations apply cleanly; existing seeded artifacts have `status = 'active'`, `is_ai_generated = false`
- [ ] After clicking "Run Ingestion" on a content item, artifact detection runs automatically; detected artifacts appear in `/admin/artifacts` as drafts within seconds
- [ ] If a detected artifact is a near-duplicate of an existing one, `possible_duplicate_of` is populated and a warning banner appears on the artifact edit page
- [ ] Artifacts follow the 4-state status workflow; active artifacts cannot be hard-deleted
- [ ] `/admin/artifacts` list is filterable by status and domain; AI-detected items are badged
- [ ] Artifact editor allows editing all fields (title, slug, domains, use_case, description, how-to steps) + status
- [ ] When an artifact's status is changed to `active` via PATCH, a `news_posts` draft is auto-created with `is_ai_generated = true`
- [ ] When a content item's status is changed to `active` via PATCH, a `news_posts` draft is auto-created with `is_ai_generated = true`
- [ ] AI-generated news drafts appear in `/admin/news` with an "AI draft" badge; they are editable and publishable like manual posts
- [ ] Bell icon shows unread count for new `artifact_detected` and `news_proposal_generated` notifications
- [ ] Toast appears when a new notification arrives via Supabase Realtime
- [ ] "Re-detect artifacts" button on content edit page re-runs detection for that content item
- [ ] `npm run lint && npm run build && npm run test:e2e` pass

---

## Dependencies

- Epic 8 (content intelligence) — chunks + chunk metadata available
- Epic 16 (admin UI) — admin section, content edit page, news posts CRUD
- Epic 17 (transcript jobs) — `NotificationBell` component exists; Supabase Realtime pattern established
- Epic 18 (content card enrichment) — `content.summary` column for proposal prompt context
