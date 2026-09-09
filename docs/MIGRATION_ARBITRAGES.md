# Migration Hostinger — éléments d'arbitrage

Branche : `migration_hostinger`

## Synthèse exécutive

La comparaison disponible à ce stade montre que la branche IONOS actuelle est globalement plus complète côté thème, tandis que Forestgreen contient quelques évolutions applicatives spécifiques à examiner avant suppression.

Règle par défaut convenue : en cas de doute, IONOS prod actuelle prévaut.

## 1. Thème — arbitrage recommandé : IONOS

### Header

IONOS : le header utilise un logo image intégré directement dans le thème.
Forestgreen : le header utilise un marquage CSS `cfo-mark` avec le texte CFO.

=> Ce ne sont pas les mêmes variantes visuelles. La version IONOS correspond à l'état public actuel et doit être retenue par défaut.

### Functions

IONOS charge deux feuilles CSS supplémentaires absentes de Forestgreen :
- `assets/cfo-timeline.css`
- `assets/cfo-certifications.css`

IONOS et Forestgreen partagent sinon la même structure générale Tailwind / Gutenberg / WPVibe, mais Forestgreen est essentiellement une variante renommée `cfo-theme-restore`.

=> IONOS est plus complet fonctionnellement.

### Single post

IONOS contient une logique spécifique pour la catégorie `entre-les-lignes` avec :
- hero dédié ;
- méta dédiée ;
- visuel dédié ;
- classes CSS dédiées.

Forestgreen utilise uniquement le template générique d'article et ne contient pas cette spécialisation.

=> IONOS est clairement plus riche et doit être retenu.

### Inventaire des fichiers du draft WPVibe

IONOS : 17 fichiers.
Forestgreen : 15 fichiers.

Les 2 fichiers supplémentaires sur IONOS sont les CSS timeline et certifications.

Conclusion thème : conserver IONOS comme base. Ne récupérer de Forestgreen que des éléments explicitement identifiés comme nouveaux et utiles, pas le thème en bloc.

## 2. Plugins — arbitrages à faire

### CFO Observatoire

IONOS :
- 1.3.0 actif
- 1.5.1 inactif

Forestgreen :
- 1.5.1 actif
- 1.3.0 inactif

Décision requise :
- A. conserver 1.3.0 (règle IONOS par défaut) ;
- B. retenir 1.5.1 si elle correspond à une évolution volontaire déjà validée sur Forestgreen.

Recommandation : ne pas retenir 1.5.1 uniquement parce qu'elle est plus récente ; la valider fonctionnellement avant arbitrage.

### CFO Agenda

Forestgreen : `CFO Agenda 0.1.0` actif.
IONOS : n'apparaît pas dans la liste des plugins actifs relevée.

Décision requise :
- A. abandonner CFO Agenda 0.1.0 ;
- B. le conserver comme évolution post-migration.

Recommandation : conserver son code dans la branche `migration_hostinger` avant suppression de Forestgreen, même si l'activation finale reste à décider.

## 3. Contenu WordPress

Inventaire publié comparé via REST API :

- Pages publiées : mêmes IDs, slugs et titres visibles sur IONOS et Forestgreen dans le relevé effectué.
- Articles publiés : mêmes 10 articles, mêmes IDs, slugs et titres visibles sur les deux sites.

Conclusion : aucune divergence structurelle évidente dans l'inventaire publié.

Limite : ce contrôle ne prouve pas encore que le corps complet de chaque page/article est byte-à-byte identique. Il indique simplement qu'il n'y a pas, à ce stade, de page ou article publié manifestement présent d'un côté et absent de l'autre.

## 4. Données métier Supabase

Un seul projet Supabase : `chroniques d'une fille ordinaire` (`fjpcuxsezeuajhlotzij`), état ACTIVE_HEALTHY.

=> Pas d'arbitrage de données métier IONOS/Forestgreen.

## 5. Couche hébergeur

Les plugins IONOS présents sur Forestgreen proviennent de la migration et ne doivent pas être considérés comme composants applicatifs à conserver dans l'architecture Hostinger cible.

Hostinger doit conserver sa propre couche hébergeur.

## 6. Décisions proposées au retour

### Décision 1 — thème

Proposition : **IONOS intégralement comme base thème**.

### Décision 2 — CFO Observatoire

Choix : **1.3.0 IONOS** ou **1.5.1 Forestgreen après validation fonctionnelle**.

### Décision 3 — CFO Agenda

Choix : **conserver** ou **abandonner**. Par sécurité, sauvegarder le code avant suppression de Forestgreen.

### Décision 4 — contenu éditorial

Proposition : **IONOS par défaut**, aucune divergence structurelle publiée détectée à ce stade.

## 7. Séquence après arbitrage

1. Sauvegarder dans Git les composants Forestgreen retenus.
2. Vérifier qu'aucun autre artefact utile n'est propre à Forestgreen.
3. Supprimer Forestgreen uniquement après sécurisation.
4. Relancer une migration Hostinger propre.
5. Recette dans l'architecture nominale Hostinger.
