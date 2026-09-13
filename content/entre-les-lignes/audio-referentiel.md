# Entre les lignes — référentiel audio

État : mise à niveau tuner CFO
Date : 2026-09-13

Le composant audio multi-ISRC est actif sur les dossiers Entre les lignes. Les liens plateforme sont ajoutés lorsqu'ils ont été validés ; les compléments Spotify / YouTube / Deezer peuvent être enrichis ensuite sans modifier le composant.

| WP ID | Dossier | ISRC principal | Liens actuellement validés |
|---:|---|---|---|
| 235 | Dalida | FRZ052500194 | Spotify, YouTube, Deezer |
| 317 | D’accord | FRZ052500203 | Spotify, YouTube, Deezer |
| 322 | Escroc | FRZ052500361 | Spotify |
| 329 | Que ça dure | FRZ052500195 | Spotify |
| 332 | Des gens bien | FRZ052500193 | YouTube |
| 335 | Ma faute | FRZ052500048 | Spotify, YouTube, Deezer + versions alternatives |
| 338 | Gemme | FRZ052500202 | YouTube |
| 341 | À la maison | FRZ052500196 | YouTube |
| 344 | Restes d’averses | FRZ052500199 | Spotify, YouTube |
| 881 | Tricheur | FRZ052600440 | Spotify |

## Règles

- Source de vérité audio : `public.cfo_dossier_audio_recordings` dans Supabase.
- Une ligne par enregistrement / ISRC.
- Une version principale par dossier, les autres versions s'affichent sous la façade du tuner.
- Les boutons plateforme ne sont affichés que lorsqu'un lien exact a été validé.
- Le tuner est injecté juste après le visuel du dossier, avant le texte éditorial.
- Le design du tuner est commun à toute la rubrique Entre les lignes.
