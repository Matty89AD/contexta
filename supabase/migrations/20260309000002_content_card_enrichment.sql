-- Epic 18: Content Card Enrichment — summary column + view tracking

-- Migration A: add summary column to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS summary text;

-- Migration B: create user_content_views table
CREATE TABLE IF NOT EXISTS user_content_views (
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
