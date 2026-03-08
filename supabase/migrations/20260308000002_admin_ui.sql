-- Epic 16: Admin UI
-- Migration 1: is_admin on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Migration 2: content status + raw transcript
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'pending_review', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS transcript_raw text;

-- Existing ingested content is already live, so default to 'active' (already set above)
CREATE INDEX IF NOT EXISTS idx_content_status ON content (status);

-- Migration 3: news_posts table
CREATE TABLE IF NOT EXISTS news_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text NOT NULL CHECK (type IN ('podcast', 'artifact', 'article')),
  title          text NOT NULL,
  description    text NOT NULL,
  published_date text NOT NULL,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_posts_status ON news_posts (status);

-- updated_at trigger for news_posts
CREATE TRIGGER news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
