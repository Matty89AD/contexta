-- Epic 12: Make PM-context profile fields nullable so a bare profile row
-- can be created at signup time (before context data is collected).
-- These fields are backfilled the next time the user completes a challenge flow.
alter table public.profiles
  alter column role drop not null,
  alter column company_stage drop not null,
  alter column team_size drop not null,
  alter column experience_level drop not null;
