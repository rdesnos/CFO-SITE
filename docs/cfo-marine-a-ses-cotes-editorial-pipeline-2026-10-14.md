# CFO Marine — À ses côtés : chaîne publication → éditorial

Date : 14 octobre 2026
Statut : **socle de file éditoriale déployé en Supabase**, collecte des posts individuels **non raccordée**.

## Règle métier validée
Chaque publication originale de Cynthia et Géraldine (Carnet de bord Marine), quelle que soit sa plateforme, doit produire un **dossier éditorial distinct** CFO. Le relais social existant reste en place. Le texte final ne doit pas être une reformulation mécanique : il doit apporter contexte, vérifications, récit et mise en perspective, avec lien vers la source, identification des auteures et respect des droits.

La mise en ligne des articles CFO suppose contrôle humain et statut approuvé. Une publication originale ne devient jamais automatiquement un article public.

## Infrastructure constatée le 14/10/2026
- WordPress public : /a-ses-cotes-carnets-de-bord/ (page 878). Le relais Facebook est un iframe construit par assets/js/cfo-carnets-feed.js et reste intact.
- WordPress brouillon 2053 : présentation et sélection éditorialisée, non publiée.
- WordPress brouillon 2055 : portrait Cynthia & Géraldine, non publié.
- WordPress catégories 61 (À ses côtés), 62 (Carnet de bord — Le regard CFO).
- Supabase projet `fjpcuxsezeuajhlotzij` : profil `public.cfo_side_profiles`, sources `public.cfo_side_social_sources`, publications `public.cfo_side_social_posts`.
- Les trois sources existantes (Facebook, Instagram et TikTok) sont configurées en `collector_type='manual'`. Leur `last_success_at` est NULL, et le nombre de publications collectées est **zéro**.
- La nouvelle table `cfo.side_editorial_queue` conserve une ligne unique par `source_post_id`. La fonction `cfo.side_editorial_queue_from_source()` et le trigger `cfo_side_social_post_editorial_intake` sont actifs sur INSERT et certaines UPDATE de `public.cfo_side_social_posts`.
- États : awaiting_source, to_research, in_writing, ready_for_review, approved, published, on_hold.
- Contrôle de complétude pour published : titre, corps, source vérifiée, date d'approbation, identifiant WordPress et date de publication.
- RLS activée, droits directs anon/authenticated révoqués, service_role autorisé.
- Vérification effectuée : trigger actif, 0 entrée (normal tant que l'ingestion est vide), anon/authenticated sans SELECT.

## Prochaine étape impérative : acquérir des publications individuelles
Le plugin de page Facebook rend un iframe côté navigateur. **Il ne fournit pas à la base les textes, identifiants, dates, médias ni permaliens de chaque publication.** Il faut un connecteur autorisé, une collaboration directe avec les auteures, un import vérifié de leurs publications ou une collecte officiellement permise. Éviter le scraping non autorisé et ne jamais inventer de post ni de citation.

Pour chaque élément importé dans `public.cfo_side_social_posts` :
- `profile_id` du profil Carnet de bord ;
- `source_id` de la plateforme ;
- `platform`, `canonical_url` ;
- `published_at` exact, avec fuseau ;
- `text_content`, `media_url`, `raw_payload` si disponibles ;
- anti-doublon existant `unique(source_id, canonical_url)`.

Le trigger créera ou actualisera le dossier (sans écraser un article déjà traité).

## Production éditoriale cible
1. Détection d'une publication originale et ingestion sourcée.
2. Ouverture de dossier `to_research` (ou `awaiting_source` si contenu indisponible).
3. Rédaction d'une analyse originale, sans inventions.
4. Vérification humaine des faits, des citations et droits.
5. Brouillon WordPress lié au dossier ; validation.
6. Publication WordPress ; enregistrement de `wp_post_id`, dates et statut.
7. Affichage dans la sélection de la rubrique + lien explicite vers le post initial.

## Vérifications restant à faire
- Collecte authentifiée réelle, avec contrôle sur la fraîcheur et les erreurs.
- Test bout en bout sur un post **réel et identifiable**, avec preuve d'absence de doublons.
- Validation du rendu desktop/mobile WordPress (la prévisualisation anonyme d'un brouillon ne fonctionne pas).
- Versionner la migration SQL exacte et réconcilier avec l'environnement de production ; le présent document constate un DDL déjà exécuté mais n'est pas la migration elle-même.
- Aucun traitement IA autonome ni publication automatique n'a été activé.
