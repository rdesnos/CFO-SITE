# CFO MGP Visualisation

Plugin WordPress dédié à la **visualisation** du Modèle Gravitationnel Polarisé.

## Principe d'architecture

Le calcul MGP reste dans le plugin / pipeline MGP existant.

Ce plugin ne recalcule pas le modèle : il **lit les données disponibles** et les traduit en une représentation grand public.

- **Marine** : point fixe au centre.
- **Taille de Marine** : masse MGP globale.
- **Galaxies** : domaines de l'écosystème.
- **Astres** : objets internes à chaque galaxie.
- **Événements** : impulsions datées qui apparaissent séparément.
- **Temps** : curseur de lecture de l'évolution.

## Galaxies V1

- Musique
- Médias
- Artistes
- Live
- Réseaux
- Cinéma

Une galaxie sans donnée MGP fiable reste visible mais apparaît comme **non mesurée**.

## Shortcode

```
[cfo_mgp_visualisation]
```

## Sources V1

- WordPress REST : `/wp-json/cfo-mgp/v1/snapshot?artist=marine&days=365`
- Supabase Edge Function : `cfo-actu-feed`
- Supabase Edge Function : `cfo-salles-feed`

## Règle scientifique

La visualisation ne doit jamais inventer une masse ou une causalité.
Une donnée non couverte reste explicitement non mesurée.
