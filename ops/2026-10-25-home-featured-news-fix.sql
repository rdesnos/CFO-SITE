-- Production data correction applied on 25 October 2026.
-- Symptom: Supabase hydration overwrote the updated WordPress lead with the old nomination.
-- Existing editorial placement trigger refreshes featured_news automatically.
-- Verified: snapshot now returns the victory headline and the published CFO article URL.
-- Verified: rendered home lead shows the victory and the internal article link.
-- No schema or audience metrics changed.
-- Previous editorial placement (public content only):
-- [{"id":"a1a4fcb3-1ca2-47f3-9365-6006465632bf","artist_slug":"marine","content_type":"news","content_id":"4b99c2cc-5c33-455d-aaba-cf1b45671070","placement_key":"home.a_la_une","priority":10,"active":true,"starts_at":null,"ends_at":null,"headline_override":"Marine nommée aux NRJ Music Awards 2026 : le vote est ouvert","summary_override":"Marine figure parmi les nommées de la catégorie Artiste Féminine Francophone. Le vote du public est ouvert jusqu’au 23 octobre à 12 h, à raison d’un vote par jour et par catégorie.","image_url_override":"https://chroniques-fille-ordinaire.com/wp-content/uploads/2026/09/NRJ-Music-Awards-2026-—-visuel-NRJ.jpg","cta_label":"Voter sur NRJ ↗","cta_url":"https://www.nrj.fr/music-awards/votes","metadata":{"managed_by":"CFO","editorial_reason":"actualité principale de la home"},"created_at":"2026-09-26 08:57:40.133244+00","updated_at":"2026-09-26 08:57:40.133244+00"}]

BEGIN;

-- Correct the editorial source consumed by the home hydration script.
-- Updating only WordPress leaves the old nomination visible after load.
WITH existing AS (
  SELECT id FROM public.cfo_news_items
  WHERE artist_slug = 'marine'
    AND canonical_url = 'https://www.nrj.fr/music-awards/actualites/cest-incroyable-marine-confirme-avec-le-trophee-dartiste-feminine-francophone-71367251'
), inserted AS (
  INSERT INTO public.cfo_news_items
    (artist_slug,canonical_url,source_name,source_domain,source_title,published_at,
     cfo_summary,image_url,status,is_primary_source,is_official_source,metadata)
  SELECT 'marine',
    'https://www.nrj.fr/music-awards/actualites/cest-incroyable-marine-confirme-avec-le-trophee-dartiste-feminine-francophone-71367251',
    'NRJ','nrj.fr',
    'Marine sacrée Artiste Féminine Francophone aux NRJ Music Awards 2026',
    '2026-10-24T00:24:00+02:00'::timestamptz,
    'Le 23 octobre 2026 à Cannes, Marine remporte le NRJ Music Award de l’Artiste Féminine Francophone, après celui de la Révélation Féminine Francophone en 2025.',
    'https://chroniques-fille-ordinaire.com/wp-content/uploads/2026/09/NRJ-Music-Awards-2026-—-visuel-NRJ.jpg',
    'validated',true,true,
    '{"wp_id":3097,"wp_tag":"a-la-une","validation_source":"NRJ announcement checked 2026-10-25","fix":"home stale nomination after hydration"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
), chosen AS (
  SELECT id FROM existing UNION ALL SELECT id FROM inserted
)
UPDATE cfo.editorial_placements
SET content_id = (SELECT id FROM chosen),
    headline_override = 'Marine sacrée Artiste Féminine Francophone aux NRJ Music Awards 2026',
    summary_override = 'Le 23 octobre 2026 à Cannes, Marine remporte le NRJ Music Award de l’Artiste Féminine Francophone, après celui de la Révélation Féminine Francophone en 2025.',
    cta_label = 'Lire l’actualité →',
    cta_url = 'https://chroniques-fille-ordinaire.com/marine-victoire-nrj-music-awards-2026/',
    metadata = metadata || '{"wp_id":3097,"wp_tag":"a-la-une","fix":"home stale nomination after hydration"}'::jsonb,
    updated_at = now()
WHERE id = 'a1a4fcb3-1ca2-47f3-9365-6006465632bf'
  AND artist_slug = 'marine'
  AND placement_key = 'home.a_la_une'
  AND active
RETURNING id,content_id,headline_override,cta_url;

COMMIT;

-- Read-only verification:
SELECT payload->'featured_news' AS featured_news
FROM public.cfo_home_snapshot
WHERE snapshot_key = 'marine';
