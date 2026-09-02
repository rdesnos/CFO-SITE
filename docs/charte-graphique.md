# CFO — Charte graphique sous gestion de configuration

Baseline initiale : 2 septembre 2026
Statut : validée

## Principe

La charte graphique CFO est un actif de configuration au même titre que le thème, les templates et les assets. Toute évolution doit être versionnée dans Git avant mise en production.

## Couleurs de référence

- Bleu CFO principal : `#183d4b`
- Bleu secondaire / transition : `#245364`
- Brique / vin CFO : `#8a3328`
- Brique foncé : `#5c211b`
- Or / accent chaud : `#b38b55`
- Encre : `#2d2927`
- Papier : `#fffdfa`
- Crème : `#f5eee8`

Le bleu `#183d4b` est la référence graphique principale validée pour le hero et les blocs sombres.

## Typographies

- Titres / éditorial : `Cormorant Garamond`, fallback `Georgia, serif`
- Texte courant / navigation : `Source Sans 3`, fallback `Segoe UI, sans-serif`

## Hero validé

- Fond : dégradé oblique `108deg`
- Dégradé validé : `#183d4b 0%`, `#183d4b 50%`, `#245364 57%`, `#d8d6d1 68%`, `#fffdfa 79%`, `#fffdfa 100%`
- Transition visuelle alignée sur la tête / oreille gauche de Marine
- Portrait : centré verticalement, `right:25%`, `top:50%`, `width:36%`, `max-width:630px`, `transform:translateY(-50%)`
- H1 : `clamp(2.8rem,5.2vw,4.8rem)`, largeur max 760px
- CTA principal brique, CTA secondaire transparent
- Motif de fines diagonales conservé en surimpression

## Composition et rythme

- Header clair, ample, sobre
- Logo à gauche, navigation horizontale à droite
- Forte hiérarchie éditoriale : titre serif, texte secondaire sans-serif
- Alternance fonds bleu / papier / crème
- Accent brique réservé aux CTA, états actifs, repères éditoriaux et filets
- Cartes à fond blanc avec bord supérieur alterné brique / bleu

## Actualités — règle de sélection des visuels

Chaque actualité CFO doit disposer d'un visuel contextualisé. Le choix du visuel respecte obligatoirement l'ordre de priorité suivant :

1. **Visuel exact de l'actualité** : photographie ou image directement liée à l'événement, à l'annonce ou à l'information traitée.
2. **Visuel publié par l'artiste ou l'organisateur** : publication, photographie, affiche ou image officielle directement relative à cette actualité.
3. **Snapshot pertinent de la publication ou de la source** : capture permettant d'identifier et de contextualiser clairement l'information.
4. **Logo exact de l'émetteur** : uniquement lorsque les trois niveaux précédents ne fournissent aucun visuel exploitable.
5. **Visuel générique CFO** : dernier recours uniquement.

### Principes d'application

- Le recours au logo doit rester exceptionnel : un logo ne remplace jamais un visuel contextualisé disponible aux niveaux 1 à 3.
- Les photographies génériques de concert, studio, microphone, festival ou public ne doivent pas être utilisées lorsqu'un visuel directement lié à l'information existe.
- La source doit être identifiée à son niveau exact. Des entités proches ne sont pas interchangeables : par exemple **NRJ France** et **NRJ Belgique** sont deux émetteurs distincts et doivent être traités comme tels.
- Un logo, lorsqu'il est nécessaire, doit être celui de l'entité effectivement à l'origine de l'information et dans sa version officielle correcte.
- La même hiérarchie s'applique aux actualités anciennes lors de leur remise au standard CFO.

## Règle de gestion de configuration

Toute modification de couleur, typographie, règle de composition, positionnement du hero, règle éditoriale visuelle ou asset maître doit :
1. être testée en preview ;
2. être validée visuellement ;
3. être commitée dans Git ;
4. seulement ensuite être publiée.

La charte de référence est ce document + les fichiers de thème associés sous `wordpress/theme/`.
