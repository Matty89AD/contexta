-- Epic 11 performance: store pre-generated LLM detail per artifact
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS detail JSONB;
