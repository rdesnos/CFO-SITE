# Publication du module « Ce que disent les chiffres »

Référence validée : `snapshots/2026-10-11-home-editorial/`, commit `8546534`.
Lot préparé : commit `a7d8482`.

## Périmètre livré

Trois fichiers du thème actif `cfo`, transférés individuellement via le protocole TUS Hostinger :

- `front-page.php` : remplace uniquement le premier aside `cfo-weekly-pulse` par le module éditorial validé, après les filtres WordPress ; conserve le portrait et les autres sections.
- `functions.php` : ajoute seulement le chargement de `assets/cfo-home-trends.css` sur l'accueil, version `20261011-25` ; conserve toutes les fonctions existantes.
- `assets/cfo-home-trends.css` : feuille de style du snapshot validé, sans modification de design.

Le snapshot est un lot partiel, pas un thème installable. Aucun remplacement du thème complet, aucune publication du brouillon WPVibe existant, aucune activation de thème ou modification du contenu WordPress de l'accueil n'ont été effectués. Les modifications de l'aquarelle et les autres fichiers du site sont conservés.

## Préparation et restauration

Les fichiers PHP actifs ont été lus avant publication et sauvegardés dans `before/`. Le diff avec le snapshot contient uniquement l'insertion du module et de son chargement CSS. Les deux fichiers passent `php -l` avec PHP 8.2.29.

Le script `deploy.py` est exécuté depuis la racine du dossier de travail contenant le clone `source/`, avec un fichier temporaire de credentials issu de `hosting_files_generate-upload-url`. Il transfère la CSS, puis les fonctions, puis le template, vérifie les réponses TUS et supprime le fichier temporaire. Aucun secret n'est versionné.

Pour restaurer le rendu précédent, transférer les deux fichiers PHP `before/` aux mêmes chemins. La CSS devient alors non chargée. Ne pas restaurer un thème complet ancien.

## Vérification réelle sur le site public

Vérifié sur https://chroniques-fille-ordinaire.com/ le 11 octobre 2026, après publication et exécution du JavaScript existant :

- Auditeurs Spotify : **871 477 ↘ −3,7 %**.
- Streams : **954 610 → +0,5 %**.
- Passages radio : **2 164 ↗ +3,9 %**.
- Trois micro-analyses conformes au snapshot.
- Chiffres `#0B3447`, lignes en flex avec alignement sur la ligne de base.
- Aucun SVG, canvas ou mini-graphique dans le module.
- Aucun débordement horizontal à la largeur courante ni à 390 pixels.
- Comparaison des éléments hors module : titre, liens, images, scripts et neuf sections conservés au chargement initial. Les cartes existantes continuent ensuite leur actualisation habituelle par le JavaScript déjà présent ; ce mécanisme n'a pas été modifié.
- Comparaison visuelle des captures complètes avant/après : accueil, portrait, autres cartes, dossiers, navigation et pied de page préservés.
- Relecture des trois fichiers déployés : concordance avec le lot Git, fins de ligne normalisées pour la comparaison.

Les fichiers `verification-*.json`, `file-verification.json`, `deployment.json` et les captures PNG constituent les preuves de vérification. Les captures avant/après montrent aussi l'actualisation habituelle des autres cartes ; les anciennes données initiales ne sont pas une modification de ce lot.
