-- Use the qualified catalogue and one complete observation date for every title.
create or replace function private.cfo_spotify_common_date(p_artist_slug text,p_until date default current_date)
returns date language sql stable security definer set search_path='' as $fn$
with scope as (
 select t.id from acquisition.tracks t
 join acquisition.artists a on a.id=t.primary_artist_id
 join acquisition.soundcharts_track_qualification q on q.track_id=t.id
 where a.slug=p_artist_slug and a.is_active and a.acquisition_enabled
 and t.is_active and t.acquisition_enabled and q.include_in_cfo_metrics and q.qualification_status='include'
), complete as (
 select o.observation_date from acquisition.metric_observations o join scope s on s.id=o.track_id
 where o.source_code='soundcharts' and o.platform='spotify' and o.metric_type='streams_total'
 and o.observation_date<=p_until and o.observation_date>=p_until-90
 and not o.is_interpolated and o.raw_response_id is not null and o.ingestion_run_id is not null
 and o.value_numeric is not null
 and o.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb
 group by o.observation_date having count(distinct o.track_id)=(select count(*) from scope)
)
select max(observation_date) from complete where observation_date-7 in(select observation_date from complete)
 and observation_date-14 in(select observation_date from complete);
$fn$;
revoke all on function private.cfo_spotify_common_date(text,date) from public,anon,authenticated;
grant execute on function private.cfo_spotify_common_date(text,date) to service_role;

CREATE OR REPLACE FUNCTION public.cfo_track_verified_snapshot(p_artist_slug text DEFAULT 'marine'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'acquisition', 'pg_temp'
AS $function$
with anchor as materialized (select private.cfo_spotify_common_date(p_artist_slug) d), tracked as (
  select
    t.id,
    t.title,
    t.release_date,
    coalesce(t.metadata->'cfo_observatoire'->>'label', t.title) as display_label,
    coalesce(t.metadata->'cfo_observatoire'->>'group', 'other') as cfo_group,
    coalesce((t.metadata->'cfo_observatoire'->>'canonical_for_total')::boolean, true) as canonical_for_total,
    t.metadata->'cfo_observatoire'->>'counting_note' as counting_note,
    t.metadata->'cfo_soundcharts'->>'spotify_identifier' as platform_identifier,
    t.metadata->'cfo_soundcharts'->>'last_synchronized_at' as last_synchronized_at
  from acquisition.tracks t
  join acquisition.artists a on a.id = t.primary_artist_id
  where a.slug = p_artist_slug
    and a.is_active
    and a.acquisition_enabled
    and t.is_active
    and t.acquisition_enabled
    and exists(select 1 from acquisition.soundcharts_track_qualification q where q.track_id=t.id and q.include_in_cfo_metrics and q.qualification_status='include')
), verified as (
  select
    o.track_id,
    o.observation_date,
    o.value_numeric,
    o.acquired_at
  from acquisition.metric_observations o
  join tracked t on t.id = o.track_id
  where o.source_code = 'soundcharts'
    and o.platform = 'spotify'
    and o.metric_type = 'streams_total'
    and o.raw_response_id is not null
    and o.ingestion_run_id is not null
    and o.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb
), stats as (
  select
    t.*,
    latest.observation_date,
    latest.value_numeric as current_streams,
    case when d7.value_numeric is not null then latest.value_numeric - d7.value_numeric end as weekly_current,
    case when d7.value_numeric is not null and d14.value_numeric is not null then d7.value_numeric - d14.value_numeric end as weekly_previous,
    case when d7.value_numeric is not null and d14.value_numeric is not null
      then (latest.value_numeric - d7.value_numeric) - (d7.value_numeric - d14.value_numeric)
    end as weekly_delta,
    case when d7.value_numeric is not null and d14.value_numeric is not null and d7.value_numeric <> d14.value_numeric
      then round(((latest.value_numeric - d7.value_numeric) - (d7.value_numeric - d14.value_numeric)) * 100.0 / nullif(d7.value_numeric - d14.value_numeric, 0), 1)
    end as weekly_rate,
    case when d7.value_numeric is not null then round((latest.value_numeric - d7.value_numeric) / 7.0) end as mm7,
    case when d14.value_numeric is not null then round((latest.value_numeric - d14.value_numeric) / 14.0) end as mm14,
    case when d30.value_numeric is not null then round((latest.value_numeric - d30.value_numeric) / 30.0) end as mm30,
    coalesce(counts.observation_count, 0) as observation_count
  from tracked t
  left join lateral (
    select v.observation_date, v.value_numeric
    from verified v where v.track_id = t.id and v.observation_date=(select d from anchor)
    order by v.observation_date desc, v.acquired_at desc limit 1
  ) latest on true
  left join lateral (
    select v.value_numeric from verified v
    where v.track_id = t.id and v.observation_date = latest.observation_date - 7
    order by v.observation_date desc, v.acquired_at desc limit 1
  ) d7 on true
  left join lateral (
    select v.value_numeric from verified v
    where v.track_id = t.id and v.observation_date = latest.observation_date - 14
    order by v.observation_date desc, v.acquired_at desc limit 1
  ) d14 on true
  left join lateral (
    select v.value_numeric from verified v
    where v.track_id = t.id and v.observation_date = latest.observation_date - 30
    order by v.observation_date desc, v.acquired_at desc limit 1
  ) d30 on true
  left join lateral (
    select count(*)::integer as observation_count from verified v where v.track_id = t.id
  ) counts on true
), ordered as (
  select s.*,
    case s.cfo_group when 'album' then 1 when 'collaboration' then 2 when 'ma_faute_version' then 3 else 4 end as group_order
  from stats s
)
select jsonb_build_object(
  'tracks', coalesce((
    select jsonb_agg(jsonb_build_object(
      'track_id', id,
      'artist', 'Marine',
      'title', title,
      'display_label', display_label,
      'cfo_group', cfo_group,
      'canonical_for_total', canonical_for_total,
      'counting_note', counting_note,
      'release_date', release_date,
      'observation_date', observation_date,
      'current_streams', current_streams,
      'weekly_current', weekly_current,
      'weekly_previous', weekly_previous,
      'weekly_delta', weekly_delta,
      'weekly_rate', weekly_rate,
      'mm7', mm7,
      'mm14', mm14,
      'mm30', mm30,
      'observation_count', observation_count,
      'platform_identifier', platform_identifier,
      'last_synchronized_at', last_synchronized_at,
      'source', 'Soundcharts',
      'verified', observation_date is not null
    ) order by group_order, release_date, display_label)
    from ordered
  ), '[]'::jsonb),
  'summary', coalesce((
    select jsonb_build_object(
      'tracked_titles', count(*),
      'verified_titles', count(*) filter (where observation_date is not null),
      'observation_date', max(observation_date),
      'current_streams', case when count(*) filter(where canonical_for_total)=count(current_streams) filter(where canonical_for_total) then sum(current_streams) filter (where canonical_for_total) end,
      'weekly_current', sum(weekly_current) filter (where canonical_for_total),
      'weekly_previous', sum(weekly_previous) filter (where canonical_for_total),
      'weekly_delta', (sum(weekly_current) filter (where canonical_for_total)) - (sum(weekly_previous) filter (where canonical_for_total)),
      'weekly_rate', case when sum(weekly_previous) filter (where canonical_for_total) <> 0
        then round(((sum(weekly_current) filter (where canonical_for_total)) - (sum(weekly_previous) filter (where canonical_for_total))) * 100.0 /
          nullif(sum(weekly_previous) filter (where canonical_for_total), 0), 1)
      end,
      'mm7', round(sum(weekly_current) filter (where canonical_for_total) / 7.0),
      'scope', 'soundcharts_track_qualification.include_in_cfo_metrics',
      'period_start', min(observation_date)-6,
      'period_end', min(observation_date),
      'source', 'Soundcharts',
      'verified', count(*) = count(*) filter (where observation_date is not null)
    ) from ordered
  ), '{}'::jsonb)
);
$function$;

CREATE OR REPLACE FUNCTION private.cfo_streaming_family_snapshot(p_artist_slug text, p_period_end date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with a as (
  select id
  from acquisition.artists
  where slug = p_artist_slug
  limit 1
),
p as (
  select private.cfo_spotify_common_date(p_artist_slug,coalesce(p_period_end,current_date)) as period_end
),
q as (
  select
    t.id,
    t.title,
    t.release_date,
    case
      when t.title = 'Tricheur' then 'Tricheur'
      when t.title in ('Coeur maladroit','Coeur maladroit - Live Session @Artistic Palace') then 'Cœur maladroit'
      when lower(t.title) like 'ma faute%' then 'Ma faute'
      when lower(t.title) like 'restes d''averses%' then 'Restes d’averses'
      when t.title = 'Escroc' then 'Escroc'
      when t.title = 'On m''avait dit' then 'On m’avait dit'
      when t.title like 'Princesse chaos%' then 'Princesse chaos'
      else null
    end as family
  from acquisition.tracks t
  join acquisition.soundcharts_track_qualification qual
    on qual.track_id = t.id
   and qual.include_in_cfo_metrics = true
   and qual.qualification_status='include'
  where t.primary_artist_id = (select id from a) and t.is_active and t.acquisition_enabled
),
targets as (
  select 0 as days_back
  union all select 7
  union all select 14
  union all select 30
),
track_values as (
  select
    q.id,
    q.family,
    q.release_date,
    tg.days_back,
    (
        select mo.value_numeric from acquisition.metric_observations mo
        where mo.track_id=q.id and mo.source_code='soundcharts' and mo.platform='spotify'
          and mo.metric_type='streams_total' and not mo.is_interpolated
          and mo.raw_response_id is not null and mo.ingestion_run_id is not null
          and mo.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb
          and mo.observation_date=(select period_end from p)-tg.days_back
        order by mo.acquired_at desc,mo.id desc limit 1
    ) as value_numeric
  from q
  cross join targets tg
),
family_sums as (
  select
    family,
    min(release_date) as min_release_date,
    days_back,
    case when count(value_numeric)=count(*) then sum(value_numeric)::bigint end as total
  from track_values
  where family is not null
  group by family, days_back
),
family_pivot as (
  select
    family,
    min(min_release_date) as min_release_date,
    max(total) filter (where days_back=0) as cur,
    max(total) filter (where days_back=7) as d7,
    max(total) filter (where days_back=14) as d14,
    max(total) filter (where days_back=30) as d30
  from family_sums
  group by family
),
family_json as (
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'family', family,
      'current', cur,
      'weekly_current', cur-d7,
      'weekly_previous', d7-d14,
      'weekly_rate', round(100.0*((cur-d7)-(d7-d14))/nullif((d7-d14),0),1),
      'mm7', round((cur-d7)/7.0),
      'mm14', round((cur-d14)/14.0),
      'mm30', case
        when min_release_date <= (select period_end from p)-30
        then round((cur-d30)/30.0)
        else null
      end,
      'release_date', min_release_date
    )
    order by case family
      when 'Tricheur' then 1
      when 'Cœur maladroit' then 2
      when 'Ma faute' then 3
      when 'Restes d’averses' then 4
      when 'Escroc' then 5
      when 'On m’avait dit' then 6
      when 'Princesse chaos' then 7
      else 99 end
  ),'[]'::jsonb) as data
  from family_pivot
),
global_sums as (
  select days_back, case when count(value_numeric)=count(*) then sum(value_numeric)::bigint end as total
  from track_values
  group by days_back
),
global_pivot as (
  select
    max(total) filter (where days_back=0) as cur,
    max(total) filter (where days_back=7) as d7,
    max(total) filter (where days_back=14) as d14,
    max(total) filter (where days_back=30) as d30
  from global_sums
)
select jsonb_build_object(
  'period_end',(select period_end from p),
  'scope','soundcharts_track_qualification.include_in_cfo_metrics',
  'expected_tracks',(select count(*) from q),
  'families',(select data from family_json),
  'catalogue',(
    select jsonb_build_object(
      'current',cur,
      'weekly_current',cur-d7,
      'weekly_previous',d7-d14,
      'weekly_rate',round(100.0*((cur-d7)-(d7-d14))/nullif((d7-d14),0),1),
      'mm7',round((cur-d7)/7.0),
      'mm14',round((cur-d14)/14.0),
      'mm30',round((cur-d30)/30.0)
    )
    from global_pivot
  )
)
$function$;

CREATE OR REPLACE FUNCTION private.refresh_cfo_home_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'acquisition', 'private'
AS $function$
declare
  v_payload jsonb;
  v_period_end date;
begin
  with params as (
    select
      a.id as artist_id,
      private.cfo_spotify_common_date('marine') as period_end
    from acquisition.artists a
    where lower(a.name)='marine'
    limit 1
  ),
  q_tracks as (
    select t.id,t.title,t.isrc
    from acquisition.tracks t
    join acquisition.soundcharts_track_qualification q on q.track_id=t.id
    join params p on p.artist_id=t.primary_artist_id
    where q.include_in_cfo_metrics is true and q.qualification_status='include' and t.is_active and t.acquisition_enabled
      and t.is_active is true
      and t.acquisition_enabled is true
      and coalesce((t.metadata->'cfo_observatoire'->>'included')::boolean, false) is true
  ),
  track_week as (
    select qt.id,qt.title,qt.isrc,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date=p.period_end
        and mo.raw_response_id is not null and mo.ingestion_run_id is not null and not mo.is_interpolated and mo.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb order by mo.observation_date desc,mo.acquired_at desc limit 1),null) as v_end,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date=p.period_end-7
        and mo.raw_response_id is not null and mo.ingestion_run_id is not null and not mo.is_interpolated and mo.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb order by mo.observation_date desc,mo.acquired_at desc limit 1),null) as v_prev_end,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date=p.period_end-14
        and mo.raw_response_id is not null and mo.ingestion_run_id is not null and not mo.is_interpolated and mo.dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb order by mo.observation_date desc,mo.acquired_at desc limit 1),null) as v_prev2_end
    from q_tracks qt
  ),
  track_delta as (
    select *,
      v_end-v_prev_end as cur,
      v_prev_end-v_prev2_end as prev
    from track_week
  ),
  streams as (
    select case when count(cur)=count(*) then sum(cur) end cur,case when count(prev)=count(*) then sum(prev) end prev,case when count(v_end)=count(*) then sum(v_end) end cumulative
    from track_delta
  ),
  artist_metric as (
    select
      max(value_numeric) filter (where platform='spotify' and metric_type='monthly_listeners' and observation_date=(select max(observation_date) from acquisition.metric_observations m2 where m2.artist_id=p.artist_id and m2.platform='spotify' and m2.metric_type='monthly_listeners' and m2.observation_date<=p.period_end)) as sp_monthly,
      (select value_numeric from acquisition.metric_observations m3 where m3.artist_id=p.artist_id and m3.platform='spotify' and m3.metric_type='monthly_listeners' and m3.observation_date<=((select max(observation_date) from acquisition.metric_observations m4 where m4.artist_id=p.artist_id and m4.platform='spotify' and m4.metric_type='monthly_listeners' and m4.observation_date<=p.period_end)-7) order by observation_date desc, acquired_at desc limit 1) as sp_monthly_prev,
      max(value_numeric) filter (where platform='youtube' and metric_type='views_daily' and observation_date=(select max(observation_date) from acquisition.metric_observations m5 where m5.artist_id=p.artist_id and m5.platform='youtube' and m5.metric_type='views_daily' and m5.observation_date<=p.period_end)) as yt_daily,
      (select value_numeric from acquisition.metric_observations m6 where m6.artist_id=p.artist_id and m6.platform='youtube' and m6.metric_type='views_daily' and m6.observation_date<=((select max(observation_date) from acquisition.metric_observations m7 where m7.artist_id=p.artist_id and m7.platform='youtube' and m7.metric_type='views_daily' and m7.observation_date<=p.period_end)-7) order by observation_date desc, acquired_at desc limit 1) as yt_daily_prev,
      max(value_numeric) filter (where platform='instagram' and metric_type='followers' and observation_date=(select max(observation_date) from acquisition.metric_observations m8 where m8.artist_id=p.artist_id and m8.platform='instagram' and m8.metric_type='followers' and m8.observation_date<=p.period_end)) as ig_followers,
      (select max(observation_date) from acquisition.metric_observations m8d where m8d.artist_id=p.artist_id and m8d.platform='instagram' and m8d.metric_type='followers' and m8d.observation_date<=p.period_end) as ig_followers_date,
      (select value_numeric from acquisition.metric_observations m9 where m9.artist_id=p.artist_id and m9.platform='instagram' and m9.metric_type='followers' and m9.observation_date<=((select max(observation_date) from acquisition.metric_observations m10 where m10.artist_id=p.artist_id and m10.platform='instagram' and m10.metric_type='followers' and m10.observation_date<=p.period_end)-7) order by observation_date desc, acquired_at desc limit 1) as ig_followers_prev,
      (select observation_date from acquisition.metric_observations m9d where m9d.artist_id=p.artist_id and m9d.platform='instagram' and m9d.metric_type='followers' and m9d.observation_date<=((select max(observation_date) from acquisition.metric_observations m10d where m10d.artist_id=p.artist_id and m10d.platform='instagram' and m10d.metric_type='followers' and m10d.observation_date<=p.period_end)-7) order by observation_date desc, acquired_at desc limit 1) as ig_followers_prev_date
    from acquisition.metric_observations mo
    cross join params p
    where mo.artist_id=p.artist_id
    group by p.artist_id,p.period_end
  ),
  airplay as (
   select
     count(*) filter(where date(rs.broadcast_at at time zone 'Europe/Paris') between p.period_end-6 and p.period_end) as cur,
     count(*) filter(where date(rs.broadcast_at at time zone 'Europe/Paris') between p.period_end-13 and p.period_end-7) as prev
   from acquisition.radio_spins rs
   cross join params p
   where rs.artist_id=p.artist_id
  ),
  tricheur as (
   select
     sum(td.cur) cur_streams,sum(td.prev) prev_streams,
     (select count(*) from acquisition.radio_spins rs cross join params p
        where rs.track_id in (select id from q_tracks where lower(title)='tricheur')
          and date(rs.broadcast_at at time zone 'Europe/Paris') between p.period_end-6 and p.period_end) cur_airplay,
     (select count(*) from acquisition.radio_spins rs cross join params p
        where rs.track_id in (select id from q_tracks where lower(title)='tricheur')
          and date(rs.broadcast_at at time zone 'Europe/Paris') between p.period_end-13 and p.period_end-7) prev_airplay
   from track_delta td where lower(td.title)='tricheur'
  ),
  catalogue as (
   select jsonb_agg(jsonb_build_object(
     'title', label,
     'value', cur::bigint,
     'previous', prev::bigint,
     'change_pct', case when prev>0 then round(100.0*(cur/prev-1),1) end
   ) order by ord) as items
   from (
     select 1 ord,'Ma faute' label,sum(cur) cur,sum(prev) prev from track_delta where lower(title) like 'ma faute%'
     union all select 2,'Escroc',sum(cur),sum(prev) from track_delta where lower(title)='escroc'
     union all select 3,'Cœur maladroit',sum(cur),sum(prev) from track_delta where lower(title) like 'coeur maladroit%'
     union all select 4,'Restes d’averses',sum(cur),sum(prev) from track_delta where lower(title) like 'restes d''averses%'
   ) x
  ),
  radio_top as (
   select jsonb_agg(jsonb_build_object('title',title,'spins',spins) order by spins desc) as items
   from (
     select t.title,count(*)::int spins
     from acquisition.radio_spins rs
     join acquisition.tracks t on t.id=rs.track_id
     cross join params p
     where rs.artist_id=p.artist_id
       and date(rs.broadcast_at at time zone 'Europe/Paris') between p.period_end-6 and p.period_end
     group by t.title
     order by spins desc
     limit 5
   ) r
  )
  select
    (select period_end from params),
    jsonb_build_object(
     'period',jsonb_build_object(
       'start',(select period_end-6 from params),
       'end',(select period_end from params)
     ),
     'spotify_monthly',jsonb_build_object(
       'value',am.sp_monthly::bigint,
       'previous',am.sp_monthly_prev::bigint,
       'change_pct',round(100.0*(am.sp_monthly/am.sp_monthly_prev-1),1)
     ),
     'streams_weekly',jsonb_build_object(
       'value',s.cur::bigint,
       'previous',s.prev::bigint,
       'change_pct',round(100.0*(s.cur/s.prev-1),1),
       'cumulative',s.cumulative::bigint
     ),
     'airplay_weekly',jsonb_build_object(
       'value',ap.cur,
       'previous',ap.prev,
       'change_pct',round(100.0*(ap.cur::numeric/ap.prev-1),1)
     ),
     'youtube_daily',jsonb_build_object(
       'value',am.yt_daily::bigint,
       'previous',am.yt_daily_prev::bigint,
       'change_pct',round(100.0*(am.yt_daily/am.yt_daily_prev-1),1)
     ),
     'instagram',jsonb_build_object(
       'value',am.ig_followers::bigint,
       'date',am.ig_followers_date,
       'previous',case when am.ig_followers_prev_date = am.ig_followers_date - 7 then am.ig_followers_prev::bigint else null end,
       'previous_date',am.ig_followers_prev_date,
       'change_abs',case when am.ig_followers_prev_date = am.ig_followers_date - 7 then (am.ig_followers-am.ig_followers_prev)::bigint else null end,
       'comparison_valid',(am.ig_followers_prev_date = am.ig_followers_date - 7)
     ),
     'tricheur',jsonb_build_object(
       'streams',tr.cur_streams::bigint,
       'streams_previous',tr.prev_streams::bigint,
       'streams_change_pct',case when tr.prev_streams>0 then round(100.0*(tr.cur_streams/tr.prev_streams-1),1) end,
       'airplay',tr.cur_airplay,
       'airplay_previous',tr.prev_airplay,
       'airplay_change_pct',case when tr.prev_airplay>0 then round(100.0*(tr.cur_airplay::numeric/tr.prev_airplay-1),1) end
     ),
     'catalogue',(select items from catalogue),
     'radio_top',(select items from radio_top)
    )
  into v_period_end,v_payload
  from streams s, artist_metric am, airplay ap, tricheur tr;

  insert into public.cfo_home_snapshot(snapshot_key,period_end,generated_at,payload)
  values ('marine',v_period_end,now(),v_payload)
  on conflict(snapshot_key) do update
    set period_end=excluded.period_end,
        generated_at=excluded.generated_at,
        payload=excluded.payload;

  perform private.enrich_cfo_home_snapshot();
end;
$function$;

create or replace function public.cfo_marine_metric_changes_30d()
returns jsonb language sql stable security definer set search_path='' as $fn$
with daily as (
 select distinct on(m.platform,m.metric_type,m.observation_date)
  m.platform,m.metric_type,m.observation_date,m.value_numeric,m.raw_response_id,m.acquired_at
 from acquisition.metric_observations m join acquisition.artists a on a.id=m.artist_id
 where a.slug='marine' and m.track_id is null and m.metric_type<>'chart_position'
 and m.source_code='soundcharts' and not m.is_interpolated and m.value_numeric is not null
 order by m.platform,m.metric_type,m.observation_date,m.acquired_at desc,m.id desc
), latest as (
 select distinct on(platform,metric_type) * from daily order by platform,metric_type,observation_date desc
)
select coalesce(jsonb_agg(jsonb_build_object(
 'platform',l.platform,'metric_type',l.metric_type,'date',l.observation_date,'value',l.value_numeric,
 'previous_date',p.observation_date,'previous_value',p.value_numeric,
 'change_30d',case when p.value_numeric is not null then l.value_numeric-p.value_numeric end,
 'change_30d_pct',case when p.value_numeric>0 then round(100*(l.value_numeric-p.value_numeric)/p.value_numeric,2) end,
 'comparison_valid',p.observation_date is not null,'lag_days',current_date-l.observation_date,
 'raw_response_id',l.raw_response_id,'previous_raw_response_id',p.raw_response_id,
 'source','Soundcharts'
) order by l.platform,l.metric_type),'[]'::jsonb)
from latest l left join daily p on p.platform=l.platform and p.metric_type=l.metric_type
 and p.observation_date=l.observation_date-30;
$fn$;
revoke all on function public.cfo_marine_metric_changes_30d() from public;
grant execute on function public.cfo_marine_metric_changes_30d() to anon,authenticated,service_role;

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
  obs as (
    select
      m.platform,
      m.metric_type,
      max(m.observation_date) as latest_date,
      max(m.acquired_at) filter (
        where m.observation_date = (
          select max(m2.observation_date)
          from acquisition.metric_observations m2
          where m2.artist_id=v_artist
            and m2.track_id is null
            and m2.platform=m.platform
            and m2.metric_type=m.metric_type
        )
      ) as latest_acquired_at
    from acquisition.metric_observations m
    where m.artist_id=v_artist
      and m.track_id is null
    group by m.platform,m.metric_type
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
             'tracks_with_observations',count(distinct m.track_id))
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
$function$;

CREATE OR REPLACE FUNCTION public.cfo_marine_snapshot_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'acquisition', 'cfo', 'pg_temp'
AS $function$
with marine as (
  select id from acquisition.artists where slug='marine' limit 1
),
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
  select *
  from cfo.panel_snapshot
  where artist_slug='marine'
  limit 1
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
$function$;

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
      'contract_version', 'marine-dashboard-cache-1.1',
      'metrics_30d', public.cfo_marine_metric_changes_30d(),
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
$function$;

