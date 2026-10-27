# CFO Marine — Plan d'action 1 : information

Date : 27 octobre 2026.
Exigence : information réactive, riche, vérifiée, centralisée et utile.
Pilotage et dépendances : [plan commun](plans-actions-cfo-marine-2026-10-27.md).

## Point de départ et limites du diagnostic

Le dépôt contient déjà un collecteur, un flux public et des règles de qualification. Leur présence ne prouve pas leur exécution actuelle en production. Le code du collecteur consulté parcourt des pages Web ; il ne prouve pas à lui seul une collecte des publications sociales officielles.

Références : [contexte du projet](../AI_CONTEXT.md), [collecteur](../supabase/functions/cfo-news-collector/index.ts), [flux public](../supabase/functions/cfo-actu-feed/index.ts), [tests de préservation éditoriale](../tests/news-collector-preserves-editorial.test.cjs).

## Actions ordonnées

| ID | Action précise | Livrable / preuve attendue | Dépendance |
| --- | --- | --- | --- |
| I01 | Recenser les canaux officiels de Marine, son entourage professionnel et les médias admissibles. Vérifier pour chacun l'URL, le propriétaire, le mode de lecture disponible et l'accès réel. | Registre de sources classé Platinum / Gold / Silver, avec statut accessible, partiel ou indisponible, fréquence possible et dernière lecture réussie. | Aucune |
| I02 | Comparer les informations importantes des sept derniers jours aux contenus publics de CFO ; horodater source, détection et publication CFO quand ces dates sont connues. | Tableau de couverture : fait, source originale, importance, page CFO ou absence, délai mesuré, cause du manque. Les heures inconnues restent inconnues. | I01 |
| I03 | Vérifier les traitements réellement déployés, leurs exécutions et erreurs. Corriger les sources défaillantes et raccorder les canaux prioritaires par les accès effectivement disponibles. | Pour chaque source prioritaire, exécution réelle traçable, résultat et procédure de reprise. Une source inaccessible a une solution manuelle explicite, jamais un faux statut de couverture. | I01–I02 |
| I04 | Consolider la qualification : pertinence Marine, source originale, dédoublonnage, dates, catégorie et importance. Préserver les décisions éditoriales lors des reprises. | Tests ciblés sur homonymes, même fait repris, URL canonique, date manquante et seconde collecte du même item ; aucun doublon ni écrasement d'une décision validée. | I03 |
| I05 | Vérifier la chaîne page d'actualité → mise en avant → accueil → agenda si l'information justifie un événement qualifié. Relier la donnée pertinente et les dossiers existants. | Une information publiée a une URL stable, sa source et sa date ; une même actualité mise en avant alimente la Une sans copie concurrente. Contrôle après rechargement et après exécution du JavaScript. | I04 |
| I06 | Mettre en place ou réparer la planification et la supervision des sources : dernière exécution, dernière réussite, retard et erreur. Configurer des alertes internes exploitables. | Exécution autonome hors ChatGPT, incident simulé détecté, reprise sans doublon, source en erreur visible dans le suivi. Pas de message envoyé à des tiers dans ce lot. | I03–I05 |
| I07 | Préparer la diffusion à partir de la page CFO effectivement prête : angle, URL, visuel et signal de publication. | Passage traçable au plan Viraly V03 ; le transfert prépare la diffusion sans supposer une publication sociale automatique. | I05, V01–V02 |
| I08 | Refaire quotidiennement le rapprochement sources/CFO durant sept jours complets d'exploitation. Corriger les omissions et relever la cause des retards. | Bilan de couverture et délais, incidents résolus ou documentés ; preuve de ce que CFO apporte au lecteur. | I06–I07 |

## Qualification d'importance

Priorité haute : sortie ou annonce officielle, mise en vente ou modification importante de concert, changement majeur de programme, résultat ou certification officiellement confirmé. Les autres contenus sont qualifiés selon leur utilité pour le lectorat ; la multiplication de reprises d'un même fait ne crée pas plusieurs actualités.

La source originale est conservée ; Google News reste un outil de découverte. Les flux Actus et Agenda restent distincts. L'état de qualification doit empêcher la diffusion publique d'une information non vérifiée.

## Cibles initiales de recette

- Couvrir toutes les informations de priorité haute identifiées dans l'échantillon des sources accessibles ; expliciter toute omission.
- Cible de détection : moins de 30 minutes sur les sources prioritaires pour lesquelles une collecte automatisée de cette fréquence est réellement possible.
- Cible de publication d'un fait prioritaire vérifié : moins de deux heures après détection pendant les plages de qualification effectivement couvertes. Le suivi affiche ces plages ; aucune disponibilité humaine permanente n'est supposée.
- 100 % des informations publiques contrôlées ont une source identifiable et une date qualifiée.
- Prendre au moins dix faits distincts sur sept jours si disponibles ; sinon contrôler tous les faits disponibles et signaler la petite taille de l'échantillon.

Le budget, les limites d'accès et la fraîcheur de chaque source déterminent la fréquence effective ; ils sont consignés avant activation.

## Recette visible par le lecteur

Parcourir accueil, Actualités, article et agenda lié sur mobile et grand écran. Vérifier cohérence des titres et dates, source accessible, liens utiles, absence de doublon, absence de remplacement tardif par un ancien contenu et intelligibilité de l'information. Un visiteur doit comprendre ce qui vient de se produire, pourquoi c'est important et où approfondir.

## Première livraison attendue

Le registre des sources, le tableau des écarts et la correction du premier manque prioritaire réellement constaté. L'information choisie est vérifiée au moment de l'exécution ; aucun sujet ancien n'est arbitrairement présenté comme nouveau.
