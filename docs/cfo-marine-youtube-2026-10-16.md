# CFO Marine — contrôle YouTube et des six plateformes

## Diagnostic vérifié avant correction

Dépôt : https://github.com/rdesnos/CFO-SITE. Collecteur : `supabase/functions/cfo-soundcharts-extract/index.ts`, appelé à 03:15 UTC puis reprise à 04:05 UTC. Normalisation : `public.cfo_normalize_soundcharts`; santé : `private.refresh_cfo_marine_data_health`; cache : `cfo.refresh_marine_dashboard_cache`; lecture publique : `cfo_marine_dashboard_public_v1`, puis `wordpress/theme/assets/js/cfo-observatoire-live.js`.

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

Avant publication : 27 tests de pipeline et les 12 cas de pertinence existants passent sur la branche de préparation. Le lot YouTube est ensuite reporté seul sur la branche principale : ses 24 tests de pipeline et les 12 cas de pertinence passent également. Les trois tests supplémentaires de la branche de préparation concernent les utilitaires historiques non publiés. Les nouveaux tests couvrent la sonde YouTube bornée à deux routes, la réponse fraîche, le retard, les valeurs nulles, un format inconnu, les erreurs fournisseur, une page restante, une panne du registre et le quota épuisé.

Production : migration `20261016204710_marine_collection_trace` appliquée ; collecteur principal version 13 et Shazam version 4 actifs. Sonde authentifiée limitée aux deux routes YouTube, requête 5069 : deux appels HTTP 200. La série musicale retourne explicitement `partial/source_delayed`, avec les mêmes 18 points. La série de chaîne avance au 16 octobre.

Registre : deux nouvelles tentatives (identifiants 34 et 35 ; les séquences peuvent comporter des trous après rollback). Les deux ont un statut, une empreinte, des paramètres et des liens archive/extraction. La première est reliée à l'archive existante 63323 malgré la déduplication ; la seconde à la nouvelle archive 63427. Aucun appel fictif ajouté pour combler le passé.

Normalisation : une nouvelle observation d'abonnés, une de vues cumulées et une de publications ; aucune vue quotidienne créée. Valeurs YouTube au 16 octobre : 116000 abonnés, 54434219 vues cumulées et 73 publications. Les 660755 observations historiques jusqu'à l'identifiant 13876973 gardent exactement la somme de hash `-1277185763030275461432`.

Cache rafraîchi à 20:52:45 UTC, total social 1186780. Contrôle du site public : YouTube 116000, Instagram 711383, Facebook 29397, TikTok 330000 ; mêmes dates et valeurs que Supabase. Le site signale toujours les vues quotidiennes au 4 octobre comme anciennes. Capture : `releases/2026-10-16-data-pipeline/youtube-production.png`.

Les 15 comparaisons à 30 jours ont été recalculées : zéro erreur de date, de delta ou de pourcentage. Exemple YouTube abonnés : 116000 contre 114000 au 16 septembre, soit +1,75 %, arrondi à +1,8 % sur le site. La variation des vues quotidiennes reste datée du 4 octobre : elle ne décrit pas la situation du 16 octobre.

Consommation supplémentaire de cette validation : **2 appels Soundcharts** ; total instrumenté pendant l'intervention : **34** (32 Shazam, 2 YouTube). Provision d'ouverture conservatrice : 5000 ; le total technique réservé n'est pas une facture fournisseur. Les appels antérieurs non instrumentés ne sont pas quantifiables exactement.

## Anomalies et limites restantes

- Les vues musicales quotidiennes restent bloquées chez le fournisseur. Le pipeline local ne peut pas forcer la reprise de YouTube Charts/Soundcharts. Aucun point manquant fiable à réinjecter ; aucune différence des cumuls de chaîne ne sera utilisée comme substitution. Un dossier de diagnostic peut être transmis à Soundcharts par le titulaire du compte ; aucun message n'a été envoyé.
- Shazam reste partiellement couvert (8/32 récents), avec 24 réponses vides dans la fenêtre du test précédent. Les observations plus anciennes sont conservées.
- Les anciens appels restent sans traçabilité exhaustive. Les deux collecteurs quotidiens Marine sont désormais instrumentés ; les utilitaires manuels historiques gardent leur état de déploiement décrit dans le rapport précédent, dont six déploiements hors Marine refusés par la revue automatique. Aucun de ces six utilitaires n'a été déployé lors du présent lot.
- L'horaire quotidien suivant n'a pas encore eu lieu ; la sonde réelle a validé le même handler et les mêmes routes. Aucune nouvelle tâche planifiée ou notification n'a été créée.
- Livraison Git : branche `codex/marine-youtube-p0` publiée. Le push direct sur `main` a été refusé par la revue automatique, faute de preuve autorisant cette voie dans le processus existant. Une PR de revue est préparée ; aucune fusion n'est effectuée. Les versions Supabase ci-dessus sont déjà actives et contrôlées.
