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

## Règle de gestion de configuration

Toute modification de couleur, typographie, règle de composition, positionnement du hero ou asset maître doit :
1. être testée en preview ;
2. être validée visuellement ;
3. être commitée dans Git ;
4. seulement ensuite être publiée.

La charte de référence est ce document + les fichiers de thème associés sous `wordpress/theme/`.
