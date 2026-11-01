# Rudy l’a dit — maquette V3 : direction pop intime et mélodique

[Écouter la V3 de 40 secondes](audio/RudyLadit-maquette-40s-v3.mp3)

## Direction artistique

L'utilisateur demande une couleur dans l'univers musical de Marine. Traduction proposée et autorisée pour cette version : pop française sensible, organique et mélodique ; piano chantant dans le registre aigu, cordes qui portent l'émotion, batterie humaine et riff électrique mélodique. La composition reste originale et instrumentale. Le plan de génération décrit des qualités musicales, sans demander de reprendre une chanson, une mélodie ou un enregistrement existant.

Cette V3 conserve le découpage confirmé sur le croquis :

| Temps | Arrangement demandé |
|---|---|
| 0–8 s | Piano acoustique seul, mélodie expressive, petit arpège avant les cordes |
| 8–16 s | Violons ajoutés et montée ; le piano continue |
| 16–24 s | Violoncelle ajouté ; piano et violons continuent |
| 24–30 s | Contrebasse pizzicato ajoutée ; montée cumulative de tout l'ensemble |
| 30–30,5 s | Silence complet |
| 30,5–33 s | Batterie acoustique seule |
| 33–40 s | Entrée du riff électrique au premier plan, avec reprise générale |

Le plan privilégie une mélodie simple et mémorisable, des nuances naturelles et un tempo de référence de 100 BPM. Il écarte les fanfares, les effets de bande-annonce, les masses orchestrales emphatiques et la distorsion agressive. La guitare demandée est électrique, avec un son clair à légèrement saturé, un riff chantant et identifiable, soutenu par tous les autres instruments.

## Réalisation et vérifications

Une seule génération Eleven Music music_v2_5 de 40 secondes. Six chunks : 8 + 8 + 8 + 6 + 3 + 7 secondes. Montage identique à la V2 : compression avec conservation de hauteur du solo de batterie de 3 à 2,5 s, et insertion de 0,5 s de silence à 30 s. La section finale commence à 33 s.

MP3 final de 40 secondes décodées exactement, stéréo 48 kHz / 192 kbit/s. Décodage intégral réussi, silence central à zéro PCM. La qualité musicale, les instruments réellement perceptibles et la proximité de la couleur souhaitée restent à valider à l'écoute.

Résultats : `docs/results/rudyladit-music-film-draft03-2026-11-01.json`.
Montage : `tools/rudyladit-music-film-draft/assemble-v3.py`, original `provider-original-40s.mp3` à côté du script ; imageio-ffmpeg 0.7.0 dans `tools/.pilot-tools`.
Plan et code : `supabase/functions/cfo-elevenlabs-music-film-draft/index.ts`.
API de composition : https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans

## Sécurité

Déploiement final v6, vérification JWT activée. Accès temporaire supprimé et désactivé après la génération ; verrou de tentative conservé. Aucun secret ni lien signé dans GitHub. Fonctions CFO de lecture d'articles inchangées. V1 et V2 conservées pour comparaison.

Original fournisseur privé : `rudyladit-music-pilot/film-draft03-pop-40s-2026-11-01.mp3`.
