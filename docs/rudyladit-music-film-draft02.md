# Rudy l’a dit — maquette musicale V2, 1er novembre 2026

[Écouter le MP3 de 40 secondes](audio/RudyLadit-maquette-40s-v2.mp3)

Cette version reprend le croquis manuscrit et la confirmation de l'entrée de la contrebasse à 24 s. Elle remplace le timing de la V1 ; la V1 reste conservée.

| Temps | Direction musicale demandée |
|---|---|
| 0–8 s | Piano acoustique mélodique dans le registre aigu, petit arpège avant les cordes |
| 8–16 s | Violons ajoutés et montée progressive ; le piano continue |
| 16–24 s | Violoncelle ajouté et montée progressive ; les instruments précédents continuent |
| 24–30 s | Contrebasse pizzicato ajoutée ; tout continue et monte jusqu'au break |
| 30–30,5 s | Coupure complète d'une demi-seconde |
| 30,5–33 s | Batterie acoustique seule |
| 33–40 s | Entrée du riff de guitare électrique, avec reprise générale de tous les instruments |

À 33 s, c'est bien la guitare électrique qui entre, avec un riff identifiable au premier plan et tout le reste derrière. Pas de guitare acoustique.

## Production et contrôle

Une génération Eleven Music music_v2_5 de 40 secondes, explicitement lancée après le « go » sur le découpage confirmé. Six chunks : 8 + 8 + 8 + 6 + 3 + 7 secondes. Pour respecter la durée minimale de trois secondes par chunk du fournisseur, le solo de batterie de trois secondes est comprimé à 2,5 s avec conservation de la hauteur, puis un silence de 0,5 s est inséré à 30 s. Le final commence à 33 s. Aucun autre appel de génération pour le montage.

MP3 final : exactement 40 s décodées, 48 kHz stéréo, 192 kbit/s, décodage complet sans erreur. Silence central vérifié à zéro PCM. Ces contrôles valident le montage et la lisibilité ; l'identité des instruments, leur équilibre et la qualité du riff restent à juger à l'écoute.

Résultats : `docs/results/rudyladit-music-film-draft02-2026-11-01.json`.
Montage reproductible : `tools/rudyladit-music-film-draft/assemble-v2.py`, avec l'original `provider-original-40s.mp3` à placer à côté du script et imageio-ffmpeg 0.7.0 dans `tools/.pilot-tools`.

## Sécurité

Fonction musicale isolée, déploiement final v4 avec JWT activé. Accès temporaire limité à cet essai, supprimé du coffre et désactivé dans le code après réussite. Verrou de tentative conservé. Aucun secret ni lien signé versionné. Fonctions de lecture CFO inchangées.

Original fournisseur conservé en privé : `rudyladit-music-pilot/film-draft02-40s-2026-11-01.mp3`.
