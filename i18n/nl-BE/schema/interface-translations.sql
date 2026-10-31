create table public.cfo_interface_translations (
  source_key text not null,
  locale text not null check (locale ~ '^[a-z]{2,3}-[A-Z]{2}$'),
  source_revision text not null,
  source_hash text not null,
  translated_labels jsonb not null check (jsonb_typeof(translated_labels)='object'),
  status text not null default 'review' check (status in ('draft','review','approved','published','stale')),
  reviewed_at timestamptz,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (source_key,locale)
);
alter table public.cfo_interface_translations enable row level security;
revoke all on public.cfo_interface_translations from anon,authenticated;
grant select on public.cfo_interface_translations to anon,authenticated;
create policy "Public reads published interface labels"
on public.cfo_interface_translations for select to anon,authenticated using (status='published');
create policy "CFO server previews Dutch interface labels"
on public.cfo_interface_translations for select to anon
using (locale='nl-BE' and status in ('review','approved') and (select private.wp_sync_authorized()));
