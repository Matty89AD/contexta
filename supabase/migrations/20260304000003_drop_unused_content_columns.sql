-- Drop unused columns from content table.
-- summary, key_takeaways, metadata, and raw_text were never used in the matching pipeline.
-- Structured intelligence fields (topics, keywords, content_category, etc.) from Epic 8 replaced their intent.

ALTER TABLE content
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS key_takeaways,
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS raw_text;
