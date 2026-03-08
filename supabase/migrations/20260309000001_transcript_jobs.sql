-- Epic 17: Auto-Generate Transcript from URL
-- Migration 1: transcript_jobs table

CREATE TABLE IF NOT EXISTS transcript_jobs (
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

CREATE INDEX IF NOT EXISTS transcript_jobs_created_by_idx ON transcript_jobs(created_by);
CREATE INDEX IF NOT EXISTS transcript_jobs_status_idx ON transcript_jobs(status);

-- auto-update updated_at
CREATE TRIGGER transcript_jobs_updated_at
  BEFORE UPDATE ON transcript_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: only admins can manage transcript_jobs
ALTER TABLE transcript_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transcript_jobs"
  ON transcript_jobs
  FOR ALL
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
