# CFO Cockpit V1 — reference fonctionnelle et visuelle

Date de validation : 13 septembre 2026
Instance : CFO_Marine
Statut : REFERENCE VALIDEE — base de réalisation

## Principe

Le cockpit CFO est un tableau de bord éditorial et analytique alimenté par les données réelles Supabase. Aucun chiffre ne doit être inventé pour compléter l'interface : une donnée indisponible est explicitement signalée.

La maquette validée le 13/09/2026 constitue la référence graphique V1. Elle ne doit pas être réinventée lors de l'implémentation.

## Navigation

Onglets :
- Vue d'ensemble
- Audiences
- Écoutes & Titres
- Classements
- Certifications
- Airplay
- Comparaisons

La période d'observation et la date/heure de dernière mise à jour sont visibles en haut à droite.

## Vue d'ensemble — ordre des blocs

### 1. Prochaines certifications
Bloc prioritaire, placé immédiatement sous la navigation.
Pour chaque projet : pochette, titre, type (single/album), prochain niveau de certification, seuil, estimation/cumul disponible, progression en %, barre/jauge de progression.

### 2. Audiences · Mix · Followers
Restitution synthétique des audiences et abonnés :
- répartition des abonnés par plateforme ;
- auditeurs mensuels Spotify ;
- top villes Spotify ;
- followers Spotify ;
- YouTube audiences mensuelles ;
- TikTok followers ;
- Instagram followers.
Les indicateurs CFO existants et leurs définitions métier sont conservés.

### 3. Écoutes · Classements · Certifications
Cartes par projet avec : cumul, semaine courante, variation S/S-1, tendance, classements SNEP/UTOP disponibles et accès au détail des titres.
Sous les cartes : tableaux de sélection de titres et leurs métriques.

### 4. Albums / projets détaillés
Restitution par format/édition et titres, avec écoutes, parts, variations et tendances lorsque disponibles.

### 5. Écoutes globales Spotify
Vue Marine globale, hors périmètres explicitement exclus, avec série temporelle et variation hebdomadaire.

### 6. Airplay
Marine global + cartes par projet : plays, S-1, variation et marchés/pays disponibles.

### 7. En cours
Bloc de suivi éditorial et prospectif.
- TRICHEUR : single en cours ; progression vers la certification cible.
- DEMAIN : album en préparation ; le cockpit intégrera automatiquement les données dès disponibilité après sortie.
Ce bloc est extensible à plusieurs objets actifs/futurs.

## Données

Sources de référence déjà identifiées :
- `public.observatoire_indicators`
- `publication.v_observatoire_status`
- `cfo.cockpit_certification_status`
- tables `cfo.certification_*`
- schémas `core`, `facts`, `acquisition` et données airplay/social associées.

Pour les certifications, la famille de certification consolide les versions/recordings admissibles selon les règles métier CFO. Les identifiants plateforme ne sont pas additionnés lorsqu'ils correspondent au même ISRC.

## Règles d'affichage

Chaque valeur doit être qualifiable comme réelle, officielle, calculée/estimée, calibrée ou indisponible selon le modèle de données. La qualité/provenance ne doit pas être masquée.

Le cockpit doit rester lisible comme un média premium : densité forte mais hiérarchisée, pas d'effet graphique gratuit, information prioritaire.

## Règle de réalisation

Supabase = données de référence.
GitHub = code, documentation et historique de référence.
WordPress/CFO = restitution publique.

Toute évolution validée du cockpit doit être versionnée dans Git.