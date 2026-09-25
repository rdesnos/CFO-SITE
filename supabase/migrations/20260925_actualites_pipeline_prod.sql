-- CFO Actualites production pipeline - 2026-09-25
-- Source of truth: Supabase project fjpcuxsezeuajhlotzij.
-- No secrets are stored in this migration.

create or replace function private.cfo_news_auto_validate()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.cfo_news_items i
     set status = 'validated',
         decision_note = 'Auto-validation CFO: actualite Marine directe',
         relevance_score = greatest(coalesce(i.relevance_score,0), 90),
         priority_score = greatest(
           coalesce(i.priority_score,0),
           case
             when s.source_tier='platinum' then 95
             when s.source_tier='gold' then 85
             else 75
           end
         ),
         updated_at = now()
    from public.cfo_news_sources s
   where s.id = i.source_id
     and i.status = 'detected'
     and i.duplicate_of is null
     and i.canonical_url is not null
     and btrim(i.canonical_url) <> ''
     and coalesce(s.active,true) is true
     and coalesce(s.source_status,'active') <> 'blacklisted'
     and coalesce(i.published_at,i.detected_at,i.updated_at) >= now() - interval '30 days'
     and (
       (
         s.source_tier in ('platinum','gold')
         and (
           lower(i.source_title) like '%marine%'
           or lower(coalesce(i.source_excerpt,'')) like '%marine%'
           or lower(i.source_title) like '%tricheur%'
           or lower(i.source_title) like '%coeur maladroit%'
           or lower(i.source_title) like '%cœur maladroit%'
           or lower(i.source_title) like '%ma faute%'
           or lower(i.source_title) like '%restes d''averses%'
         )
       )
       or
       (
         s.source_tier='silver'
         and lower(i.source_title) like '%marine%'
         and lower(i.source_title) not like '%marine le pen%'
         and lower(i.source_title) not like '%marine nationale%'
         and lower(i.source_title) not like '%ex-marine%'
       )
     );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function private.cfo_news_close_stale_runs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.cfo_news_ingestion_runs
     set status='partial',
         finished_at=coalesce(finished_at,now()),
         errors=coalesce(errors,'[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('source','collector','error','collector timeout or interrupted before completion')
         )
   where status='running'
     and started_at < now() - interval '10 minutes';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname='cfo-news-collector-hourly') then
    perform cron.unschedule('cfo-news-collector-hourly');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-collector-official') then
    perform cron.unschedule('cfo-news-collector-official');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-collector-media-a') then
    perform cron.unschedule('cfo-news-collector-media-a');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-collector-media-b') then
    perform cron.unschedule('cfo-news-collector-media-b');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-auto-validate-hourly') then
    perform cron.unschedule('cfo-news-auto-validate-hourly');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-auto-validate-quarter-hour') then
    perform cron.unschedule('cfo-news-auto-validate-quarter-hour');
  end if;
  if exists (select 1 from cron.job where jobname='cfo-news-close-stale-runs') then
    perform cron.unschedule('cfo-news-close-stale-runs');
  end if;

  perform cron.schedule(
    'cfo-news-collector-official',
    '5 * * * *',
    $cmd$select net.http_post(
      url := 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-news-collector',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object(
        'scheduled_at',now(),
        'source_names',jsonb_build_array(
          'Marine Hub officiel',
          'Marine YouTube',
          'Marine TikTok',
          'Marine Instagram',
          'Sony Music France - Marine',
          'Arachnée Productions - Marine'
        )
      ),
      timeout_milliseconds := 25000
    );$cmd$
  );

  perform cron.schedule(
    'cfo-news-collector-media-a',
    '20 * * * *',
    $cmd$select net.http_post(
      url := 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-news-collector',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object(
        'scheduled_at',now(),
        'source_names',jsonb_build_array('NRJ','Europe 2','Soirmag')
      ),
      timeout_milliseconds := 25000
    );$cmd$
  );

  perform cron.schedule(
    'cfo-news-collector-media-b',
    '35 * * * *',
    $cmd$select net.http_post(
      url := 'https://fjpcuxsezeuajhlotzij.supabase.co/functions/v1/cfo-news-collector',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object(
        'scheduled_at',now(),
        'source_names',jsonb_build_array('La Voix du Nord','Marie Claire','AlloCine','Artmedia')
      ),
      timeout_milliseconds := 25000
    );$cmd$
  );

  perform cron.schedule(
    'cfo-news-auto-validate-quarter-hour',
    '10,25,40,55 * * * *',
    'select private.cfo_news_auto_validate();'
  );

  perform cron.schedule(
    'cfo-news-close-stale-runs',
    '0,15,30,45 * * * *',
    'select private.cfo_news_close_stale_runs();'
  );
end
$$;
