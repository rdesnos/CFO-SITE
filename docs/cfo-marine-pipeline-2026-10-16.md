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

## Résultats de production

Les deux collecteurs Marine sont déployés (extract v12, Shazam v3), les quatre migrations de ce lot appliquées, et la tâche Shazam réactivée à 03:50 UTC. Les deux collectes utilisent le secret d'invocation déjà conservé dans Vault. Les écritures Shazam et la réservation du budget sont interdites aux rôles publics.

Une exécution Shazam contrôlée a traité les 32 titres qualifiés en **32 appels Soundcharts** : 8 observations nouvelles, datées des 14 et 15 octobre ; 24 réponses récentes vides. Deux titres ne disposent d'aucun ancien comptage. Aucun zéro ni continuité n'a été créé. La tâche se limite aux 14 derniers jours et ne reprend pas la file historique multi-artistes.

Le budget comptabilise 32 réservations effectives et une provision d'ouverture de 5000 : solde technique 5032/10000. La provision est une marge de sécurité pour octobre, pas une estimation publiée de la consommation fournisseur. L'historique des appels avant instrumentation est partiellement dédupliqué et ne permet pas d'établir un relevé de facturation exact.

Les utilitaires Marine resolve-panel v6, shazam-audit v4 et playlist-audit v3 passent également par le compteur. L'audit playlists exige désormais le secret partagé avant tout accès aux identifiants fournisseur.

### Concordance de la période 9–15 octobre

| Mesure | Source / cache / accueil contrôlés |
|---|---:|
| Titres qualifiés et couverts | 32 |
| Cumul Spotify | 121766904 |
| Streams sur 7 jours | 951021 |
| Semaine précédente | 956603 |
| Variation hebdomadaire | -0,6 % |
| Passages radio | 2088 |
| Semaine radio précédente | 2141 |
| Variation radio | -2,5 % |

Le navigateur public affiche 951021 streams, 2088 passages et la période explicite 09/10–15/10. Son classement radio utilise désormais les sept jours correspondants (Tricheur 1106), au lieu de reprendre un classement 30 jours sous le KPI hebdomadaire. Les commentaires fixes de septembre et les chiffres de secours du gabarit Marine ont été retirés. En attente des données, les mesures restent des tirets.

Les variations à 30 jours ont **0 erreur de date et 0 erreur de formule** lors du contrôle indépendant. Les points J, J-7, J-14 et J-30 sont complets pour le catalogue actuel ; MM30 concorde avec les sources aux dates exactes. L'absence d'un point exact sur un réseau suspend la comparaison sociale agrégée et ne devient plus artificiellement une variation nulle.

Le détail public « Dates des relevés et état des sources » expose les dates, les variations sur 30 jours et les comptages Shazam titre par titre. YouTube quotidien y reste explicitement ancien, au 4 octobre : l'API fournisseur continue de livrer cette dernière date. Aucune série alternative ou différence de compteurs globaux n'a été substituée.

### Conservation, tests et traces

- Les 660755 observations et les 1605571 passages radio présents au départ conservent exactement les mêmes comptes et sommes de hachages JSON après intervention.
- 18 tests de pipeline et 12 cas de pertinence existants passent localement.
- Relectures Spotify et Shazam des réponses archivées : aucune observation dupliquée ou réécrite. Relecture radio : aucune insertion et aucune mise à jour.
- Test du plafond à 10000, contrôle des privilèges et relectures exécutés dans des transactions annulées. Ces tests n'ont consommé aucun appel fournisseur.
- Contrôles SQL dans `tests/sql/`, bilan machine dans `releases/2026-10-16-data-pipeline/verification.json`, capture dans `production.png`.
- Le JavaScript distant a été comparé au fichier versionné. Le PHP déployé préserve le contenu déjà présent en production ; sa seule différence effective est le numéro de version du script. Les caches Hostinger ont été purgés. Les identifiants de téléversement temporaires ont été supprimés.

## Limites et autorisation complémentaire

Le contrôle automatique d'approbation a refusé la relance globale du collecteur quotidien après déploiement (plusieurs jeux de données et quota), puis le déploiement de l'utilitaire ISRC Eddy de Pretto, dont le périmètre peut modifier un catalogue autre que Marine. Aucune de ces actions refusées n'a été contournée. Les tests de relecture annulés remplacent la relance globale.

Les protections partagées sont préparées et testées pour les six utilitaires ci-dessous, mais **ne sont pas déployées** :

- `cfo-eddy-isrc-audit`
- `cfo-eddy-isrc-probe`
- `cfo-panel-new-artists-resolve`
- `cfo-import-new-panel-catalogs`
- `cfo-new-panel-isrc`
- `cfo-soundcharts-full-init`

Ils ne sont appelés par aucun cron actif relevé pendant l'audit. Leur déploiement nécessite une autorisation explicite couvrant ces utilitaires du panel. Tant qu'ils restent inchangés, le plafond partagé protège les collecteurs Marine et les trois utilitaires déployés, mais ne garantit pas le total de tous les appels manuels du compte Soundcharts.

Les conseillers Supabase signalent encore la vue publique `cfo_cockpit_overview_v1` avec privilèges du créateur, antérieure à ce lot ([règle de contrôle](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)). Les trois tables opérationnelles créées ont RLS activé sans politique publique : cet état est volontaire, elles sont réservées aux fonctions privilégiées et au service.

La consommation fournisseur antérieure exacte, les 24 réponses Shazam sans point récent et la reprise de la collecte quotidienne YouTube restent des limites externes. Aucun historique n'a été altéré pour les masquer.
