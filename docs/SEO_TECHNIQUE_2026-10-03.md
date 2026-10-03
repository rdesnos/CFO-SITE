# CFO Marine — audit et corrections techniques du 3 octobre 2026

## Périmètre et méthode

Audit HTTP public des 61 pages WordPress publiées, lecture des réglages The SEO Framework et du sitemap XML, contrôle du HTML serveur et test PageSpeed Insights mobile de l'accueil. Les contenus n'ont pas été réécrits et les URL publiques n'ont pas été déplacées. La page enfant Univers MGP reste publiée et indexable : son rendu est fonctionnel malgré le slug historique de son parent.

Les 6 exclusions historiques de Search Console ne sont pas expliquées par cet audit : leurs motifs doivent être lus dans le rapport Indexation. Ne pas les confondre avec les prototypes découverts ici.

## Corrections publiées

| Page WordPress | Modification |
| --- | --- |
| 930 — TEST Cockpit CFO 1.5.0 exact | `_genesis_noindex=1` |
| 924 — TEST Cockpit CFO 1.5.0 restauré | `_genesis_noindex=1` |
| 928 — Cockpit CFO V0 | `_genesis_noindex=1` |
| 819 — À ses côtés, ancienne page de test | `_genesis_noindex=1` |
| 971 — Observatoire CFO V1 Preview, shortcode non exécuté | `_genesis_noindex=1` |
| 404 — En coulisses | Suppression du H1 identique au titre du thème ; titre SEO et description alignés sur le contenu actuel (métiers de la musique et salles) |
| 947 — Charte numérique écoresponsable | Suppression du H1 identique au titre du thème |
| 582 — Méthodologie MGP | Suppression du H1 identique au titre du thème |

Les pages de test restent accessibles pour conservation et restauration. Aucune désindexation effective par Google n'est encore confirmée : la consigne doit être relue par ses robots.

## Vérification publique

- `/robots.txt` : HTTP 200, exploration du site autorisée, sitemap déclaré.
- `/sitemap.xml` : HTTP 200, XML exploitable ; après modification, les cinq URL exclues sont absentes. Le sitemap contient alors 88 URL (pages, articles et événements).
- `/wp-sitemap.xml` : 404 ; le sitemap actif est celui de The SEO Framework, ce qui ne constitue pas une erreur en soi.
- Accueil, En coulisses, Entre les lignes et Observatoire principal : balises canoniques cohérentes et aucune consigne globale `noindex`.
- En coulisses, charte numérique et méthodologie MGP : un seul H1 dans le HTML public après modification.
- La nouvelle description d'En coulisses est présente dans le HTML public.
- Le prototype 930 émet `noindex` dans son HTML public.
- Les anciennes vues MGP 446, 453 et 467 étaient déjà en `noindex`.
- Aucun échec HTTP parmi les 61 pages examinées avant correction.

## Performance mobile

Test PageSpeed Insights, accueil, 3 octobre 2026 :

| Mesure laboratoire | Résultat |
| --- | --- |
| Performance | 59/100 |
| SEO Lighthouse | 100/100 |
| LCP | 16,3 s |
| FCP | 3,9 s |
| CLS | 0 |
| TBT | 150 ms |
| Speed Index | 6,6 s |
| Poids transféré | 4 401 Kio |

Aucune donnée CrUX : trafic insuffisant. Ce test isolé ne prouve pas une dégradation mesurée chez tous les lecteurs. Le score SEO Lighthouse vérifie des bases et ne prédit ni le classement ni l'indexation.

Opportunités remontées : environ 74 Kio de JavaScript inutilisé, 31 Kio de CSS inutilisé, 6 Kio de CSS à minifier. La priorité est d'identifier l'élément LCP et les ressources qui composent les 4,4 Mo, puis de dimensionner les images, éviter le lazy-loading de l'image principale et réserver les scripts de visualisation aux pages qui les utilisent. Ces optimisations ne sont pas encore appliquées et aucun gain ne doit être annoncé.

## Modifications préparées, non appliquées

Les écritures suivantes ont été refusées par le serveur avec HTTP 429. Après pause, la lecture des métadonnées 577 et 1092 a confirmé l'absence de modification ; la tentative unique de reprise a de nouveau rencontré la limite. Il faut reprendre à faible cadence après rétablissement des écritures, puis vérifier le HTML public.

| Page | Correction préparée |
| --- | --- |
| 561 — Orbite de carrière de Marine | Convertir le H1 interne `Orbite de carrière de Marine` en H2, le thème fournissant déjà le H1 |
| 577 — MGP 3D | Description : « Explorez la trajectoire de Marine dans une visualisation 3D du Modèle Gravitationnel Polarisé, avec la méthodologie et les limites de l’Observatoire CFO. » |
| 1092 — Univers MGP | Description : « L’Univers de Marine propose une lecture visuelle de sa carrière et de son environnement musical à partir des données et de la méthode de l’Observatoire CFO. » |

## Points restant à diagnostiquer

1. Performance : détail du réseau et élément LCP avant toute modification des visuels ou des chargements.
2. Forum : wpForo fournit un second H1 et aucune description détectée sur la page principale ; vérifier ses propres réglages et son rendu avant intervention.
3. Search Console : raisons exactes des 6 pages non indexées et état du sitemap soumis.
4. Redirections HTTP/HTTPS et www, vraie réponse 404, liens internes et fichiers chargés : contrôle dédié restant à effectuer.
5. Les dates `lastmod` du sitemap sont identiques pour toutes les URL observées. Plusieurs pages ont effectivement été enregistrées au même instant ; ne pas modifier ce signal sans identifier l'origine de ces mises à jour et les règles de génération.

## Conservation et reprise

La sauvegarde de restauration est conservée séparément du dépôt public. Ce rapport ne contient pas les textes des pages. Les modifications sont enregistrées dans la base WordPress ; cette branche constitue leur historique documentaire et n'installe pas de plugin supplémentaire.

Références primaires utilisées :

- https://kb.theseoframework.com/kb/data-stored-in-your-database/
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
