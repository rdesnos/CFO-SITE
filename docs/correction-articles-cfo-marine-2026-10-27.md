# Correction des deux articles — 27 octobre 2026

La première publication des articles 3383 et 3384 était insuffisante : contrôle limité au HTTP/HTML, gabarit générique, absence de visuel et signature technique « admin ». Le retour visuel de Rudy a révélé le défaut. La présence d'une page et de son texte ne constitue pas une recette visuelle.

## Lot corrigé

- Article 3383 : illustration CFO déjà présente dans la médiathèque Supabase et le dossier « Marine : ce qui brûlait déjà » ; mention explicite d'illustration éditoriale et d'assistance IA, distincte d'une pochette officielle. Repères datés, tableau CD/vinyles avec liens directs, contextualisation éditoriale et accès au dossier.
- Article 3384 : deux graphiques vectoriels accessibles, périodes comparées et échelles propres partant de zéro ; messages Spotify +4,5 % / radio −0,7 % (stable) ; valeurs et limites détaillées. Les figures ne comparent pas des unités différentes sur une même échelle.
- Présentation : palette et polices existantes CFO (Cormorant Garamond / Source Sans 3), titre éditorial, corps 18 px, crédit visible « La rédaction CFO », adaptation sous 680 px. Le compte WordPress et les autres articles ne sont pas modifiés.

Les sources HTML exactes et le CSS sont dans `wordpress/content/2026-10-27/`. Chaque article contient un bloc HTML WordPress autonome avec ses styles, limité aux identifiants des deux articles ; aucun JavaScript, plugin ou fichier PHP de production ajouté. La mise en forme fonctionne sans WPVibe. Les révisions WordPress et le checkpoint Git des anciens corps permettent la restauration.

## Vérifications avant livraison

- HTML lu par le parseur ; liens HTTPS ou internes, visuel avec dimensions et alternative, aucun lien de prévisualisation, aucun script.
- Illustration Supabase téléchargée, décodée (1672 × 941) et inspectée.
- Calculs : 45 889 / 1 027 104 = +4,4678… % ; −14 / 2 137 = −0,6551… %, arrondis +4,5 % et −0,7 %.
- Boutique officielle et quatre fiches produit relues le 27 octobre. Aucun prix, stock ou disponibilité d'une offre n'est promis.
- Recette visuelle sur les pages publiques à effectuer après application du lot ; ne pas déclarer le lot livré sur la seule base du statut REST.
