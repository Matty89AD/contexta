-- Epic 13: Add status column to challenges table
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open','in_progress','completed','archived','abandoned'));
