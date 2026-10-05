# SEO CFO Marine — 5 octobre 2026

Les corrections principales sont publiées et vérifiées. Deux ajustements restent bloqués par le contrôle automatique d’approbation : la gestion native des balises du forum et la description SEO de la fiche Mons du 16 octobre.

## Résultats publiés et vérifiés

- Audit initial : 101 URL, toutes HTTP 200 ; 88 URL dans le sitemap.
- Contrôle après publication : 19 pages HTTP 200, dont les 14 pages ciblées portant effectivement `noindex` et absentes du sitemap. Le sitemap comporte maintenant 74 URL.
- Accueil : titre, description, canonical et robots conservés. Open Graph utilise le visuel CFO de 77 496 octets, à la place du visuel NRJ. Le visuel CFO précédent par défaut pesait 2 846 356 octets : réduction de 97,3 %.
- Le schéma Organization de l’accueil référence désormais le véritable logo CFO WebP de 10 576 octets, à la place de la bannière de 2,8 Mo. Le logo affiché du site est conservé. Les deux fichiers publics sont accessibles HTTP 200 et leur taille est confirmée.
- Les fiches du 15 octobre à Mons et du 26 mars à Lille ont un contenu, un H1, un titre SEO et une description cohérents avec leurs sources officielles. Les anciens noms de salle ont disparu du contenu rendu. Les URL existantes sont conservées.
- La fiche du 16 octobre à Mons a également son contenu, son H1 et son titre SEO corrigés. Sa description SEO comporte encore Namur : l’écriture de cette dernière balise a été refusée par le contrôle automatique.
- Article Marine Lorphelin `5314c68f-dd62-48c4-b4e2-3d12546fce5f` passé de `validated` à `ignored`, avec motif éditorial en base. Le flux public Supabase et le HTML serveur de la page Actualités ne le contiennent plus (HTTP 200 et canonical valide).
- Filtre des homonymes déployé : collecteur version 6 active ; code relu en production identique au dépôt. Huit cas de pertinence passent avec `node tests/news-relevance.test.cjs`.

## Forum : diagnostic et adaptation prête

La tentative de déléguer les métadonnées du forum à The SEO Framework (`seo_meta=false`, `seo_title=false`) n’a pas restauré ses balises. Le contrôle public de La Grand-Place montre toujours l’absence de robots, description et canonical.

L’examen du code officiel wpForo et de sa documentation confirme que sa gestion native doit produire les balises des forums. Les URL présentes dans sa liste `noindex` sont sans protocole, alors que le moteur les compare à des URL complètes. L’adaptation préparée consiste donc à réactiver les deux options natives et à ajouter `https://` à chacune des URL existantes, sans supprimer de règle ni modifier la visibilité des contenus.

Cette adaptation a été refusée par le contrôle automatique, qui la considère comme un changement inverse hors du périmètre autorisé. Elle n’est pas présentée comme publiée. État actuel confirmé : les deux options natives restent à `false`.

## Sources des concerts

- [Mons, 15 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine/).
- [Mons, 16 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine-2/) et [Ticketmaster](https://www.ticketmaster.be/event/marine-tickets/1426098765?language=fr-be).
- [Lille, 26 mars 2027 à 20 h — Fnac Spectacles](https://www.fnacspectacles.com/event/marine-tournee-zenith-arena-de-lille-21102342/).

La seconde date de Mons, initialement non confirmée, a été vérifiée auprès de la salle et de la billetterie avant correction. Le contrôle automatique a accepté son contenu et son titre, puis refusé sa description SEO au motif que la seconde date dépassait les corrections initialement préparées. Aucun autre chemin d’écriture n’a été utilisé pour contourner ce refus.

## Fichiers de suivi

- `wordpress/seo/2026-10-05-audit.json` : état initial des URL et balises.
- `wordpress/seo/2026-10-05-verification.json` : contrôles publics après corrections.
- `wordpress/seo/2026-10-05-settings.json` : contenus non indexables, médias persistés et état du collecteur.
- `wordpress/seo/2026-10-05-rollback.json` : options et valeurs précédentes des événements.
- `wordpress/seo/2026-10-05-pending.json` : les deux seules opérations WordPress restantes, avec valeurs exactes et sources.

## Validation Google encore indisponible

Search Console via Site Kit répond `Login Required`. PageSpeed API répond HTTP 429, quota quotidien indisponible. Aucun score mobile, Core Web Vitals ou nombre de pages indexées par Google n’est déclaré. Le retrait du sitemap et les balises publiques sont vérifiés ; ils ne prouvent pas encore leur prise en compte par Google.
