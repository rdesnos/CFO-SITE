# CFO Marine — Plan d'action 2 : donnée

Date : 27 octobre 2026.
Exigence : donnée **fiable**, porteuse d'un message clair et lisible.
Pilotage et dépendances : [plan commun](plans-actions-cfo-marine-2026-10-27.md).

## Point de départ et références

Le contrôle public de l'Observatoire réalisé dans la session du 27 octobre a exposé des valeurs en attente, une période ancienne et des photographies datées. Ce constat de rendu appelle un diagnostic de la chaîne complète ; il ne prouve pas à lui seul quel composant est fautif.

Le [lot de fiabilisation du 16 octobre](cfo-marine-pipeline-2026-10-16.md) décrit du code et des validations locales, mais laisse la preuve de déploiement à compléter. Relever la version réellement en production avant correction.

Respecter la [source de vérité du cockpit](CFO_COCKPIT_SOURCE_OF_TRUTH.md), les [principes de conception](principes-conception-cfo-marine.md) et [l'architecture runtime](ARCHITECTURE_RUNTIME.md). Conserver les indicateurs validés et l'identité CFO ; améliorer leur hiérarchie de lecture.

## Actions ordonnées

| ID | Action précise | Livrable / preuve attendue | Dépendance |
| --- | --- | --- | --- |
| D01 | Inventorier chaque indicateur visible sur l'accueil et l'Observatoire : définition, unité, périmètre, source, date d'observation, collecte, cache, API et sélecteur d'affichage. | Matrice de traçabilité ; distinguer fraîcheur fournisseur, fraîcheur de collecte et fraîcheur du cache. | Aucune |
| D02 | Rejouer la lecture source → calcul → API → navigateur sur un indicateur de chaque famille : Spotify, radio, réseaux sociaux, YouTube et certifications si affichées. Vérifier la version déployée. | Journal des écarts et cause établie : source ancienne, période incomplète, calcul, cache ou affichage. Aucune valeur reprise d'une ancienne maquette comme donnée actuelle. | D01 |
| D03 | Corriger les périodes et calculs non comparables, le périmètre des enregistrements et les doublons ; conserver les valeurs manquantes. | Calculs reproductibles depuis les observations, dates exactes et cas limites documentés. Tests de non-régression appropriés aux corrections. | D02 |
| D04 | Définir pour chaque bloc ce qu'il doit faire comprendre : mouvement, stabilité, divergence ou point à surveiller. Associer une formulation factuelle et les métriques réellement nécessaires à sa preuve. | Fiche message → chiffres → comparaison → source → limite. Aucun message dynamique prédéterminé avant lecture des données. | D03 |
| D05 | Réaliser une première restitution dans la composition CFO existante : signal immédiatement perceptible, chiffres d'appui hiérarchisés, période et accès au détail. Présenter les états vide, ancien et erreur. | Proposition visuelle fondée sur des données réelles ; lecture essentielle en trois secondes, compréhension de la dynamique en dix secondes. | D04 |
| D06 | Raccorder cette restitution aux calculs fiables ; aligner accueil et Observatoire sur les mêmes définitions et périodes. Actualiser le cache et traiter les erreurs de chargement. | Valeurs identiques à définition et date identiques ; chargement terminé ou état explicite ; aucune ancienne valeur concurrente réinjectée par un second script. | D03–D05 |
| D07 | Réparer ou compléter le suivi de santé : couverture, dernière observation, dernière collecte, dernière actualisation, retard, état des quotas et erreurs. | Incident détectable, reprise contrôlée et historique préservé ; traitement autonome hors ChatGPT. | D02–D06 |
| D08 | Effectuer la recette publique puis contrôler sept jours complets de fonctionnement. Réinjecter les défauts dans les actions concernées. | Preuves desktop/mobile, clavier et zoom ; rapprochement quotidien source/rendu, erreurs et corrections ; validation du message et de la fiabilité. | D06–D07 |

## Contrôles de fiabilité obligatoires

- Une variation compare la même métrique, le même périmètre et des périodes de même durée. Montrer les dates ; une comparaison incomplète est signalée.
- Pour les écoutes calculées depuis des compteurs cumulés, utiliser des bornes exactes et traiter une baisse ou une remise à zéro comme une anomalie à qualifier.
- Appliquer le catalogue qualifié et les règles de déduplication existantes ; vérifier notamment que deux versions partageant un compteur ne sont pas additionnées deux fois.
- Une base de comparaison nulle ou absente ne produit pas un pourcentage trompeur. Une donnée absente reste absente.
- Les auditeurs mensuels Spotify sont une mesure glissante ; les abonnés sont un stock ; les écoutes et passages radio concernent une période. Conserver ces sens sous les bons libellés.
- Une somme d'abonnés de réseaux n'est pas un nombre de personnes uniques. Les vues YouTube globales et les vues de clips officiels doivent rester distinctes.
- Les certifications officielles et les projections CFO sont distinguées. Les écoutes mondiales Spotify ne se substituent pas aux équivalents éligibles en France pour une certification.
- Une corrélation entre exposition et écoute n'établit pas une causalité. Les hypothèses sont identifiées comme telles.
- Les règles de fraîcheur sont définies par métrique et fréquence fournisseur attendue ; un retard fournisseur n'est pas maquillé par la date du dernier appel réussi.
- Les appels et reprises respectent les quotas réellement applicables et conservent l'historique ; aucune collecte historique massive n'est lancée par commodité.

## Grammaire de lecture

Chaque bloc suit trois niveaux : **signal immédiat → éléments explicatifs → données d'appui vérifiables**. Les indicateurs détaillés restent accessibles. Taille, contraste, espace, flèches et libellés doivent porter le message ; la couleur seule ne doit pas être nécessaire.

Seuils existants à conserver : stabilité si variation absolue inférieure à 1 %, mouvement modéré de 1 % à moins de 5 %, mouvement significatif à partir de 5 %. Un seuil ne constitue pas une preuve statistique. Vérifier les valeurs autour des bornes et les arrondis affichés.

La rédaction peut préciser le constat ; elle ne compense pas une organisation visuelle incompréhensible. Un mouvement modéré n'est pas présenté graphiquement comme une rupture.

## Première livraison attendue et clôture

Choisir, après D01–D03, le premier signal actuel entièrement justifiable. Livrer sa restitution et sa preuve de calcul sur la même période, puis appliquer la méthode aux autres blocs. Un manque de données conduit à un état explicite, jamais à une histoire inventée.

Clôture : tous les blocs exposés ont une traçabilité, un état de fraîcheur et un message soutenable ; aucun indicateur validé n'a disparu ; la recette et les sept jours d'exploitation disposent de preuves. Une belle maquette seule ou une base correcte seule ne clôture pas le chantier.
