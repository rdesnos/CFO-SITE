-- Budget shared by the daily collectors. Reservations include network failures.
-- October opening balance conservatively reserves at least half the allowance
-- for pre-instrumentation traffic; this is a safety allowance, not a billed count.
create table acquisition.soundcharts_call_budget (
  budget_month date primary key,
  reserved_calls integer not null default 0 check(reserved_calls between 0 and 10000),
  opening_allowance integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table acquisition.soundcharts_call_budget enable row level security;
create table acquisition.soundcharts_call_ledger (
  id bigint generated always as identity primary key,
  reserved_at timestamptz not null default now(),
  endpoint text not null
);
alter table acquisition.soundcharts_call_ledger enable row level security;
create index on acquisition.soundcharts_call_ledger(reserved_at);
create table acquisition.soundcharts_daily_runs (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  api_calls integer not null default 0,
  summary jsonb not null default '{}'::jsonb
);
alter table acquisition.soundcharts_daily_runs enable row level security;
grant select,insert,update on acquisition.soundcharts_daily_runs to service_role;
revoke all on acquisition.soundcharts_call_budget,acquisition.soundcharts_call_ledger,acquisition.soundcharts_daily_runs from public,anon,authenticated;

create or replace function public.cfo_reserve_soundcharts_call(p_endpoint text)
returns bigint language plpgsql security definer set search_path='' as $fn$
declare
  v_month date := date_trunc('month',now() at time zone 'UTC')::date;
  v_calls integer;
  v_id bigint;
  v_opening integer;
begin
  if p_endpoint not like '/api/%' then raise exception 'Invalid Soundcharts endpoint'; end if;
  -- One lock serializes both the monthly counter and daily cap.
  perform pg_advisory_xact_lock(631016,10000);
  if not exists(select 1 from acquisition.soundcharts_call_budget where budget_month=v_month) then
    select least(10000,greatest(
      case when v_month=date '2026-10-01' then 5000 else 0 end,
      coalesce((select sum((metadata->>'api_calls')::integer) from acquisition.extraction_runs
        where started_at>=v_month),0)
      + (select count(*) from acquisition.raw_api_responses
         where received_at>=v_month and endpoint_name in ('song_audience_spotify','song_audience_shazam'))
    )) into v_opening;
    insert into acquisition.soundcharts_call_budget(budget_month,reserved_calls,opening_allowance)
    values(v_month,v_opening,v_opening);
  end if;
  select reserved_calls into v_calls from acquisition.soundcharts_call_budget where budget_month=v_month for update;
  if v_calls>=10000 or
     (select count(*) from acquisition.soundcharts_call_ledger
      where reserved_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') >=250
  then return null; end if;
  update acquisition.soundcharts_call_budget set reserved_calls=reserved_calls+1,updated_at=now() where budget_month=v_month;
  insert into acquisition.soundcharts_call_ledger(endpoint) values(p_endpoint) returning id into v_id;
  return v_id;
end $fn$;
revoke all on function public.cfo_reserve_soundcharts_call(text) from public,anon,authenticated;
grant execute on function public.cfo_reserve_soundcharts_call(text) to service_role;

CREATE OR REPLACE FUNCTION public.cfo_track_store_soundcharts(p_track_id uuid, p_endpoint_url text, p_start_date date, p_end_date date, p_identifier text, p_pages jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_artist_id uuid;
  v_run_id uuid;
  v_page jsonb;
  v_observation jsonb;
  v_raw_id bigint;
  v_inserted integer := 0;
  v_received integer := 0;
  v_metadata jsonb;
begin
  select t.primary_artist_id, t.metadata
    into v_artist_id, v_metadata
  from acquisition.tracks t
  join acquisition.soundcharts_track_qualification q on q.track_id=t.id
  where t.id = p_track_id
    and t.is_active = true
    and t.acquisition_enabled = true
    and q.include_in_cfo_metrics = true
    and q.qualification_status = 'include';

  if v_artist_id is null then
    raise exception 'Titre absent du périmètre CFO actif';
  end if;

  insert into acquisition.ingestion_runs (
    source_code, workflow_name, endpoint_name, endpoint_url, run_type, status,
    artist_id, track_id, requested_start_date, requested_end_date,
    page_offset, page_limit
  ) values (
    'soundcharts', 'cfo_soundcharts_track_streams', 'song_audience_spotify',
    p_endpoint_url, 'initial', 'running', v_artist_id, p_track_id,
    p_start_date, p_end_date, 0, 100
  ) returning id into v_run_id;

  -- Existing observations are immutable. Only missing natural keys are inserted.

  for v_page in select value from jsonb_array_elements(coalesce(p_pages, '[]'::jsonb))
  loop
    insert into acquisition.raw_api_responses (
      source_code, ingestion_run_id, endpoint_name, endpoint_url, http_method,
      http_status, artist_id, track_id, request_parameters, response_headers,
      response_payload, response_hash, page_offset, page_limit, page_total,
      next_url, requested_at
    ) values (
      'soundcharts', v_run_id, 'song_audience_spotify', v_page->>'url', 'GET',
      (v_page->>'status')::integer, v_artist_id, p_track_id,
      coalesce(v_page->'request_parameters', '{}'::jsonb),
      coalesce(v_page->'response_headers', '{}'::jsonb),
      coalesce(v_page->'payload', '{}'::jsonb), v_page->>'response_hash',
      (v_page->>'offset')::integer, 100,
      nullif(v_page #>> '{payload,page,total}', '')::integer,
      v_page #>> '{payload,page,next}',
      nullif(v_page->>'requested_at', '')::timestamptz
    ) on conflict (endpoint_name, response_hash) where response_hash is not null do nothing returning id into v_raw_id;
    if v_raw_id is null then
      select id into v_raw_id from acquisition.raw_api_responses
      where endpoint_name='song_audience_spotify' and response_hash=v_page->>'response_hash' limit 1;
    end if;

    v_received := v_received + jsonb_array_length(coalesce(v_page->'observations', '[]'::jsonb));

    for v_observation in
      select value from jsonb_array_elements(coalesce(v_page->'observations', '[]'::jsonb))
    loop
      insert into acquisition.metric_observations (
        source_code, ingestion_run_id, raw_response_id, entity_type,
        artist_id, track_id, platform, metric_type, observation_date,
        value_numeric, platform_identifier, is_interpolated, dimensions,
        source_payload, acquired_at
      ) values (
        'soundcharts', v_run_id, v_raw_id, 'track', v_artist_id, p_track_id,
        'spotify', 'streams_total', (v_observation->>'date')::date,
        (v_observation->>'value')::numeric, p_identifier, false,
        jsonb_build_object(
          'dataset', 'track_spotify_streams',
          'selection_rule', 'latest_day_max_identifier',
          'verified', true
        ),
        v_observation,
        now()
      ) on conflict do nothing;
      if found then v_inserted := v_inserted + 1; end if;
    end loop;
  end loop;

  update acquisition.tracks
  set metadata = jsonb_set(
        coalesce(v_metadata, '{}'::jsonb),
        '{cfo_soundcharts}',
        jsonb_build_object(
          'source', 'soundcharts',
          'platform', 'spotify',
          'selection_rule', 'latest_day_max_identifier',
          'spotify_identifier', p_identifier,
          'last_verified_date', (select max(observation_date) from acquisition.metric_observations where track_id=p_track_id and platform='spotify' and metric_type='streams_total' and dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb),
          'last_synchronized_at', now()
        ),
        true
      ),
      updated_at = now()
  where id = p_track_id;

  update acquisition.ingestion_runs
  set status = 'success', http_status = 200,
      records_received = v_received, records_inserted = v_inserted,
      records_rejected = greatest(0, v_received - v_inserted),
      completed_at = now()
  where id = v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'records_received', v_received,
    'records_inserted', v_inserted
  );
end
$function$;

CREATE OR REPLACE FUNCTION public.cfo_track_store_soundcharts_shazam(p_track_id uuid, p_endpoint_url text, p_start_date date, p_end_date date, p_identifier text, p_pages jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_artist_id uuid;
  v_run_id uuid;
  v_page jsonb;
  v_obs jsonb;
  v_raw_id bigint;
  v_inserted integer := 0;
  v_received integer := 0;
  v_rows integer := 0;
BEGIN
  SELECT t.primary_artist_id
    INTO v_artist_id
  FROM acquisition.tracks t
  JOIN acquisition.soundcharts_track_qualification q ON q.track_id = t.id
  WHERE t.id = p_track_id
    AND t.is_active
    AND t.acquisition_enabled
    AND q.qualification_status = 'include'
    AND q.include_in_cfo_metrics;

  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Titre absent du périmètre CFO actif';
  END IF;

  INSERT INTO acquisition.ingestion_runs(
    source_code, workflow_name, endpoint_name, endpoint_url, run_type, status,
    artist_id, track_id, requested_start_date, requested_end_date, page_offset, page_limit
  ) VALUES (
    'soundcharts', 'cfo_soundcharts_track_shazam', 'song_audience_shazam',
    p_endpoint_url, 'initial', 'running', v_artist_id, p_track_id,
    p_start_date, p_end_date, 0, 100
  ) RETURNING id INTO v_run_id;

  -- Append only: never delete or overwrite an observation.

  FOR v_page IN
    SELECT value FROM jsonb_array_elements(coalesce(p_pages, '[]'::jsonb))
  LOOP
    INSERT INTO acquisition.raw_api_responses(
      source_code, ingestion_run_id, endpoint_name, endpoint_url, http_method,
      http_status, artist_id, track_id, request_parameters, response_headers,
      response_payload, response_hash, page_offset, page_limit, page_total,
      next_url, requested_at
    ) VALUES (
      'soundcharts', v_run_id, 'song_audience_shazam', v_page->>'url', 'GET',
      (v_page->>'status')::integer, v_artist_id, p_track_id,
      coalesce(v_page->'request_parameters', '{}'::jsonb),
      coalesce(v_page->'response_headers', '{}'::jsonb),
      coalesce(v_page->'payload', '{}'::jsonb),
      v_page->>'response_hash', (v_page->>'offset')::integer, 100,
      nullif(v_page#>>'{payload,page,total}', '')::integer,
      v_page#>>'{payload,page,next}',
      nullif(v_page->>'requested_at', '')::timestamptz
    )
    ON CONFLICT (endpoint_name, response_hash)
      WHERE response_hash IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_raw_id;

    IF v_raw_id IS NULL THEN
      SELECT id INTO v_raw_id
      FROM acquisition.raw_api_responses
      WHERE endpoint_name = 'song_audience_shazam'
        AND response_hash = v_page->>'response_hash'
      ORDER BY id DESC
      LIMIT 1;
    END IF;

    IF v_raw_id IS NULL THEN
      RAISE EXCEPTION 'Impossible de retrouver la réponse Shazam archivée';
    END IF;

    v_received := v_received
      + jsonb_array_length(coalesce(v_page->'observations', '[]'::jsonb));

    FOR v_obs IN
      SELECT value FROM jsonb_array_elements(coalesce(v_page->'observations', '[]'::jsonb))
    LOOP
      INSERT INTO acquisition.metric_observations(
        source_code, ingestion_run_id, raw_response_id, entity_type, artist_id,
        track_id, platform, metric_type, observation_date, value_numeric,
        platform_identifier, is_interpolated, dimensions, source_payload, acquired_at
      ) VALUES (
        'soundcharts', v_run_id, v_raw_id, 'track', v_artist_id, p_track_id,
        'shazam', 'shazam_count', (v_obs->>'date')::date,
        (v_obs->>'value')::numeric, p_identifier, false,
        jsonb_build_object(
          'dataset', 'track_shazam_count',
          'verified', true,
          'selection_rule', 'latest_day_max_identifier'
        ),
        v_obs, now()
      )
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_inserted := v_inserted + v_rows;
    END LOOP;
  END LOOP;

  UPDATE acquisition.ingestion_runs
  SET status = 'success',
      http_status = 200,
      records_received = v_received,
      records_inserted = v_inserted,
      records_rejected = greatest(0, v_received - v_inserted),
      completed_at = now()
  WHERE id = v_run_id;

  UPDATE acquisition.tracks
  SET shazam_last_verified_date = (
    SELECT max(observation_date) FROM acquisition.metric_observations
    WHERE track_id=p_track_id AND platform='shazam' AND metric_type='shazam_count'
  )
  WHERE id = p_track_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'records_received', v_received,
    'records_inserted', v_inserted,
    'records_rejected', greatest(0, v_received - v_inserted)
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.cfo_normalize_soundcharts(p_artist_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_artist uuid;
  v_streaming integer := 0;
  v_followers integer := 0;
  v_views integer := 0;
  v_posts integer := 0;
  v_likes integer := 0;
  v_following integer := 0;
  v_charts integer := 0;
  v_radio integer := 0;
  v_radio_raw_ids bigint[];
  v_events integer := 0;
begin
  select id into v_artist
  from acquisition.artists
  where slug = p_artist_slug;

  if v_artist is null then
    raise exception 'Unknown artist';
  end if;

  -- Historical observations are immutable; classify only incoming rows.

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id,
    'artist',
    v_artist,
    replace(r.endpoint_name, 'streaming_', ''),
    case replace(r.endpoint_name, 'streaming_', '')
      when 'spotify' then 'monthly_listeners'
      when 'youtube' then 'views_daily'
      else 'listening_value'
    end,
    (i->>'date')::timestamptz::date,
    (i->>'value')::numeric,
    jsonb_build_object(
      'dataset', 'streaming_audience',
      'source_field', 'value',
      'soundcharts_platform', r.response_payload#>>'{related,platform}'
    ),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'streaming_%'
    and i->>'date' is not null
    and i->>'value' is not null
  on conflict do nothing;
  get diagnostics v_streaming = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id, 'artist', v_artist, replace(r.endpoint_name, 'audience_', ''),
    'followers', (i->>'date')::timestamptz::date, (i->>'followerCount')::numeric,
    jsonb_build_object('dataset', 'social_audience', 'source_field', 'followerCount'),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'audience_%'
    and i->>'date' is not null
    and i->>'followerCount' is not null
  on conflict do nothing;
  get diagnostics v_followers = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id, 'artist', v_artist, replace(r.endpoint_name, 'audience_', ''),
    'views_total', (i->>'date')::timestamptz::date, (i->>'viewCount')::numeric,
    jsonb_build_object('dataset', 'social_audience', 'source_field', 'viewCount'),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'audience_%'
    and i->>'date' is not null
    and i->>'viewCount' is not null
  on conflict do nothing;
  get diagnostics v_views = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id, 'artist', v_artist, replace(r.endpoint_name, 'audience_', ''),
    'posts_total', (i->>'date')::timestamptz::date, (i->>'postCount')::numeric,
    jsonb_build_object('dataset', 'social_audience', 'source_field', 'postCount'),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'audience_%'
    and i->>'date' is not null
    and i->>'postCount' is not null
  on conflict do nothing;
  get diagnostics v_posts = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id, 'artist', v_artist, replace(r.endpoint_name, 'audience_', ''),
    'likes_total', (i->>'date')::timestamptz::date, (i->>'likeCount')::numeric,
    jsonb_build_object('dataset', 'social_audience', 'source_field', 'likeCount'),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'audience_%'
    and i->>'date' is not null
    and i->>'likeCount' is not null
  on conflict do nothing;
  get diagnostics v_likes = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, dimensions, source_payload
  )
  select
    r.id, 'artist', v_artist, replace(r.endpoint_name, 'audience_', ''),
    'following_total', (i->>'date')::timestamptz::date, (i->>'followingCount')::numeric,
    jsonb_build_object('dataset', 'social_audience', 'source_field', 'followingCount'),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'audience_%'
    and i->>'date' is not null
    and i->>'followingCount' is not null
  on conflict do nothing;
  get diagnostics v_following = row_count;

  insert into acquisition.metric_observations(
    raw_response_id, entity_type, artist_id, platform, metric_type,
    observation_date, value_numeric, country_code, city_name,
    platform_identifier, dimensions, source_payload
  )
  select
    r.id,
    'artist',
    v_artist,
    coalesce(i#>>'{chart,platform}', replace(r.endpoint_name, 'song_charts_', '')),
    'chart_position',
    (i->>'rankDate')::timestamptz::date,
    coalesce(nullif((i->>'position')::numeric, 0), (i->>'oldPosition')::numeric),
    nullif(i#>>'{chart,countryCode}', '')::char(2),
    nullif(i#>>'{chart,cityName}', ''),
    i#>>'{song,uuid}',
    jsonb_build_object(
      'dataset', 'charts',
      'song_name', i#>>'{song,name}',
      'chart_slug', i#>>'{chart,slug}',
      'chart_name', i#>>'{chart,name}',
      'frequency', i#>>'{chart,frequency}',
      'peak_position', i->'peakPosition',
      'time_on_chart', i->'timeOnChart',
      'current', i->'current'
    ),
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name like 'song_charts_%'
    and i->>'rankDate' is not null
  on conflict do nothing;
  get diagnostics v_charts = row_count;

  -- Bound each artist's radio work and remember completed source responses.
  select coalesce(array_agg(candidate.id), '{}'::bigint[])
  into v_radio_raw_ids
  from (
    select r.id
    from acquisition.raw_api_responses r
    where r.artist_id = v_artist
      and r.http_status = 200
      and r.endpoint_name = 'radio_broadcasts_fr'
      and not exists (
        select 1 from acquisition.soundcharts_radio_normalized_sources done
        where done.raw_response_id = r.id
      )
    order by r.received_at desc, r.id desc
    limit 100
  ) candidate;

  insert into acquisition.radio_spins(
    raw_response_id, artist_id, soundcharts_broadcast_id,
    radio_slug, radio_name, country_code, city_name,
    broadcast_at, timezone, duration_seconds, source_payload
  )
  select
    r.id,
    v_artist,
    md5(coalesce(i#>>'{song,uuid}', '') || '|' || coalesce(i#>>'{radio,slug}', '') || '|' || coalesce(i->>'airedAt', '')),
    i#>>'{radio,slug}',
    i#>>'{radio,name}',
    nullif(i#>>'{radio,countryCode}', '')::char(2),
    nullif(i#>>'{radio,cityName}', ''),
    (i->>'airedAt')::timestamptz,
    i#>>'{radio,timeZone}',
    nullif(i->>'duration', '')::integer,
    i
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name = 'radio_broadcasts_fr'
    and r.id = any(v_radio_raw_ids)
    and i->>'airedAt' is not null
    and not exists (
      select 1
      from acquisition.radio_spins s
      where s.soundcharts_broadcast_id =
        md5(coalesce(i#>>'{song,uuid}', '') || '|' || coalesce(i#>>'{radio,slug}', '') || '|' || coalesce(i->>'airedAt', ''))
    )
  on conflict do nothing;
  get diagnostics v_radio = row_count;

  insert into acquisition.soundcharts_radio_normalized_sources(raw_response_id)
  select unnest(v_radio_raw_ids)
  on conflict do nothing;

  insert into cfo.events(
    event_type, title, start_date, end_date, start_at, end_at,
    city, country_code, status, initiative_origin, source_url, metadata
  )
  select
    case when i->>'type' in ('concert', 'festival') then i->>'type' else 'other' end,
    coalesce(i->>'name', p_artist_slug),
    (i->>'date')::timestamptz::date,
    case
      when nullif(i->>'endedAt', '')::timestamptz::date >= (i->>'date')::timestamptz::date
        then nullif(i->>'endedAt', '')::timestamptz::date
      else null
    end,
    nullif(i->>'date', '')::timestamptz,
    null,
    i#>>'{venue,cityName}',
    (
      select c.code
      from core.countries c
      where c.code = nullif(i#>>'{venue,countryCode}', '')::char(2)
      limit 1
    ),
    case when (i->>'date')::timestamptz < now() then 'completed' else 'confirmed' end,
    'third_party',
    null,
    jsonb_build_object(
      'source', 'soundcharts',
      'soundcharts_uuid', i->>'uuid',
      'venue', i->'venue',
      'festival', i->'festival',
      'price', i->'price',
      'artist_slug', p_artist_slug,
      'source_status', i->>'status'
    )
  from acquisition.raw_api_responses r
  cross join lateral jsonb_array_elements(coalesce(r.response_payload->'items', '[]'::jsonb)) i
  where r.artist_id = v_artist
    and r.http_status = 200
    and r.endpoint_name = 'artist_events'
    and i->>'date' is not null
    and not exists (
      select 1
      from cfo.events e
      where e.metadata->>'soundcharts_uuid' = i->>'uuid'
    );
  get diagnostics v_events = row_count;

  return jsonb_build_object(
    'streaming_metrics', v_streaming,
    'followers', v_followers,
    'views_total', v_views,
    'posts_total', v_posts,
    'likes_total', v_likes,
    'following_total', v_following,
    'chart_metrics', v_charts,
    'radio_spins', v_radio,
    'radio_responses_processed', cardinality(v_radio_raw_ids),
    'events', v_events
  );
end
$function$;

revoke all on function public.cfo_track_store_soundcharts_shazam(uuid,text,date,date,text,jsonb) from public,anon,authenticated;
grant execute on function public.cfo_track_store_soundcharts_shazam(uuid,text,date,date,text,jsonb) to service_role;
CREATE OR REPLACE FUNCTION private.dispatch_cfo_marine_shazam_daily()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_base text;
  v_jwt text;
  v_invoke_key text;
  v_request_id bigint;
begin
  select decrypted_secret into v_base
  from vault.decrypted_secrets
  where name='cfo_project_url';

  select decrypted_secret into v_jwt
  from vault.decrypted_secrets
  where name='cfo_anon_jwt';

  select decrypted_secret into v_invoke_key from vault.decrypted_secrets where name='cfo_extractor_invoke_key';
  if v_base is null or v_jwt is null or v_invoke_key is null then
    raise exception 'Missing CFO project invocation secrets';
  end if;

  v_request_id := net.http_post(
    url := v_base || '/functions/v1/cfo-soundcharts-shazam-backfill',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || v_jwt,
      'apikey',v_jwt,
      'x-cfo-extractor-key',v_invoke_key
    ),
    body := jsonb_build_object('artist_slug','marine'),
    timeout_milliseconds := 300000
  );

  return v_request_id;
end;
$function$;

revoke all on function private.dispatch_cfo_marine_shazam_daily() from public,anon,authenticated;
select cron.alter_job((select jobid from cron.job where jobname='cfo-marine-shazam-daily'),active:=true);

CREATE OR REPLACE FUNCTION public.cfo_normalize_airplay_soundcharts(p_artist_slug text, p_run_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_artist uuid;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_unmapped integer := 0;
begin
  select id into v_artist
  from acquisition.artists
  where slug = p_artist_slug
  limit 1;

  if v_artist is null then
    raise exception 'Unknown artist: %', p_artist_slug;
  end if;

  with candidate_rows as (
    select
      r.id as raw_response_id,
      r.extraction_run_id,
      r.received_at,
      i,
      md5(
        coalesce(i #>> '{song,uuid}', '') || '|' ||
        coalesce(i #>> '{radio,slug}', '') || '|' ||
        coalesce(i ->> 'airedAt', '')
      ) as broadcast_id,
      t.id as mapped_track_id
    from acquisition.raw_api_responses r
    cross join lateral jsonb_array_elements(coalesce(r.response_payload -> 'items', '[]'::jsonb)) i
    left join acquisition.tracks t
      on t.primary_artist_id = v_artist
     and t.soundcharts_uuid::text = i #>> '{song,uuid}'
    where r.artist_id = v_artist
      and r.http_status between 200 and 299
      and r.endpoint_name like 'radio_broadcasts_%'
      and i ->> 'airedAt' is not null
      and (
        (p_run_id is not null and r.extraction_run_id = p_run_id)
        or
        (p_run_id is null and r.received_at >= now() - interval '3 days')
      )
  ),
  source_rows as (
    select distinct on (broadcast_id)
      raw_response_id,
      extraction_run_id,
      received_at,
      i,
      broadcast_id,
      mapped_track_id
    from candidate_rows
    order by broadcast_id, received_at desc, raw_response_id desc
  ),
  upserted as (
    insert into acquisition.radio_spins(
      source_code, extraction_run_id, raw_response_id, artist_id, track_id,
      soundcharts_broadcast_id, radio_slug, radio_name, country_code, city_name,
      broadcast_at, timezone, duration_seconds, source_payload, acquired_at
    )
    select
      'soundcharts', s.extraction_run_id, s.raw_response_id, v_artist, s.mapped_track_id,
      s.broadcast_id,
      s.i #>> '{radio,slug}',
      s.i #>> '{radio,name}',
      nullif(s.i #>> '{radio,countryCode}', '')::char(2),
      nullif(s.i #>> '{radio,cityName}', ''),
      (s.i ->> 'airedAt')::timestamptz,
      s.i #>> '{radio,timeZone}',
      nullif(s.i ->> 'duration', '')::integer,
      s.i,
      s.received_at
    from source_rows s
    on conflict (soundcharts_broadcast_id)
      where soundcharts_broadcast_id is not null
    do nothing
    returning (xmax = 0) as inserted, track_id
  )
  select
    count(*) filter (where inserted),
    count(*) filter (where not inserted),
    count(*) filter (where track_id is null)
  into v_inserted, v_updated, v_unmapped
  from upserted;

  return jsonb_build_object(
    'inserted', coalesce(v_inserted, 0),
    'updated', coalesce(v_updated, 0),
    'unmapped', coalesce(v_unmapped, 0),
    'run_id', p_run_id
  );
end
$function$;


