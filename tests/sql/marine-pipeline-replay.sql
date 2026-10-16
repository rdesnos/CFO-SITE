begin;
do $test$
declare v_raw acquisition.raw_api_responses%rowtype; v_obs acquisition.metric_observations%rowtype; v_reply jsonb; v_count bigint;
begin
  select count(*) into v_count from acquisition.metric_observations;
  select * into v_obs from acquisition.metric_observations where platform='shazam' and metric_type='shazam_count' and id>13876973 limit 1;
  select * into v_raw from acquisition.raw_api_responses where id=v_obs.raw_response_id;
  v_reply:=public.cfo_track_store_soundcharts_shazam(v_obs.track_id,v_raw.endpoint_url,v_obs.observation_date,v_obs.observation_date,v_obs.platform_identifier,
    jsonb_build_array(jsonb_build_object('url',v_raw.endpoint_url,'status',200,'offset',0,'requested_at',v_raw.requested_at,'payload',v_raw.response_payload,'response_hash',v_raw.response_hash,'observations',jsonb_build_array(v_obs.source_payload))));
  if (v_reply->>'records_inserted')::int<>0 then raise exception 'Shazam replay inserted a duplicate'; end if;
  select * into v_obs from acquisition.metric_observations where platform='spotify' and metric_type='streams_total' and raw_response_id is not null and ingestion_run_id is not null and dimensions @> '{"dataset":"track_spotify_streams","verified":true}'::jsonb order by observation_date desc limit 1;
  select * into v_raw from acquisition.raw_api_responses where id=v_obs.raw_response_id;
  v_reply:=public.cfo_track_store_soundcharts(v_obs.track_id,v_raw.endpoint_url,v_obs.observation_date,v_obs.observation_date,v_obs.platform_identifier,
    jsonb_build_array(jsonb_build_object('url',v_raw.endpoint_url,'status',200,'offset',0,'requested_at',v_raw.requested_at,'payload',v_raw.response_payload,'response_hash',v_raw.response_hash,'observations',jsonb_build_array(v_obs.source_payload))));
  if (v_reply->>'records_inserted')::int<>0 then raise exception 'Spotify replay inserted a duplicate'; end if;
  if (select count(*) from acquisition.metric_observations)<>v_count then raise exception 'Observation count changed'; end if;
  if public.cfo_reserve_soundcharts_call('/api/test/no-network') is null then raise exception 'Reservation unexpectedly denied'; end if;
  update acquisition.soundcharts_call_budget set reserved_calls=10000 where budget_month=date_trunc('month',now())::date;
  if public.cfo_reserve_soundcharts_call('/api/test/no-network') is not null then raise exception 'Monthly cap failed'; end if;
  if has_function_privilege('anon','public.cfo_reserve_soundcharts_call(text)','execute') then raise exception 'Budget RPC exposed to anon'; end if;
  if has_function_privilege('anon','public.cfo_track_store_soundcharts_shazam(uuid,text,date,date,text,jsonb)','execute') then raise exception 'Shazam writes exposed to anon'; end if;
end $test$;
rollback;
select 'PASS: immutable replays, budget cap, private writes; all test writes rolled back' as validation;
