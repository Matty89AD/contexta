-- Add premium model preference flag to profiles.
-- Users can toggle this in the profile page to use a higher-quality chat model
-- for artifact recommendations without any extra DB lookup at inference time
-- (the flag is mirrored to localStorage on the client).
alter table public.profiles
  add column if not exists use_premium_model boolean not null default false;
