# Inventaire WordPress — V1

Capture de référence du site CFO au 23 août 2026.

## Environnement

- Site : https://chroniques-fille-ordinaire.com
- WordPress : 7.1
- PHP : 8.3.33
- Thème actif : MH Magazine 5.0.8 (`mh-magazine`)
- WPVibe : 1.15.3

## Plugins installés / actifs visibles

- `beyond-seo/beyond-seo.php`
- `cfo-cockpit-hebdo/cfo-cockpit-hebdo.php`
- `cfo-mgp/cfo-mgp.php`
- `cfo-observatoire-disabled/cfo-observatoire.php`
- `cfo-observatoire/cfo-observatoire.php`
- `cfo-observatoire-performance/cfo-observatoire-performance.php`
- `cfo-supabase-sync/cfo-supabase-sync.php`
- `contact-form-7/wp-contact-form-7.php`
- `content-aware-sidebars/content-aware-sidebars.php`
- `ionos-essentials/ionos-essentials.php`
- `extendify/extendify.php`
- `maintenance/maintenance.php`
- `ionos-marketplace/ionos-marketplace.php`
- `mgp-trajectory-3d/mgp-trajectory-3d.php`
- `ionos-sso/ionos-sso.php`
- `01-ext-ion8dhas7/01-ext-ion8dhas7.php`
- `google-site-kit/google-site-kit.php`
- `sugar-calendar-lite/sugar-calendar-lite.php`
- `autodescription/autodescription.php`
- `viraly/viraly.php`
- `wordpress-mcp/wordpress-mcp.php`
- `wpforo/wpforo.php`
- `vibe-ai/vibe-ai.php`

## Plugins CFO à considérer comme briques de production

- `cfo-cockpit-hebdo`
- `cfo-mgp`
- `cfo-observatoire`
- `cfo-observatoire-performance`
- `cfo-supabase-sync`
- `mgp-trajectory-3d`

Le répertoire `cfo-observatoire-disabled` est un reliquat identifié. Il ne doit pas être supprimé sans audit contrôlé.

## Limite de cette capture

Le connecteur WordPress actuel permet d’inventorier précisément l’environnement mais ne fournit pas encore un export direct des fichiers des plugins de production. Le dépôt Git constitue donc à ce stade la baseline de configuration et de documentation ; le code source des plugins devra être ajouté dès qu’un canal d’export fiable est disponible.
