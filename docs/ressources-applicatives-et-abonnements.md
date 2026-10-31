# CFO — Référentiel des ressources applicatives et abonnements

**Mise à jour : 31 octobre 2026.** Référentiel transversal demandé dans CFO-SITE, non limité au site CFO Marine.

## Règle d'exploitation
**Avant toute proposition de nouvel abonnement, vérifier cet inventaire, l'accès existant, les crédits/quotas, les droits d'usage et la possibilité d'intégration API.** Préférer la réutilisation des ressources, l'automatisation et la traçabilité. Ne pas confondre « compte connecté », « plan payant confirmé » et « service effectivement utilisable pour une tâche précise ».

## Solutions et ressources identifiées

| Ressource | Accès / formule connue | Usage envisagé ou effectif | Vérification et limites |
|---|---|---|---|
| **ChatGPT / OpenAI** | Environnement ChatGPT utilisé ; plan et quotas à revérifier dans la facturation | Management IA, conception, rédaction, analyse, orchestration ; outils de génération visuelle | Ne pas présumer de l'accès API OpenAI ou de crédits API séparés |
| **Codex** | Utilisé / disponible dans le flux de développement selon la conversation | Codage, automatisation Playwright, Remotion, FFmpeg, contrôle qualité | Accès aux sites et éventuelles restrictions d'environnement à tester |
| **GitHub** | Compte rdesnos connecté ; 26 dépôts relevés avant création de `rdesnos/rudyladit`, devenu 27e dépôt visible | Versionnement, sources, scripts, référentiels | Dépôt dédié pub : https://github.com/rdesnos/rudyladit ; repo CFO : https://github.com/rdesnos/CFO-SITE |
| **WordPress / WPVibe** | Connecteur opérationnel ; 19 sites recensés dans WPVibe le 31/10, dont certains en attente de confirmation | Gestion des sites, lecture HTML, médias, inspection des éléments graphiques | Disponibilité variable par site et autorisations ; pas de modification en production sans contrôle |
| **Hostinger** | Hébergement et domaines utilisés | Publication, WordPress, DNS, hébergement | Inventaire des factures, produits et dates de renouvellement à vérifier |
| **Supabase** | Plan Pro signalé dans les échanges ; facturation et statut du projet à revérifier | Bases, stockage média, fonctions, journaux API et cockpits | Des messages de paiement reçu **et** d'échec de paiement existent dans Gmail ; ne pas déclarer tous les projets en règle sans contrôle |
| **ElevenLabs** | **Creator**, constaté sur capture du 31/10 : **216 627 crédits restants** dans Rudy's Workspace, à cet instant | Voix, doublage, **Eleven Music v2.5**, musique pour vidéo | Musique visible dans l'application ; coût réel en crédits, licences commerciales et modalités API à vérifier avant exploitation |
| **Make** | **Make Pro** mentionné dans les échanges, à revérifier | Automatisation inter-applications | Vérifier scénarios, quotas, comptes et secrets disponibles |
| **Soundcharts** | Service utilisé, enveloppe d'appels réduite dans les travaux précédents de 500 k à 10 k | Data artistes, airplay, streaming, contrôle de cohérence | État de l'abonnement et quotas actuels à revérifier ; aucune donnée chiffrée codée en dur |
| **Windsor.ai** | Connecté pour les métriques SEO/marketing ; accès mis en place fin octobre | Search Console, analytics, données de référencement | Droits, sources et périmètre de facturation à vérifier |
| **Viraly** | Outil/connexion identifié dans l'écosystème | Diffusion et analyses sur les réseaux sociaux | Statut d'abonnement, capacités et quotas à vérifier |
| **Vercel** | Connecteur / capacités de déploiement disponibles | Sites et applications, build/déploiements | Offre facturée et projets à confirmer |
| **Gmail / Google Drive** | Connecteurs disponibles | Retrouver factures, dossiers, ressources et décisions | Ne pas interpréter un reçu historique comme preuve d'abonnement actif |
| **GitHub + WP + Supabase + outils vidéo** | Ensemble combinable | Pipeline film : vraies captures -> montage -> audio -> MP4 -> versionnement | Séparer environnement de production et sites live |

## Projet prioritaire : film Rudy l’a dit
- Référentiel : https://github.com/rdesnos/rudyladit
- Publicité cinéma de 40 s : vraies interfaces des écosystèmes, montage continu, non diaporama.
- Identité : deux SVG **distincts** dans ce dépôt : logo historique WordPress et variante vidéo ; ne pas modifier le site pour une animation.
- Musique souhaitée (originale) :
  - 00–08 s : piano acoustique mélodique, expressif, exigeant ;
  - 08–16 s : violons ;
  - 16–24 s : violoncelle et contrebasse **pizzicato** ;
  - 24–26 s : silence total ;
  - 26–31 s : batterie seule ;
  - 31–40 s : ensemble + guitare électrique, climax.
- Le rendu synthétique basique a été rejeté : privilégier Eleven Music déjà accessible avant de payer un autre outil.
- Test musical : valider d'abord les **8 premières secondes de piano réaliste** avant l'orchestration. Ne pas présumer du prix en crédits sans vérifier.

## Gouvernance du catalogue
Chaque intégration devrait documenter : fournisseur ; produit et compte/workspace ; formule confirmée ou non ; coût et échéance si vérifiés ; crédit/quotas avec date ; usage et projets ; capacités API ; documentation ; clé stockée **uniquement** dans gestionnaire de secrets ; responsable ; décision « réutiliser, consolider, résilier, vérifier ».

### Points ouverts
1. Vérifier dans les interfaces de facturation les tarifs, renouvellements et paiements actuels (ne pas déduire des seuls emails).
2. Auditer les quotas des outils et les fonctionnalités réellement incluses avant de recommander une dépense.
3. Vérifier l'éligibilité Eleven Music API, ses crédits et droits commerciaux dans le plan Creator utilisé.
4. Maintenir le catalogue à jour et le relier aux dépôts/projets.

## Confidentialité
Aucune clé API, jeton, identifiant secret, donnée bancaire ou contenu personnel de facture ne doit figurer dans ce dépôt. Les détails de paiement restent dans les systèmes sécurisés.
