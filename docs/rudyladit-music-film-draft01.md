# Rudy l’a dit — maquette musicale de 40 secondes, version 1

[Écouter le MP3](audio/RudyLadit-maquette-40s-v1.mp3)

## Direction artistique retenue

Construction cumulative : chaque instrument reste audible après son entrée, jusqu'au break. Piano acoustique mélodique plus aigu, avec un petit arpège juste avant les cordes. Les cordes entrent en trois temps. La contrebasse est jouée aux doigts en pizzicato. Après une coupure de tout l'ensemble et un solo de batterie, tous les instruments reviennent avec un riff de guitare électrique identifiable au premier plan.

| Temps | Arrangement demandé |
|---|---|
| 0–8 s | Piano acoustique expressif dans le registre aigu ; arpège en fin de séquence |
| 8–16 s | Violons ajoutés ; le piano continue |
| 16–20 s | Violoncelle ajouté ; piano et violons continuent |
| 20–24 s | Contrebasse pizzicato ajoutée ; les autres instruments continuent |
| 24–26 s | Coupure complète, silence |
| 26–31 s | Batterie acoustique seule |
| 31–40 s | Retour de tout l'ensemble, avec riff de guitare électrique au premier plan |

L'entrée du violoncelle à 16 s et de la contrebasse à 20 s constitue la répartition proposée pour cette première maquette.

## Production vérifiée

Une seule génération payante explicitement autorisée a été effectuée avec Eleven Music music_v2_5. Plan v2 de six chunks totalisant 38 secondes musicales. Le modèle impose un minimum de trois secondes par chunk ; la coupure exacte de deux secondes a donc été insérée localement à 24 s. Le fichier fournisseur de 38,04 s a été limité à 38 s puis monté en 40,00 s, encodé en MP3 stéréo 48 kHz / 192 kbit/s. Aucun nouvel appel fournisseur lors du montage.

Vérifications : décodage intégral sans erreur, 1 920 000 trames PCM par canal, silence central vérifié entre 24,05 et 25,95 s. Les timings et la lisibilité sont contrôlés ; la qualité artistique, les entrées instrumentales et la présence du riff nécessitent une validation à l'écoute. Il s'agit d'une première proposition.

## Sécurité et isolation

Fonction séparée `cfo-elevenlabs-music-film-draft`, déploiement final v2, JWT activé. Le pilote piano initial et toutes les fonctions de lecture CFO restent séparés. L'accès temporaire de 256 bits a été créé dans Vault, utilisé côté serveur puis supprimé. Il est désactivé dans le code final. Aucun secret ni lien signé n'est versionné. Verrou persistant conservé pour empêcher une deuxième génération par relance.

Original privé Supabase : bucket `rudyladit-music-pilot`, objet `film-draft01-38s-2026-10-31.mp3`.

Code et tests : `supabase/functions/cfo-elevenlabs-music-film-draft/`.
Montage : `tools/rudyladit-music-film-draft/assemble.py`. Il attend l'original fournisseur `provider-original-38s.mp3` dans son répertoire, ainsi que imageio-ffmpeg 0.7.0 dans `tools/.pilot-tools`.
Résultats : `docs/results/rudyladit-music-film-draft01-2026-10-31.json`.
