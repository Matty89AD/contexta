-- Strip transcript-style timestamps from body before building tsvector.
-- Patterns like "Lenny (22:59):" or "(00:00)" add noise (numbers 22, 59) to
-- full-text search and can cause irrelevant matches. We keep body unchanged
-- for display; only the indexed text is cleaned.

CREATE OR REPLACE FUNCTION public.content_chunks_tsv_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  body_for_tsv text;
BEGIN
  -- Remove parenthesized timestamps e.g. (22:59), (1:30:45), (0:00)
  body_for_tsv := regexp_replace(
    NEW.body,
    '\(\d{1,2}:\d{1,2}(:\d{1,2})?\)',
    '',
    'g'
  );
  NEW.tsv := to_tsvector(
    'english',
    body_for_tsv || ' ' || COALESCE(array_to_string(NEW.key_concepts, ' '), '')
  );
  RETURN NEW;
END;
$$;

-- Recompute tsv for existing chunks (trigger runs on UPDATE OF body)
UPDATE public.content_chunks SET body = body;
