# Observatoire des salles — production 25/09/2026

## État
- 30 dates suivies, d’octobre 2026 à mars 2027.
- Avignon (10/12/2026) et Monaco (13/02/2027) ajoutés au référentiel.
- Correction des dates de Mons (15–16/10) et Lille (26/03).
- Billetteries d’achat ajoutées quand une vente est documentée.
- Prix indicatifs et capacités documentées quand les sources le permettent.
- Longjumeau (08/10) marqué COMPLET sur la base du relevé de billetterie.
- Châlons-en-Champagne (20/11) marqué BIENTÔT lorsque la vente n’est pas encore ouverte.

## Architecture
WordPress utilise `page-observatoire-des-salles.php`, rendu côté serveur depuis l’Edge Function `cfo-salles-feed`.
Supabase conserve les statuts dans `cfo.venue_ticket_status`.

## Fraîcheur
`cfo-salles-refresh` contrôle les URL sources 4 fois par jour.
Un contrôle HTTP réussi actualise `checked_at`. Un blocage 403/timeout n’écrase pas la dernière date vérifiée.
Le monitor ne modifie plus automatiquement le statut métier à partir de mots génériques présents sur une page ; il vérifie la joignabilité/fraîcheur, tandis que le statut reste issu d’un relevé documenté.

## Cadence
05:10, 11:10, 17:10 et 22:10 UTC chaque jour.

## Publication
Rendu public contrôlé après publication sur :
https://chroniques-fille-ordinaire.com/en-coulisses/observatoire-des-salles/
