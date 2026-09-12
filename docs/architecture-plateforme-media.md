# CFO — Architecture de plateforme média

## Principe directeur

CFO est le POC d'une plateforme média industrialisée, duplicable et multi-instance.

L'objectif n'est pas de dupliquer un site WordPress. L'objectif est d'instancier un modèle média sur un moteur commun.

## Ce qui reste commun

Le moteur et la data restent communs aux différentes instances :

- Supabase comme socle de données ;
- Supabase Storage comme médiathèque centrale ;
- référentiels et historiques partagés ;
- pipelines d'ingestion, d'enrichissement et de contrôle ;
- APIs et logique métier ;
- composants et modules fonctionnels ;
- mécanismes de publication ;
- automatisations ;
- code et règles techniques versionnés dans Git.

WordPress n'est pas la source primaire des données ou des médias. Il constitue principalement la couche de publication web, de composition éditoriale et de rendu.

## Ce qui est instanciable

Une instance média porte ce qui fait son identité propre :

- identité éditoriale ;
- sujet / entité éditoriale principale ;
- nom et domaine ;
- charte graphique et design tokens ;
- ligne éditoriale et tonalité ;
- rubriques et modules activés ;
- navigation et paramètres de présentation ;
- paramètres SEO et sociaux spécifiques.

## Modèle cible

### Media Platform

Moteur commun + data commune + médiathèque centrale + modules communs + système de publication commun.

### Media Instance

Configuration qui transforme la plateforme commune en un média identifiable et autonome pour le visiteur.

CFO / Chroniques d'une fille ordinaire constitue la première instance réelle du modèle.

## Règle d'architecture

Avant de développer un mécanisme spécifique à CFO, poser la question :

> Ce mécanisme doit-il appartenir au moteur commun ou à la configuration de l'instance ?

Un développement lié à l'identité éditoriale ou graphique doit, autant que possible, être paramétrable. Un développement de moteur ou de data doit rester commun et bénéficier à toutes les instances.

## Médiathèque

La médiathèque Supabase est un principe structurant de la plateforme, et non un contournement technique.

Chaîne cible :

1. création ou collecte du média ;
2. validation éditoriale humaine ;
3. stockage dans Supabase Storage ;
4. enregistrement des métadonnées structurées ;
5. consommation par l'instance média ;
6. publication et mise en page par WordPress ;
7. contrôles automatisés.

La médiathèque WordPress ne doit pas devenir la source primaire des médias de la plateforme lorsqu'un média peut être géré par le socle Supabase.

## Critère d'industrialisation

La création d'un deuxième média ne doit pas conduire à reconstruire CFO.

Elle doit conduire à créer une nouvelle Media Instance : configuration, identité éditoriale, charte graphique et périmètre de publication, tout en conservant le même moteur et le même socle de données.

Le travail humain doit se concentrer sur la création, l'arbitrage et la validation éditoriale. Les opérations techniques répétitives doivent être automatisées ou absorbées par la plateforme.
