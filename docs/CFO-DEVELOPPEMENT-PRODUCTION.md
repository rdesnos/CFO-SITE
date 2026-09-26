# CFO — Développement, implémentation et production

## Principe directeur

CFO dispose d'une chaîne de développement, d'implémentation et de production simple, maîtrisée et reproductible.

Aucun composant nécessaire au fonctionnement de CFO en production ne doit dépendre de ChatGPT, MCP, WPVibe ou WPCode. La production doit continuer à fonctionner de façon autonome si ces outils sont indisponibles.



## Finalité professionnelle de l'écosystème

CFO n'est pas seulement un média ni un terrain technique isolé. Il fait partie d'un **écosystème de démonstrateurs professionnels réels**, destiné à rendre visibles des compétences de niveau direction / architecture / transformation :

- conception d'un produit et d'une architecture cohérente ;
- gouvernance de la donnée et qualification des sources ;
- automatisation de bout en bout ;
- utilisation pragmatique de l'IA comme **intelligence aidante** ;
- contrôle éditorial humain et traçabilité ;
- conception d'interfaces métier et de restitutions lisibles ;
- industrialisation, versionnement, déploiement et exploitation ;
- capacité à articuler SI, Finance, Data, IA, métier et communication.

La valeur professionnelle du démonstrateur repose précisément sur le fait qu'il s'agit d'un **système réel, exploité, mesuré et amélioré**, et non d'une maquette.

La documentation, le code, les choix d'architecture et la chaîne de livraison doivent donc permettre d'expliquer non seulement **ce qui a été construit**, mais aussi **pourquoi**, **comment**, avec quelles contraintes, quels arbitrages et quels contrôles.

CFO contribue ainsi à la démonstration professionnelle globale portée par l'écosystème Regards SI / CFO / GUSTAVE-OPAAIA / Antoine Delmas : montrer une capacité à **savoir regarder autrement**, structurer un problème complexe et transformer une intention métier en système opérationnel.


## Sources de vérité

- **Supabase** : source de vérité Data et état opérationnel.
- **GitHub / CFO-SITE** : source de vérité du code, règles, migrations, Edge Functions, plugins, thème et documentation validés.
- **WordPress** : runtime du site public et de l'administration CFO.
- **Soundcharts** : fournisseur externe de données musicales.

## Outils qualifiés

| Outil | Rôle | Production | Autorité |
| --- | --- | --- | --- |
| Supabase | DB, RAW, référentiels, traitements, Cron, Edge Functions, Vault, API | Oui — cœur | Data |
| GitHub / CFO-SITE | Code, plugins, thème, SQL/migrations, Edge Functions, documentation | Oui | Code |
| WordPress | Site public + administration CFO | Oui | Présentation |
| Plugin CFO | Interface fonctionnelle CFO / Supabase | Oui | Application |
| Soundcharts | Acquisition externe | Oui | Fournisseur Data |
| Hostinger | Hébergement WordPress | Oui | Infrastructure |
| ChatGPT / OpenAI | Développement, analyse, tests, diagnostic | Non | Outil de développement |
| MCP Supabase | Développement/admin Supabase | Non | Outil de développement |
| WPVibe | Accès technique/diagnostic WordPress | Non | Outil de développement |
| WPCode | Aucun rôle cible CFO | Non | Hors chaîne CFO |
| Code Snippets | Aucun rôle cible CFO | Non | Hors chaîne CFO |

## Processus de développement

Besoin -> développement local -> tests locaux -> constitution d'un lot cohérent -> validation -> commit Git -> déploiement WordPress/Supabase -> contrôle production -> version validée.

Pour Supabase :

SQL / Edge Function -> test -> Git -> migration/déploiement Supabase -> validation -> exploitation autonome.

## Processus de production Data

Soundcharts -> Supabase Edge Functions -> RAW -> normalisation / qualification -> CORE -> FACTS -> MGP / Observatoire -> API Supabase -> Plugin CFO -> WordPress -> Public / Administration CFO.

## Orchestration autonome

Supabase Cron -> procédures / Edge Functions -> Vault -> Soundcharts -> Supabase.

**OpenAI n'est jamais middleware de production.**

## Discipline de déploiement

Aucun fichier PHP CFO ne doit être modifié directement en production.

Toute version de production doit posséder son équivalent exact dans CFO-SITE, avec numéro de version et commit de déploiement identifiable.

Chaîne cible : **PC local -> GitHub / CFO-SITE -> Hostinger / Supabase -> contrôle production**.

Hostinger est une cible de déploiement et d'exploitation, pas un atelier de développement incrémental. Les petites modifications et itérations doivent être travaillées et validées localement, puis regroupées avant publication.

Le principe CFO **« commit Git = publication »** doit être garanti par la chaîne technique et par l'alignement entre le code versionné et le code réellement déployé.

## Règle anti-bricolage

Un besoin fonctionnel ne conduit pas par défaut à l'installation d'un nouveau plugin ou d'un outil intermédiaire.

Toute nouvelle dépendance doit être explicitement qualifiée : rôle, nécessité, responsabilité, présence ou non en production, et conséquence de son indisponibilité.

Les outils de développement et d'administration ne deviennent pas des dépendances du runtime CFO.

## CFO Delivery V1

1. Inventaire exact Git / WordPress / Supabase.
2. Réalignement de Git sur les versions réellement validées en production.
3. Mécanisme unique de déploiement.
4. Contrôle automatique de la version déployée.
5. Reprise des développements fonctionnels, notamment Administration CFO, uniquement via cette chaîne.


## Architecture de travail validée le 26 septembre 2026

### Chaîne de référence

**PC local -> GitHub / CFO-SITE -> Hostinger**

Le poste local devient l'environnement principal de développement et de validation. La production Hostinger ne doit plus être sollicitée par une succession de petites écritures automatisées.

### Raison opérationnelle

Les sessions de développement de septembre 2026 ont mis en évidence des réponses **HTTP 429 Too Many Requests** lors d'une succession d'appels automatisés rapprochés vers WordPress/Hostinger.

La réponse retenue n'est pas de contourner cette limite, mais d'améliorer le processus de livraison :

- réduire les appels automatisés vers la production ;
- préparer les changements hors production ;
- regrouper les modifications ;
- effectuer un déploiement consolidé ;
- limiter les contrôles distants à un smoke test final ciblé.

### Environnement local cible

- Windows ;
- LocalWP pour WordPress local ;
- clone local du dépôt CFO-SITE ;
- thème et plugins CFO issus du dépôt Git ;
- configuration locale distincte de la production ;
- environnement Supabase de test lorsque possible ;
- accès aux données de production en lecture seule lorsque nécessaire à une validation réaliste.

### Règle de publication

Le principe **« commit Git = publication »** signifie désormais :

> un commit validé et intégré sur la branche de production représente un état cohérent, testé et publiable.

Il ne signifie pas que chaque essai ou micro-correction locale doit déclencher une publication.

### Place de WPVibe et WPCode

WPVibe reste utile pour :
- diagnostic ponctuel ;
- lecture ;
- validation post-déploiement ;
- intervention exceptionnelle.

WPCode reste un outil transitoire ou de diagnostic, mais ne doit pas constituer la chaîne de production CFO.

La cible est que le code fonctionnel CFO vive dans le dépôt Git, soit testable localement et soit déployé de façon reproductible.
