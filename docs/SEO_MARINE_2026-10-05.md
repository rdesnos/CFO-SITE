# SEO CFO Marine — 5 octobre 2026

Les corrections SEO et les deux dernières écritures autorisées sont publiées. La description de Mons est vérifiée. Il reste à vider le cache propre à wpForo, puis contrôler les robots du forum : les options sont correctes en base, mais le rendu public utilise encore les anciens réglages.

## Résultats publiés et vérifiés

- Audit initial : 101 URL, toutes HTTP 200 ; 88 URL dans le sitemap.
- Contrôle après publication : 19 pages HTTP 200, dont les 14 pages ciblées portant effectivement `noindex` et absentes du sitemap. Le sitemap comporte maintenant 74 URL.
- Accueil : titre, description, canonical et robots conservés. Open Graph utilise le visuel CFO de 77 496 octets, à la place du visuel NRJ. Le visuel CFO précédent par défaut pesait 2 846 356 octets : réduction de 97,3 %.
- Le schéma Organization de l’accueil référence désormais le véritable logo CFO WebP de 10 576 octets, à la place de la bannière de 2,8 Mo. Le logo affiché du site est conservé. Les deux fichiers publics sont accessibles HTTP 200 et leur taille est confirmée.
- Les fiches du 15 octobre à Mons et du 26 mars à Lille ont un contenu, un H1, un titre SEO et une description cohérents avec leurs sources officielles. Les anciens noms de salle ont disparu du contenu rendu. Les URL existantes sont conservées.
- La fiche du 16 octobre à Mons a également son contenu, son H1 et son titre SEO corrigés. Sa description SEO est également corrigée et vérifiée dans le HTML public après autorisation du 5 octobre à 13 h 33.
- Article Marine Lorphelin `5314c68f-dd62-48c4-b4e2-3d12546fce5f` passé de `validated` à `ignored`, avec motif éditorial en base. Le flux public Supabase et le HTML serveur de la page Actualités ne le contiennent plus (HTTP 200 et canonical valide).
- Filtre des homonymes déployé : collecteur version 6 active ; code relu en production identique au dépôt. Huit cas de pertinence passent avec `node tests/news-relevance.test.cjs`.

## Forum : diagnostic et adaptation prête

La tentative de déléguer les métadonnées du forum à The SEO Framework (`seo_meta=false`, `seo_title=false`) n’a pas restauré ses balises. Le contrôle public de La Grand-Place montre toujours l’absence de robots, description et canonical.

L’examen du code officiel wpForo et de sa documentation confirme que sa gestion native doit produire les balises des forums. Les URL présentes dans sa liste `noindex` sont sans protocole, alors que le moteur les compare à des URL complètes. L’adaptation préparée consiste donc à réactiver les deux options natives et à ajouter `https://` à chacune des URL existantes, sans supprimer de règle ni modifier la visibilité des contenus.

Cette adaptation a été explicitement autorisée le 5 octobre à 13 h 33 puis enregistrée. Une lecture SQL confirme `seo_meta=true`, `seo_title=true` et les 13 URL complètes avec `https://`. Le contrôle public après écriture, y compris une requête sans cache HTTP, montre toutefois toujours l’absence de robots.

Le code officiel `wpforo_get_option()` lit d’abord un fichier de cache indépendant ; `wpforo_update_option()` purge ce cache, mais un appel WordPress `update_option()` ne le fait pas. La purge WordPress exécutée répond « No known cache plugin detected » et ne purge que le cache objet. Aucune capacité wpForo n’est exposée dans l’API Abilities. Il reste donc à utiliser le bouton natif « Delete All Caches » de wpForo. L’accès au navigateur en remplacement du connecteur demande une autorisation spécifique selon les instructions de l’outil navigateur. Le forum n’est pas déclaré finalisé tant que ses balises publiques ne sont pas vérifiées.

## Sources des concerts

- [Mons, 15 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine/).
- [Mons, 16 octobre 2026 à 20 h — Théâtre Royal](https://theatreroyalmons.be/agenda/marine-2/) et [Ticketmaster](https://www.ticketmaster.be/event/marine-tickets/1426098765?language=fr-be).
- [Lille, 26 mars 2027 à 20 h — Fnac Spectacles](https://www.fnacspectacles.com/event/marine-tournee-zenith-arena-de-lille-21102342/).

La seconde date de Mons, initialement non confirmée, a été vérifiée auprès de la salle et de la billetterie avant correction. Après le refus initial du contrôle automatique, l’autorisation explicite du 5 octobre à 13 h 33 a permis de publier la description. Le HTML public confirme désormais Mons dans le titre, le H1 et la description.

## Fichiers de suivi

- `wordpress/seo/2026-10-05-audit.json` : état initial des URL et balises.
- `wordpress/seo/2026-10-05-verification.json` : contrôles publics après corrections.
- `wordpress/seo/2026-10-05-settings.json` : contenus non indexables, médias persistés et état du collecteur.
- `wordpress/seo/2026-10-05-rollback.json` : options et valeurs précédentes des événements.
- `wordpress/seo/2026-10-05-pending.json` : le seul point restant : purge native wpForo, puis vérification des balises du forum.

## Validation Google encore indisponible

Search Console via Site Kit répond `Login Required`. PageSpeed API répond HTTP 429, quota quotidien indisponible. Aucun score mobile, Core Web Vitals ou nombre de pages indexées par Google n’est déclaré. Le retrait du sitemap et les balises publiques sont vérifiés ; ils ne prouvent pas encore leur prise en compte par Google.
