# CFO — À ses côtés

Plugin WordPress CFO pour présenter et agréger les publications des passionnés qui accompagnent Marine.

## Gabarit V1

Chaque présence comprend :
- nom du projet / compte ;
- personnes ou signature publique ;
- présentation éditoriale ;
- liens Instagram, TikTok, YouTube et X ;
- 10 dernières publications, tous réseaux connectés confondus.

## Pilote

**Les Carnets de bord — Cynthia & Géraldine**

## Affichage

Shortcode global : `[cfo_a_ses_cotes]`

Fiche spécifique : `[cfo_a_ses_cotes slug="les-carnets-de-bord"]`

## Contrat agrégateur

Le filtre WordPress `cfo_a_ses_cotes_posts` reçoit `(array $items, int $post_id, int $limit)` et doit retourner des éléments normalisés :

- `network`
- `url`
- `published_at`
- `text`
- `media_url`

Le plugin trie les éléments par `published_at` décroissant et limite le rendu à 10 publications. La couche Supabase / synchronisation RS alimentera ce contrat sans coupler le rendu aux APIs sociales.
