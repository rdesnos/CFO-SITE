create table if not exists public.cfo_side_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  public_signature text,
  introduction text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cfo_side_social_sources (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.cfo_side_profiles(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube','x','facebook','other')),
  handle text,
  profile_url text not null,
  external_account_id text,
  active boolean not null default true,
  collector_type text not null default 'manual' check (collector_type in ('manual','api','rss','social_external')),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, platform, profile_url)
);

create table if not exists public.cfo_side_social_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.cfo_side_profiles(id) on delete cascade,
  source_id uuid not null references public.cfo_side_social_sources(id) on delete cascade,
  platform text not null,
  external_post_id text,
  canonical_url text not null,
  published_at timestamptz not null,
  text_content text,
  media_url text,
  thumbnail_url text,
  content_type text,
  raw_payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id, canonical_url)
);

create index if not exists cfo_side_posts_profile_date_idx on public.cfo_side_social_posts(profile_id, published_at desc) where active = true;
create index if not exists cfo_side_sources_profile_idx on public.cfo_side_social_sources(profile_id) where active = true;

alter table public.cfo_side_profiles enable row level security;
alter table public.cfo_side_social_sources enable row level security;
alter table public.cfo_side_social_posts enable row level security;

insert into public.cfo_side_profiles (slug, name, public_signature, status, sort_order)
values ('les-carnets-de-bord', 'Les Carnets de bord', 'Cynthia & Géraldine', 'draft', 10)
on conflict (slug) do update set
  name = excluded.name,
  public_signature = excluded.public_signature,
  updated_at = now();