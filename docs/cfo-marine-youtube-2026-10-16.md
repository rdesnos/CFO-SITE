# CFO Marine — contrôle YouTube et des six plateformes

## Diagnostic vérifié avant correction

Dépôt : https://github.com/rdesnos/CFO-SITE. Collecteur : `supabase/functions/cfo-soundcharts-extract/index.ts`, appelé à 03:15 UTC puis reprise à 04:05 UTC. Normalisation : `public.cfo_normalize_soundcharts`; santé : `private.refresh_cfo_marine_data_health`; cache : `cfo.refresh_marine_dashboard_cache`; lecture publique : `cfo_marine_dashboard`, puis `wordpress/theme/assets/js/cfo-observatoire-live.js`.

La route `/api/v2/artist/{uuid}/streaming/youtube/listening` fournit les vues musicales de toutes les chaînes, vidéos officielles, paroles et UGC inclus. La route `/api/v2/artist/{uuid}/audience/youtube` fournit les compteurs de la chaîne. Ces périmètres sont différents. Documentation officielle vérifiée le 16 octobre : https://developers.soundcharts.com/api/reference/artist/get-streaming-audience et https://help.soundcharts.com/en/articles/3191135-why-can-t-i-see-youtube-views-on-the-audience-page.

La réponse brute 63323 du 16 octobre contient 18 points, `lastCrawlDate=2026-10-04`, HTTP 200, `errors=[]`, `page.next=null`. Aucun changement de format détecté. Toutes les archives ont été recherchées pour les dates depuis le 1er octobre : seules les dates 1, 2 et 4 existent, avec respectivement 70280, 78395 et 63275 vues. Pas de point oublié à normaliser pour le 3 ou les 5–15 octobre.

La réponse 63326 contient les compteurs de chaîne au 15 octobre : 115000 abonnés, 54434219 vues, 73 publications. Les cumuls progressent par paliers couvrant plusieurs jours. Une différence attribuerait artificiellement ces mises à jour à une journée et créerait des zéros sur les autres. Aucune reconstruction quotidienne n'est donc fiable avec les données disponibles.

Le dernier `acquired_at` du 8 octobre pour les vues quotidiennes ne signifie pas l'arrêt des appels : les réponses identiques sont dédupliquées. Il faut distinguer dernière tentative, dernière archive, date de collecte fournisseur et date de l'observation.

## Six plateformes — audit des sources au 16 octobre

| Plateforme | Mesures contrôlées | Dernière observation | Constat |
|---|---|---|---|
| Spotify | auditeurs mensuels, abonnés, cumuls des 32 titres | 16 octobre / titres 15 octobre | fraîches, périodes communes et comparaisons à dates exactes |
| Deezer | abonnés | 16 octobre | frais ; route streaming vide, aucun chiffre inventé |
| YouTube | abonnés, cumul de chaîne, publications / vues musicales quotidiennes | 15 octobre / 4 octobre | retard fournisseur sur les seules vues musicales |
| Instagram | abonnés | 15 octobre | frais |
| Facebook | abonnés | 15 octobre | frais |
| TikTok | abonnés | 15 octobre | frais ; comparaison exacte J-7 absente, donc variation non affichée |

Les 14 indicateurs de santé ne couvrent pas tous les champs secondaires (par exemple publications YouTube). La date de rafraîchissement du cache n'est jamais une preuve de fraîcheur de la source.

## Correction complémentaire

- Registre enrichi avec paramètres, statut HTTP (0 pour échec réseau), empreinte de réponse, date de fin et lien vers l'archive et l'extraction. Une nouvelle tentative reste distincte même si son contenu brut est dédupliqué. Aucun appel antérieur n'est réinventé dans le registre.
- Collecteur principal : les réponses 200 anciennes, invalides, vides, porteuses d'erreurs ou incomplètement paginées sont explicitement signalées. Filtre de routes pour tester YouTube avec deux appels seulement.
- Santé : date du dernier contrôle et type de preuve (`archive_only` ou `call_ledger`), date de collecte fournisseur et périmètre de l'indicateur.
- Compteurs historiques, archives existantes et points manquants conservés. Pas de zéro de remplacement. Aucune collecte historique supplémentaire.

## Validation

Avant publication : 27 tests de pipeline et les 12 cas de pertinence existants passent. Les nouveaux tests couvrent la sonde YouTube bornée à deux routes, la réponse fraîche, le retard, les valeurs nulles, un format inconnu, les erreurs fournisseur, une page restante, une panne du registre et le quota épuisé.

Validation de production et consommation : à compléter après publication du correctif.
