# Formulaire de commentaires — 25 octobre 2026

Le formulaire WordPress des articles s’affichait sans styles dédiés : libellés sur la ligne des champs, largeurs fixes et bouton sans présentation.

Le correctif est dans `wordpress/custom-css/comments-2026-10-25.css`. Les règles ciblent uniquement `.single-post #respond`. Sur ordinateur, nom et e-mail sont côte à côte ; sous 600 px, tous les champs passent sur une colonne. Le texte reste à 17 px dans les champs, avec focus visible et cibles d’au moins 48 px pour les champs texte et le bouton.

## Déploiement effectué

- CSS additionnel natif WordPress, article `custom_css` 1004 pour le thème `cfo`.
- La valeur précédente de `theme_mods_cfo.custom_css_post_id` était `-1` : l’ancien CSS du cockpit était désactivé.
- Le contenu précédent a été conservé intégralement dans un bloc `@media not all { ... }`, pour rester inactif. Le nouveau CSS est placé après ce bloc. La mise à jour finale a été atomique avec une feuille complète et équilibrée.
- `custom_css_post_id` vaut désormais `1004`.
- Aucun fichier du thème en brouillon n’a été publié.

## Vérifications

- Feuille `#wp-custom-css` chargée sur l’URL publique de l’article NMA.
- Rendu contrôlé visuellement dans Chrome à 1363 × 936 : champs contenus dans le formulaire, noms et e-mail alignés, bouton bordeaux, libellés au-dessus des champs.
- Largeurs mesurées : commentaire/site web 638 px ; nom/e-mail 307 px ; hauteur des champs texte et du bouton 52 px.
- Le point de rupture mobile à 600 px est présent dans la feuille servie ; aucune émulation mobile n’a été effectuée.
- Action du formulaire, champs obligatoires et consentement cookies conservés. Aucun commentaire de test envoyé.

## Retour arrière

Remettre la modification de thème `custom_css_post_id` à `-1` rétablit l’état d’affichage antérieur. Le CSS précédent reste conservé dans l’article 1004.
