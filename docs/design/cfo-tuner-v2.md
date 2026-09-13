# CFO — Tuner V2 multi-ISRC

Statut : DESIGN VALIDÉ
Date : 2026-09-13
Référence : maquette validée par Rudy

## Principe

Le tuner est un objet éditorial et fonctionnel inspiré d'une chaîne Hi-Fi haut de gamme des années 1980-1990, intégré à la charte CFO.

## Façade principale

- Bloc supérieur fixe, finition ivoire / métal chaud, écran noir-ambre et angles arrondis.
- Libellé : « ÉCOUTER LE MORCEAU ».
- Affichage du titre et de la version en alphabet pixelisé / afficheur digital années 80-90.
- Vumètre / animation graphique dans l'écran.
- Boutons principaux Spotify, YouTube et Deezer correspondant à la version actuellement sélectionnée ; un bouton n'est affiché que si le lien existe.
- La version sélectionnée dans la liste pilote les liens principaux de la façade.

## Versions / ISRC

Le tuner s'étend verticalement en fonction du nombre d'enregistrements disponibles pour le morceau.

Chaque enregistrement occupe une ligne et affiche :

1. numéro / repère de version ;
2. titre de version (studio, démo, live, etc.) ;
3. information secondaire éventuelle (album, session, année) ;
4. ISRC exact de cet enregistrement ;
5. boutons Spotify / YouTube / Deezer disponibles pour CET enregistrement.

Une plateforme sans lien validé n'affiche pas de bouton actif.

La ligne active est visuellement distinguée et met à jour la façade supérieure.

## Défilement

Comme sur les radios RDQS, la zone des versions peut devenir scrollable lorsque la liste est longue :

- hauteur visuelle maîtrisée ;
- défilement vertical dans la seule liste des versions ;
- façade principale toujours visible ;
- contrôles / indicateurs de défilement cohérents avec l'esthétique du tuner ;
- sur mobile, conservation d'une navigation tactile naturelle.

Le nombre de versions ne doit donc jamais faire exploser la hauteur de la page.

## Règle de données

Un morceau peut avoir plusieurs enregistrements. Chaque enregistrement possède son propre ISRC et ses propres liens plateforme. Le tuner ne doit jamais supposer qu'un lien d'une version est valable pour une autre version.

Source de vérité prévue : `public.cfo_dossier_audio_recordings` dans Supabase.

## Règle graphique CFO

Le graphisme sert la fonction :

- façade = écoute rapide ;
- afficheur = identification immédiate du morceau et de la version ;
- liste = comparaison / sélection des enregistrements ;
- ISRC = identification documentaire ;
- boutons par ligne = accès exact à chaque version sur chaque plateforme ;
- défilement = gestion fonctionnelle des listes longues.

Cette spécification est la référence graphique et fonctionnelle à implémenter. Les liens plateforme seront validés séparément avant alimentation définitive du référentiel.