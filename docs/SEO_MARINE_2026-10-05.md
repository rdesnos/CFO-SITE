# SEO CFO Marine — 5 octobre 2026

Le travail est partiellement publié. Les dernières opérations WordPress et leur vérification publique restent en attente de reprise autorisée après un blocage du contrôle automatique d’approbation.

## Audit avant corrections

- 101 URL contrôlées : toutes répondent HTTP 200 ; 88 figuraient dans le sitemap.
- Accueil : titre, description, canonical et robots présents ; portrait WebP avec dimensions, srcset et priorité de chargement.
- Les actualités sont présentes dans le HTML serveur.
- 11 fiches événement vides et 3 pages MGP inabouties apparaissaient dans le sitemap.
- Le forum ne restituait pas la consigne de non-indexation de The SEO Framework.
- L’aperçu social de l’accueil utilisait un visuel NRJ ; le visuel CFO par défaut pesait 2 846 356 octets.

Le relevé des URL et balises se trouve dans `wordpress/seo/2026-10-05-audit.json`. Il correspond à l’état **avant** corrections ; ce n’est pas une vérification finale.

## Corrections confirmées

- `_genesis_noindex = 1` enregistré pour les 14 contenus listés dans `wordpress/seo/2026-10-05-settings.json`. Les réponses de chaque écriture WordPress ont confirmé leur succès. La restitution publique des robots et du sitemap reste à vérifier.
- Actualité Marine Lorphelin `5314c68f-dd62-48c4-b4e2-3d12546fce5f` passée de `validated` à `ignored`, avec motif éditorial en base.
- Collecteur : exclusion des homonymes Lorphelin, Le Pen, Tondelier, ainsi que Marine nationale et Marine Corps, sauf mention explicite de Marine Delplace. Huit cas de pertinence réussissent avec `node tests/news-relevance.test.cjs`. Version 6 déployée et active ; le code relu en production correspond au dépôt. Le flux public répond HTTP 200 et ne contient plus l’article Lorphelin (30 éléments retournés).
- Visuel CFO existant optimisé, sans nouveau dessin : JPEG 1200 × 630, 77 496 octets, enregistré dans Supabase et confirmé dans `cfo_media_assets`. Réduction de poids de 97,3 %. Le fichier public répond HTTP 200 en image/jpeg et restitue exactement 77 496 octets. Le logo officiel du site est conservé.

## Opérations WordPress prêtes

Le fichier `wordpress/seo/2026-10-05-pending.json` contient les valeurs exactes :

1. Configurer l’aperçu social de l’accueil et le visuel par défaut dans The SEO Framework.
2. Relire `wpforo_seo` : la tentative de modification a reçu HTTP 429 et son résultat est indéterminé. Désactiver uniquement sa gestion du titre et des métadonnées si nécessaire pour restituer celles de The SEO Framework ; contrôler ensuite le résultat et restaurer si besoin.
3. Corriger la fiche du 15 octobre 2026 vers Mons, d’après [le Théâtre Royal de Mons](https://theatreroyalmons.be/agenda/marine/).
4. Corriger la fiche du 26 mars 2027 vers Lille, d’après [Fnac Spectacles](https://www.fnacspectacles.com/event/marine-tournee-zenith-arena-de-lille-21102342/).

Les URL existantes sont conservées. La fiche du 16 octobre 2026 contient aussi une incohérence Namur/Mons ; la seconde date n’a pas encore été confirmée par une source officielle. Ne pas la présenter comme corrigée.

Après reprise : contrôler les balises robots des 14 pages, leur retrait du sitemap, l’aperçu Open Graph de l’accueil, le forum et les deux fiches de concert.

## Limites de validation

- Après un HTTP 429 Hostinger, les appels WordPress ont été suspendus. Le contrôle automatique a ensuite refusé une lecture de l’option du forum, en considérant cette suspension comme une consigne utilisateur. Aucune requête WordPress de contournement n’a été faite.
- Search Console via Site Kit : réponse `Login Required`, statistiques Google indisponibles dans cette session.
- PageSpeed API : quota quotidien indisponible, HTTP 429. Aucun score mobile ou Core Web Vitals n’est déclaré.
