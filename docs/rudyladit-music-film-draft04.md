# Rudy l’a dit — maquette V4 : deux phrases musicales

[Écouter la V4 de 40 secondes](audio/RudyLadit-maquette-40s-v4.mp3)

## Correction demandée

La première phrase doit se terminer musicalement avant la petite respiration. La seconde phrase doit démarrer avec une intensité très supérieure. Un simple trou de silence dans une phrase en cours ne répond pas à cette demande.

La référence d'intention donnée par l'utilisateur est « Dalida » de Marine : la proposition est une ballade originale lente au piano, avec de l'espace, des cordes expressives et un final électrique chantant. Aucun enregistrement, mélodie ou partition de la chanson n'est utilisé.

## Nouvelle composition demandée

Tempo de référence proposé : 64 BPM, mesure à quatre temps ; une première phrase de huit mesures correspond à 30 secondes. Le plan comprend désormais une section explicite de cadence de 27 à 30 secondes, après le crescendo. Une dernière note commune est demandée vers 28,5 secondes, suivie de sa résonance naturelle, sans nouvelle attaque dans la dernière seconde.

| Temps | Direction demandée |
|---|---|
| 0–8 s | Piano acoustique expressif dans l'aigu ; petit arpège avant les violons |
| 8–16 s | Violons ajoutés ; piano continu |
| 16–24 s | Violoncelle ajouté ; les couches précédentes continuent |
| 24–27 s | Contrebasse pizzicato et sommet de la montée cumulative |
| 27–30 s | Conclusion de la première phrase, résolution et résonance |
| 30–30,5 s | Respiration courte |
| 30,5–33 s | Batterie seule, attaque intense de la seconde phrase |
| 33–40 s | Riff électrique au premier plan ; retour de tout l'ensemble, très intense |

## Réalisation et limites de vérification

Une seule génération a été effectuée pour cette version. Le plan v2.5 comporte sept chunks : 8 + 8 + 8 + 3 + 3 + 3 + 7 secondes. Le silence de 0,5 seconde est inséré localement après la section de cadence générée ; le solo de batterie de trois secondes est comprimé à 2,5 secondes avec conservation de la hauteur pour garder l'entrée du riff à 33 secondes.

Le décodage complet, la durée exacte de 40 secondes et le silence central sont vérifiés. Ces contrôles ne prouvent pas que le modèle a produit une cadence convaincante ni que la respiration est musicalement naturelle : ce point reste à valider à l'écoute. Aucune validation artistique automatique n'est revendiquée.

Code : `supabase/functions/cfo-elevenlabs-music-film-draft/index.ts`.
Montage : `tools/rudyladit-music-film-draft/assemble-v4.py` ; original fournisseur `provider-original-40s.mp3` à placer à côté du script, imageio-ffmpeg 0.7.0 dans `tools/.pilot-tools`.
Résultats : `docs/results/rudyladit-music-film-draft04-2026-11-01.json`.
Original fournisseur privé : `rudyladit-music-pilot/film-draft04-phrases-40s-2026-11-01.mp3`.

## Sécurité

Déploiement final v8, JWT activé, accès temporaire supprimé du coffre et désactivé dans le code. Verrou de tentative conservé. Pas de secret ni de lien signé versionné. Fonctions de lecture CFO inchangées ; versions précédentes conservées.
