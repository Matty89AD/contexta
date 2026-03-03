-- Epic 6: Multi-domain support
-- Adds domains[] arrays to challenges and content; migrates existing single-domain data.

-- challenges: add domains array populated from existing `domain` column
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS domains challenge_domain[] NOT NULL DEFAULT '{}';

-- Backfill from existing domain column (each challenge had exactly one domain)
UPDATE public.challenges
  SET domains = ARRAY[domain];

-- content: add domains array
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS domains challenge_domain[] NOT NULL DEFAULT '{}';

-- Backfill from existing primary_domain column (NULL rows stay empty array)
UPDATE public.content
  SET domains = ARRAY[primary_domain]
  WHERE primary_domain IS NOT NULL;
