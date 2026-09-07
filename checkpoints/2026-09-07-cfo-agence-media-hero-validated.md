# CFO Agence Media — Hero validé

Date de validation : 2026-09-07
Site : https://cfo-agencemedia.fr
État : HERO VALIDÉ visuellement par Rudy.

## Référence visuelle

Le hero validé conserve :
- fond scène / projecteurs ;
- kicker « STRATÉGIE · CONTENUS · INFLUENCE · DATA » ;
- pseudo-logo vectoriel unique à trois lignes « Faire émerger / ce qui mérite / d’être vu. » ;
- texte descriptif CFO Agence Media ;
- CTA « Découvrir notre approche » et « Parler d’un projet » ;
- blocs valeurs et habillage éditorial à droite.

## Pseudo-logo maître

Fichier maître validé : `cfo-agence-media-pseudologo-hero(1).svg`
SHA-256 : `b07a6d67dff79db14180bf8609535f28004604dac92685eb5b53d148642c769b`
ViewBox : `0 0 1741 903`
Couleurs principales : blanc `#ffffff`, or `#E3A83D`.

Le pseudo-logo doit toujours être traité comme un seul objet vectoriel responsive. Ne pas le reconstruire en HTML/CSS ni avec des polices séparées.

## Intégration WordPress validée

Le draft `cfo-agence-media` charge le pseudo-logo depuis `assets/brand/cfo-agence-media-pseudologo-hero.txt`, décodé puis injecté inline dans `.cam-title-vector.cam-title-vector-final`.

Règles de rendu essentielles :
- largeur du bloc vectoriel : `min(100%, 760px)` ;
- le SVG garde ses proportions ;
- le titre HTML historique est masqué derrière le bloc vectoriel ;
- le hero reste à `820px` sur desktop dans l’état validé.

Preview utilisée lors de la validation :
https://cfo-agencemedia.fr/?wpvibe_preview=WfnnNNcmHvyxBU4vLgGCahp3xzD4ahIU

## Règle de gestion de configuration

Ce checkpoint devient la référence de retour arrière pour le hero CFO Agence Media. Toute évolution ultérieure doit partir de cet état et faire l’objet d’un nouveau checkpoint après validation visuelle.