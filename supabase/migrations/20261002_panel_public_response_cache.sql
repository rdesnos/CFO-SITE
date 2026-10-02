create table if not exists cfo.panel_dashboard_cache (
 id boolean primary key default true check(id),
 payload jsonb not null,refreshed_at timestamptz not null default now()
);
alter table cfo.panel_dashboard_cache enable row level security;
revoke all on cfo.panel_dashboard_cache from public,anon,authenticated;
grant all on cfo.panel_dashboard_cache to service_role;
create or replace function cfo.refresh_panel_dashboard_cache()
returns void language sql security definer set search_path=pg_catalog,cfo as $$
 insert into cfo.panel_dashboard_cache(id,payload,refreshed_at)
 select true,coalesce(jsonb_agg(jsonb_build_object(
 'artist_id',artist_id,'artist_name',artist_name,'artist_slug',artist_slug,
 'spotify_monthly_listeners',spotify_monthly_listeners,
 'spotify_monthly_listeners_date',spotify_monthly_listeners_date,
 'spotify_followers',spotify_followers,'spotify_followers_date',spotify_followers_date,
 'social_followers_total',social_followers_total,
 'social_oldest_date',social_oldest_date,'social_latest_date',social_latest_date,
 'airplay_7d',airplay_7d,'airplay_prev_7d',airplay_prev_7d,
 'airplay_change_pct',airplay_change_pct,'latest_airplay_date',latest_airplay_date,
 'latest_data_date',latest_data_date,'data_status',data_status)
 order by case when artist_name='Marine' then 0 else 1 end,
 spotify_monthly_listeners desc nulls last,artist_name),'[]'::jsonb),now()
 from cfo.panel_snapshot
 on conflict(id) do update set payload=excluded.payload,refreshed_at=excluded.refreshed_at;
$$;
revoke all on function cfo.refresh_panel_dashboard_cache() from public,anon,authenticated;
grant execute on function cfo.refresh_panel_dashboard_cache() to service_role;
select cfo.refresh_panel_dashboard_cache();
create or replace function public.cfo_panel_snapshot_v1()
returns jsonb language sql stable security definer set search_path=pg_catalog,cfo as $$
 select coalesce((select payload from cfo.panel_dashboard_cache where id=true),'[]'::jsonb);
$$;
revoke all on function public.cfo_panel_snapshot_v1() from public;
grant execute on function public.cfo_panel_snapshot_v1() to anon,authenticated,service_role;
do $$
declare existing_job bigint;
begin
 select jobid into existing_job from cron.job where jobname='refresh-cfo-marine-dashboard-hourly';
 if existing_job is null then raise exception 'Existing dashboard refresh job missing';end if;
 perform cron.alter_job(existing_job,command:='select cfo.refresh_marine_dashboard_cache(); select cfo.refresh_panel_dashboard_cache();');
end;
$$;
