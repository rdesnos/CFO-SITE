# Optimisation des visuels CFO Marine — 3 octobre 2026

## Publié dans les contenus

Les dix dossiers Entre les lignes et la carte Tricheur de l’accueil utilisent des versions WebP de 960 pixels. Les dix images passent de 27 223 809 à 1 737 268 octets, soit une réduction de 93,6 %. Ce total additionne des fichiers de plusieurs pages ; ce n’est pas le poids d’une visite.

| Visuel | PNG original (Ko) | WebP 960 px (Ko) | Réduction |
|---|---:|---:|---:|
| À la maison | 2516.7 | 134.7 | 94.6 % |
| D’accord | 2692.4 | 172.4 | 93.6 % |
| Dalida | 2682.8 | 174.7 | 93.5 % |
| Des gens bien | 2621.0 | 163.2 | 93.8 % |
| Escroc | 2898.9 | 211.7 | 92.7 % |
| Gemme | 2712.3 | 178.4 | 93.4 % |
| Ma faute | 2571.9 | 145.9 | 94.3 % |
| Que ça dure | 2693.3 | 179.1 | 93.4 % |
| Restes d’averses | 2625.7 | 164.5 | 93.7 % |
| Tricheur | 3208.9 | 212.7 | 93.4 % |

## Médiathèque et tailles disponibles

32 fichiers optimisés sont enregistrés et vérifiés dans cfo-media et cfo_media_assets : trois versions pour chacune des dix illustrations (640, 960, taille originale), plus deux versions du portrait Marine (340 et 673 pixels). Chaque fichier public a été téléchargé et son SHA-256 comparé à la version locale.

Les dix illustrations en pleine taille passent de 27,22 à 4,00 Mo (−85,3 %). Les versions de 640 pixels totalisent 0,835 Mo. Le navigateur choisit désormais le fichier selon le srcset et la densité de l’écran.

Les originaux sont conservés. Les variantes WebP 960 sont référencées comme illustrations principales. Les données de livraison sont sauvegardées dans data/cfo-visual-delivery-2026-10-03.json ; WordPress lit leur projection via l’option cfo_visual_delivery.

Le portrait est compressé sans perte : 101 614 octets en 340 pixels et 394 970 octets en 673 pixels. Les pixels décodés ont été comparés aux pixels attendus. Les illustrations utilisent une compression WebP qualité 90 ; une comparaison visuelle a été réalisée.

## Thème publié et vérifié

Les modifications sont limitées à front-page.php, au chargement de cfo-visual-delivery.php dans functions.php et à ce nouveau module. Le module ajoute srcset et sizes au rendu WordPress ; ces attributs sont retirés lors de l’enregistrement des contenus par la voie utilisée.

Le HTML public de l’accueil a été vérifié après publication : portrait WebP avec srcset 340/673 et carte Tricheur avec srcset 640/960/1536. Le dossier À la maison sert également son WebP avec srcset et sizes. Aucun message d’erreur PHP n’a été détecté sur ces pages. Les règles CSS de mise en page ont été conservées.

Le thème a été publié le 3 octobre 2026 après autorisation explicite de l’utilisateur. Le portrait public et la sélection des tailles d’images sont actifs.

Une sauvegarde des onze contenus concernés et des métadonnées originales a été conservée séparément. Le mécanisme de publication du thème conserve également une sauvegarde du thème précédent.

## Vérification de vitesse

Une nouvelle mesure PageSpeed Insights mobile a été réalisée après publication le 3 octobre 2026.

| Mesure | Avant | Après |
|---|---:|---:|
| Performance mobile | 59/100 | 68/100 |
| LCP | 16,3 s | 7,3 s |
| FCP | 3,9 s | 3,0 s |
| TBT | 150 ms | 60 ms |
| CLS | 0 | 0 |

Le LCP mesuré diminue d’environ 55 %. Ce sont des mesures de laboratoire, variables selon les essais ; aucune donnée terrain CrUX n’est disponible. Le LCP reste trop élevé. L’audit indique encore 31 KiB de CSS inutilisé, 6 KiB de CSS à minifier et 74 KiB de JavaScript inutilisé. Ces points constituent la suite du travail sur la vitesse et ne sont pas modifiés dans cette intervention centrée sur les images.
