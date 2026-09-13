# Escroc — état validé

Statut : publié et validé en production
Date de validation : 2026-09-13

- WordPress page ID : 322
- URL : https://chroniques-fille-ordinaire.com/escroc-quand-le-succes-ne-suffit-pas-a-se-sentir-legitime/
- Rubrique : Entre les lignes
- Référence de rendu : Dalida

## Visuel validé

- Stockage : Supabase / cfo-media
- Asset ID : a50c8115-214c-4d99-9344-070dbbc45680
- URL : https://fjpcuxsezeuajhlotzij.supabase.co/storage/v1/object/public/cfo-media/dossiers/escroc-quand-le-succes-ne-suffit-pas-a-se-sentir-legitime/cfo-escroc-visuel-valide-2d09a4e4.png
- Source : visuel fourni et validé par Rudy le 2026-09-13

## Correction structurelle validée

Le template `page.php` n'affiche plus l'image mise en avant lorsqu'un dossier contient déjà un bloc `cfo-dossier-illustration`, ce qui supprime le double visuel à la source.

Le CSS dossier est désormais commun : toute `.cfo-page-content` contenant directement `figure.cfo-dossier-illustration` hérite du standard Dalida, sans liste d'IDs de pages. Le visuel est centré avec une largeur maximale de 760 px, le corps éditorial est limité à 820 px et le comportement responsive est commun à tous les dossiers.

Cette règle remplace les exceptions CSS page par page précédemment utilisées pour Dalida et D’accord.
