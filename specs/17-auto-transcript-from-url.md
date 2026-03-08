# Epic 17 — Auto-Generate Transcript from URL

> **Status:** ✅ done  |  **As of:** 2026-03-08

## Goal

Allow admins to paste any URL (YouTube video, podcast RSS feed, podcast episode, direct audio/video file, or webpage) and automatically generate a transcript + extract all available metadata. A draft `content` record is created and fully pre-filled (transcript + intelligence) for the admin to review before triggering embedding/ingestion. In-app notifications (bell icon + toast) inform the admin when a background job completes.

---

## Scope

1. **DB migration** — new `transcript_jobs` table
2. **`@steipete/summarize` integration** — transcript extraction service wrapping the CLI
3. **Metadata extraction** — Open Graph, YouTube oEmbed, RSS feed parsing per URL type
4. **Background job processing** — Next.js 15 `after()` for post-response async work; runs transcript + intelligence extraction; creates draft content
5. **RSS episode picker** — detect RSS feed URLs → parse episodes → admin selects one before confirming
6. **Admin UI: "Add from URL" flow** — button on `/admin/content` → URL input modal → confirmation step → (RSS: episode picker step) → job creation
7. **Admin UI: Notification system** — bell icon in admin nav (badge count of pending/recently completed jobs), toast on completion via Supabase Realtime
8. **Admin UI: Draft review** — read-only view of auto-generated transcript and pre-filled metadata on the existing content edit page
9. **Admin UI: Ingest trigger** — "Run Ingestion" button on the draft content page to generate embeddings/chunks, making content searchable
10. **API routes** — `POST /api/admin/transcript-jobs`, `GET /api/admin/transcript-jobs`, `GET /api/admin/transcript-jobs/[id]`

---

## Out of scope

- Editing the transcript inline (read-only review only)
- Scheduled/recurring auto-ingestion from RSS feeds
- Support for authenticated/paywalled content
- Bulk URL submission
- Webhook callbacks or email notifications
- Content source monitoring / cron (covered in a future epic)

---

## URL types and processing strategy

| URL type | Detection | Transcript source | Metadata source |
|---|---|---|---|
| YouTube video | `youtube.com` / `youtu.be` in URL | `@steipete/summarize` (published captions → Whisper fallback) | YouTube oEmbed API (title, author, published_date, thumbnail) |
| Podcast RSS feed | `Content-Type: application/rss+xml` or `.xml` / `/feed` in URL | Parse feed → pick episode → audio URL → summarize | RSS `<channel>` fields + selected `<item>` fields |
| Podcast episode (direct audio) | `.mp3` / `.m4a` / `.ogg` extension or `audio/` MIME | `@steipete/summarize` (Whisper) | ID3 tags via summarize + URL hostname |
| Web page / article | Fallback for all other URLs | `@steipete/summarize` (HTML → clean text) | Open Graph meta tags (`og:title`, `og:description`, `og:site_name`, `article:published_time`) |

---

## DB migration

### New table: `transcript_jobs`

```sql
CREATE TABLE transcript_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url           text NOT NULL,
  url_type      text NOT NULL CHECK (url_type IN ('youtube', 'podcast_rss', 'podcast_episode', 'webpage')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  content_id    uuid REFERENCES content(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transcript_jobs_created_by_idx ON transcript_jobs(created_by);
CREATE INDEX transcript_jobs_status_idx ON transcript_jobs(status);

-- auto-update updated_at
CREATE TRIGGER transcript_jobs_updated_at
  BEFORE UPDATE ON transcript_jobs
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

RLS policies: only users with `is_admin = true` can select/insert/update on `transcript_jobs`. Service role bypasses RLS for background processing.

---

## Architecture

### New files

```
services/transcript-job.service.ts      # orchestrates job creation + processing
services/transcript-extractor.service.ts # wraps @steipete/summarize CLI
services/url-metadata.service.ts         # per-type metadata extraction
repositories/transcript-jobs.repository.ts
app/api/admin/transcript-jobs/route.ts          # POST (create), GET (list)
app/api/admin/transcript-jobs/[id]/route.ts     # GET (status)
components/admin/AddFromUrlModal.tsx
components/admin/RssEpisodePicker.tsx
components/admin/NotificationBell.tsx
```

### Processing flow (per job)

```
POST /api/admin/transcript-jobs
  → validate URL, detect url_type
  → insert job (status=pending)
  → return 202 { jobId }
  → after() {
      update job → processing
      extractMetadata(url, url_type)      // url-metadata.service
      extractTranscript(url, url_type)    // transcript-extractor.service (summarize CLI)
      runIntelligence(transcript, meta)   // existing content-intelligence service
      insert content (status=draft, transcript_raw, all metadata fields)
      update job → completed, content_id
    }
  // Supabase Realtime notifies client on job row update
```

### Intelligence extraction timing

Intelligence extraction (LLM tagging, domain classification, artifact matching hints) runs **automatically inside the background job**, immediately after transcript generation. By the time the admin opens the draft, all metadata fields are pre-filled. Embeddings/chunks are **not** generated here — that step is deferred until the admin explicitly clicks "Run Ingestion" on the content review page.

---

## Services

### `TranscriptExtractorService`

- Installs dependency: `@steipete/summarize` (added to `package.json`)
- Spawns CLI via `child_process.execFile` with `--json` flag for structured output
- Passes `OPENROUTER_API_KEY` (already in env) as `OPENAI_API_KEY` with `OPENAI_BASE_URL=https://openrouter.ai/api/v1` so summarize.sh routes through OpenRouter
- 10-minute timeout; on timeout → job status = `failed` with descriptive `error_message`
- Returns: `{ transcript: string, detectedTitle?: string, detectedAuthor?: string, duration?: number }`

### `UrlMetadataService`

Extracts per-type metadata before transcript generation:

- **YouTube**: `GET https://www.youtube.com/oembed?url=<url>&format=json` → title, author_name, thumbnail_url; parse `published_date` from YouTube page meta if available
- **RSS feed**: `fast-xml-parser` or `rss-parser` npm package; returns `{ feedTitle, feedAuthor, episodes: [{ title, description, pubDate, audioUrl, duration }] }` (max 50 most recent episodes)
- **Podcast episode**: Extract from RSS parent if discoverable; otherwise derive from `og:` tags on landing page
- **Webpage**: `unfurl.js` or manual fetch + `cheerio` for Open Graph; extract `og:title`, `og:description`, `og:site_name`, `article:published_time`

All fields mapped to existing `content` table columns: `title`, `author`, `source_url`, `source_type`, `published_date`, `description`.

### `TranscriptJobService`

- `createJob(url, adminId)` — validates URL (must be reachable, non-empty), detects type, inserts job, calls `after()` with `processJob(jobId)`
- `processJob(jobId)` — full pipeline: metadata → transcript → intelligence → insert content → update job
- `listJobs(adminId)` — recent 20 jobs ordered by `created_at DESC`
- `getJob(jobId)` — single job with `content_id`

---

## API routes

### `POST /api/admin/transcript-jobs`

Request body:
```json
{ "url": "https://..." }
```

Response `202`:
```json
{
  "jobId": "uuid",
  "urlType": "youtube" | "podcast_rss" | "podcast_episode" | "webpage",
  "feedEpisodes": [...] | null   // populated only when urlType = "podcast_rss"
}
```

If `urlType = "podcast_rss"`, the client shows the episode picker modal. Admin selects an episode and re-submits with the resolved episode URL (now `urlType = "podcast_episode"`).

Response `400` for invalid/unreachable URL. Response `403` if not admin.

### `GET /api/admin/transcript-jobs`

Returns the 20 most recent jobs for the current admin. Used for bell icon polling on mount and Realtime as fallback.

### `GET /api/admin/transcript-jobs/[id]`

Returns single job. Client navigates to `/admin/content/[content_id]` when `status = completed`.

---

## Admin UI

### `/admin/content` — "Add from URL" button

- New primary button next to existing "Add content" button: **"Add from URL"**
- Opens `AddFromUrlModal`

### `AddFromUrlModal` — 3-step flow

**Step 1 — URL input**
- Text input for URL
- "Continue" button → calls `POST /api/admin/transcript-jobs` (probe only: validate + detect type, don't create job yet — or detect client-side by URL pattern)
- Actually: detect URL type client-side by pattern; show detected type badge ("YouTube video", "Podcast RSS feed", etc.)

**Step 2 — Confirmation**
- Shows: detected URL type, URL preview, warning "Transcript generation may take several minutes for long audio"
- Shows estimated processing note per type (YouTube: "~30 seconds"; audio/podcast: "~2–5 minutes"; webpage: "~10 seconds")
- "Generate Transcript" button → calls `POST /api/admin/transcript-jobs` → creates job → closes modal → shows toast "Job started"

**Step 2b — RSS episode picker** (only for RSS feeds, inserted between steps 1 and 2)
- `RssEpisodePicker` component: table of episodes (title, date, duration)
- Admin selects one episode → continues to Step 2 confirmation with resolved audio URL

### `NotificationBell` (in admin nav)

- Bell icon with badge showing count of `pending` + `processing` jobs
- On mount: fetches `/api/admin/transcript-jobs`; subscribes to Supabase Realtime on `transcript_jobs` table for the current admin's rows
- On `status → completed`: show toast ("Transcript ready: [title]") with link to `/admin/content/[content_id]`; decrement badge
- On `status → failed`: show error toast ("Transcript failed for [url]"); decrement badge
- Clicking bell opens a small dropdown listing recent jobs with status indicators and links to completed content

### Draft content review (`/admin/content/[id]`)

No new page needed — the existing content edit page already shows all fields. The following behaviour is added:

- When `content.status = 'draft'` and the content was created from a transcript job (detectable via `transcript_jobs.content_id`):
  - Show a read-only banner: "Generated from URL — review transcript and metadata before ingesting"
  - All fields are pre-filled (read-only display for `transcript_raw`)
  - "Run Ingestion" button triggers the existing ingest/embedding pipeline
  - After ingestion, admin can change `status` to `active`

---

## LLM model strategy

Currently **all** AI calls — including ingestion scripts and the `/process` route — share a single `createOpenRouterProvider()` that reads `OPENROUTER_CHAT_MODEL`. For user-facing chat tasks the model is chosen for speed (currently `openai/gpt-oss-20b:nitro`). That's the wrong trade-off for background transcript ingestion, where:

- Speed is irrelevant (async job, admin isn't waiting)
- Context window matters (full podcast transcripts can be 30–80K tokens)
- Quality matters more (domain classification and tagging directly affect search quality)

### Implementation

Add a `createOpenRouterIngestProvider()` factory to `core/ai/openrouter-provider.ts`:
- Reads `OPENROUTER_INGEST_MODEL` env var; falls back to `OPENROUTER_CHAT_MODEL`; falls back to `google/gemini-2.0-flash` as hard default
- All existing code remains unchanged — only the transcript job service calls this factory
- Recommended default: `google/gemini-2.0-flash` — 1M token context window, handles full transcripts, comparable cost to `gpt-4o-mini`

### Summarize.sh model

`@steipete/summarize` also uses an LLM internally (for its summarization step). Configure it with a separate cheap/free model since we only need the raw transcript output, not a high-quality summary. Pass `OPENROUTER_API_KEY` via `OPENAI_API_KEY` + `OPENAI_BASE_URL=https://openrouter.ai/api/v1` override, and set `SUMMARIZE_MODEL=google/gemini-2.0-flash-lite` (cheap, fast, good enough for text cleanup).

---

## Env vars

| Var | Required | Default | Notes |
|---|---|---|---|
| `OPENROUTER_INGEST_MODEL` | No | `google/gemini-2.0-flash` | Model used for intelligence extraction in background transcript jobs. Separate from `OPENROUTER_CHAT_MODEL` to avoid degrading user-facing response speed. |

All other required vars (`OPENROUTER_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.) already exist.

---

## Dependencies to add

```
@steipete/summarize   # transcript extraction CLI
rss-parser            # RSS feed parsing (podcast feeds)
cheerio               # HTML parsing for Open Graph metadata
```

---

## Acceptance criteria

1. Admin pastes a YouTube URL → job created → after ~30s, draft content appears with transcript, title, author, published_date, source_type pre-filled; bell icon shows completion toast
2. Admin pastes a podcast RSS URL → episode picker shown → admin selects episode → job created → after processing, draft content with transcript appears
3. Admin pastes a direct audio URL (.mp3) → job created → draft content with Whisper-generated transcript appears
4. Admin pastes a webpage URL → job created → draft content with extracted article text as transcript + Open Graph metadata appears
5. Admin opens draft content → all fields are pre-filled and readable → "Run Ingestion" button is visible
6. Clicking "Run Ingestion" generates embeddings/chunks → content becomes searchable
7. On job failure (bad URL, timeout, unsupported content) → toast with error message; job status = `failed` in dropdown
8. Bell icon badge shows count of in-progress jobs; clears on completion/failure
9. Submitting a very long audio URL shows a confirmation modal before job creation
10. Transcript jobs table is accessible to admin users only (RLS enforced)

---

## Out-of-scope (explicitly deferred)

- Inline transcript editing
- Duplicate URL detection
- Scheduled re-ingestion from RSS feeds
- Non-admin users triggering transcript generation
- Push/email notifications
- Progress percentage during processing
