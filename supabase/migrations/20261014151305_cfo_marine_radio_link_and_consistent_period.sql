-- CFO Marine: relier les passages radio au titre par identifiant Soundcharts.
-- Aligner les passages sur tous les titres de Marine, y compris les variantes non qualifiées pour les streams.
CREATE OR REPLACE FUNCTION private.cfo_link_radio_spin_track()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'acquisition', 'private'
AS $function$
BEGIN
  IF NEW.track_id IS NULL AND NEW.artist_id IS NOT NULL AND
     NEW.source_payload #>> '{song,uuid}' IS NOT NULL THEN
    SELECT t.id INTO NEW.track_id
    FROM acquisition.tracks t
    WHERE t.soundcharts_uuid::text = NEW.source_payload #>> '{song,uuid}'
      AND t.primary_artist_id = NEW.artist_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$
;

DROP TRIGGER IF EXISTS trg_cfo_link_radio_spin_track ON acquisition.radio_spins;
CREATE TRIGGER trg_cfo_link_radio_spin_track
BEFORE INSERT OR UPDATE OF track_id,source_payload,artist_id ON acquisition.radio_spins
FOR EACH ROW EXECUTE FUNCTION private.cfo_link_radio_spin_track();

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
      (
        select max(mo.observation_date)
        from acquisition.metric_observations mo
        join acquisition.soundcharts_track_qualification q on q.track_id=mo.track_id
        where mo.artist_id=a.id
          and mo.platform='spotify'
          and mo.metric_type='streams_total'
          and q.include_in_cfo_metrics is true
      ) as period_end
    from acquisition.artists a
    where lower(a.name)='marine'
    limit 1
  ),
  q_tracks as (
    select t.id,t.title,t.isrc
    from acquisition.tracks t
    join acquisition.soundcharts_track_qualification q on q.track_id=t.id
    join params p on p.artist_id=t.primary_artist_id
    where q.include_in_cfo_metrics is true
  ),
  track_week as (
    select qt.id,qt.title,qt.isrc,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date<=p.period_end
        order by mo.observation_date desc,mo.acquired_at desc limit 1),0) as v_end,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date<=p.period_end-7
        order by mo.observation_date desc,mo.acquired_at desc limit 1),0) as v_prev_end,
      coalesce((select mo.value_numeric from acquisition.metric_observations mo, params p
        where mo.track_id=qt.id and mo.platform='spotify' and mo.metric_type='streams_total'
          and mo.observation_date<=p.period_end-14
        order by mo.observation_date desc,mo.acquired_at desc limit 1),0) as v_prev2_end
    from q_tracks qt
  ),
  track_delta as (
    select *,
      greatest(v_end-v_prev_end,0) as cur,
      greatest(v_prev_end-v_prev2_end,0) as prev
    from track_week
  ),
  streams as (
    select sum(cur) cur,sum(prev) prev,sum(v_end) cumulative
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
$function$
;
