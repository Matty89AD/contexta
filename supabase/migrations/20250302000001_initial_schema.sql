-- Enable pgvector for embeddings
create extension if not exists vector;

-- Profile role enum
create type profile_role as enum (
  'founder', 'cpo_director', 'head_of_product', 'sr_pm', 'associate_pm'
);

-- Company stage enum
create type company_stage as enum (
  'preseed_seed', 'series_a_b', 'growth_series_c_plus', 'enterprise', 'corporate'
);

-- Team size enum
create type team_size as enum ('1-5', '6-15', '16-50', '51+');

-- Experience level enum
create type experience_level as enum ('junior', 'mid', 'senior', 'lead');

-- Challenge domain enum
create type challenge_domain as enum (
  'strategy', 'discovery', 'delivery', 'growth', 'leadership'
);

-- Content source type
create type content_source_type as enum ('podcast', 'article', 'framework', 'playbook', 'case_study');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role profile_role not null,
  company_stage company_stage not null,
  team_size team_size not null,
  experience_level experience_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  raw_description text not null,
  domain challenge_domain not null,
  subdomain text,
  impact_reach text,
  summary text,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

create policy "Users can manage own challenges"
  on public.challenges for all
  using (auth.uid() = user_id);

-- Content (curated items)
create table public.content (
  id uuid primary key default gen_random_uuid(),
  source_type content_source_type not null,
  title text not null,
  url text,
  summary text,
  key_takeaways text,
  metadata jsonb default '{}',
  primary_domain challenge_domain,
  created_at timestamptz not null default now()
);

alter table public.content enable row level security;

-- No RLS policies: only service role (bypasses RLS) can access content in API.

-- Content chunks with embeddings (1536 for text-embedding-3-small)
create table public.content_chunks (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content(id) on delete cascade,
  body text not null,
  embedding vector(1536),
  chunk_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.content_chunks enable row level security;

-- No RLS policies: only service role can access content_chunks in API.

-- Index for vector similarity search (required for efficient match)
create index on public.content_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC: match content chunks by embedding similarity (cosine)
create or replace function public.match_content_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  chunk public.content_chunks,
  content public.content,
  similarity float
)
language sql stable
as $$
  select
    cc as chunk,
    c as content,
    1 - (cc.embedding <=> query_embedding) as similarity
  from public.content_chunks cc
  join public.content c on c.id = cc.content_id
  where cc.embedding is not null
  order by cc.embedding <=> query_embedding
  limit match_count;
$$;

-- Updated_at trigger for profiles
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
