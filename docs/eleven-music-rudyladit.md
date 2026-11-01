# Eleven Music — piano RudyLadit

[Écouter le MP3 de 8 secondes](audio/rudyladit-piano-8s.mp3)

## Résultat du 31 octobre 2026

Une seule génération Eleven Music `music_v2_5` a réussi : piano acoustique instrumental, mélodique et expressif. Requête fixe `music_length_ms: 8000`, `force_instrumental: true`, format `mp3_48000_192`.

Le fichier fournisseur mesure 8,04 s. Les 40 ms finales ont été retirées et le MP3 réencodé avec libmp3lame à 192 kbit/s pour livrer exactement **8,00 s décodées** : 384 000 échantillons par canal à 48 kHz, stéréo. Décodage complet sans erreur ; signal non silencieux. Ceci ne constitue pas une validation artistique à l'écoute.

Le MP3 livré est versionné dans `docs/audio/rudyladit-piano-8s.mp3`. Le fichier original reste dans le bucket Supabase privé `rudyladit-music-pilot`, objet `piano-8s-2026-10-31.mp3`.

## Fonction et sécurité

Code : `supabase/functions/cfo-elevenlabs-music-pilot/index.ts`. Projet : `fjpcuxsezeuajhlotzij`. Déploiement final ACTIVE v3 avec `verify_jwt=true`.

La fonction conserve la vérification JWT et exige une autorisation supplémentaire. Le pilote a été invoqué côté serveur via pg_net avec le JWT existant et un jeton aléatoire de 256 bits limité au pilote, explicitement autorisé par l'utilisateur. Le jeton a été généré dans Vault sans être retourné ; seule son empreinte SHA-256 a servi au déploiement temporaire. Il a ensuite été supprimé du coffre et l'accès temporaire désactivé dans le déploiement final. L'authentification administrateur reste disponible pour récupérer l'objet existant.

Le verrou atomique persistant est conservé. Une relance autorisée réutilise le MP3 et ne crée pas une deuxième génération. Ne pas supprimer le verrou pour réessayer sans vérification et autorisation.

Aucun secret ni lien signé n'est versionné. Les fonctions de lecture des articles CFO restent inchangées.

## Vérifications

Avec Node 24 :

- `node supabase/functions/cfo-elevenlabs-music-pilot/check.mjs`
- `node supabase/functions/cfo-elevenlabs-music-pilot/check-temporary-access.mjs`

Les tests simulent les appels fournisseur : méthode, autorisation, paramètres fixes, cache, erreurs expurgées, verrou après échec et appels concurrents, jeton temporaire invalide/expiré. La vérification du MP3 réel repose sur FFmpeg et le comptage des trames PCM.

Détails et empreintes : `docs/results/eleven-music-pilot-2026-10-31.json`.

API officielle : https://elevenlabs.io/docs/api-reference/music/compose
