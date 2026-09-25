# CFO Actualites - baseline production du 25 septembre 2026

## Etat

La page publique `/actualites/` est en production et rend le flux Supabase cote serveur via `page-actualites.php`.

## Chaine de donnees

- Supabase collecte les sources.
- `cfo-news-collector` accepte une liste `source_names` pour fractionner la collecte.
- Validation automatique des actualites Marine directes.
- WordPress consomme `cfo-actu-feed` et applique le filtre editorial final avant rendu.
- Seules les actualites avec une vraie `published_at` sont exposees dans le fil principal.

## Cadence production

- :05 chaque heure : sources officielles/pro.
- :20 chaque heure : NRJ, Europe 2, Soirmag.
- :35 chaque heure : La Voix du Nord, Marie Claire, AlloCine, Artmedia.
- :10, :25, :40, :55 : auto-validation.
- :00, :15, :30, :45 : cloture des runs bloques depuis plus de 10 minutes.

## Garde-fous editoriaux

Sont exclus du fil public principal :
- faux positifs Marine Le Pen / marine nationale / ex-marine / marine corps ;
- biographies, playlists et pages NRJ generiques ;
- contenus sans date editoriale de publication ;
- doublons et entrees non validees par le flux public.

## Incidents sources observes

- Instagram peut repondre HTTP 429.
- Artmedia peut refuser/reset la connexion.

Ces incidents sont isoles par source et ne doivent plus bloquer les autres collectes.

## Verification production

Le 25/09/2026, le rendu public a ete controle apres publication. Le flux affiche notamment les actualites NRJ des 24/09, 17/09 et 16/09, puis les actualites du 04/09, sans le faux positif "The Dog Stars".
