-- Epic 7: Hybrid RAG retrieval
-- Adds tsvector column + GIN index to content_chunks for full-text keyword search.
-- A trigger keeps tsv in sync with body on insert/update.
-- Adds keyword_match_content_chunks RPC for ranked keyword search.
-- Optional raw_text on content for future use.

-- 1. Add tsvector column to content_chunks
ALTER TABLE public.content_chunks
  ADD COLUMN IF NOT EXISTS tsv tsvector;

-- 2. GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS content_chunks_tsv_gin
  ON public.content_chunks
  USING gin(tsv);

-- 3. Trigger function to auto-populate tsv from body
CREATE OR REPLACE FUNCTION public.content_chunks_tsv_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', NEW.body);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_chunks_tsv_update ON public.content_chunks;

CREATE TRIGGER content_chunks_tsv_update
  BEFORE INSERT OR UPDATE OF body ON public.content_chunks
  FOR EACH ROW EXECUTE FUNCTION public.content_chunks_tsv_trigger();

-- 4. Backfill tsv for existing rows
UPDATE public.content_chunks
  SET tsv = to_tsvector('english', body)
  WHERE tsv IS NULL;

-- 5. Optional raw_text on content for future use
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS raw_text text;

-- 6. RPC: keyword search on content chunks using full-text search
--    ts_rank_cd with normalization=8 (rank / unique-word-count) gives a better 0–1 range.
--    plainto_tsquery handles natural language input without special characters.
CREATE OR REPLACE FUNCTION public.keyword_match_content_chunks(
  query_text text,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  chunk public.content_chunks,
  content public.content,
  keyword_score float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cc AS chunk,
    c AS content,
    ts_rank_cd(cc.tsv, plainto_tsquery('english', query_text), 8) AS keyword_score
  FROM public.content_chunks cc
  JOIN public.content c ON c.id = cc.content_id
  WHERE
    cc.tsv IS NOT NULL
    AND cc.tsv @@ plainto_tsquery('english', query_text)
  ORDER BY keyword_score DESC
  LIMIT match_count;
$$;
