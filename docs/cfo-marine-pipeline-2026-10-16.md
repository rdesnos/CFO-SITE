# CFO Marine — fiabilisation du pipeline, 16 octobre 2026

## Audit vérifié

- Shazam : tâche cron 16 désactivée ; dernière observation du 7 septembre. L'ancien worker sélectionnait les files pending/failed de tous les artistes, sans restriction Marine. Il supprimait les observations de la fenêtre avant réinsertion.
- YouTube : la réponse brute 63323, reçue le 16 octobre, contient 18 points du 16 septembre au 4 octobre. `related.lastCrawlDate=2026-10-04`, HTTP 200, aucune page suivante. Retard fournisseur, pas une panne de normalisation.
- Cache Marine : `cfo.refresh_marine_dashboard_cache` appelle `cfo_marine_snapshot_v1` et `cfo_marine_chart_series_v1`. Sources : observations et radio_spins du schéma acquisition, qualifications catalogue, référentiel de certification, panel_snapshot.
- FACTS streaming et airplay : vides ; pas de dépendance de ces fonctions. Le pipeline générique raw/facts est distinct (247 lignes raw streaming). Aucun remplissage de convenance ni collecte supplémentaire.
- Spotify : le cache utilisait une ancienne sélection de 25 titres ; la qualification active contient 32 titres, dont Tricheur. Le snapshot utilisait des dernières dates par titre et des points antérieurs à J-7/J-14/J-30, susceptibles de produire des périodes inégales.
- Historique avant intervention : 660755 observations, id maximal 13876973, somme des hashtextextended JSON `-1277185763030275461432`. Radio : 1605571 lignes, id maximal 3325024, somme `6987323057371320539037`.

## Lot

- Stockage Spotify, Shazam et radio en ajout seulement ; conflits ignorés, aucune suppression ou réécriture des observations.
- Shazam limité au contexte Marine qualifié, fenêtre de 14 jours, identifiant précédent conservé, 2 pages maximum par titre, collecte authentifiée et journalisée.
- Budget commun : réservation atomique avant requête, maximum 10000/mois UTC et 250/jour. Les réservations incluent les tentatives réseau échouées. Octobre utilise une provision conservatrice d'au moins 5000 appels pour la période non instrumentée ; ce n'est pas un chiffre de facturation. La consommation fournisseur antérieure exacte n'est pas reconstructible à partir d'archives dédupliquées.
- Collecteur quotidien sans reprise historique automatique ; amorçage Spotify borné à 35 jours pour les nouveaux titres.
- Catalogue qualifié, dernière date complète commune, comparaisons à dates exactes. Une donnée manquante reste NULL.
- Mesures de variation à 30 jours : date, valeur, valeur à J-30, variation absolue et pourcentage, identifiants des réponses brutes et validité de la comparaison.

## Validation locale

`node --test tests/soundcharts-pipeline.test.mjs tests/news-relevance.test.cjs` : 10 tests de pipeline et les 12 cas de pertinence existants réussis.

Les tests couvrent l'authentification, l'absence de collecte historique, la sélection canonique, les valeurs nulles/négatives, la réponse vide, le quota épuisé, HTTP 429 et l'échec d'archivage. Les données de test sont confinées aux mocks ; aucune donnée fictive n'est écrite dans Supabase.

## Publication

Ordre : commit du lot, déploiement des deux Edge Functions, migrations atomiques, tests SQL de conservation/idempotence/comparabilité, collecte réelle contrôlée, rafraîchissement des caches, contrôle du site public.

État de production et bilan d'appels à compléter avec les preuves de déploiement.
