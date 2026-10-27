# CFO Marine — exécution, premier lot du 27 octobre 2026

Le cadrage est passé en exécution. Les trois chantiers restent ouverts : les correctifs Supabase ci-dessous sont déployés ; le cockpit reste en prévisualisation ; les articles 3383 et 3384 sont publiés après accord explicite de Rudy. Aucun résultat d'acquisition n'est encore attribuable à ce lot.

## Livré et vérifié

- **Information** : filtre Marine appliqué avant limitation du flux public ; réponse 200, version `2026-10-27.1`, 32 entrées toutes Marine. Le collecteur distingue désormais accès Web et canaux sociaux non raccordés, conserve les décisions éditoriales et reprend le classement du registre. Contrôle réel des trois canaux sociaux : trois erreurs explicites, aucune fausse réussite ajoutée. Boutique officielle ajoutée en source Gold, couverture manuelle explicite.
- **Donnée** : seuil de stabilité inférieur à 1 %, valeurs absentes conservées, flèches et formulations calculées à partir des variations. Premier message : Spotify +4,5 %, radio −0,7 % (stable), semaine du 20 au 26 octobre. Source Soundcharts/CFO, dates et absence de causalité explicites. Prévisualisation réelle contrôlée. Le dernier ajustement renforce la taille du texte et retire la surcouche de graphique qui exposait encore les valeurs de septembre aux lecteurs d'écran.
- **Viraly** : inventaire complet 83/83 (77 publications historiques, 6 brouillons, 0 programmée). Neuf candidats enregistrés, dont deux brouillons réutilisés ; tous restent Draft. Liens UTM Facebook/X ; raccordement Instagram et preuve GA4 encore ouverts.
- **Contenu** : [deux articles publiés après validation](contenus-cfo-marine-2026-10-27.md), WordPress 3383 et 3384. [Neuf textes et calendrier](pilote-viraly-cfo-marine-2026-10-27.md).

## Déploiement et preuves

Code initial : `fe540ba7978368571770f6b1be8e3d91efab216d`.
Fonctions actives : `cfo-actu-feed` v7 ; `cfo-news-collector` v10. Le paramètre JWT de déploiement n'a pas été modifié. Aucun changement de schéma ou de politique d'accès.

Tests : cinq fichiers, neuf tests Node et douze cas de pertinence intégrés réussis ; syntaxe JavaScript valide. Rapport initial : `ops/2026-10-27-execution-lot-1.json`. Résultats de livraison : `ops/2026-10-27-execution-resultats.json`.

## État des actions

| Action | État et travail restant |
|---|---|
| I01 | En cours : 14 sources enregistrées ; couverture sociale réelle non raccordée |
| I02 | En cours : derniers faits relevés ; comparaison exhaustive sept jours à terminer |
| I03 | Partiel livré : faux succès sociaux corrigés ; Arachnée 503, Artmedia et connecteurs sociaux restent ouverts |
| I04 | Partiel livré : filtre Marine, métadonnées et préservation éditoriale testés ; dédoublonnage sémantique à approfondir |
| I05 | Partiel livré : article 3383 publié et page publique contrôlée ; chaîne accueil/agenda à terminer |
| I06 | En cours : crons et erreurs constatés ; alertes et reprise autonome à terminer |
| I07 | Préparé : trois brouillons sociaux du contenu information ; pas de publication |
| I08 | À démarrer : sept jours réels après activation |
| D01–D02 | En cours : KPI principaux rapprochés ; appel historique HTTP 500 et séries anciennes documentés |
| D03 | Partiel livré : sens des tendances, stabilité et valeurs absentes corrigés ; pas de réécriture des agrégations SQL |
| D04–D05 | Première restitution prête en prévisualisation ; message, source, période et limites visibles |
| D06 | En cours : restitution raccordée au RPC ; alignement accueil et élimination du chargement historique restent ouverts |
| D07 | En cours : santé examinée ; YouTube/Shazam et retard panel à traiter |
| D08 | À terminer : mobile/clavier/zoom puis sept jours de contrôle public |
| V01 | Inventaire complet réalisé ; historique conservé dans le rapport initial |
| V02 | En cours : convention UTM prête ; réception GA4 et lecture qualifiée à prouver |
| V03 | Deux nouveaux articles publiés et pages publiques contrôlées, Gemme public ; recette des aperçus à terminer |
| V04 | Neuf brouillons enregistrés ; visuels Instagram provisoires à décliner |
| V05 | Calendrier relatif proposé ; activation conditionnée aux validations |
| V06 | Non lancé : aucune programmation ni publication de ce lot |
| V07 | En cours : identifiants et reprises idempotentes consignés ; rapprochement GA4 à réaliser |
| V08 | À démarrer après les publications ; aucune mesure future déclarée réalisée |

## Points bloquants et prochaine livraison

1. Terminer la livraison du thème à partir de l'état public actuel : le brouillon WPVibe existant comporte d'autres fichiers plus anciens. Ne pas le publier globalement. Retirer le snapshot initial de septembre et l'appel concurrent `cfo_cockpit_snapshot` en erreur ; conserver la composition et les indicateurs validés. Sauvegarde et recette de livraison requises selon la procédure du projet.
2. Accord obtenu sur les deux textes précis. Les articles 3383 et 3384 sont publiés le 27 octobre à 12 h 42 (Europe/Paris), sans modification des textes validés. Le refus initial a été levé par cet accord ; les pages publiques renvoient HTTP 200 et affichent les titres, corps et liens attendus, sans bannière de prévisualisation.
3. Achever mesure, aperçus et visuels avant activation du calendrier Viraly. Le cockpit et les posts sociaux restent non publiés ; les deux articles sont publics.
4. Raccorder réellement les sources sociales avec un accès adapté, puis mesurer les retards et omissions. Le présent lot rend la couverture honnête, il ne la rend pas encore exhaustive.
