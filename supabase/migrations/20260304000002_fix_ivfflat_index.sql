-- Epic 9 hotfix: drop the IVFFlat index; use sequential scan instead.
--
-- Root cause: the ivfflat index was created before content was ingested, so
-- pgvector had no data to compute centroids from. Some query vectors map to
-- empty centroids and return 0 results despite 900+ chunks existing.
--
-- Why not recreate the index?
--   Rebuilding ivfflat requires k-means over all vectors, which uses
--   ~57 MB (n_iters × n_rows × dims × 4 B) — over Supabase's 32 MB limit.
--
-- Why is sequential scan fine here?
--   With only ~900 rows, scanning all vectors per query is <1 ms and gives
--   exact nearest-neighbour results (no approximation errors). An index only
--   helps at 10 K+ rows. Re-add when the corpus grows.
--
-- The match_content_chunks function is also updated to remove the now-
-- irrelevant ivfflat.probes GUC setting.

-- 1. Drop the broken IVFFlat index
DROP INDEX IF EXISTS public.content_chunks_embedding_idx;

-- 2. Restore match_content_chunks without the ivfflat.probes setting
CREATE OR REPLACE FUNCTION public.match_content_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
RETURNS TABLE (
  chunk public.content_chunks,
  content public.content,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cc AS chunk,
    c  AS content,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM public.content_chunks cc
  JOIN public.content c ON c.id = cc.content_id
  WHERE cc.embedding IS NOT NULL
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
$$;
