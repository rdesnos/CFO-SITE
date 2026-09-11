# CFO — baseline CSS restaurée — 2026-09-11

## Statut

État visuel validé après la migration Hostinger réussie et la correction des régressions CSS.

## Règle de restauration

- La migration Hostinger et les contenus WordPress sont conservés.
- Les contenus éditoriaux récents sont conservés, notamment « À propos », « À propos de l’auteur » et « À ses côtés ».
- La restauration concerne uniquement la couche CSS.
- Le portrait actuel de Marine sur la home est conservé.
- L’expérimentation de typographie « Marine CFO » est abandonnée comme police du thème.
- Typographie de référence : Cormorant Garamond pour les titres éditoriaux ; Source Sans 3 pour navigation, interface et texte fonctionnel.

## Correctifs de la session

- Correction de la fermeture manquante du bloc `@media(max-width:600px)` de la page 819, qui provoquait une cascade CSS incorrecte.
- Suppression des classes `.cfo-marine-script` et variantes associées dans le CSS du draft.
- Aucun contenu WordPress n’a été restauré ou remplacé dans cette opération.

## Baseline

Cet état est la nouvelle référence visuelle CFO. Les prochaines évolutions CSS doivent être localisées et validées sans modification globale non maîtrisée.

## Attention gestion de configuration

Le fichier CSS opérationnel complet du thème WordPress reste à synchroniser dans le dépôt comme source de vérité technique ; ce checkpoint fige la décision et l’état fonctionnel validé, mais ne prétend pas constituer à lui seul une copie intégrale du thème actif/draft.
