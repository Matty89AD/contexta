-- Epic 19 — Smart Artifact Detection + News Proposal Pipeline

-- Migration 1: Extend artifacts table
ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'pending_review', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS possible_duplicate_of text REFERENCES artifacts(slug) ON DELETE SET NULL;

-- Existing seeded artifacts are already active (default 'active' handles this)
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts (status);

-- Migration 2: Extend news_posts table
ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_type text CHECK (source_type IN ('content', 'artifact')),
  ADD COLUMN IF NOT EXISTS source_id uuid;

-- Migration 3: admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL CHECK (type IN (
               'artifact_detected',
               'news_proposal_generated'
             )),
  title      text NOT NULL,
  body       text,
  link_url   text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications (created_at DESC);

-- Add to Realtime publication so NotificationBell receives live inserts
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- RLS: only admins can access
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_notifications"
  ON admin_notifications FOR ALL
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
