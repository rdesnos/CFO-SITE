-- Add operational provenance only. Never rewrite metric observations or archived responses.
alter table acquisition.soundcharts_call_ledger
 add column completed_at timestamptz,
 add column request_parameters jsonb,
 add column http_status integer,
 add column response_hash text,
 add column raw_response_id bigint references acquisition.raw_api_responses(id),
 add column extraction_run_id uuid references acquisition.extraction_runs(id),
 add column summary jsonb;
create index soundcharts_call_ledger_endpoint_recent on acquisition.soundcharts_call_ledger(endpoint,reserved_at desc);
create or replace function public.cfo_complete_soundcharts_call(p_call_id bigint,p_request_parameters jsonb,p_http_status integer,p_response_hash text,p_summary jsonb)
returns void language plpgsql security definer set search_path='' as $fn$
begin
 update acquisition.soundcharts_call_ledger l
 set completed_at=now(),request_parameters=p_request_parameters,http_status=p_http_status,
     response_hash=p_response_hash,summary=p_summary,
     raw_response_id=(select r.id from acquisition.raw_api_responses r
       where r.response_hash=p_response_hash and split_part(r.endpoint_url,'?',1)='https://customer.api.soundcharts.com'||l.endpoint
       order by r.id desc limit 1)
 where l.id=p_call_id and l.completed_at is null;
 if not found then raise exception 'Call reservation unavailable or already completed'; end if;
end $fn$;
revoke all on function public.cfo_complete_soundcharts_call(bigint,jsonb,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.cfo_complete_soundcharts_call(bigint,jsonb,integer,text,jsonb) to service_role;
create or replace function private.link_soundcharts_call_archive()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if new.response_headers->>'x-cfo-call-id' ~ '^[0-9]+$' then
  update acquisition.soundcharts_call_ledger
  set raw_response_id=new.id,extraction_run_id=new.extraction_run_id
  where id=(new.response_headers->>'x-cfo-call-id')::bigint
    and response_hash=new.response_hash;
 end if;
 return new;
end $fn$;
revoke all on function private.link_soundcharts_call_archive() from public,anon,authenticated;
create trigger link_soundcharts_call_archive after insert on acquisition.raw_api_responses
for each row execute function private.link_soundcharts_call_archive();

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


  -- Observation acquisition is deduplicated. A later successful check must not
  -- imply a newer observation or a newer provider crawl.
  with routes as (
   select h.metric_key,
    case when h.metric_key='spotify_monthly_listeners' then 'streaming_spotify'
         when h.metric_key='youtube_views_daily' then 'streaming_youtube'
         else 'audience_'||h.platform end endpoint_name
   from cfo.data_pipeline_health h where h.artist_slug='marine'
    and h.platform in ('spotify','deezer','youtube','instagram','facebook','tiktok')
    and h.metric_key<>'spotify_track_streams'
  ), evidence as (
   select routes.metric_key,r.id,r.http_status,r.received_at,r.endpoint_name,r.endpoint_url,
          r.response_payload#>>'{related,lastCrawlDate}' source_crawl,
          l.id call_id,l.reserved_at,l.completed_at,l.http_status call_http_status,l.summary
   from routes
   left join lateral (
    select r.* from acquisition.raw_api_responses r where r.artist_id=v_artist and r.endpoint_name=routes.endpoint_name
    order by r.received_at desc,r.id desc limit 1
   ) r on true
   left join lateral (
    select l.* from acquisition.soundcharts_call_ledger l
     where l.endpoint=replace(split_part(r.endpoint_url,'?',1),'https://customer.api.soundcharts.com','')
     order by l.reserved_at desc,l.id desc limit 1
   ) l on true
  )
  update cfo.data_pipeline_health h set details=h.details||jsonb_build_object(
   'last_archived_at',e.received_at,'last_checked_at',coalesce(e.reserved_at,e.received_at),
   'check_evidence',case when e.call_id is null then 'archive_only' else 'call_ledger' end,
   'last_http_status',coalesce(e.call_http_status,e.http_status),
   'source_last_crawl_date',coalesce(e.summary->>'source_crawl_date',e.source_crawl),
   'raw_response_id',e.id,'call_id',e.call_id,
   'collection_status',case
     when e.call_id is not null and e.completed_at is null then 'incomplete_attempt'
     when coalesce(e.call_http_status,e.http_status) is null then 'unverified'
     when coalesce(e.call_http_status,e.http_status)<>200 then 'http_error'
     when h.freshness_status in ('stale','lagging','missing') then 'source_delayed'
     else 'ok' end,
   'metric_scope',case when h.metric_key='youtube_views_daily' then 'youtube_music_all_channels'
                      when h.metric_key='youtube_views_total' then 'youtube_channel_total' else h.metric_type end
  ) from evidence e where h.artist_slug='marine' and h.metric_key=e.metric_key;

  return public.cfo_marine_data_health();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cfo_record_soundcharts_response(p_run_id uuid, p_artist_slug text, p_dataset_code text, p_endpoint_name text, p_endpoint_url text, p_http_status integer, p_request_parameters jsonb, p_response_headers jsonb, p_response_payload jsonb, p_response_hash text, p_page_offset integer DEFAULT NULL::integer, p_page_limit integer DEFAULT NULL::integer, p_page_total integer DEFAULT NULL::integer, p_next_url text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id bigint;
  v_artist uuid;
begin
  select id into v_artist
  from acquisition.artists
  where slug = p_artist_slug
  limit 1;

  insert into acquisition.raw_api_responses(
    extraction_run_id, endpoint_name, endpoint_url, http_status, artist_id,
    request_parameters, response_headers, response_payload, response_hash,
    page_offset, page_limit, page_total, next_url, requested_at
  )
  values(
    p_run_id, p_endpoint_name, p_endpoint_url, p_http_status, v_artist,
    coalesce(p_request_parameters, '{}'::jsonb),
    coalesce(p_response_headers, '{}'::jsonb),
    coalesce(p_response_payload, '{}'::jsonb),
    p_response_hash, p_page_offset, p_page_limit, p_page_total, p_next_url, now()
  )
  on conflict (endpoint_name, response_hash)
    where response_hash is not null
  do nothing
  returning id into v_id;

  if v_id is null and p_response_hash is not null then
    select id into v_id
    from acquisition.raw_api_responses
    where endpoint_name = p_endpoint_name
      and response_hash = p_response_hash
    order by id desc
    limit 1;
  end if;

  if p_response_headers->>'x-cfo-call-id' ~ '^[0-9]+$' then
    update acquisition.soundcharts_call_ledger
    set raw_response_id=v_id,extraction_run_id=p_run_id
    where id=(p_response_headers->>'x-cfo-call-id')::bigint and response_hash=p_response_hash;
  end if;
  return v_id;
end
$function$
;
