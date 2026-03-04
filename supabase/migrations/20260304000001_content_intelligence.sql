-- Epic 8: Content Intelligence Service
-- Adds structured metadata columns to content and content_chunks.
-- Updates tsvector trigger to include key_concepts in full-text index.
-- GIN indexes on array columns for metadata filtering.

-- 1. Document-level intelligence columns on content
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS publication_date date,
  ADD COLUMN IF NOT EXISTS content_category text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS extraction_confidence float;

-- 2. GIN indexes on content array columns (metadata filtering)
CREATE INDEX IF NOT EXISTS content_topics_gin
  ON public.content USING gin(topics);

CREATE INDEX IF NOT EXISTS content_keywords_gin
  ON public.content USING gin(keywords);

-- 3. Chunk-level intelligence columns on content_chunks
ALTER TABLE public.content_chunks
  ADD COLUMN IF NOT EXISTS chunk_type text,
  ADD COLUMN IF NOT EXISTS key_concepts text[] NOT NULL DEFAULT '{}';

-- 4. GIN index on key_concepts
CREATE INDEX IF NOT EXISTS content_chunks_key_concepts_gin
  ON public.content_chunks USING gin(key_concepts);

-- 5. Update tsvector trigger function to include key_concepts in full-text index.
--    Fires on INSERT or UPDATE OF body/key_concepts so the tsv stays current
--    after the intelligence service populates key_concepts post-ingest.
CREATE OR REPLACE FUNCTION public.content_chunks_tsv_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector(
    'english',
    NEW.body || ' ' || COALESCE(array_to_string(NEW.key_concepts, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Replace trigger to also fire on key_concepts updates
DROP TRIGGER IF EXISTS content_chunks_tsv_update ON public.content_chunks;

CREATE TRIGGER content_chunks_tsv_update
  BEFORE INSERT OR UPDATE OF body, key_concepts ON public.content_chunks
  FOR EACH ROW EXECUTE FUNCTION public.content_chunks_tsv_trigger();

-- 7. Backfill tsv for existing rows (key_concepts is empty, but refreshes format)
UPDATE public.content_chunks
  SET tsv = to_tsvector(
    'english',
    body || ' ' || COALESCE(array_to_string(key_concepts, ' '), '')
  );
