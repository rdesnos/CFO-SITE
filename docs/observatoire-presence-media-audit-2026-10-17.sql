-- CFO Marine / Observatoire: presence mediatique, extraction auditable
-- Source primaire interne: public.cfo_news_items
-- Aucun appel Soundcharts. Requete en lecture seule.
-- Important: "detected" = signal candidat, PAS apparition verifiee.
WITH candidates AS (
 SELECT id,artist_slug,category,status,source_name,source_domain,source_title,
        canonical_url,published_at,detected_at,reliability_score,
        is_primary_source,is_official_source,duplicate_of
 FROM public.cfo_news_items
 WHERE artist_slug = 'marine'
   AND category IN ('media','interview')
   AND status <> 'ignored'
   AND duplicate_of IS NULL
   AND published_at >= CURRENT_DATE - INTERVAL '30 days'
), qualified AS (
 SELECT *, CASE
   WHEN status IN ('validated','published') THEN 'validated'
   ELSE 'to_verify' END AS evidence_status
 FROM candidates
)
SELECT category,evidence_status,count(*) AS source_items,
       count(DISTINCT source_domain) AS distinct_domains,
       max(published_at) AS latest_publication
FROM qualified
GROUP BY category,evidence_status
ORDER BY category,evidence_status;

-- Suite de la chaine (a implementer et tester avant exposition publique):
-- 1. Verifier les articles, interviews et apparitions; dedoublonner les reprises.
-- 2. Ne pas convertir automatiquement un article en apparition TV/radio.
-- 3. Lier l'evenement verifie a cfo.media_events avec source_url et date.
-- 4. Croiser par fenetres J-7/J+7 avec les mesures streaming/sociales.
-- 5. Presenter des coincidences temporelles; aucune causalite automatique.
-- 6. Projections de certification: joindre seulement les seuils et calibrations
--    documentes; aucun equivalence brute vues YouTube -> unites SNEP.
