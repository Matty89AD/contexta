# Epic 16 — Admin UI

> **Status:** ✅ done  |  **As of:** 2026-03-08

## Goal

A protected web interface at `/admin` for curating the knowledge base: adding and processing new content, managing content metadata and status, creating news posts for the Journey page, and a scaffold for future content source monitoring.

---

## Scope

1. **DB migrations** — `is_admin` on `profiles`; `status` + `transcript_raw` on `content`; new `news_posts` table
2. **Admin middleware** — gate all `/admin` routes; redirect non-admins to `/`
3. **Dashboard** — headline stats (content by status, news posts by status)
4. **Content list** — filterable/searchable table of all content items
5. **Add content** — URL + source type form, transcript textarea, "Process now" trigger
6. **Edit content** — metadata fields + status change + chunk count (read-only)
7. **News posts list + editor** — create, edit, publish/unpublish, delete
8. **Content sources scaffold** — read-only placeholder section for future cron monitoring
9. **API routes** — admin-only endpoints for all of the above

---

## Out of scope

- Auto-transcript generation (future epic)
- Content source monitoring / cron jobs (sources section is UI scaffold only)
- Bulk status changes
- Audit log / change history
- Image/thumbnail support for news posts
- Supabase Storage for transcript files (raw text stored in DB column for MVP)

---

## DB migrations

### Migration 1 — `is_admin` on profiles

```sql
ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
```

### Migration 2 — content status + transcript

Add a `status` column (text with check constraint) and a `transcript_raw` column to store the paste-in transcript before processing.

```sql
ALTER TABLE content
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'pending_review', 'active', 'archived')),
  ADD COLUMN transcript_raw text;

-- Existing ingested content is already live, so default to 'active'
CREATE INDEX idx_content_status ON content (status);
```

### Migration 3 — news_posts table

```sql
CREATE TABLE news_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('podcast', 'artifact', 'article')),
  title       text NOT NULL,
  description text NOT NULL,
  published_date text NOT NULL,   -- display string, e.g. "Mar 2026"
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_posts_status ON news_posts (status);
```

---

## Auth — admin middleware

- `middleware.ts` (or a layout-level server check) reads the authenticated user's `profiles.is_admin`.
- Any request to `/admin/**` where `is_admin = false` or the user is unauthenticated redirects to `/`.
- The check must be server-side (layout RSC or Next.js middleware) — never client-only.

---

## Routes and pages

| Route | Description |
|---|---|
| `/admin` | Dashboard with stats |
| `/admin/content` | Content list |
| `/admin/content/new` | Add new content |
| `/admin/content/[id]` | Edit content metadata / status |
| `/admin/news` | News posts list |
| `/admin/news/new` | Create news post |
| `/admin/news/[id]` | Edit news post |
| `/admin/sources` | Content sources scaffold (static) |

All pages share an `/admin` layout with a simple sidebar nav.

---

## Dashboard (`/admin`)

**Stat cards (fetched server-side):**
- Total content items / broken down by status (draft, pending_review, active, archived)
- Total news posts / broken down by status (draft, published)

**Quick-action links:** "Add content", "New news post"

---

## Content list (`/admin/content`)

- Table columns: Title, Source type, Primary domain, Status, Created at, Actions
- Filter bar: status tabs (All / Draft / Pending review / Active / Archived), source type dropdown, domain dropdown
- Search: title full-text (client-side filter for MVP)
- Row actions: Edit, Change status (inline dropdown), Delete (with confirmation — hard delete; only allowed on `draft` or `archived` items to prevent accidental removal of active knowledge)
- Paginate or virtual-scroll if row count grows; 50 rows per page for MVP

---

## Add content (`/admin/content/new`)

**Form fields:**

| Field | Required | Notes |
|---|---|---|
| Source type | Yes | Select: Podcast, Video, Website, Book |
| URL | Yes | The canonical source URL |
| Title | No | Pre-filled manually; LLM can enrich later |
| Transcript / full text | Conditional | Required if source type = podcast or video; textarea for paste-in. Optional for website/book. |

**Behaviour:**
1. Submit creates a `content` row with `status = 'draft'` and stores the raw transcript in `transcript_raw`. No chunking or embedding happens yet.
2. The user is redirected to the edit page for that content item.
3. From the edit page, a "Process now" button triggers the ingest pipeline (chunk → embed → intelligence extraction). The button is disabled while processing; a status indicator shows progress (pending → processing → done / error).
4. After successful processing, `status` automatically advances to `pending_review`.

**URL handling (MVP):** The URL is saved to the DB as provenance only — nothing is fetched from it at submission time. All processing uses the provided transcript text. A future epic can add a "fetch from URL" flow to auto-populate metadata (title, author, publication date) and eliminate the need to paste a transcript for website/book content.

---

## Edit content (`/admin/content/[id]`)

**Editable fields:**
- Title
- URL
- Author
- Domains (multi-select, maps to `ChallengeDomain` enum)
- Topics (tag input, free text array)
- Keywords (tag input, free text array)
- Publication date
- Status (select: draft / pending_review / active / archived)

**Read-only info panel:**
- Source type
- Extraction confidence (from intelligence service)
- Chunk count (count of rows in `content_chunks` for this content id)
- Created at

**Actions:**
- Save metadata
- "Process now" (visible only if `status = 'draft'` and transcript exists; re-processing is allowed from any status with a warning)
- Delete (with confirmation; hard delete)

---

## News posts list (`/admin/news`)

- Table columns: Title, Type, Date, Status, Sort order, Actions
- Row actions: Edit, Publish/Unpublish toggle, Delete (with confirmation)
- "New post" button links to `/admin/news/new`

---

## News post editor (`/admin/news/new` and `/admin/news/[id]`)

**Form fields:**

| Field | Required | Notes |
|---|---|---|
| Type | Yes | Select: Podcast, Artifact, Article |
| Title | Yes | |
| Description | Yes | Short text shown in the card |
| Display date | Yes | Free-text string shown in the card, e.g. "Mar 2026" |
| Status | Yes | Draft / Published |
| Sort order | No | Integer; lower = shown first in the card list |

**Behaviour:**
- Saving with `status = published` immediately makes it appear in the Journey `NewsCard`.
- `NewsCard` component is updated to fetch published posts from the DB (ordered by `sort_order ASC, created_at DESC`) instead of using hardcoded mock data.

---

## Content sources scaffold (`/admin/sources`)

Static read-only page. No database interaction.

**Contents:**
- Section header: "Content Sources"
- Short explanation: "Define monitored sources so new content is automatically scraped and queued for ingestion. Not yet active — coming in a future release."
- Empty state table with columns: Source name, URL, Type, Schedule, Last checked, Status
- "Add source" button (disabled, with tooltip "Coming soon")

---

## API routes

All routes require the authenticated user to have `is_admin = true`; return 403 otherwise.

```
GET  /api/admin/stats                    → { content: { total, by_status }, news: { total, by_status } }

GET  /api/admin/content                  → paginated list with filters (status, source_type, domain, q)
POST /api/admin/content                  → create draft content item (fields: source_type, url, title?, transcript_raw?)
GET  /api/admin/content/[id]             → single content item + chunk_count
PATCH /api/admin/content/[id]            → update editable metadata fields + status
DELETE /api/admin/content/[id]           → hard delete (guard: reject if status = active)
POST /api/admin/content/[id]/process     → trigger ingest pipeline; returns 202 Accepted; sets status to pending_review on completion

GET  /api/admin/news                     → list all news posts
POST /api/admin/news                     → create news post
GET  /api/admin/news/[id]                → single news post
PATCH /api/admin/news/[id]               → update news post
DELETE /api/admin/news/[id]              → hard delete
```

The `/process` endpoint runs the existing ingest pipeline (service layer) on the stored `transcript_raw` text. For MVP, the URL is never fetched — all content must be provided as transcript text. Processing runs synchronously in the route handler with a generous timeout; a background queue is a future improvement.

---

## Repositories and services

**New repository:** `repositories/admin.ts`
- `getStats()` — aggregate counts for dashboard
- `listContent(filters, page)` — paginated content query
- `getContentById(id)` — single item + chunk count join
- `createContent(data)` — insert draft row
- `updateContent(id, data)` — partial update of editable fields
- `deleteContent(id)` — hard delete with active-status guard
- `listNews(filters)` — all news posts
- `createNews(data)` — insert
- `getNewsById(id)` — single post
- `updateNews(id, data)` — partial update
- `deleteNews(id)` — hard delete
- `getPublishedNews()` — published posts ordered for Journey card

**Service updates:**
- `services/ingest.ts` — expose a `processContentById(id)` function that reads `transcript_raw` from the DB and runs the existing pipeline, rather than reading from the filesystem.

**Component update:**
- `components/journey/NewsCard.tsx` — replace hardcoded `NEWS_ITEMS` array with a server-side fetch of published news posts via `repositories/admin.getPublishedNews()` (or a lightweight `/api/journey/news` public endpoint).

---

## Types (`lib/db/types.ts` additions)

```ts
export const CONTENT_STATUSES = ['draft', 'pending_review', 'active', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const NEWS_POST_TYPES = ['podcast', 'artifact', 'article'] as const;
export type NewsPostType = (typeof NEWS_POST_TYPES)[number];

export const NEWS_POST_STATUSES = ['draft', 'published'] as const;
export type NewsPostStatus = (typeof NEWS_POST_STATUSES)[number];

export interface NewsPost {
  id: string;
  type: NewsPostType;
  title: string;
  description: string;
  published_date: string;
  status: NewsPostStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

Also add `status: ContentStatus` and `transcript_raw: string | null` to the existing `Content` interface.

---

## Acceptance criteria

- [ ] Non-admin and unauthenticated users hitting any `/admin` route are redirected to `/`
- [ ] Dashboard loads with accurate counts from the DB
- [ ] Admin can create a content item (URL + source type + optional transcript), save it as `draft`
- [ ] "Process now" triggers the ingest pipeline; status advances to `pending_review` on success; error state is shown on failure
- [ ] Admin can edit all specified metadata fields and save
- [ ] Status transitions work for all four states via the edit page dropdown
- [ ] Content items with `status = active` cannot be hard-deleted (returns an error; UI shows explanation)
- [ ] Admin can create, edit, publish, unpublish, and delete news posts
- [ ] Journey page `NewsCard` renders published news posts from the DB (not hardcoded data), ordered by `sort_order ASC, created_at DESC`
- [ ] Content sources page renders as a static read-only scaffold with no DB interaction
- [ ] `npm run lint && npm run build` pass
