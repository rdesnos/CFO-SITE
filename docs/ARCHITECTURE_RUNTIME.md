# CFO — Règle d'architecture runtime

Date de validation : 18 septembre 2026

## Principe directeur

**Supabase est la plateforme centrale d'exécution et le middleware de production de CFO.**

OpenAI est utilisé pour le développement, le test, l'analyse, l'assistance et les arbitrages, mais **ne doit jamais être un composant requis du runtime de production**.

## Architecture cible

### Production

```
Supabase Cron / Edge Functions
        ↓
     Soundcharts
        ↓
   RAW Supabase
        ↓
Normalisation / qualification
        ↓
 Référentiel CFO
        ↓
 Cockpit / site / API CFO
```

Les traitements de production doivent continuer à fonctionner si OpenAI, ChatGPT ou le MCP sont indisponibles.

### Développement et test

```
OpenAI / ChatGPT
        ↕
   MCP Supabase
        ↕
     Supabase
```

Le MCP Supabase sert à développer, tester, inspecter, diagnostiquer et administrer la plateforme. Il n'est pas le middleware d'exécution de production.

## Règles obligatoires

1. Les clés et secrets Soundcharts restent dans Supabase Vault ou dans les secrets des Edge Functions.
2. Les appels Soundcharts de production sont exécutés côté Supabase.
3. Les réponses brutes sont persistées dans Supabase avant normalisation.
4. Les traitements batch doivent être autonomes, reprenables, journalisés et indépendants d'une session ChatGPT.
5. Les états d'exécution, erreurs, quotas et retries sont persistés côté Supabase.
6. OpenAI peut analyser les anomalies, proposer des corrections et aider aux arbitrages métier.
7. Aucun flux critique de production ne doit nécessiter un appel OpenAI pour continuer.
8. Le remplacement d'OpenAI ou du modèle IA ne doit pas remettre en cause le pipeline de données CFO.
9. Git reste la source de vérité du code, des règles et des versions de référence.
10. Supabase reste la source de vérité opérationnelle des données et des états d'exécution.

## Conséquence pour Soundcharts

Le flux cible est :

```
Supabase → Soundcharts → stockage RAW → extraction des identifiants
→ normalisation → qualification automatique → file d'anomalies
```

OpenAI intervient uniquement sur la file d'anomalies ou pour le développement et le test du pipeline.
