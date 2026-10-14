# CFO Marine — contrôle de cohérence du 14 octobre 2026

## Correction exécutée en production

Projet Supabase : `fjpcuxsezeuajhlotzij` (Chroniques d'une fille ordinaire).

L'enquête a identifié 932 passages radio entre le 8 et le 14 octobre 2026 dont `acquisition.radio_spins.track_id` était NULL. Chacun disposait d'un identifiant Soundcharts `source_payload.song.uuid` permettant une correspondance unique avec `acquisition.tracks.soundcharts_uuid` au sein du même artiste.

Liaison réparée par mise à jour SQL ciblée sur Marine, la période et les lignes NULL uniquement ; résultat UPDATE RETURNING : 932 lignes. Vérification indépendante ensuite : 0 passages sans titre lié sur la période.

Deux caches ont été rafraîchis : `private.refresh_cfo_home_snapshot()` et `cfo.refresh_marine_dashboard_cache()`.

Résultats vérifiés : accueil radio 1875 (précédent 2153, -12,9 %) ; tableau de bord radio 1875 (précédent 2156, -13,0 %). Le nombre actuel converge, les références historiques restent différentes.

## À corriger avant de conclure

- Radio : investiguer l'écart historique 2153/2156, puis prévoir une liaison automatique par identifiant Soundcharts à l'ingestion pour prévenir toute régression. Une réparation ponctuelle n'est pas une correction durable de pipeline.
- Spotify : accueil 857993 / -9,6 % vs cache Marine 804914 / +2,0 %. Les deux calculs n'ont pas le même périmètre : le cache filtre les titres vérifiés et le marqueur `canonical_for_total`; la fonction d'accueil utilise la qualification `include_in_cfo_metrics`, sans le même dédoublonnage. Définir une mesure commune à dates et périmètres identiques avant de modifier l'éditorial.
- YouTube vues/jour : observation du 4 octobre, périmée au 14 octobre ; afficher la date effective ou suspendre les conclusions de tendance.
- La publication web WordPress n'a pas été vérifiée après rafraîchissement ; distinguer Supabase, cache WordPress et rendu public.

**Règles :** aucun chiffre en dur ; période explicite ; couverture et fraîcheur par métrique ; aucun commentaire sans donnée comparable.
