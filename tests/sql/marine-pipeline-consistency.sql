with scope as (
 select t.id from acquisition.tracks t join acquisition.artists a on a.id=t.primary_artist_id
 join acquisition.soundcharts_track_qualification q on q.track_id=t.id
 where a.slug='marine' and q.include_in_cfo_metrics and q.qualification_status='include' and t.is_active and t.acquisition_enabled
), d as (select private.cfo_spotify_common_date('marine') ref_date),
points as (
 select s.id,ref_date,
 (select value_numeric from acquisition.metric_observations m where m.track_id=s.id and platform='spotify' and metric_type='streams_total' and observation_date=ref_date and dimensions @> '{"verified":true,"dataset":"track_spotify_streams"}' order by acquired_at desc,id desc limit 1) cur,
 (select value_numeric from acquisition.metric_observations m where m.track_id=s.id and platform='spotify' and metric_type='streams_total' and observation_date=ref_date-7 and dimensions @> '{"verified":true,"dataset":"track_spotify_streams"}' order by acquired_at desc,id desc limit 1) p7,
 (select value_numeric from acquisition.metric_observations m where m.track_id=s.id and platform='spotify' and metric_type='streams_total' and observation_date=ref_date-14 and dimensions @> '{"verified":true,"dataset":"track_spotify_streams"}' order by acquired_at desc,id desc limit 1) p14,
 (select value_numeric from acquisition.metric_observations m where m.track_id=s.id and platform='spotify' and metric_type='streams_total' and observation_date=ref_date-30 and dimensions @> '{"verified":true,"dataset":"track_spotify_streams"}' order by acquired_at desc,id desc limit 1) p30
 from scope s cross join d
), checks as (
 select
  (select payload#>>'{marine,streaming,weekly_current}' from cfo.marine_dashboard_cache)::numeric=sum(cur-p7) weekly_cache_matches_sources,
  (select payload#>>'{streams_weekly,value}' from public.cfo_home_snapshot where snapshot_key='marine')::numeric=sum(cur-p7) home_matches_sources,
  round(sum(cur-p30)/30)=(private.cfo_streaming_family_snapshot('marine')#>>'{catalogue,mm30}')::numeric mm30_exact_dates,
  count(*)=count(cur) and count(*)=count(p7) and count(*)=count(p14) and count(*)=count(p30) complete_0_7_14_30,
  (select payload#>>'{marine,airplay,spins_7d}' from cfo.marine_dashboard_cache)::numeric=(select payload#>>'{airplay_weekly,value}' from public.cfo_home_snapshot where snapshot_key='marine')::numeric radio_home_cache_match
 from points
), changes as (select x from jsonb_array_elements(public.cfo_marine_metric_changes_30d()) x)
select to_jsonb(checks) || jsonb_build_object(
 'change_30d_date_errors',(select count(*) from changes where (x->>'comparison_valid')::boolean and (x->>'previous_date')::date<>(x->>'date')::date-30),
 'change_30d_formula_errors',(select count(*) from changes where (x->>'previous_value')::numeric>0 and (x->>'change_30d_pct')::numeric<>round(100*((x->>'value')::numeric-(x->>'previous_value')::numeric)/(x->>'previous_value')::numeric,2)),
 'interpolated_observations',(select count(*) from acquisition.metric_observations where is_interpolated),
 'calls_consumed',(select count(*) from acquisition.soundcharts_call_ledger),
 'shazam_job_active',(select active from cron.job where jobname='cfo-marine-shazam-daily')
) validation from checks;
