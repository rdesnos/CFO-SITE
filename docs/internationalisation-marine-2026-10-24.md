# CFO Marine — éditions linguistiques

Demande de Rudy, 24 octobre 2026 : couvrir les langues des pays cibles, avec une édition **français canadien** distincte du français de France.

## Périmètre

| Édition | Code | Territoires de référence |
| --- | --- | --- |
| Français de France | fr-FR | Source éditoriale existante ; lecteurs francophones européens |
| Français canadien | fr-CA | Canada, notamment Québec |
| Anglais canadien | en-CA | Canada anglophone |
| Néerlandais | nl-BE | Belgique néerlandophone |
| Allemand | de | Belgique, Suisse, Luxembourg |
| Luxembourgeois | lb-LU | Luxembourg |
| Italien | it-CH | Suisse italophone |
| Romanche | rm-CH | Suisse, Rumantsch grischun à réviser |

La régionalisation fr-BE, fr-CH, fr-LU ou de-CH pourra être ajoutée à la même structure lorsqu'un contenu réellement régional existe. Les langues des communautés immigrées et les langues autochtones canadiennes ne sont pas incluses automatiquement dans ce premier périmètre ; il ne s'agit pas d'une prétention à couvrir toutes les langues parlées dans ces pays.

## Principes

- Une source factuelle partagée ; pas de compteurs ou chiffres recopiés en dur.
- Conserver les titres originaux des chansons, la marque et les noms propres.
- Distinguer traduction linguistique, adaptation locale et informations propres à un pays.
- Ne pas convertir les horaires d'un concert sans conserver le fuseau du lieu ; ne pas convertir arbitrairement les prix en dollars.
- Les citations, paroles, codes, URL, sources et données ne sont pas réécrits par la couche de vocabulaire.
- Français canadien naturel et sobre : infolettre, balado, écoute en continu ; pas de québécismes artificiels.
- Aucune redirection automatique imposée selon IP ou langue du navigateur.
- Ne rendre visibles que les éditions dont le contenu est disponible.

## Livraison préparée

Le module `wordpress/theme/cfo-international.php` ajoute un sélecteur France/Canada et une première adaptation de vocabulaire fr-CA au rendu HTML. Les liens éditoriaux conservent `?cfo_lang=fr-CA`. Les contenus français restent partagés : il ne s'agit pas d'une révision canadienne intégrale.

Le script compagnon applique la même adaptation aux textes chargés après le rendu. Les langues restantes sont enregistrées mais non exposées tant que leurs traductions complètes ne sont pas disponibles.

La variante canadienne est provisoirement `noindex`, canonique existante conservée ; les `hreflang` SEO et des routes dédiées devront être activés après révision et disponibilité de chaque page traduite. Sur demande de Rudy, le sélecteur associe désormais des drapeaux SVG aux noms explicites des langues et régions. Les icônes sont hébergées dans le thème, décoratives pour les lecteurs d’écran et indépendantes des polices emoji de Windows. La mise en cache de la variante canadienne est désactivée pour prévenir tout mélange avec la France.

## État réel

- Code préparé localement et destiné à un aperçu WordPress ; pas de publication automatique.
- Traductions en-CA, nl-BE, de, lb-LU, it-CH, rm-CH : **à produire**, y compris articles, navigation, formulaires, textes alternatifs et contenus des flux.
- Révision éditoriale fr-CA : **à compléter**. Les dates des flux qui imposent `fr-FR` dans leur propre code nécessitent une intégration séparée ; elles ne sont pas converties par ce module.
- Les autres sites CFO (Agence Média, Mag, Hebdo) n'ont pas été modifiés : leur périmètre éditorial est distinct du média Marine.

## Sources de périmètre

- Suisse, langues nationales : https://www.aboutswitzerland.eda.admin.ch/fr/plurilinguisme
- Luxembourg, langues : https://luxembourg.public.lu/en/society-and-culture/languages.html

## Intégration et retrait

Charger `cfo-international.php` depuis les fonctions du thème. Pour retirer la fonctionnalité, retirer cette ligne ; aucune donnée WordPress n'est dupliquée ni modifiée et aucun service tiers de traduction n'est requis.
