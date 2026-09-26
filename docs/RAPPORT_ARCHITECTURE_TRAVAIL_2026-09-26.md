# Rapport — Évolution de l’architecture de travail CFO et finalité professionnelle

Date : 26 septembre 2026

## 1. Objet du rapport

Ce document retrace la démarche qui a conduit à faire évoluer le mode de développement de CFO vers une architecture structurée :

**PC local → GitHub / CFO-SITE → Hostinger**

Cette évolution répond à deux objectifs principaux :

1. fiabiliser techniquement le développement, les tests et les déploiements ;
2. renforcer la valeur professionnelle de CFO comme démonstrateur réel de conception, d’architecture, de Data, d’IA, d’automatisation et d’industrialisation.

CFO doit être considéré comme un système réellement exploité, et non comme une maquette technique ou un simple site éditorial.

La monétisation éventuelle constitue un **bonus** : elle est bienvenue si elle découle naturellement de la valeur créée, mais elle ne doit pas devenir le moteur qui déforme l’architecture, l’éditorial ou la crédibilité du démonstrateur.

---

## 2. Finalité professionnelle de l’écosystème

L’objectif ultime de l’écosystème de démonstrateurs est sa **valorisation professionnelle**.

CFO, Regards SI, GUSTAVE / OPAAIA, Antoine Delmas et les autres briques ne doivent pas être présentés comme une juxtaposition de projets indépendants, mais comme des preuves concrètes d’une même capacité :

- comprendre un besoin complexe ;
- structurer une architecture cohérente ;
- articuler métier, SI, Finance, Data et IA ;
- industrialiser les flux ;
- construire des interfaces utiles ;
- automatiser sans perdre le contrôle ;
- gouverner les données ;
- déployer, exploiter et améliorer un système réel.

CFO apporte une preuve particulièrement forte parce que le dispositif fonctionne dans un environnement éditorial réel, avec des données réelles, des contraintes de qualité, une audience publique et un besoin de crédibilité.

La valeur professionnelle vient donc moins de la démonstration d’un outil isolé que de la capacité à concevoir et faire vivre **un système complet**.

---

## 3. Contexte initial

Le site CFO repose sur plusieurs couches :

- WordPress pour le rendu public et l’administration ;
- Supabase pour la donnée, les snapshots, les traitements et la logique analytique ;
- Soundcharts et d’autres sources pour l’acquisition ;
- des plugins CFO pour les fonctionnalités applicatives ;
- GitHub / CFO-SITE pour la documentation et le versionnement ;
- WPVibe et WPCode comme outils d’intervention et de diagnostic pendant la phase de construction.

Au fil des développements, de nombreuses petites corrections ont été réalisées directement sur la production WordPress.

Cette façon de travailler était rapide pour prototyper, mais a montré ses limites à mesure que CFO devenait un système plus complet.

---

## 4. La home comme démonstrateur Data + IA + éditorial

La finalisation de la home a mis en évidence un point structurant : les cartes de la home ne sont pas de simples widgets alimentés par des chiffres.

Elles constituent une démonstration concrète d’un pipeline éditorial augmenté :

**acquisition → qualification → calcul → détection de signaux → analyse → rédaction → contrôle humain → publication**

À partir de données qualifiées, le système doit pouvoir :

- détecter une évolution significative ;
- replacer cette évolution dans son contexte ;
- produire une analyse ;
- générer une proposition rédactionnelle adaptée ;
- soumettre cette proposition à une validation éditoriale humaine ;
- publier le contenu validé.

Exemple observé :

- streams de Tricheur en baisse ;
- airplay en hausse ;
- interprétation : déplacement de l’exposition de l’écoute vers la radio ;
- rédaction dynamique adaptée au signal.

L’intérêt du dispositif est précisément que **la donnée raconte une histoire sans qu’on lui fasse dire ce qu’elle ne dit pas**.

---

## 5. IA : intelligence aidante

Dans CFO, l’IA n’est pas conçue comme un substitut au jugement humain.

Elle est une **intelligence aidante**.

Son rôle est de :

- aider à lire les données ;
- détecter des signaux ;
- croiser les informations ;
- proposer une interprétation ;
- produire une première rédaction ;
- accélérer les traitements ;
- industrialiser certaines tâches répétitives.

Principe CFO :

> **La donnée éclaire. L’IA aide. L’humain décide.**

Cette approche est aussi une démonstration professionnelle : elle montre une utilisation pragmatique, utile et gouvernée de l’IA, loin d’une automatisation aveugle.

---

## 6. Contrôle éditorial humain

La crédibilité de CFO repose sur un contrôle éditorial humain explicite.

Le pipeline cible n’est pas :

**Data → IA → publication**

mais :

**Data qualifiée → signal → IA → proposition éditoriale → validation humaine → publication**

Le rôle humain porte notamment sur :

- la vérification factuelle ;
- la pertinence de l’interprétation ;
- le ton ;
- la contextualisation ;
- le choix de publier ou non.

Le workflow cible peut être représenté par les états :

- generated ;
- review_required ;
- approved ;
- rejected ;
- published.

La traçabilité cible doit conserver autant que possible :

- les données sources ;
- la période d’observation ;
- les règles ou signaux déclenchés ;
- la version du modèle ou du prompt ;
- le texte généré ;
- les modifications humaines ;
- le valideur ;
- la date de validation.

Ce mécanisme constitue une démonstration de **gouvernance de l’IA** autant qu’un mécanisme éditorial.

---

## 7. Automatisation : partie intégrante du concept

L’automatisation n’est pas une simple commodité technique.

Elle fait partie intégrante du produit et du démonstrateur.

Le pipeline cible est :

**acquisition automatisée → qualification → calcul → détection des signaux → analyse IA → rédaction IA → contrôle humain → publication → surveillance de fraîcheur et de qualité**

La valeur vient de la reproductibilité de cette chaîne.

Une donnée nouvelle peut ainsi :

- entrer dans le système ;
- être qualifiée ;
- mettre à jour les indicateurs ;
- déclencher un signal ;
- produire une analyse ;
- générer une proposition de contenu ;
- attendre une validation humaine ;
- être publiée.

Le système doit donc être capable de fonctionner comme une véritable chaîne éditoriale industrialisée.

---

## 8. Problème technique rencontré : HTTP 429

Pendant la finalisation de la home, les opérations de modification et de contrôle répétées via WordPress / WPVibe ont provoqué des réponses :

**HTTP 429 Too Many Requests**

Le problème n’était pas lié au modèle de données Supabase ni au contenu fonctionnel de CFO.

Le problème opérationnel était la fréquence d’appels automatisés rapprochés vers l’hébergement WordPress.

La séquence typique était :

1. modification ;
2. contrôle ;
3. nouvelle modification ;
4. nouvelle lecture ;
5. correction ;
6. nouvelle validation.

Ce fonctionnement transforme la production en environnement de développement interactif.

---

## 9. Enseignement tiré du 429

Le 429 n’est pas traité comme un simple incident à contourner.

Il révèle une mauvaise séparation des environnements.

La production ne doit pas être le lieu où l’on :

- expérimente ;
- affine progressivement le code ;
- teste plusieurs versions ;
- multiplie les petites écritures ;
- réalise des cycles d’essai-erreur.

La production doit recevoir **un état déjà travaillé, testé et validé**.

Le 429 devient donc un signal d’architecture de processus.

---

## 10. Architecture de travail retenue

Architecture validée :

**PC local → GitHub / CFO-SITE → Hostinger**

### PC local

Le poste local devient l’atelier de développement.

Il doit permettre :

- les modifications fréquentes ;
- les essais ;
- les tests visuels ;
- les tests fonctionnels ;
- les corrections successives ;
- la validation avant livraison.

### GitHub / CFO-SITE

Git devient la source de vérité du code et des décisions validées.

Le dépôt doit contenir :

- code CFO ;
- thème ;
- plugins ;
- SQL et migrations ;
- règles ;
- documentation ;
- scripts de déploiement ;
- références d’architecture ;
- historique des décisions.

### Hostinger

Hostinger devient avant tout :

- l’hébergement WordPress de production ;
- la cible du déploiement ;
- l’environnement de contrôle final.

Il ne doit plus être utilisé comme atelier de développement incrémental.

---

## 11. Environnement local cible

Le choix retenu est un WordPress local sur le poste Windows.

Solution privilégiée :

**LocalWP**

Raisons :

- démarrage rapide ;
- environnement WordPress complet ;
- gestion simple des sites locaux ;
- visualisation immédiate ;
- adapté au travail itératif sur CFO.

Le dépôt CFO-SITE est cloné localement et sert de référence pour les composants versionnés.

Les secrets et paramètres d’environnement ne doivent pas être stockés dans Git.

---

## 12. Nouvelle discipline de développement

Le processus cible devient :

1. expression du besoin ;
2. développement local ;
3. tests locaux ;
4. itérations locales ;
5. constitution d’un lot cohérent ;
6. validation ;
7. commit Git ;
8. déploiement consolidé ;
9. contrôle de production ;
10. rollback si nécessaire.

Principe :

> **on travaille hors production ; on publie un état cohérent.**

---

## 13. Évolution du principe « commit Git = publication »

La formule reste pertinente, mais doit être interprétée correctement.

Elle ne signifie pas :

> chaque petite modification = publication immédiate.

Elle signifie :

> un commit validé sur la branche de production représente un état cohérent, testé et publiable.

Le commit devient une **unité de livraison**.

Les essais et micro-corrections vivent en local tant qu’ils ne constituent pas un ensemble cohérent.

---

## 14. Place des outils distants

### WPVibe

WPVibe reste utile pour :

- diagnostic ;
- contrôle ponctuel ;
- vérification post-déploiement ;
- intervention exceptionnelle.

Il ne doit plus être l’outil principal d’édition répétitive en production.

### WPCode

WPCode doit être considéré comme un outil transitoire ou de diagnostic.

La cible est que le code fonctionnel CFO vive dans le dépôt Git et soit déployé de manière reproductible.

### ChatGPT / OpenAI

L’IA est un outil de conception, d’analyse, de développement et d’assistance éditoriale.

Elle ne doit pas devenir un middleware indispensable au runtime du site.

---

## 15. Sources de vérité

Architecture cible :

- **Supabase** : vérité Data ;
- **GitHub / CFO-SITE** : vérité code et documentation ;
- **WordPress local** : environnement de développement ;
- **WordPress Hostinger** : runtime production ;
- **Soundcharts** : fournisseur de données musicales ;
- **humain** : autorité éditoriale finale.

---

## 16. Valorisation professionnelle

La documentation du projet doit permettre de montrer :

### Architecture

Capacité à définir des frontières claires entre :

- données ;
- logique métier ;
- application ;
- présentation ;
- développement ;
- production.

### Data

Capacité à :

- acquérir ;
- normaliser ;
- qualifier ;
- historiser ;
- mesurer la fraîcheur ;
- construire des indicateurs ;
- produire des modèles exploitables.

### IA

Capacité à :

- utiliser l’IA de manière ciblée ;
- l’intégrer dans un pipeline ;
- contrôler ses entrées ;
- valider ses sorties ;
- conserver un contrôle humain ;
- assurer la traçabilité.

### Automatisation

Capacité à :

- industrialiser les flux ;
- orchestrer les traitements ;
- réduire les opérations manuelles ;
- assurer la répétabilité.

### Delivery

Capacité à :

- versionner ;
- tester ;
- déployer ;
- contrôler ;
- revenir en arrière ;
- gérer les contraintes d’infrastructure.

### Produit

Capacité à transformer une intention éditoriale et métier en un système effectivement exploitable.

---

## 17. Monétisation

La monétisation n’est pas la raison d’être première du démonstrateur.

La priorité est :

1. construire quelque chose de solide ;
2. démontrer une valeur professionnelle réelle ;
3. rendre cette valeur visible et explicable.

Cependant, si le système produit une valeur économique directe ou crée des opportunités de revenus, il n’y a aucune raison de les écarter.

La monétisation peut venir par exemple de :

- services autour de la Data ;
- prestations d’analyse ;
- produits éditoriaux ;
- licences ou déclinaisons des outils ;
- accompagnement professionnel ;
- partenariats ;
- réutilisation de briques dans d’autres verticales.

La règle retenue est donc :

> **la monétisation est un bonus à capter, pas une contrainte qui pilote le design.**

---

## 18. Prochaines étapes

### Étape 1 — Poste local

- installer LocalWP ;
- créer l’instance CFO locale ;
- cloner CFO-SITE ;
- récupérer thème et plugins ;
- définir les paramètres locaux.

### Étape 2 — Data

- définir l’accès Supabase local ;
- privilégier un environnement de test ;
- limiter l’accès production à la lecture lorsque possible ;
- conserver les secrets hors Git.

### Étape 3 — Delivery

- définir le format d’un lot de livraison ;
- automatiser ou simplifier le déploiement Hostinger ;
- associer chaque déploiement à un commit ;
- mettre en place un smoke test post-déploiement.

### Étape 4 — Home

- terminer localement le rendu serveur ;
- éliminer la dépendance fragile à une hydratation JavaScript critique ;
- intégrer les cartes IA dans le pipeline validé ;
- formaliser le contrôle éditorial humain.

### Étape 5 — Démonstrateur professionnel

- documenter les choix ;
- produire des schémas d’architecture ;
- illustrer les flux ;
- montrer les arbitrages ;
- rendre visibles les résultats ;
- relier CFO à l’écosystème professionnel global.

---

## 19. Conclusion

Le passage à une architecture **local → Git → production** n’est pas seulement une réponse technique au HTTP 429.

C’est une étape de maturité du projet.

CFO passe d’un mode de prototypage interactif directement sur la production à une logique d’ingénierie plus robuste :

**concevoir → tester → valider → versionner → déployer → contrôler**

Cette évolution renforce simultanément :

- la fiabilité ;
- la maintenabilité ;
- la traçabilité ;
- la sécurité ;
- la capacité de rollback ;
- la crédibilité technique ;
- la valeur professionnelle du démonstrateur.

Et si cette valeur peut en plus produire du chiffre d’affaires, ce sera un bonus parfaitement assumé.
