-- Prevent stale YouTube daily views from driving current audience narratives.
CREATE OR REPLACE FUNCTION private.apply_cfo_home_analysis_cards()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  d jsonb;
  cards jsonb := '[]'::jsonb;
  sp numeric;
  sp_prev numeric;
  sp_pct numeric;
  yt numeric;
  yt_pct numeric;
  sw numeric;
  sw_pct numeric;
  ap numeric;
  ap_pct numeric;
  tr_s numeric;
  tr_s_pct numeric;
  tr_a numeric;
  tr_a_pct numeric;
  cat jsonb;
  top_title text;
  top_value numeric;
  top_pct numeric;
begin
  if new.snapshot_key <> 'marine' or new.payload is null then
    return new;
  end if;

  d := new.payload;
  sp := nullif(d#>>'{spotify_monthly,value}','')::numeric;
  sp_prev := nullif(d#>>'{spotify_monthly,previous}','')::numeric;
  sp_pct := nullif(d#>>'{spotify_monthly,change_pct}','')::numeric;
  yt := nullif(d#>>'{youtube_daily,value}','')::numeric;
  yt_pct := nullif(d#>>'{youtube_daily,change_pct}','')::numeric;
  -- A stale observation is kept for traceability in the snapshot but must not
  -- drive a current editorial conclusion.
  if nullif(d#>>'{youtube_daily,date}','')::date < coalesce(new.period_end,current_date)-2 then
    yt := null;
    yt_pct := null;
  end if;
  sw := nullif(d#>>'{streams_weekly,value}','')::numeric;
  sw_pct := nullif(d#>>'{streams_weekly,change_pct}','')::numeric;
  ap := nullif(d#>>'{airplay_weekly,value}','')::numeric;
  ap_pct := nullif(d#>>'{airplay_weekly,change_pct}','')::numeric;
  tr_s := nullif(d#>>'{tricheur,streams}','')::numeric;
  tr_s_pct := nullif(d#>>'{tricheur,streams_change_pct}','')::numeric;
  tr_a := nullif(d#>>'{tricheur,airplay}','')::numeric;
  tr_a_pct := nullif(d#>>'{tricheur,airplay_change_pct}','')::numeric;
  cat := coalesce(d->'catalogue','[]'::jsonb);

  select x->>'title',
         nullif(x->>'value','')::numeric,
         nullif(x->>'change_pct','')::numeric
    into top_title, top_value, top_pct
  from jsonb_array_elements(cat) x
  order by coalesce(nullif(x->>'change_pct','')::numeric,-999999) desc,
           coalesce(nullif(x->>'value','')::numeric,0) desc
  limit 1;

  cards := cards || jsonb_build_array(jsonb_build_object(
    'key','focus_track',
    'label','Musique',
    'title',
      case
        when tr_a_pct >= 25 and coalesce(tr_s_pct,0) >= 0 then 'Tricheur accélère nettement'
        when tr_a_pct >= 10 then 'Tricheur gagne du terrain en radio'
        when tr_s_pct >= 10 then 'Tricheur progresse en écoute'
        when tr_s_pct < -10 and tr_a_pct > 0 then 'Tricheur se déplace de l’écoute vers la radio'
        else 'Tricheur poursuit son installation'
      end,
    'summary',
      case
        when tr_a_pct >= 25 and coalesce(tr_s_pct,0) >= 0 then 'La progression radio est forte et les écoutes résistent : le titre gagne en exposition sans décrochage d’audience.'
        when tr_a_pct >= 10 then 'Le signal principal vient de la radio : le titre entre plus fortement dans les rotations.'
        when tr_s_pct >= 10 then 'La dynamique vient d’abord des écoutes, signe d’un intérêt public en progression.'
        when tr_s_pct < -10 and tr_a_pct > 0 then 'Les écoutes ralentissent tandis que la radio continue de progresser : la nature de l’exposition évolue.'
        else 'Les indicateurs restent contrastés : le titre continue de s’installer sans rupture nette.'
      end,
    'metrics',jsonb_build_array(
      jsonb_build_object('label','Streams semaine','value',tr_s,'change_pct',tr_s_pct),
      jsonb_build_object('label','Passages radio','value',tr_a,'change_pct',tr_a_pct)
    ),
    'source_keys',jsonb_build_array('tricheur.streams','tricheur.airplay')
  ));

  cards := cards || jsonb_build_array(jsonb_build_object(
    'key','catalogue',
    'label','Catalogue',
    'title',
      case
        when top_pct >= 5 then coalesce(top_title,'Le catalogue') || ' tire le catalogue vers le haut'
        when sw_pct >= 0 then 'Le catalogue reste orienté à la hausse'
        when sw_pct > -7 then 'Le catalogue résiste'
        else 'Le catalogue marque le pas'
      end,
    'summary',
      case
        when top_pct >= 5 then coalesce(top_title,'Un titre') || ' est le principal moteur positif de la semaine.'
        when sw_pct >= 0 then 'Le volume cumulé progresse malgré des évolutions contrastées selon les titres.'
        when sw_pct > -7 then 'Le recul global reste contenu : les titres principaux conservent l’essentiel de leur niveau.'
        else 'Le recul est suffisamment marqué pour signaler un tassement du fonds de catalogue.'
      end,
    'metrics',cat,
    'source_keys',jsonb_build_array('streams_weekly','catalogue')
  ));

  cards := cards || jsonb_build_array(jsonb_build_object(
    'key','audience',
    'label','Audience',
    'title',
      case
        when sp_pct > 1 and yt_pct > 5 then 'L’attention progresse sur plusieurs canaux'
        when sp_pct > 1 then 'Spotify repart à la hausse'
        when yt_pct > 5 then 'YouTube accélère'
        when sp_pct < -1 and yt_pct < -5 then 'L’attention se tasse'
        when yt is null and sp_pct < -1 then 'Spotify recule ; YouTube reste à actualiser'
        when yt is null and sp_pct > 1 then 'Spotify progresse ; YouTube reste à actualiser'
        when yt is null then 'YouTube : données à actualiser'
        else 'L’audience reste globalement stable'
      end,
    'summary',
      case
        when sp_pct > 1 and yt_pct > 5 then 'Spotify et YouTube progressent en même temps : le signal d’attention est convergent.'
        when sp_pct > 1 then 'La progression des auditeurs mensuels Spotify constitue le signal principal de la semaine.'
        when yt_pct > 5 then 'La hausse des vues quotidiennes YouTube compense une dynamique Spotify plus modérée.'
        when sp_pct < -1 and yt_pct < -5 then 'Spotify et YouTube reculent simultanément : l’attention globale se contracte.'
        when yt is null and sp_pct < -1 then 'Les auditeurs mensuels Spotify reculent. Les données quotidiennes YouTube sont trop anciennes pour conclure sur l’évolution globale de l’audience.'
        when yt is null and sp_pct > 1 then 'Les auditeurs mensuels Spotify progressent. Les données quotidiennes YouTube sont trop anciennes pour conclure sur une dynamique commune.'
        when yt is null then 'Les données quotidiennes YouTube doivent être actualisées avant de comparer les plateformes.'
        else 'Les indicateurs d’audience évoluent sans rupture suffisamment nette pour parler d’accélération ou de décrochage.'
      end,
    'metrics',jsonb_build_array(
      jsonb_build_object('label','Spotify mensuels','value',sp,'change_pct',sp_pct),
      jsonb_build_object('label',case when yt is null then 'Vues YouTube / jour — données anciennes' else 'Vues YouTube / jour' end,'value',yt,'change_pct',yt_pct)
    ),
    'source_keys',jsonb_build_array('spotify_monthly','youtube_daily')
  ));

  cards := cards || jsonb_build_array(jsonb_build_object(
    'key','exposure',
    'label','Exposition',
    'title',
      case
        when ap_pct >= 10 then 'La radio renforce l’exposition'
        when ap_pct <= -10 then 'L’exposition radio recule nettement'
        when ap_pct <= -5 then 'La radio se tasse légèrement'
        else 'La présence radio reste stable'
      end,
    'summary',
      case
        when ap_pct >= 10 then 'Le volume de passages radio progresse nettement par rapport à la semaine précédente.'
        when ap_pct <= -10 then 'Le recul des passages radio réduit nettement l’exposition hebdomadaire.'
        when ap_pct <= -5 then 'Les passages radio reculent modérément : l’exposition reste solide mais perd un peu de terrain cette semaine.'
        else 'Les rotations radio restent proches de leur niveau précédent, sans changement de régime.'
      end,
    'metrics',jsonb_build_array(
      jsonb_build_object('label','Passages semaine','value',ap,'change_pct',ap_pct)
    ),
    'source_keys',jsonb_build_array('airplay_weekly','radio_top')
  ));

  new.payload := jsonb_set(d,'{analysis_cards}',cards,true);
  return new;
end;
$function$
;
