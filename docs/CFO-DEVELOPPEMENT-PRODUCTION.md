# CFO — Développement, implémentation et production

## Principe directeur

CFO dispose d'une chaîne de développement, d'implémentation et de production simple, maîtrisée et reproductible.

Aucun composant nécessaire au fonctionnement de CFO en production ne doit dépendre de ChatGPT, MCP, WPVibe ou WPCode. La production doit continuer à fonctionner de façon autonome si ces outils sont indisponibles.

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

Besoin -> développement dans CFO-SITE -> tests -> commit Git -> déploiement WordPress/Supabase -> contrôle production -> version validée.

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

Chaîne cible : **développement -> Git -> déploiement -> contrôle production**.

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
