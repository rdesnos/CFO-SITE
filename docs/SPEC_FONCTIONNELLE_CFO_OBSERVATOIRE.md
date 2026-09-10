# CFO Observatoire — Spécification fonctionnelle de référence

**Statut : baseline fonctionnelle validée**  
**Date de figement : 10 septembre 2026**  
**Référence visuelle : Marine Hebdo du 14/02/2026 au 20/02/2026, fournie par Rudy Desnos.**

## 1. Principe

Le Marine Hebdo fourni constitue la **spécification fonctionnelle de référence** du cockpit CFO Observatoire.

Le nouvel Observatoire ne doit pas repartir d'une page blanche ni simplifier ce périmètre. Il doit transposer la richesse fonctionnelle du cockpit historique dans l'expérience Web CFO actuelle.

La référence porte sur les **fonctions, indicateurs, comparaisons, tendances, graphiques et niveaux de détail**, et non sur la reproduction pixel-perfect du tableur historique.

Les chiffres visibles sur la référence du 14–20 février 2026 sont des données historiques d'illustration : le cockpit Web doit afficher les données les plus récentes disponibles dans Supabase.

## 2. Principes d'architecture

- WordPress : publication et expérience Web.
- CFO Theme : présentation du site ; aucune logique métier stratégique de l'Observatoire.
- Plugin `cfo-observatoire` : couche applicative et rendu du cockpit.
- Supabase : source de vérité des données CFO.
- GitHub : source de vérité du code et de la documentation.
- Aucune donnée métier fictive dans le cockpit.
- La discographie et les titres affichés doivent être dynamiques, issus du référentiel de données, et non codés en dur.

## 3. Audiences, mix et followers

Le cockpit doit restituer :

- mix des abonnés par plateforme ;
- auditeurs mensuels Spotify ;
- valeur courante ;
- valeur semaine précédente ;
- variation absolue et relative ;
- maximum historique ;
- historique graphique des auditeurs mensuels ;
- top des villes Spotify ;
- évolution des followers ;
- audiences mensuelles YouTube ;
- followers TikTok ;
- followers Instagram ;
- tendance hebdomadaire ;
- maximum historique lorsque disponible.

## 4. Airplay

Le cockpit doit conserver une lecture géographique et par titre :

- synthèse globale Marine ;
- France ;
- Belgique ;
- Suisse ;
- classement des radios ;
- nombre de plays/spins ;
- comparaison semaine précédente ;
- variation hebdomadaire ;
- tendance ;
- détail airplay par titre.

Les titres visibles doivent suivre automatiquement la discographie et les données disponibles.

## 5. Écoutes, classements et certifications

Pour les titres principaux :

- cumul d'écoutes ;
- semaine précédente ;
- semaine courante ;
- tendance ;
- moyennes mobiles / horizons de référence utiles ;
- historique graphique ;
- classements SNEP Singles ;
- classements SNEP Radio ;
- classements U-TOP Singles ;
- niveau / cible de certification ;
- progression vers la certification ;
- projection de date de certification ;
- évolution de cette projection.

Le cockpit doit pouvoir distinguer visuellement les titres et leurs familles / éditions lorsqu'elles existent.

## 6. Discographie détaillée

Le tableau de suivi doit couvrir dynamiquement les titres de Marine, notamment :

- titres de l'album ;
- titres Deluxe ;
- nouvelles sorties postérieures à la référence historique ;
- autres éditions ou familles pertinentes.

Pour chaque titre lorsque les données existent :

- cumul ;
- semaine précédente ;
- semaine courante ;
- moyenne ;
- tendance ;
- indicateur directionnel.

**La liste de titres ne doit jamais être figée dans le code.**

## 7. Album / éditions

Le cockpit doit conserver une lecture agrégée de l'album et de ses éditions :

- courbes d'écoutes ;
- total album ;
- album hors bonus / Deluxe lorsque pertinent ;
- comparaison des composantes ;
- parts relatives ;
- évolution quotidienne / hebdomadaire ;
- cumul ;
- tendances.

## 8. Estimations équivalent-ventes et projections

Le cockpit doit permettre :

- calcul / affichage des estimations équivalent-ventes ;
- suivi de la progression ;
- projection de certification ;
- date estimée ;
- évolution de l'estimation ;
- comparaison aux seuils et certifications officielles disponibles.

La méthodologie doit être identifiable/versionnable lorsque le calcul est CFO et non une donnée officielle.

## 9. EP / Live Session / contenus spécifiques

Le périmètre comprend le suivi des contenus spécifiques lorsqu'ils existent, par exemple EP / Live Session :

- historique graphique ;
- écoutes par titre ;
- cumul ;
- semaine précédente ;
- semaine courante ;
- tendance / variation hebdomadaire.

## 10. Écoutes globales Spotify

Le cockpit doit présenter une synthèse globale Spotify permettant notamment :

- historique des écoutes ;
- moyenne récente ;
- comparaison semaine précédente ;
- variation hebdomadaire ;
- lecture distincte de Marine hors périmètres spécifiques lorsque cela est fonctionnellement pertinent.

## 11. Responsive et expérience Web

La référence historique est très dense. Cette densité fonctionnelle doit être conservée, mais adaptée au Web.

### Desktop

- sensation de véritable cockpit / tableau de bord ;
- densité élevée mais structurée ;
- comparaisons immédiatement visibles ;
- graphiques et tableaux exploitables sans multiplier artificiellement les pages.

### Tablette

- réorganisation des blocs ;
- maintien des comparaisons essentielles ;
- tableaux horizontalement exploitables si nécessaire.

### Mobile

- cartes / blocs empilés ;
- priorité aux KPI, tendances et alertes ;
- accès au détail sans supprimer l'information ;
- tableaux adaptés ou dépliables ;
- graphiques lisibles à petite largeur.

Le responsive ne doit pas conduire à supprimer des fonctions du cockpit.

## 12. Données et fraîcheur

- Supabase est la source de vérité.
- Le cockpit utilise la donnée la plus récente disponible.
- La date / période d'observation doit être identifiable.
- Les valeurs historiques de la référence visuelle ne doivent pas être codées en dur.
- Les titres nouvellement sortis doivent apparaître via le référentiel dynamique.
- Les absences de données doivent être explicites et ne jamais être remplacées par des valeurs fictives.

## 13. Socle de données identifié

Le modèle Supabase existant comprend notamment :

- `core.artists`
- `core.tracks`
- `core.artist_tracks`
- `facts.streaming_daily`
- `facts.airplay_daily`
- `cfo.certification_targets`
- `cfo.certification_events`
- `cfo.trajectories`
- `cfo.gravitational_scores`
- `cfo.observations`

Le mapping définitif entre chaque composant du cockpit et les vues/tables d'exposition sera versionné avec le plugin.

## 14. Règle de gestion de configuration

À compter de cette baseline :

**validation = rendu validé + code complet dans Git + commit identifiable.**

Le code des plugins CFO fait explicitement partie du périmètre Git. Une logique fonctionnelle importante ne doit plus exister uniquement dans WordPress / la production.

Chaque évolution de CFO Observatoire doit partir de la dernière version validée et versionnée, puis suivre le cycle :

`baseline validée → évolution → preview → validation → Git → publication`

## 15. Portée de la référence

Cette spécification constitue le **socle**, pas la limite fonctionnelle future de CFO Observatoire. Elle doit permettre de reconstruire rapidement une base saine, figée et versionnée, puis de faire évoluer le cockpit sans perdre les fonctionnalités déjà définies.