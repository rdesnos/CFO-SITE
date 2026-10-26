# CFO Marine — Mise à la une du 26 octobre 2026

## Demande et résultat

Rudy Desnos a demandé la mise à la une de l’article validé « Marine : ce qui brûlait déjà ».

- Article : https://chroniques-fille-ordinaire.com/marine-ce-qui-brulait-deja/
- Page WordPress : 3277 ; accueil : 48.
- Sélection : `cfo.editorial_placements`, `home.a_la_une`, ID `a1a4fcb3-1ca2-47f3-9365-6006465632bf`.
- Référence éditoriale : `cfo_news_items`, ID `24a36c02-9d9f-4b34-9bdd-d07adf4cc7b4`, analyse originale CFO, lien vers la page WordPress. Le corps de l’article reste dans WordPress.
- Visuel : aperçu de partage CFO existant dans la médiathèque Supabase, asset `351eb9d0-d027-4513-bfa6-bfdbee7b37d6`. Aucun nouveau visuel de dossier généré.

## Données appliquées

```sql
WITH article AS (
 INSERT INTO public.cfo_news_items
 (artist_slug,canonical_url,source_name,source_domain,source_title,published_at,category,cfo_summary,image_url,status,is_primary_source,is_official_source,content_type,metadata)
 VALUES ('marine','https://chroniques-fille-ordinaire.com/marine-ce-qui-brulait-deja/','CFO — Entre les lignes','chroniques-fille-ordinaire.com','Marine : ce qui brûlait déjà','2026-10-26T11:50:27Z','musique',$text$Dans « Si j’essaie pas », les mots du prochain album sont déjà là. Une lecture sensible de cette passerelle entre le doute, la vie intérieure et le courage d’oser.$text$,'https://fjpcuxsezeuajhlotzij.supabase.co/storage/v1/object/public/cfo-media/social/2026/10/cfo-marine-social-124cb732.jpg','validated',true,false,'editorial_analysis','{"wp_id":3277,"wp_type":"page","rubrique":"entre-les-lignes","editorial_validation":"Rudy Desnos, 26 octobre 2026","content_origin":"CFO original analysis"}'::jsonb)
 ON CONFLICT (canonical_url) DO UPDATE SET source_title=EXCLUDED.source_title,cfo_summary=EXCLUDED.cfo_summary,image_url=EXCLUDED.image_url,status=EXCLUDED.status,metadata=public.cfo_news_items.metadata || EXCLUDED.metadata,updated_at=now()
 RETURNING id
)
UPDATE cfo.editorial_placements
SET content_id=(SELECT id FROM article),
 headline_override='Marine : ce qui brûlait déjà',
 summary_override=$text$Dans « Si j’essaie pas », les mots du prochain album sont déjà là. Une lecture sensible de cette passerelle entre le doute, la vie intérieure et le courage d’oser.$text$,
 image_url_override='https://fjpcuxsezeuajhlotzij.supabase.co/storage/v1/object/public/cfo-media/social/2026/10/cfo-marine-social-124cb732.jpg',
 cta_label='Lire l’article →',
 cta_url='https://chroniques-fille-ordinaire.com/marine-ce-qui-brulait-deja/',
 metadata=(metadata - 'fix' - 'wp_tag') || '{"wp_id":3277,"wp_type":"page","rubrique":"entre-les-lignes","editorial_reason":"mise à la une demandée par Rudy Desnos le 26 octobre 2026"}'::jsonb,
 updated_at=now()
WHERE id='a1a4fcb3-1ca2-47f3-9365-6006465632bf'
 AND artist_slug='marine' AND placement_key='home.a_la_une' AND active
RETURNING id,content_id,headline_override,summary_override,image_url_override,cta_url;
```

## Modifications ciblées de l’accueil

Six remplacements match-once de la page 48 : visuel, titre, résumé, bouton principal, bouton secondaire, source.

```json
[
  {
    "before": "<div class=\"cfo-weekly-visual cfo-weekly-nma\"><img src=\"/wp-content/uploads/2026/09/NRJ-Music-Awards-2026-—-visuel-NRJ.jpg\" alt=\"Logo officiel NRJ Music Awards 2026\"></div>",
    "after": "<div class=\"cfo-weekly-visual\"><img src=\"https://fjpcuxsezeuajhlotzij.supabase.co/storage/v1/object/public/cfo-media/social/2026/10/cfo-marine-social-124cb732.jpg\" alt=\"Chroniques d’une fille ordinaire — une lecture de l’œuvre de Marine\"></div>"
  },
  {
    "before": "<h3>Marine remporte le NRJ Music Award 2026 de l’Artiste Féminine Francophone</h3>",
    "after": "<h3>Marine : ce qui brûlait déjà</h3>"
  },
  {
    "before": "<p>Le 23 octobre à Cannes, Marine a remporté le trophée d’<strong>Artiste Féminine Francophone</strong> aux NRJ Music Awards 2026. Après le prix de Révélation Féminine Francophone en 2025, cette deuxième récompense consécutive marque une nouvelle étape de son parcours.</p>",
    "after": "<p>Dans « Si j’essaie pas », les mots du prochain album sont déjà là. Une lecture sensible de cette passerelle entre le doute, la vie intérieure et le courage d’oser.</p>"
  },
  {
    "before": "<a class=\"primary\" href=\"https://www.nrj.fr/music-awards/actualites/cest-incroyable-marine-confirme-avec-le-trophee-dartiste-feminine-francophone-71367251\" target=\"_blank\" rel=\"noopener noreferrer\">Lire l’annonce de NRJ ↗</a>",
    "after": "<a class=\"primary\" href=\"https://chroniques-fille-ordinaire.com/marine-ce-qui-brulait-deja/\">Lire l’article →</a>"
  },
  {
    "before": "<a class=\"secondary\" href=\"/actualites/\">Suivre l’actualité →</a>",
    "after": "<a class=\"secondary\" href=\"/entre-les-lignes/\">Entre les lignes →</a>"
  },
  {
    "before": "<small class=\"cfo-weekly-source\">Source : <a href=\"https://www.nrj.fr/music-awards/actualites/cest-incroyable-marine-confirme-avec-le-trophee-dartiste-feminine-francophone-71367251\" target=\"_blank\" rel=\"noopener noreferrer\">NRJ Music Awards 2026</a></small>",
    "after": "<small class=\"cfo-weekly-source\">Source : <a href=\"https://chroniques-fille-ordinaire.com/marine-ce-qui-brulait-deja/\">CFO — Entre les lignes</a></small>"
  }
]
```

## Vérification

- Les six remplacements ont chacun modifié exactement une occurrence.
- Le rendu public de `.cfo-weekly-lead` affiche le titre, le résumé et le lien direct vers l’article.
- `cfo_home_snapshot.payload.featured_news` renvoie le même titre, le même visuel et le même lien. La sélection est donc cohérente avec la source utilisée par l’hydratation dynamique.
- Le visuel Supabase répond et a été inspecté : aperçu CFO avec portrait dessiné et identité du média.
- Le contrôle complémentaire par Playwright local n’a pas pu être lancé : binaire Chromium absent. Aucun résultat desktop/mobile par navigateur local n’est revendiqué.

## État précédent

La sélection pointait vers la victoire aux NMA (news `eec38e36-285a-4397-b09a-8a3c00326d9e`, page 3097). L’article de victoire demeure publié ; seule la sélection de une change. La correction précédente et ses valeurs sont documentées dans `ops/2026-10-25-home-featured-news-fix.sql`.
