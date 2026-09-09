# Migration Hostinger — état de référence

## Objet

Cette branche `migration_hostinger` sert exclusivement à sécuriser le chantier de migration CFO vers Hostinger et à éviter toute confusion avec le fonctionnement nominal futur.

## Instances Hostinger identifiées

### 1. `forestgreen-ape-335663.hostingersite.com`

- Rôle : instance issue de la migration Hostinger réalisée le 27 août 2026 depuis le site CFO IONOS.
- Statut : branche historique de migration, ensuite modifiée.
- Usage : uniquement pour inventorier et récupérer les évolutions utiles avant une nouvelle migration propre.
- Destination : hors architecture nominale future une fois la consolidation terminée.

### 2. `mediumturquoise-gnat-385231.hostingersite.com`

- Rôle : URL temporaire Hostinger de l'instance destinée à devenir la production CFO.
- Domaine cible : `chroniques-fille-ordinaire.com`.
- Statut actuel : WordPress neuf / non consolidé.

## Architecture nominale cible Hostinger

1. WPVibe Preview : sandbox de thème, sans impact sur le thème live.
2. Staging Hostinger rattaché à l'instance de production : préproduction / recette complète.
3. Production Hostinger : instance actuellement accessible via `mediumturquoise-gnat-385231.hostingersite.com`, puis via `chroniques-fille-ordinaire.com` après raccordement du domaine.

`forestgreen-ape-335663.hostingersite.com` n'appartient pas à cette architecture nominale.

## Référentiel métier Supabase

- Un seul projet Supabase identifié : `chroniques d'une fille ordinaire`.
- Project ref : `fjpcuxsezeuajhlotzij`.
- Statut : ACTIVE_HEALTHY.
- Le plugin `CFO Supabase Sync` est présent sur les instances CFO inspectées.
- Conclusion : pas de branche de données métier IONOS/Hostinger à réconcilier ; Supabase reste le référentiel unique des données cœur de métier.

## Diff technique déjà identifié : IONOS prod vs Forestgreen

### Socle compatible

- WordPress : 7.1 des deux côtés.
- PHP : 8.3.33 des deux côtés.
- Permaliens : `/%postname%/`.
- HTTPS actif.
- Multisite désactivé.

### Ecarts applicatifs principaux

- Thème actif IONOS : `cfo` 1.0.0.
- Thème actif Forestgreen : `cfo-theme` 1.0.0.
- Forestgreen contient aussi un thème inactif `CFO Theme Restore`.
- `CFO Observatoire` : IONOS 1.3.0 actif / 1.5.1 inactif ; Forestgreen 1.5.1 actif / 1.3.0 inactif.
- `CFO Agenda` 0.1.0 : actif sur Forestgreen, absent de la liste des plugins actifs IONOS relevée.
- Plugins principaux CFO communs : Cockpit Hebdo 1.5.0, Forum Bridge 1.0.3, MGP 0.2.1, Supabase Sync 1.0.2, correctif performance 1.0.0, Illustrations 1.0.0, wpForo 3.1.5, WPVibe 1.16.4.
- Charset base WordPress : IONOS `utf8mb4`, Forestgreen `utf8`.
- Plugins IONOS (Essentials, Single Sign-On, Marketplace / Installatron) présents dans la migration Forestgreen mais à considérer comme couche hébergeur et non comme composants cibles Hostinger.

## Règle d'arbitrage

- En cas d'écart clair, conserver la version explicitement validée comme la plus récente / utile.
- En cas de doute, la version IONOS de production actuelle prévaut.
- Aucun écrasement ni suppression de Forestgreen avant sécurisation des éléments retenus.

## Prochaine étape

Faire le diff détaillé des éléments ayant pu évoluer après le 27 août sur Forestgreen :

- thème / CSS / templates ;
- plugins CFO spécifiques ;
- pages, contenus éditoriaux, menus et médias ;
- snippets / configuration WordPress.

Après arbitrage, sécuriser les éléments retenus dans cette branche, puis supprimer l'ancienne instance de migration et relancer une migration Hostinger propre.
