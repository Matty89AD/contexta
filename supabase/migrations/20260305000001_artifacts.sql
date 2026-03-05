CREATE TABLE IF NOT EXISTS artifacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  domains      text[] NOT NULL DEFAULT '{}',
  use_case     text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_domains ON artifacts USING GIN (domains);
