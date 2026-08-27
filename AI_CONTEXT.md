# CFO — AI Context

Derniere mise a jour : 27 aout 2026

## Objet

Ce fichier est la memoire de reprise rapide du projet CFO. Il complete la documentation detaillee de `docs/` et doit permettre de reprendre le chantier dans une nouvelle session sans reconstruire le contexte.

## Nomenclature structurante

**CFO est le nom du projet et du socle commun.**

Chaque declinaison consacree a un artiste est une instance CFO nommee selon la convention : `CFO_<artiste>`.

Exemples :
- `CFO_Marine` : instance actuelle, POC de reference.
- `CFO_Julien_Lieb` : prochain POC envisage apres finalisation de CFO_Marine.

Cette convention doit etre utilisee autant que possible dans Git, Supabase, plugins, documentation et futurs environnements afin de distinguer clairement le socle CFO d'une instance artiste.

Le chantier actuel reste exclusivement CFO_Marine. Ne pas lancer ni melanger le prochain POC avant stabilisation du POC actuel.

## POC actuel

CFO_Marine est le POC en cours et la priorite absolue. Il correspond au media libre, independant et non officiel consacre a Marine.

Ne pas transformer le chantier actuel en plateforme multi-artistes. Une plateforme editoriale multicanale generique pourra constituer un projet distinct apres stabilisation de CFO_Marine et retour d'experience des POC.

## Priorite actuelle

1. Finaliser CFO Theme, theme WordPress proprietaire et leger.
2. Stabiliser CFO Actus.
3. Stabiliser CFO Agenda.
4. Integrer la Timeline.
5. Controler l'ensemble desktop/mobile et publier apres validation.

MH Magazine reste le rollback tant que CFO Theme n'est pas valide et publie.

## Architecture du POC

- WordPress : publication et experience Web.
- CFO Theme : presentation uniquement, sans logique metier strategique.
- Plugins CFO : fonctionnalites du site.
- Supabase : couche de donnees de reference pour Actus/Agenda et les donnees structurees CFO.
- GitHub : documentation durable, historique des decisions et code versionne.

## CFO Actus — decisions figees

CFO doit etre un agregateur de news originales, pas un agregateur d'agregateurs.

Hierarchie des sources :
- Platinum : canaux officiels de Marine.
- Gold : environnement professionnel de Marine (management, label/editeur, maison de disques, agence acting, etc.).
- Silver : toute source admissible qui n'est ni Platinum, ni Gold, ni blacklistee. Google News sert de radar primaire mais la source Web originale doit etre conservee et affichee.
- Blacklist : source exclue.

Le lien public d'une actu doit pointer vers la source Web originale (`canonical_url`), jamais vers Google News lorsqu'une source originale est disponible.

Statuts publics : seules les actus validees/publiees sont exposees. Les doublons, sources blacklistees/inactives et entrees sans URL source sont exclus.

Dates : `published_at` est la date editoriale lorsqu'elle est disponible ; sinon `detected_at` sert de fallback. Pour le backfill initial, les dates historiques peuvent etre corrigees manuellement/semi-manuellement.

Visuels, ordre de fallback :
1. image originale de l'article ;
2. snapshot de la page source ;
3. logo du media source ;
4. visuel fallback de la source ;
5. placeholder CFO.

Les logos medias doivent etre stockes au niveau de la source, pas dupliquer par actualite.

## CFO Agenda

Agenda et Actus sont deux pipelines distincts, meme s'ils peuvent etre relies editorialement. Ne jamais injecter automatiquement des resultats Actus dans les evenements Agenda sans qualification.

Design souhaite : inspiration Outlook, vues hebdomadaire, mensuelle et trimestrielle ; distinction evenement ponctuel / evenement multi-jours ; rendu visuel coherent avec CFO ; Timeline partagee avec l'univers Actus.

## CFO Theme

CFO Theme doit donner l'impression d'un vrai media specialise dans le suivi d'une artiste, pas d'un assemblage de plugins WordPress ni d'un fan-site.

Principes : sobre, premium, rapide, mobile-first, typographie editoriale forte, photographie valorisee, information prioritaire sur les effets graphiques.

Le theme affiche ; il ne doit pas contenir la logique metier des collectes, qualifications ou donnees.

Le site CFO lui-meme n'a pas vocation a etre monetise agressivement. La strategie future est de monetiser les outils et savoir-faire CFO, mais ce sujet appartient au projet suivant et ne doit pas distraire la finalisation du POC.

## Regle de travail

Le POC CFO_Marine doit etre **stable et reproductible**.

Avancer une priorite a la fois et valider sur le rendu reel. Une modification de base de donnees ou de back-office n'est pas consideree comme terminee tant que le comportement public n'a pas ete controle.

Ne pas annoncer qu'une correction est en production sans verification effective du rendu public.

Chaque composant important doit tendre vers trois proprietes : installable, testable, restaurable.

## Documentation existante

- `README.md` : positionnement et etat fige initial.
- `docs/architecture-editoriale.md` : architecture editoriale.
- `docs/radar.md` : specifications Radar.
- `docs/roadmap.md` : roadmap historique.

Mettre ce fichier a jour lorsque des decisions structurantes sont validees.