-- CFO Observatoire des salles - production baseline 2026-09-25
-- No secrets.

create table if not exists cfo.venue_ticket_status (
  event_id uuid primary key references public.cfo_events(id) on delete cascade,
  ticket_status text not null default 'unknown',
  ticket_url text,
  ticket_source_name text,
  status_source_url text,
  price_min numeric,
  price_max numeric,
  currency text not null default 'EUR',
  capacity_label text,
  capacity_source_url text,
  checked_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint venue_ticket_status_check
    check (ticket_status in ('on_sale','coming_soon','sold_out','unavailable','unknown'))
);

alter table cfo.venue_ticket_status enable row level security;

create or replace function public.cfo_salles_snapshot()
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
with rows as (
  select e.id,e.event_date,e.city,e.venue,e.title,e.verified as event_verified,
         e.source_name as event_source_name,e.source_url as event_source_url,
         s.ticket_status,s.ticket_url,s.ticket_source_name,s.status_source_url,
         s.price_min,s.price_max,s.currency,s.capacity_label,s.capacity_source_url,
         s.checked_at,
         greatest(0,floor(extract(epoch from (now()-s.checked_at))/86400))::int as freshness_days,
         case
           when s.checked_at is null then 'missing'
           when now()-s.checked_at <= interval '2 days' then 'fresh'
           when now()-s.checked_at <= interval '7 days' then 'aging'
           else 'stale'
         end as freshness_status,
         s.details
  from public.cfo_events e
  left join cfo.venue_ticket_status s on s.event_id=e.id
  where e.artist_slug='marine'
    and e.event_type='live'
    and e.publication_status='published'
    and e.event_date between date '2026-10-02' and date '2027-03-27'
  order by e.event_date
),
agg as (
  select count(*) as dates_count,
         count(*) filter (where capacity_label is not null and capacity_label <> 'À documenter') as capacities_documented,
         count(*) filter (where ticket_status='on_sale') as on_sale_count,
         count(*) filter (where ticket_status='sold_out') as sold_out_count,
         count(*) filter (where ticket_status='coming_soon') as coming_soon_count,
         count(*) filter (where freshness_status='fresh') as fresh_count,
         max(checked_at) as last_checked_at,
         min(checked_at) as oldest_checked_at
  from rows
)
select jsonb_build_object(
  'generated_at',now(),
  'stats',(select to_jsonb(agg) from agg),
  'items',coalesce((select jsonb_agg(to_jsonb(rows) order by event_date) from rows),'[]'::jsonb)
);
$$;

create or replace function public.cfo_salles_monitor_update(
  p_event_id uuid,
  p_status text,
  p_http_status integer,
  p_error text,
  p_checked_url text,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update cfo.venue_ticket_status
     set ticket_status = case
           when p_success and p_status in ('on_sale','coming_soon','sold_out','unavailable','unknown')
             then p_status
           else ticket_status
         end,
         checked_at = case when p_success then now() else checked_at end,
         details = coalesce(details,'{}'::jsonb)
           || jsonb_build_object(
                'last_http_status',p_http_status,
                'last_check_error',p_error,
                'last_checked_url',p_checked_url,
                'automatic_check',true,
                'automatic_check_at',now()
              ),
         updated_at = now()
   where event_id=p_event_id;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname='cfo-salles-refresh-4x-daily') then
    perform cron.unschedule('cfo-salles-refresh-4x-daily');
  end if;
  perform cron.schedule(
    'cfo-salles-refresh-4x-daily',
    '10 5,11,17,22 * * *',
    $cmd$select net.http_post(
      url := 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-salles-refresh',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object('scheduled_at',now()),
      timeout_milliseconds := 60000
    );$cmd$
  );
end
$$;
