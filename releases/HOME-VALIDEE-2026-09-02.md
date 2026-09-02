# CFO — Home validée — 2 septembre 2026

Statut : VALIDÉE EN PREVIEW, À PUBLIER APRÈS CONTRÔLE DE SAUVEGARDE.

## Référence graphique

La home CFO validée utilise le bleu profond `#183d4b` comme bleu de référence de la charte.

Hero :
- fond en dégradé depuis `#183d4b`, avec transition bleu-gris vers crème à droite ;
- portrait de Marine en sépia, centré verticalement, positionné à droite mais ramené vers le centre de la composition ;
- position desktop validée : `right:25%`, `top:50%`, `width:36%`, `max-width:630px`, `transform:translateY(-50%)` ;
- H1 : `clamp(2.8rem,5.2vw,4.8rem)`, largeur maximale 760px ;
- boutons brique CFO `#8a3328` et variante transparente.

## Texte hero validé

Titre : « La musique de Marine, et tout ce qu’elle raconte ».

Introduction : « Actualités, dossiers, données et coulisses pour écouter autrement l’œuvre de Marine Delplace — entre émotions, société et histoires humaines. »

## Gestion de configuration

Cette révision constitue la baseline de la home validée le 2 septembre 2026. Toute modification ultérieure du hero ou de la charte doit partir de cette baseline et faire l’objet d’un nouveau commit avant publication.

Le fichier source du portrait utilisé par WordPress est `CFO_Portrait.png`. Le précédent fichier Git `assets/hero/marine-portrait.png` de 3351 octets est identifié comme incomplet et ne doit pas être utilisé comme master. Il doit être remplacé par le fichier source complet avant de considérer les assets binaires comme totalement sécurisés dans Git.
