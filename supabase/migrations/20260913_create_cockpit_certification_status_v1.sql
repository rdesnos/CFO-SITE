-- CFO Observatoire - Cockpit certifications status v1
-- Applied to Supabase production on 2026-09-13.

create or replace view cfo.cockpit_certification_status
with (security_invoker = true) as
with latest_event as (
  select distinct on (ce.family_id)
    ce.family_id,
    ce.level as current_level,
    ce.certified_on,
    ce.official_threshold as current_threshold,
    ce.official_unit
  from cfo.certification_events ce
  order by ce.family_id, ce.certified_on desc, ce.official_threshold desc
), recording_scope as (
  select
    cfr.family_id,
    count(*) filter (where cfr.included) as included_recordings,
    count(*) filter (where cfr.included and cfr.verification_status = 'verified') as verified_recordings,
    array_agg(cfr.isrc order by cfr.isrc) filter (where cfr.included) as included_isrcs
  from cfo.certification_family_recordings cfr
  group by cfr.family_id
), calibration as (
  select
    ccm.artist_id,
    ccm.format,
    ccm.certification_level,
    max(ccm.sample_size) as sample_size,
    max(ccm.quality_status) as quality_status,
    max(ccm.model_version) as model_version,
    jsonb_object_agg(
      ccm.platform,
      jsonb_build_object(
        'low', ccm.empirical_value_low,
        'median', ccm.empirical_value_median,
        'high', ccm.empirical_value_high,
        'ratio_low', ccm.ratio_low,
        'ratio_median', ccm.ratio_median,
        'ratio_high', ccm.ratio_high
      )
    ) as platform_calibration
  from cfo.certification_calibration_matrix ccm
  group by ccm.artist_id, ccm.format, ccm.certification_level
)
select
  cf.id as family_id,
  cf.artist_id,
  a.name as artist_name,
  cf.title,
  cf.format,
  cf.authority_market,
  cf.consolidation_basis,
  cf.scope_definition,
  le.current_level,
  le.certified_on,
  le.current_threshold,
  le.official_unit,
  coalesce(rs.included_recordings, 0) as included_recordings,
  coalesce(rs.verified_recordings, 0) as verified_recordings,
  rs.included_isrcs,
  cal.sample_size as calibration_sample_size,
  cal.quality_status as calibration_quality_status,
  cal.model_version,
  cal.platform_calibration,
  case
    when coalesce(rs.included_recordings, 0) = 0 then 'scope_missing'
    when coalesce(rs.verified_recordings, 0) < coalesce(rs.included_recordings, 0) then 'scope_review'
    when cal.artist_id is null then 'calibration_missing'
    else 'ready'
  end as cockpit_readiness
from cfo.certification_families cf
join acquisition.artists a on a.id = cf.artist_id
left join latest_event le on le.family_id = cf.id
left join recording_scope rs on rs.family_id = cf.id
left join calibration cal
  on cal.artist_id = cf.artist_id
 and cal.format = cf.format
 and cal.certification_level = le.current_level
where cf.is_active;
