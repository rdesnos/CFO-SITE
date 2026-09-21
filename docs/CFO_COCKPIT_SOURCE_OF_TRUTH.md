# CFO Cockpit / Observatoire — Source de vérité

Dernière consolidation : 21 septembre 2026.

## 1. Objet

Ce document est la mémoire opérationnelle du chantier Cockpit CFO / Observatoire CFO. Il doit être relu avant toute modification du Cockpit Marine et mis à jour après toute décision validée.

Objectif : éviter toute dérive conversationnelle, toute réinvention de décisions déjà prises et tout "syndrome poisson rouge".

## 2. Cible figée

Le Cockpit Marine doit être construit selon la formule :

**Marine Hebdo × charte CFO**

Trois références sont figées :

1. **Charte visuelle** : le site CFO actuel — crème, bleu profond, rouge brique, typographie éditoriale, respiration magazine, portrait / traitement illustré. Pas d'esthétique SaaS générique.
2. **Composition** : la maquette CFO validée et versionnée dans Git. Ne pas réinventer une nouvelle architecture de dashboard.
3. **Contenu fonctionnel** : le Marine Hebdo historique du 14/02/2026 au 20/02/2026 sert de référence exhaustive des indicateurs. Aucun indicateur utile ne doit disparaître lors du passage aux vraies données.

Principe de travail : **on remplace le snapshot par de vraies données sans réduire le périmètre fonctionnel**.

## 3. Indicateurs indispensables du Marine Hebdo

Le premier onglet Marine doit conserver au minimum :

- audiences / followers ;
- évolution des auditeurs Spotify ;
- villes / géographie Spotify quand la métrique existe réellement ;
- réseaux sociaux ;
- singles principaux avec cumul, S-1, S, tendance, MM7, MM14, MM30 ;
- catalogue standard ;
- Deluxe ;
- actualité singles ;
- album / projet principal ;
- classements ;
- certifications et projections ;
- EP Live Session ;
- écoute globale Spotify / catalogue qualifié ;
- Airplay Marine global ;
- Airplay par titre avec top radios.

Aucun de ces blocs ne doit être supprimé au motif de "simplifier".

## 4. Actualité singles — règle prioritaire

Le Cockpit doit montrer l'actualité avant le fonds de catalogue.

Au 18/09/2026 :

### Tricheur
- sortie : 04/09/2026
- ISRC : FRZ052600440
- Spotify cumul : 429 252
- semaine : 215 654
- MM7 : 30 808
- Airplay semaine 12–18/09 : 627
- Airplay S-1 : 66
- Top radios : Flor FM 60 ; Lor'FM 24 ; H2O Annecy 21 ; Vibration 20 ; Horizon 18

**Tricheur doit être le single d'actualité n°1 et ne doit jamais être relégué dans un petit bloc secondaire.**

Autres singles 2026 à suivre :
- On m'avait dit — 01/05/2026 — cumul Spotify 1 571 318 ; S 48 925 ; MM7 6 989
- Princesse chaos (Marine's Version) — 11/06/2026 — cumul Spotify 951 473 ; S 58 150 ; MM7 8 307

## 5. Données Marine réelles validées — photographie actuelle

Source : Supabase CFO / acquisition Soundcharts. Données arrêtées au 18/09/2026 sauf mention contraire.

### Audiences / plateformes
- Spotify auditeurs mensuels : 948 028 au 16/09
- Spotify followers : 184 798 au 16/09
- Instagram followers : 705 554 au 15/09
- TikTok followers : 311 600 au 15/09
- TikTok likes : 5 200 000
- YouTube abonnés : 114 000 au 16/09
- YouTube vues totales : 52 254 325 au 16/09
- YouTube vues/jour : 83 631 au 12/09
- Deezer followers : 151 707 au 16/09
- Facebook followers : 26 081 au 15/09

### Catalogue Spotify qualifié
- 32 enregistrements qualifiés
- cumul : 118 003 216
- semaine : 1 106 581
- S-1 : 946 189
- MM7 : 158 083
- MM14 : 131 223
- MM30 : 137 015
- tendance semaine vs S-1 : +17,0 %

### Titres principaux
Cœur maladroit :
- cumul 25 275 338
- S-1 105 445
- S 103 869
- tendance -1,5 %
- MM7 14 838 ; MM14 14 951 ; MM30 18 698

Ma faute :
- cumul 48 868 849
- S-1 282 655
- S 277 437
- tendance -1,8 %
- MM7 39 634 ; MM14 40 007 ; MM30 40 238

Restes d'averses :
- cumul 10 596 209
- S-1 80 618
- S 73 214
- tendance -9,2 %
- MM7 10 459 ; MM14 10 988 ; MM30 13 260

Escroc :
- cumul 4 912 662
- S-1 98 811
- S 97 967
- tendance -0,9 %
- MM7 13 995 ; MM14 14 056 ; MM30 13 939

### Airplay
Marine global, semaine 12–18/09/2026 :
- S : 1 852 passages
- S-1 : 1 932
- évolution : -4,1 %

Top radios Marine :
- Europe 2 Nouvelle Scène 143
- Flor FM 109
- H2O Annecy 52
- Radio Arc en Ciel 43
- Tendance Ouest 39

Par titres :
- Tricheur : 627
- Escroc : 547
- Cœur maladroit : 245
- Ma faute : 180
- Restes d'averses : 14

### Certification vérifiée
Ma faute :
- niveau : Diamant
- date officielle : 04/12/2025
- seuil : 50 M équivalents streams France
- 5/5 enregistrements vérifiés
- readiness : ready

## 6. Règles de périmètre Marine / déduplication

Ma faute :
- 27/05/2022 — QZES52563758 — inclure
- 28/05/2022 — TCAGF2260833 — pool partagé / dédupliqué, ne pas doubler dans les métriques
- 21/01/2025 — FRZ052500048 — inclure
- Star Academy du 13/02/2025 — exclure du périmètre certifiable
- Démo 2022 — alias / dédupliquer
- Live Session Artistic Palace — inclure
- NMA Live — inclure

Objets abusifs exclus :
- Slowly ft. Marine
- Brody II feat. Marine
- Sine Qua Non

Le calcul CFO doit utiliser `acquisition.v_soundcharts_track_scope` et respecter `include_in_cfo_metrics`.

## 7. Architecture WordPress actuelle

Preview de travail :
- URL : /observatoire-cfo-v1-preview/
- page WordPress : ID 971
- la page 971 contient uniquement : `[cfo_cockpit_marine]`

Shortcode :
- WPCode snippet 1009
- titre : "CFO Cockpit Marine - shortcode propre"
- actif
- il retourne le contenu du post 1007
- raison : sortir le HTML du `post_content` de la page 971 et éviter les artefacts `wpautop`

HTML du Cockpit :
- post 1007
- source de rendu du shortcode

CSS :
- WPCode snippet 1008
- titre : "CFO Cockpit Preview CSS"
- actif
- attention : WPCode sert sa propre copie depuis l'option `wpcode_snippets`
- après modification du `post_content` 1008, synchroniser aussi `wpcode_snippets.site_wide_header[0].code`
- sinon WordPress peut continuer à servir un ancien CSS

Snippet 1010 :
- "CFO Cockpit Marine — HTML"
- créé pendant les essais
- inutile pour l'architecture retenue ; ne pas le prendre comme référence

Le problème `wpautop` a été corrigé. Ne pas revenir à du gros HTML directement dans la page 971.

## 8. Largeur / template

Le thème CFO bridait la page via :
- `.cfo-page-shell`
- `.cfo-page`
- `.cfo-page-content`

Sur la page 971 uniquement, ces contraintes sont neutralisées. Le Cockpit est centré avec une largeur utile maximale de 1320 px.

Ne pas supprimer ce correctif.

## 9. Production vs preview

Ne pas écraser la production pendant la reconstruction.

À préserver :
- branche/plugin fonctionnel Observatoire 1.5.x
- V0 / maquette figée comme référence UX/UI
- preview 971 comme zone de reconstruction

La production /observatoire-cfo/ ne doit être reconnectée qu'après validation de la version Marine.

## 10. API / dynamique

L'endpoint WordPress existant `/wp-json/cfo-observatoire/v1/data` renvoie actuellement 502.

Conséquence actuelle :
- la preview utilise une photographie réelle calculée directement depuis Supabase ;
- elle ne doit pas être présentée comme dynamique tant que l'endpoint n'est pas réparé ;
- la prochaine étape technique après validation UX est de reconnecter le rendu aux vues Supabase fiables sans changer la composition.

## 11. Règles de production

- Tout ce qui constitue une version de référence doit être dans Git.
- Commit = publication / point de référence.
- Vérifier le DOM et le CSS réellement servis avant de donner un lien.
- Ne pas annoncer "corrigé" sur la seule base de la donnée en base : vérifier le rendu public.
- Ne jamais mélanger des périodes sans les qualifier.
- Ne jamais fabriquer une série temporelle avec 2 ou 3 points sans le dire.
- Ne jamais remplacer une métrique historique par une métrique différente sous le même libellé.
- Ne jamais supprimer un indicateur validé pour alléger la page sans décision explicite.
- La forme est aussi importante que le fond.

## 12. Règle de continuité

Avant toute intervention sur le Cockpit CFO :
1. relire ce fichier ;
2. vérifier l'état WordPress/Supabase réel ;
3. agir à partir de l'état existant ;
4. ne pas redemander au pilote de rappeler une décision déjà inscrite ici ;
5. mettre ce fichier à jour après toute nouvelle décision structurante.

Ce document est la mémoire opérationnelle du chantier, pas une simple note.
