-- Epic 14: Save & Revisit Challenge Results
-- Adds explicit save state + stored recommendations to challenges.

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS is_saved       boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS saved_at       timestamptz,
  ADD COLUMN IF NOT EXISTS title          text,
  ADD COLUMN IF NOT EXISTS recommendations jsonb;

-- Partial index: only saved challenges, ordered by save time (used by journey query)
CREATE INDEX IF NOT EXISTS challenges_saved_user_idx
  ON challenges (user_id, saved_at DESC)
  WHERE is_saved = true;
