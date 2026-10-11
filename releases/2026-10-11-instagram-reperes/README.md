# Correction Instagram — prête à valider, non publiée

Base Git : main 53c6d7b, synchronisée avant préparation. Le code hydratant a été relu directement en production (WPCode 1047, CFO Home — Data Supabase). Le CSS provient du dernier thème brouillon cfo-wpvibe-draft, plus récent que le snapshot Git ; toutes ses autres règles sont préservées.

Supabase confirme Marine, Soundcharts, followers Instagram, observations non interpolées : 709 414 au 3 octobre 2026 et 709 719 au 10 octobre 2026. Le snapshot public marine utilise la même paire et comparison_valid=true. Calcul : (709719 / 709414 - 1) × 100 = 0,042993231032939505 %, affiché +0,04 %.

Changements : calcul dynamique du pourcentage uniquement dans la ligne Instagram de Repères ; valeur actuelle conservée depuis Supabase ; indicateur manquant/invalide affiché — ; suppression des deux règles forçant Instagram sur une troisième ligne ; taille Instagram adaptée uniquement sous 360 px pour garder le drapeau à droite. Les autres indicateurs et blocs ne sont pas modifiés.

Vérification dans le navigateur réel sur une copie locale de la dernière page brouillon, avec ses assets et la vraie API Supabase : hydratation live réussie ; toute la page avant/après possède exactement les mêmes textes sauf +305 · au 10 oct. → +0,04 %. À 1280 px et 390 px : drapeau Instagram à droite, ligne de grille 2, sans chevauchement. À 320 px : drapeau à droite, écart réel de 2,75 px entre chiffre et pourcentage, aucun chevauchement Instagram. Les chevauchements préexistants de Spotify/Catalogue à 320 px sont conservés pour respecter le périmètre. Captures et mesures : evidence/.

Aucune écriture WordPress ni Supabase, aucune publication. Git contient un correctif préparé, pas un déploiement automatique.

Après validation explicite : relire WPCode 1047 et le CSS cible afin de détecter toute modification concurrente ; appliquer uniquement les différences Instagram ci-dessus, sans publier ni écraser le thème brouillon complet. Le script est partagé avec la production : sa modification est une publication immédiate. Vérifier la présence en production du CSS commun des drapeaux avant d’en retirer l’exception Instagram. Purger le cache puis refaire les vérifications publiques desktop/mobile. Les fichiers complets prepared/ sont des références ; ne pas remplacer aveuglément les fichiers distants.
