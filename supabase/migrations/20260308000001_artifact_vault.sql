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
