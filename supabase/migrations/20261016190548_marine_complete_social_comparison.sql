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
    ) tiktok_prev,
    (select value_numeric from acquisition.metric_observations where artist_id=(select id from marine) and track_id is null and platform='facebook' and metric_type='followers' and observation_date=(select facebook_date-7 from metric_pack) order by acquired_at desc,id desc limit 1) facebook_prev,
    (select value_numeric from acquisition.metric_observations where artist_id=(select id from marine) and track_id is null and platform='youtube' and metric_type='followers' and observation_date=(select youtube_date-7 from metric_pack) order by acquired_at desc,id desc limit 1) youtube_prev
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
    select t.title, count(*)::int spins, count(distinct coalesce(rs.radio_uuid::text,rs.radio_slug))::int radios
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
    m.instagram+m.tiktok+m.facebook+m.youtube as social_total,
    p.instagram_prev+p.tiktok_prev+p.facebook_prev+p.youtube_prev as social_prev
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

