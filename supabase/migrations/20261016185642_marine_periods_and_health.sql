CREATE OR REPLACE FUNCTION public.cfo_marine_snapshot_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'acquisition', 'cfo', 'pg_temp'
AS $function$
with marine as (
  select id from acquisition.artists where slug='marine' limit 1
), anchor as materialized (select private.cfo_spotify_common_date('marine') d),
latest_metrics as (
  select distinct on (platform, metric_type)
    platform, metric_type, observation_date, value_numeric
  from acquisition.metric_observations
  where artist_id=(select id from marine)
    and track_id is null
    and value_numeric is not null
    and (
      (platform='spotify' and metric_type='monthly_listeners')
      or (platform in ('instagram','tiktok','facebook','youtube') and metric_type='followers')
    )
  order by platform, metric_type, observation_date desc, acquired_at desc
),
metric_pack as (
  select
    max(value_numeric) filter(where platform='spotify' and metric_type='monthly_listeners') as spotify_monthly,
    max(observation_date) filter(where platform='spotify' and metric_type='monthly_listeners') as spotify_date,
    max(value_numeric) filter(where platform='instagram' and metric_type='followers') as instagram,
    max(observation_date) filter(where platform='instagram' and metric_type='followers') as instagram_date,
    max(value_numeric) filter(where platform='tiktok' and metric_type='followers') as tiktok,
    max(observation_date) filter(where platform='tiktok' and metric_type='followers') as tiktok_date,
    max(value_numeric) filter(where platform='facebook' and metric_type='followers') as facebook,
    max(observation_date) filter(where platform='facebook' and metric_type='followers') as facebook_date,
    max(value_numeric) filter(where platform='youtube' and metric_type='followers') as youtube,
    max(observation_date) filter(where platform='youtube' and metric_type='followers') as youtube_date
  from latest_metrics
),
prev as (
  select
    (
      select value_numeric from acquisition.metric_observations
      where artist_id=(select id from marine)
        and track_id is null and platform='spotify' and metric_type='monthly_listeners'
        and observation_date = (select spotify_date-7 from metric_pack)
      order by observation_date desc, acquired_at desc limit 1
    ) spotify_prev,
    (
      select value_numeric from acquisition.metric_observations
      where artist_id=(select id from marine)
        and track_id is null and platform='instagram' and metric_type='followers'
        and observation_date = (select instagram_date-7 from metric_pack)
      order by observation_date desc, acquired_at desc limit 1
    ) instagram_prev,
    (
      select value_numeric from acquisition.metric_observations
      where artist_id=(select id from marine)
        and track_id is null and platform='tiktok' and metric_type='followers'
        and observation_date = (select tiktok_date-7 from metric_pack)
      order by observation_date desc, acquired_at desc limit 1
    ) tiktok_prev
),
track_snapshot as (
  select public.cfo_track_verified_snapshot('marine') as j
),
airplay as (
  select count(*) filter(where (rs.broadcast_at at time zone 'Europe/Paris')::date between d-6 and d) airplay_7d,
    count(*) filter(where (rs.broadcast_at at time zone 'Europe/Paris')::date between d-13 and d-7) airplay_prev_7d,
    round(100.0 * (count(*) filter(where (rs.broadcast_at at time zone 'Europe/Paris')::date between d-6 and d) -
      count(*) filter(where (rs.broadcast_at at time zone 'Europe/Paris')::date between d-13 and d-7)) /
      nullif(count(*) filter(where (rs.broadcast_at at time zone 'Europe/Paris')::date between d-13 and d-7),0),1) airplay_change_pct,
    d latest_data_date
  from acquisition.radio_spins rs cross join anchor p
  where rs.artist_id=(select id from marine)
    and rs.broadcast_at >= (d-13)::timestamp at time zone 'Europe/Paris'
    and rs.broadcast_at < (d+1)::timestamp at time zone 'Europe/Paris'
  group by d
),
radio7 as (
  select coalesce(jsonb_agg(jsonb_build_object('title',title,'spins_7d',spins) order by spins desc),'[]'::jsonb) j
  from (
    select t.title,count(*) spins from acquisition.radio_spins rs join acquisition.tracks t on t.id=rs.track_id
    cross join anchor p
    where rs.artist_id=(select id from marine)
      and rs.broadcast_at >= (d-6)::timestamp at time zone 'Europe/Paris'
      and rs.broadcast_at < (d+1)::timestamp at time zone 'Europe/Paris'
    group by t.title order by count(*) desc limit 12
  ) q
),
radio30 as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'title', q.title,
    'spins_30d', q.spins,
    'radios_30d', q.radios
  ) order by q.spins desc),'[]'::jsonb) as j
  from (
    select t.title, count(*)::int spins, count(distinct rs.radio_uuid)::int radios
    from acquisition.radio_spins rs
    join acquisition.tracks t on t.id=rs.track_id
    where rs.artist_id=(select id from marine)
      and rs.broadcast_at >= now() - interval '30 days'
    group by t.title
    order by count(*) desc
    limit 12
  ) q
),
cert as (
  select jsonb_build_object(
    'title', title,
    'current_level', current_level,
    'certified_on', certified_on,
    'current_threshold', current_threshold,
    'official_unit', official_unit,
    'cockpit_readiness', cockpit_readiness
  ) as j
  from cfo.cockpit_certification_status
  where artist_name='Marine' and title='Ma faute'
  limit 1
),
calc as (
  select m.*, p.*,
    coalesce(m.instagram,0)+coalesce(m.tiktok,0)+coalesce(m.facebook,0)+coalesce(m.youtube,0) as social_total,
    coalesce(p.instagram_prev,m.instagram,0)+coalesce(p.tiktok_prev,m.tiktok,0)+coalesce(m.facebook,0)+coalesce(m.youtube,0) as social_prev
  from metric_pack m cross join prev p
)
select jsonb_build_object(
  'generated_at', now(),
  'contract_version', 'marine-snapshot-1.1',
  'quality', jsonb_build_object(
    'principle','Données qualifiées, datées et sourcées avant exposition.',
    'streaming_verified', coalesce(((track_snapshot.j->'summary'->>'verified')::boolean),false),
    'streaming_source', track_snapshot.j->'summary'->>'source',
    'streaming_observation_date', track_snapshot.j->'summary'->>'observation_date',
    'tracked_titles', (track_snapshot.j->'summary'->>'tracked_titles')::int,
    'verified_titles', (track_snapshot.j->'summary'->>'verified_titles')::int
  ),
  'audience', jsonb_build_object(
    'spotify_monthly_listeners', c.spotify_monthly,
    'observation_date', c.spotify_date,
    'previous_7d', c.spotify_prev,
    'change_7d_pct', case when c.spotify_prev is null or c.spotify_prev=0 then null
      else round(((c.spotify_monthly-c.spotify_prev)/c.spotify_prev)*100,1) end,
    'source','Soundcharts'
  ),
  'streaming', track_snapshot.j->'summary',
  'airplay', jsonb_build_object(
    'spins_7d', airplay.airplay_7d,
    'previous_7d', airplay.airplay_prev_7d,
    'change_7d_pct', airplay.airplay_change_pct,
    'latest_data_date', airplay.latest_data_date,
    'top_30d', radio30.j,
    'top_7d',(select j from radio7),
    'period_start',airplay.latest_data_date-6,
    'period_end',airplay.latest_data_date,
    'source','Soundcharts / CFO'
  ),
  'social', jsonb_build_object(
    'total', c.social_total,
    'previous_7d', c.social_prev,
    'change_7d_pct', case when c.social_prev=0 then null else round(((c.social_total-c.social_prev)/c.social_prev)*100,1) end,
    'instagram', c.instagram,
    'instagram_date', c.instagram_date,
    'instagram_change_7d_pct', case when c.instagram_prev is null or c.instagram_prev=0 then null else round(((c.instagram-c.instagram_prev)/c.instagram_prev)*100,1) end,
    'tiktok', c.tiktok,
    'tiktok_date', c.tiktok_date,
    'tiktok_change_7d_pct', case when c.tiktok_prev is null or c.tiktok_prev=0 then null else round(((c.tiktok-c.tiktok_prev)/c.tiktok_prev)*100,1) end,
    'facebook', c.facebook,
    'facebook_date', c.facebook_date,
    'youtube', c.youtube,
    'youtube_date', c.youtube_date,
    'source','Soundcharts'
  ),
  'tracks', track_snapshot.j->'tracks',
  'certification', coalesce(cert.j,'{}'::jsonb)
)
from calc c
cross join track_snapshot
left join airplay on true
cross join radio30
left join cert on true;
$function$
;
CREATE OR REPLACE FUNCTION public.cfo_marine_chart_series_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'acquisition', 'pg_temp'
AS $function$
with marine as (
  select id from acquisition.artists where slug='marine' limit 1
), anchor as materialized (select private.cfo_spotify_common_date('marine') d),
audience as (
  select jsonb_agg(jsonb_build_object('date',observation_date,'value',value_numeric) order by observation_date) as j
  from (
    select distinct on (observation_date) observation_date, value_numeric
    from acquisition.metric_observations
    where artist_id=(select id from marine)
      and track_id is null
      and platform='spotify'
      and metric_type='monthly_listeners'
      and value_numeric is not null
    order by observation_date desc, acquired_at desc
    limit 10
  ) q
),
instagram as (
  select jsonb_agg(jsonb_build_object('date',observation_date,'value',value_numeric) order by observation_date) as j
  from (
    select distinct on (observation_date) observation_date, value_numeric
    from acquisition.metric_observations
    where artist_id=(select id from marine)
      and track_id is null
      and platform='instagram'
      and metric_type='followers'
      and value_numeric is not null
    order by observation_date desc, acquired_at desc
    limit 7
  ) q
),
tiktok as (
  select jsonb_agg(jsonb_build_object('date',observation_date,'value',value_numeric) order by observation_date) as j
  from (
    select distinct on (observation_date) observation_date, value_numeric
    from acquisition.metric_observations
    where artist_id=(select id from marine)
      and track_id is null
      and platform='tiktok'
      and metric_type='followers'
      and value_numeric is not null
    order by observation_date desc, acquired_at desc
    limit 7
  ) q
),
airplay as (
  select jsonb_agg(jsonb_build_object('date',d,'value',spins) order by d) as j
  from (
    select (broadcast_at at time zone 'Europe/Paris')::date d, count(*)::int spins
    from acquisition.radio_spins
    where artist_id=(select id from marine)
      and broadcast_at >= ((select d from anchor)-6)::timestamp at time zone 'Europe/Paris'
      and broadcast_at < ((select d from anchor)+1)::timestamp at time zone 'Europe/Paris'
    group by 1
    order by 1
  ) q
),
streaming as (
  with tracked as (
    select t.id
    from acquisition.tracks t
    where t.primary_artist_id=(select id from marine)
      and t.is_active and t.acquisition_enabled
      and exists(select 1 from acquisition.soundcharts_track_qualification q where q.track_id=t.id and q.include_in_cfo_metrics and q.qualification_status='include')
      and coalesce((t.metadata->'cfo_observatoire'->>'canonical_for_total')::boolean,true)
  ),
  daily as (
    select o.track_id,o.observation_date,
           (array_agg(o.value_numeric order by o.acquired_at desc,o.id desc))[1] as value_numeric
    from acquisition.metric_observations o
    join tracked t on t.id=o.track_id
    where o.source_code='soundcharts'
      and o.platform='spotify'
      and o.metric_type='streams_total'
      and o.raw_response_id is not null
      and o.ingestion_run_id is not null
      and o.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb
      and o.observation_date between (select d from anchor)-7 and (select d from anchor)
    group by o.track_id,o.observation_date
  ),
  deltas as (
    select track_id,observation_date,
           case when observation_date-lag(observation_date) over(partition by track_id order by observation_date)=1
           then value_numeric - lag(value_numeric) over(partition by track_id order by observation_date) end as delta
    from daily
  ),
  agg as (
    select observation_date, round(sum(delta))::bigint as value
    from deltas
    where delta is not null
    group by observation_date
    having count(*)=(select count(*) from tracked)
    order by observation_date desc
    limit 7
  )
  select jsonb_agg(jsonb_build_object('date',observation_date,'value',value) order by observation_date) as j
  from agg
)
select jsonb_build_object(
  'audience_spotify', coalesce((select j from audience),'[]'::jsonb),
  'streaming_daily', coalesce((select j from streaming),'[]'::jsonb),
  'airplay_daily', coalesce((select j from airplay),'[]'::jsonb),
  'tiktok_followers', coalesce((select j from tiktok),'[]'::jsonb),
  'instagram_followers', coalesce((select j from instagram),'[]'::jsonb)
);
$function$
;
CREATE OR REPLACE FUNCTION private.refresh_cfo_marine_data_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_artist uuid;
  v_core_artist uuid;
  v_checked timestamptz := now();
begin
  select id into v_artist
  from acquisition.artists
  where slug='marine'
  limit 1;

  select id into v_core_artist
  from core.artists
  where slug='marine'
  limit 1;

  if v_artist is null then
    raise exception 'Marine acquisition artist not found';
  end if;

  with included_tracks as (
    select t.id
    from acquisition.tracks t
    join acquisition.soundcharts_track_qualification q
      on q.track_id=t.id
     and q.include_in_cfo_metrics is true
    where t.primary_artist_id=v_artist
      and t.is_active
      and t.acquisition_enabled
  ),
  track_latest as (
    select it.id, max(m.observation_date) as last_date
    from included_tracks it
    left join acquisition.metric_observations m
      on m.track_id=it.id
     and m.platform='spotify'
     and m.metric_type='streams_total'
    group by it.id
  ),
  shazam_latest as (
    select it.id,max(m.observation_date) last_date from included_tracks it
    left join acquisition.metric_observations m on m.track_id=it.id and m.platform='shazam' and m.metric_type='shazam_count'
    group by it.id
  ),
  obs as (
    select distinct on(m.platform,m.metric_type) m.platform,m.metric_type,
      m.observation_date latest_date,m.acquired_at latest_acquired_at
    from acquisition.metric_observations m
    where m.artist_id=v_artist and m.track_id is null
    order by m.platform,m.metric_type,m.observation_date desc,m.acquired_at desc,m.id desc
  ),
  metrics(metric_key,source_code,platform,metric_type,expected_lag,latest_date,last_acquired_at,details) as (
    select 'spotify_track_streams','soundcharts','spotify','streams_total',1,
           (select case when count(last_date)=count(*) then min(last_date) end from track_latest),
           (select max(m.acquired_at)
              from acquisition.metric_observations m
              where m.artist_id=v_artist
                and m.platform='spotify'
                and m.metric_type='streams_total'
                and m.observation_date=(select case when count(last_date)=count(*) then min(last_date) end from track_latest)),
           jsonb_build_object(
             'included_tracks',(select count(*) from included_tracks),
             'tracks_at_latest',(select count(*) from track_latest where last_date=(select case when count(last_date)=count(*) then min(last_date) end from track_latest))
           )
    union all
    select 'spotify_monthly_listeners','soundcharts','spotify','monthly_listeners',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='spotify' and o.metric_type='monthly_listeners'
    union all
    select 'spotify_followers','soundcharts','spotify','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='spotify' and o.metric_type='followers'
    union all
    select 'deezer_followers','soundcharts','deezer','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='deezer' and o.metric_type='followers'
    union all
    select 'instagram_followers','soundcharts','instagram','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='instagram' and o.metric_type='followers'
    union all
    select 'tiktok_followers','soundcharts','tiktok','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='tiktok' and o.metric_type='followers'
    union all
    select 'youtube_followers','soundcharts','youtube','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='youtube' and o.metric_type='followers'
    union all
    select 'youtube_views_total','soundcharts','youtube','views_total',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='youtube' and o.metric_type='views_total'
    union all
    select 'youtube_views_daily','soundcharts','youtube','views_daily',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='youtube' and o.metric_type='views_daily'
    union all
    select 'facebook_followers','soundcharts','facebook','followers',1,
           o.latest_date,o.latest_acquired_at,'{}'::jsonb
      from obs o where o.platform='facebook' and o.metric_type='followers'
    union all
    select 'airplay_fr','soundcharts','radio','broadcasts',1,
           max((rs.broadcast_at at time zone 'Europe/Paris')::date),
           max(rs.acquired_at),
           jsonb_build_object('included_track_scope',true)
      from acquisition.radio_spins rs
      join included_tracks it on it.id=rs.track_id
      where rs.artist_id=v_artist
    union all
    select 'shazam_refresh_run','soundcharts','shazam','refresh_run',1,
           max(s.finished_at::date),
           max(s.finished_at),
           jsonb_build_object('last_run_status',(array_agg(s.status order by s.started_at desc))[1])
      from acquisition.soundcharts_daily_runs s
      where s.dataset='track_shazam' and s.status='success'
    union all
    select 'shazam_observation_latest','soundcharts','shazam','shazam_count',3,
           max(m.observation_date),
           max(m.acquired_at),
           jsonb_build_object('expected_tracks',(select count(*) from included_tracks),
             'tracks_with_observations',count(distinct m.track_id),
             'fresh_tracks',(select count(*) from shazam_latest where last_date>=current_date-3),
             'missing_tracks',(select count(*) from shazam_latest where last_date is null),
             'oldest_track_date',(select min(last_date) from shazam_latest))
      from acquisition.metric_observations m
      join included_tracks it on it.id=m.track_id
      where m.platform='shazam' and m.metric_type='shazam_count'
    union all
    select 'mgp_trajectory','cfo','mgp','trajectory',1,
           max(t.observation_date),
           max(t.updated_at),
           '{}'::jsonb
      from cfo.trajectories t
      where t.artist_id=v_core_artist
  ),
  prepared as (
    select
      'marine'::text as artist_slug,
      metric_key,source_code,platform,metric_type,expected_lag,
      latest_date,
      case when latest_date is null then null else current_date-latest_date end as lag_days,
      case
        when latest_date is null then 'missing'
        when metric_key='shazam_observation_latest' and (details->>'fresh_tracks')::int < (details->>'expected_tracks')::int then 'lagging'
        when current_date-latest_date <= expected_lag then 'fresh'
        when current_date-latest_date <= expected_lag+2 then 'lagging'
        else 'stale'
      end as freshness_status,
      last_acquired_at,
      v_checked as checked_at,
      details
    from metrics
  )
  insert into cfo.data_pipeline_health(
    artist_slug,metric_key,source_code,platform,metric_type,
    expected_max_lag_days,latest_observation_date,lag_days,
    freshness_status,last_acquired_at,checked_at,details
  )
  select
    artist_slug,metric_key,source_code,platform,metric_type,
    expected_lag,latest_date,lag_days,
    freshness_status,last_acquired_at,checked_at,details
  from prepared
  on conflict (artist_slug,metric_key) do update
    set source_code=excluded.source_code,
        platform=excluded.platform,
        metric_type=excluded.metric_type,
        expected_max_lag_days=excluded.expected_max_lag_days,
        latest_observation_date=excluded.latest_observation_date,
        lag_days=excluded.lag_days,
        freshness_status=excluded.freshness_status,
        last_acquired_at=excluded.last_acquired_at,
        checked_at=excluded.checked_at,
        details=excluded.details;

  return public.cfo_marine_data_health();
end;
$function$
;
create or replace function public.cfo_marine_shazam_snapshot()
returns jsonb language sql stable security definer set search_path='' as $fn$
select coalesce(jsonb_agg(jsonb_build_object(
 'track_id',t.id,'title',t.title,'date',m.observation_date,'value',m.value_numeric,
 'raw_response_id',m.raw_response_id,'source','Soundcharts','previous_date',p.observation_date,
 'previous_value',p.value_numeric,
 'change_30d',case when p.value_numeric is not null then m.value_numeric-p.value_numeric end,
 'change_30d_pct',case when p.value_numeric>0 then round(100*(m.value_numeric-p.value_numeric)/p.value_numeric,2) end,
 'freshness_status',case when m.observation_date is null then 'missing' when current_date-m.observation_date<=3 then 'fresh' else 'stale' end
) order by t.title),'[]'::jsonb)
from acquisition.tracks t join acquisition.artists a on a.id=t.primary_artist_id
join acquisition.soundcharts_track_qualification q on q.track_id=t.id
left join lateral(
 select observation_date,value_numeric,raw_response_id from acquisition.metric_observations m
 where m.track_id=t.id and m.source_code='soundcharts' and m.platform='shazam' and m.metric_type='shazam_count'
 and not m.is_interpolated order by m.observation_date desc,m.acquired_at desc,m.id desc limit 1
) m on true
left join lateral(
 select observation_date,value_numeric from acquisition.metric_observations p
 where p.track_id=t.id and p.source_code='soundcharts' and p.platform='shazam' and p.metric_type='shazam_count'
 and not p.is_interpolated and p.observation_date=m.observation_date-30 order by p.acquired_at desc,p.id desc limit 1
) p on true
where a.slug='marine' and t.is_active and t.acquisition_enabled and q.include_in_cfo_metrics and q.qualification_status='include';
$fn$;
revoke all on function public.cfo_marine_shazam_snapshot() from public;
grant execute on function public.cfo_marine_shazam_snapshot() to anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION cfo.refresh_marine_dashboard_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cfo', 'pg_temp'
AS $function$
declare
  snap jsonb;
  series jsonb;
begin
  snap := public.cfo_marine_snapshot_v1();
  series := public.cfo_marine_chart_series_v1();

  insert into cfo.marine_dashboard_cache(id,payload,refreshed_at)
  values (
    true,
    jsonb_build_object(
      'marine', snap,
      'series', series,
      'generated_at', now(),
      'contract_version', 'marine-dashboard-cache-1.2',
      'metrics_30d', public.cfo_marine_metric_changes_30d(),
      'shazam',public.cfo_marine_shazam_snapshot(),
      'data_health',public.cfo_marine_data_health(),
      'provenance',jsonb_build_object(
        'streaming_scope','soundcharts_track_qualification.include_in_cfo_metrics',
        'streaming_date',snap#>>'{streaming,observation_date}',
        'tables',jsonb_build_array('acquisition.metric_observations','acquisition.radio_spins'),
        'youtube_last_crawl_date',(
          select r.response_payload#>>'{related,lastCrawlDate}' from acquisition.raw_api_responses r
          join acquisition.artists a on a.id=r.artist_id
          where a.slug='marine' and r.endpoint_name='streaming_youtube' and r.http_status=200
          order by r.received_at desc,r.id desc limit 1
        )
      )
    ),
    now()
  )
  on conflict (id) do update
    set payload = excluded.payload,
        refreshed_at = excluded.refreshed_at;
end;
$function$
;

