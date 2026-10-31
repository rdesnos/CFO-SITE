# CFO Marine — chantier nl-BE

**État : incomplet, non publiable, non prêt pour validation du site complet.**

Branche : `codex/nl-be-complete-preview`, basée sur `origin/main` au commit `99bf682`.

## Sources capturées le 31 octobre 2026

- `inventory/pages.json` : 64 pages WordPress publiées, contenu brut et révision.
- `inventory/posts.json` : 14 articles publiés.
- `inventory/manifest.json` : 74 contenus conservés et quatre tests explicitement exclus (930, 924, 446, 819). Les anciens contenus sans lien entrant restent conservés par prudence.
- `inventory/nonpublic-pages.json` : quatre brouillons exclus.
- `inventory/public-crawl.json` : parcours de 93 URL internes sans paramètres depuis l’accueil ; 93 réponses HTTP 200, file d’attente épuisée. Le parcours inclut 37 routes de forum/profils hors pages et articles WordPress. Cela ne couvre pas les états de formulaires, les paramètres, les médias ni les réponses API.
- `inventory/seo.json` : 116 métadonnées SEO provenant de WordPress, dont certaines concernent les événements.
- `inventory/menus.json`, `forms.json`, `namespaces.json` : autres sources techniques.

31 événements `sc_event` publiés ont également été recensés par lecture WP-CLI. Leur extraction détaillée et leur traduction restent à réaliser. Les fils du forum wpForo, l’Agenda et les données/phrases dynamiques ne sont pas couverts par le seul décompte des 78 pages/articles.

## Travail enregistré

28 pages et les 14 articles sont traduits dans `translations/`, reconstruits sans modifier le HTML dans `build/`, puis enregistrés dans `public.cfo_content_translations` avec `locale=nl-BE`, `status=review`, empreinte SHA-256 de la source et révision WordPress. Aucun enregistrement n’a été publié. L’ancienne expérience 815 a été sauvegardée avant remplacement.

106 libellés d’interface sont enregistrés dans `public.cfo_interface_translations`, au statut `review`. Ce glossaire n’est pas un inventaire complet des textes dynamiques.

Le thème **brouillon existant** a reçu l’overlay contenu dans `theme/`. Le fichier `page.php` corrige le contournement du filtre de traduction par le gabarit de l’auteur. Le prototype de glossaire contenait une erreur JavaScript due aux apostrophes non échappées ; le chargement se fait désormais depuis Supabase via le serveur.

Le lecteur refuse les sources périmées, isole les lectures de prévisualisation, n’utilise aucun cache partagé et affiche un défaut explicite lorsque le contenu manque. Il ne modifie jamais un article français. Le nl-BE reste indisponible dans le sélecteur public.

## Accès serveur et RLS

Les migrations `cfo_nl_be_server_preview_read_only` et `cfo_nl_be_interface_translations` ont été appliquées par le connecteur Supabase. Leur SQL exact figure dans `schema/`.

La prévisualisation s’appuie sur la validation du thème par WPVibe et sur le secret dédié du connecteur WordPress/Supabase **utilisé exclusivement côté serveur**. Aucun secret n’a été récupéré, affiché ou ajouté aux fichiers. Un paramètre de requête ou un cookie isolé n’accorde aucun accès. L’accès public reste limité aux lignes publiées.

Ne pas appeler `get_page_html` avec une ancienne URL de prévisualisation pour vérifier le thème : les contrôles ont montré que l’URL peut devenir invalide après génération d’une nouvelle prévisualisation. Utiliser une URL fraîche et vérifier dans le navigateur la présence effective du bandeau de brouillon et `html[lang=nl-BE]`. Aucun jeton de prévisualisation n’est conservé ici.

## Vérifications réellement exécutées

- Intégrité des 42 traductions : 675 segments ; structure HTML, liens, médias, chiffres et citations conservés.
- Relecture Supabase : 42 lignes identiques aux sorties locales pour titres, extraits, contenu et empreinte source (`evidence/supabase-roundtrip.json`).
- 16 tests PHP du lecteur : protection de la prévisualisation, sources périmées, conservation française, statuts autorisés et absence de secret dans les requêtes publiques.
- Syntaxe PHP de l’overlay et syntaxe Node des scripts modifiés : valides.
- API publique Supabase : quatre requêtes anonymes, aucune ligne non publiée exposée (`evidence/anonymous-rls.json`).
- Conseiller sécurité Supabase : aucune alerte identifiée pour les deux tables de traduction, sans prétendre auditer le reste du projet.
- Navigateur : la page 662 restitue sa traduction Supabase, les menus traduits et les liens en nl-BE. L’erreur JavaScript de l’ancien glossaire a été détectée pendant ce contrôle et corrigée.
- Régression française ciblée : texte visible de la page 662 identique au relevé avant modifications. Cela ne constitue pas une comparaison fonctionnelle complète.

## Travail restant obligatoire

`python i18n/nl-BE/tools/readiness.py` doit échouer tant que le site n’est pas complet. Actuellement : 42/74 contenus WordPress couverts, soit 56,76 %, hors modules supplémentaires. `evidence/readiness.json` donne les 32 contenus manquants.

Il reste notamment les longs dossiers, l’accueil, l’Observatoire et ses gabarits, la charte IA, les métadonnées SEO, les contenus et états du forum, l’Agenda, les flux Supabase et phrases calculées, les formulaires et leurs messages, ainsi que les tests exhaustifs de liens/médias, caractères, résidus français, responsive, JavaScript/PHP et parité fonctionnelle.

Les balises SEO observées sur la page néerlandaise 662 sont encore françaises : titre de document, description, `og:locale`, JSON-LD. Ce défaut est connu et bloquant pour une livraison complète. La narration existante et les remplacements de gabarits de l’Observatoire doivent également être contrôlés dans la langue cible.

Attention aux incohérences des sources : la description SEO 717 annonce encore la présence de Marine à Attrap’Sons alors que l’article français la dément ; plusieurs métadonnées d’événements ne correspondent pas à leurs titres actuels. Les sources françaises n’ont pas été corrigées par ce chantier. Ne pas présenter une traduction littérale de ces contradictions comme vérifiée.

## Reprise

1. Compléter les sources et traductions manquantes sans réduire silencieusement le périmètre.
2. Exécuter `build_posts.py pages`, `build_posts.py posts`, puis `build_interface.py` et enregistrer les seuls changements dans Supabase, toujours en `review`.
3. Refaire les contrôles d’intégrité et de relecture après chaque lot.
4. Compléter les preuves end-to-end et faire passer le contrôle de readiness.
5. Fournir alors seulement une URL fraîche de prévisualisation complète pour validation humaine.

Ne pas publier le thème, promouvoir les traductions ou modifier la production française sans validation explicite.
