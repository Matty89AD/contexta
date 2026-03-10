# Production Setup Guide

This guide walks through setting up a production environment with its own Supabase database, seeded from your dev database (including pre-computed embeddings).

## Prerequisites

- Supabase CLI installed: `brew install supabase/tap/supabase`
- Access to the dev Supabase project (connection string)
- A new empty Supabase project created for production

---

## Step 1: Get the Dev Database Connection String

1. Open your **dev** Supabase project in the dashboard
2. Go to **Settings → Database**
3. Under **Connection string**, select **URI** and copy the **direct connection** (not the pooler)

It looks like:
```
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

Save it as `DEV_DATABASE_URL` in your terminal session:
```bash
export DEV_DATABASE_URL="postgresql://postgres.[dev-ref]:[password]@db.[dev-ref].supabase.co:5432/postgres"
```

---

## Step 2: Dump the Schema from Dev

This creates a single baseline migration file from the current dev schema.

```bash
pg_dump \
  --schema-only \
  --no-owner \
  --no-acl \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  --exclude-schema=supabase_migrations \
  "$DEV_DATABASE_URL" \
  > supabase/migrations/20260310000000_baseline.sql
```

Then **delete all previous migration files** in `supabase/migrations/` and keep only `20260310000000_baseline.sql`.

> Going forward, new schema changes are still added as numbered migration files on top of this baseline.

---

## Step 3: Dump the Seed Data from Dev

This exports only the tables with content that is expensive or time-consuming to regenerate (embeddings, artifacts, ingested content).

```bash
pg_dump \
  --data-only \
  --no-owner \
  --no-acl \
  --table=content \
  --table=content_chunks \
  --table=artifacts \
  --table=news_posts \
  "$DEV_DATABASE_URL" \
  > data/seed.sql
```

- `content` — ingested source content and metadata
- `content_chunks` — pre-computed pgvector embeddings (1536-dim) — this is the expensive part
- `artifacts` — the 68 PM artifacts
- `news_posts` — published news posts

Tables intentionally excluded: `profiles`, `challenges` (dev test data, not useful in production).

---

## Step 4: Apply the Schema to the Production Database

1. Open your **production** Supabase project in the dashboard
2. Go to **Settings → Database** and copy its direct connection string
3. Save it:
```bash
export PROD_DATABASE_URL="postgresql://postgres.[prod-ref]:[password]@db.[prod-ref].supabase.co:5432/postgres"
```

Apply the baseline schema:
```bash
psql "$PROD_DATABASE_URL" < supabase/migrations/20260310000000_baseline.sql
```

---

## Step 5: Register the Migration with Supabase

Supabase tracks applied migrations in its own internal table. After applying the baseline manually, register it so the CLI doesn't try to re-apply it:

```bash
psql "$PROD_DATABASE_URL" -c "
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260310000000', 'baseline');
"
```

---

## Step 6: Restore the Seed Data to Production

```bash
psql "$PROD_DATABASE_URL" < data/seed.sql
```

This restores all content, chunks (with embeddings), artifacts, and news posts — no re-ingestion or re-embedding needed.

---

## Step 7: Configure Environment Variables on Vercel

In your Vercel project go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From prod Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From prod Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | From prod Supabase project settings |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `TOP_K` | Integer, e.g. `10` |

All five variables are required. The build will fail if `TOP_K` is missing.

---

## Step 8: Deploy to Vercel

Connect your GitHub repository in the Vercel dashboard and deploy. Vercel auto-detects Next.js — no `vercel.json` needed.

Build command: `npm run build`
Output directory: `.next` (auto-detected)

---

## Ongoing: Keeping Dev and Prod in Sync

**New schema changes**: add a numbered migration file (e.g. `20260315000000_add_column.sql`), apply it to dev first, then apply it to prod:
```bash
psql "$PROD_DATABASE_URL" < supabase/migrations/20260315000000_add_column.sql
```

**New content/embeddings**: re-run the seed dump (Step 3) and restore (Step 6) after ingesting new content in dev.

**Never run ingest or backfill scripts directly against the production database URL.**
