# WordPress — gestion de configuration CFO

Ce répertoire documente l’état de production WordPress associé à la baseline CFO V1.

## Périmètre à versionner

Le dépôt doit contenir à terme :

1. le code source des plugins spécifiques CFO ;
2. les composants MGP spécifiques ;
3. les migrations / schémas de données nécessaires ;
4. la documentation des endpoints et intégrations ;
5. les paramètres fonctionnels non secrets nécessaires à la reconstruction ;
6. l’architecture éditoriale et les décisions figées.

## Ne jamais versionner

- mots de passe ;
- clés API ;
- tokens ;
- secrets Supabase ;
- identifiants WordPress ;
- exports contenant des données personnelles ;
- fichiers de cache ou sauvegardes brutes contenant des secrets.

## Règle de changement

Une évolution significative de production doit correspondre à un commit identifiable. Les versions figées doivent être documentées avant l’ouverture du chantier suivant.

## Baseline actuelle

`site-inventory-v1.md` décrit l’environnement de production observé au moment de la création de la V1.
