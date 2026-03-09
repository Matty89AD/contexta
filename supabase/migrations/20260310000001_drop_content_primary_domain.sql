-- Remove primary_domain from content; domains[] is the single source of truth (Epic 6).
ALTER TABLE public.content
  DROP COLUMN IF EXISTS primary_domain;
