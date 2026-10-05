# SEO CFO Marine — 5 octobre 2026

Les corrections SEO prévues pour cette session sont publiées et vérifiées en production. La purge native wpForo et le correctif de compatibilité de La Grand-Place sont effectifs. Contrôle final : 20 pages HTTP 200, une seule balise robots par page, 16 pages non indexables absentes du sitemap et 74 URL dans le sitemap. La prise en compte par Google reste à contrôler dans Search Console.

## Résultats publiés et vérifiés

- Audit initial : 101 URL, toutes HTTP 200 ; 88 URL dans le sitemap.
- Contrôle final après publication : 20 pages HTTP 200, dont les 14 pages incomplètes ciblées portant effectivement `noindex` et absentes du sitemap. Le sitemap comporte maintenant 74 URL.
- Accueil : titre, description, canonical et robots conservés. Open Graph utilise le visuel CFO de 77 496 octets, à la place du visuel NRJ. Le visuel CFO précédent par défaut pesait 2 846 356 octets : réduction de 97,3 %.
- Le schéma Organization de l’accueil référence désormais le véritable logo CFO WebP de 10 576 octets, à la place de la bannière de 2,8 Mo. Le logo affiché du site est conservé. Les deux fichiers publics sont accessibles HTTP 200 et leur taille est confirmée.
- Les fiches du 15 octobre à Mons et du 26 mars à Lille ont un contenu, un H1, un titre SEO et une description cohérents avec leurs sources officielles. Les anciens noms de salle ont disparu du contenu rendu. Les URL existantes sont conservées.
- La fiche du 16 octobre à Mons a également son contenu, son H1 et son titre SEO corrigés. Sa description SEO est également corrigée et vérifiée dans le HTML public après autorisation du 5 octobre à 13 h 33.
- Article Marine Lorphelin `5314c68f-dd62-48c4-b4e2-3d12546fce5f` passé de `validated` à `ignored`, avec motif éditorial en base. Le flux public Supabase et le HTML serveur de la page Actualités ne le contiennent plus (HTTP 200 et canonical valide).
- Filtre des homonymes déployé : collecteur version 6 active ; code relu en production identique au dépôt. Huit cas de pertinence passent avec `node tests/news-relevance.test.cjs`.

## Forum : purge et correctif publiés, résultat vérifié

Les options natives `seo_meta=true`, `seo_title=true` et les 13 URL `noindex` complètes avec `https://` sont enregistrées. La purge native wpForo a été confirmée par Rudy le 5 octobre puis contrôlée dans le HTML public : `/community/les-estaminets/` porte désormais `noindex`, une description et son canonical.

La page WordPress `/la-grand-place/` conserve un défaut distinct : l’intégration TSF désactive sa sortie sur les pages wpForo, tandis que wpForo ne produit pas ses propres balises sur les pages utilisant son shortcode. Le code officiel de TSF 5.1.4 et wpForo 3.2.2 confirme cette interaction.

Le fichier `wordpress/theme/cfo-forum-seo.php` restaure la sortie TSF uniquement sur le chemin exact de la page 138. Le thème brouillon passe le contrôle de syntaxe PHP. Son HTML de test confirme le titre « La Grand-Place », la description et `noindex`. Le canonical reste omis conformément au réglage TSF d’une page non indexable. Les métadonnées natives des Estaminets et celles de l’accueil sont conservées. Le correctif est désormais publié dans le thème `cfo`. Le même titre, la même description et `noindex` sont confirmés dans le HTML public ; l’accueil et les métadonnées natives du forum restent corrects.

`wordpress/theme/functions.php` intègre le nouveau correctif et synchronise aussi l’inclusion du fichier `cfo-visual-delivery.php`, déjà présent en production. Ce dernier est ajouté au dépôt sans changer son comportement.

La capture Hostinger fournie par Rudy confirme une sauvegarde complète du site et de sa base datée du 4 octobre 2026 à 22 h 48. Après cette confirmation, le thème testé a été publié ; WPVibe a également sauvegardé le thème précédent dans `cfo-wpvibe-backup`. Le code est conservé dans le commit `21f17a5113f0cd3fe3417409fd0b23c960bd936d`.

## Sources des concerts

- [Mons, 15 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine/).
- [Mons, 16 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine-2/) et [Ticketmaster](https://www.ticketmaster.be/event/marine-tickets/1426098765?language=fr-be).
- [Lille, 26 mars 2027 à 20 h — Fnac Spectacles](https://www.fnacspectacles.com/event/marine-tournee-zenith-arena-de-lille-21102342/).

La seconde date de Mons, initialement non confirmée, a été vérifiée auprès de la salle et de la billetterie avant correction. Après le refus initial du contrôle automatique, l’autorisation explicite du 5 octobre à 13 h 33 a permis de publier la description. Le HTML public confirme désormais Mons dans le titre, le H1 et la description.

## Fichiers de suivi

- `wordpress/seo/2026-10-05-audit.json` : état initial des URL et balises.
- `wordpress/seo/2026-10-05-verification.json` : contrôle public final des 20 pages, du sitemap et trace de publication.
- `wordpress/seo/2026-10-05-settings.json` : contenus non indexables, médias persistés et état du collecteur.
- `wordpress/seo/2026-10-05-rollback.json` : options et valeurs précédentes des événements.
- `wordpress/seo/2026-10-05-pending.json` : liste vide, toutes les corrections prévues sont appliquées.
- `wordpress/seo/2026-10-05-forum-draft-verification.json` : contrôle du correctif en brouillon, distinct des résultats publics.

## Validation Google encore indisponible

Search Console via Site Kit répond `Login Required`. PageSpeed API répond HTTP 429, quota quotidien indisponible. Aucun score mobile, Core Web Vitals ou nombre de pages indexées par Google n’est déclaré. Le retrait du sitemap et les balises publiques sont vérifiés ; ils ne prouvent pas encore leur prise en compte par Google.
