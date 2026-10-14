# CFO Marine — audit de cohérence streaming (14 octobre 2026)

## Problème constaté
Le snapshot public `public.cfo_home_snapshot` affiche 857 993 streams Spotify sur sept jours (−9,6 %) tandis que le cache de l'Observatoire `cfo.marine_dashboard_cache` affiche 804 914 (+2,0 %).

Ces nombres n'ont pas le même périmètre et ne reposent pas sur des dates synchronisées :
- Accueil : 32 titres éligibles via `acquisition.soundcharts_track_qualification.include_in_cfo_metrics`.
- Observatoire vérifié : 25 titres via `acquisition.tracks.metadata.cfo_observatoire.included`.
- Le 14/10, seulement 2 des 25 titres disposent d'une observation Spotify certifiée. Le 13/10, les 25 titres ont une observation certifiée ; de même les 06/10 et 29/09.

## Calcul comparable sur les 25 titres
Critères : `source_code=soundcharts`, plateforme Spotify, `metric_type=streams_total`, provenance brute et exécution d'ingestion présentes, dimensions `dataset=track_spotify_streams` et `verified=true`, titres actifs et `included=true` dans la sélection de l'Observatoire.

Trois points temporels *identiques pour chaque titre* : 29 septembre, 6 octobre et 13 octobre 2026.

- Cumul au 13/10 : **116 378 359**.
- 7–13 octobre (13/10 moins 06/10) : **798 561**.
- 30 septembre–6 octobre (06/10 moins 29/09) : **793 877**.
- Évolution : **+0,6 %**, arrondie à une décimale.

## Règles avant mise en ligne de ces chiffres
1. Établir une vue/fonction pérenne et contrôlée calculant la *dernière date commune complète*, et enregistrer période/source/taux de couverture.
2. La date du bandeau global (8–14 octobre) n'est **pas** celle du streaming ci-dessus (7–13 octobre). Modifier l'interface pour afficher la période propre à la métrique avant de remplacer les chiffres.
3. Aligner les chiffres et analyses du catalogue et du morceau en vedette sur le même périmètre et les mêmes dates ; ne pas changer seulement le KPI global.
4. Ne conclure ni à une chute de −9,6 %, ni à une hausse de +2,0 % à partir de ces totaux non comparables.

## Autres changements appliqués le 14/10
- Réparation historique de 932 passages radio et liaison automatique des nouveaux relevés via identifiant Soundcharts ; accueil et Observatoire concordent sur 1 875 passages et −13,0 %.
- Exclusion des vues YouTube quotidiennes anciennes de l'interprétation éditoriale courante, sans supprimer les observations source.
- **Publication WordPress et affichage externe non validés.**

Ce document consigne un calcul SQL vérifié ; il ne signifie pas que la page publique affiche déjà les métriques Spotify corrigées.
