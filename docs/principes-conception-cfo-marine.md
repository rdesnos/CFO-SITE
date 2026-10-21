# CFO Marine — Principe de conception global

Statut : principe directeur transversal.
Date : 21 octobre 2026.

## Le projet est un système vivant

**Le contenu nourrit la forme. La forme nourrit le fond. L'expérience utilisateur est agile. Le fond nourrit l'expérience utilisateur.**

Ces dimensions ne sont pas des étapes successives ni des silos. Elles forment une boucle de conception continue :

**Fond et données ↔ contenus et sens ↔ forme et présentation ↔ expérience utilisateur ↔ nouveaux usages et nouvelles compréhensions ↔ fond.**

Chaque décision éditoriale, analytique, graphique ou technique doit être évaluée à l'aune des autres dimensions. Un choix de forme peut révéler un besoin éditorial ; une analyse peut transformer la navigation ; un usage observé peut inviter à revoir la hiérarchie de l'information. Aucun de ces domaines n'est subordonné de façon permanente à un autre.

## RU-01 — Responsive Universel Modulaire et multimodal

L'interface est composée de modules autonomes qui adaptent leur taille, leur organisation, leur densité de lecture et leurs modalités d'interaction à l'espace réellement disponible et aux besoins des personnes.

- Ne pas raisonner uniquement en « mobile / tablette / desktop » ni en résolution physique : tenir compte de la zone effective d'affichage, du zoom et de la taille des conteneurs.
- Exploiter utilement les grands écrans (notamment 3K / 4K) sans élargir inutilement les lignes de lecture.
- Conserver l'accès aux mêmes informations et fonctions, y compris lorsque leur organisation diffère.
- Permettre souris, clavier, tactile et technologies d'assistance ; envisager la voix comme modalité complémentaire, jamais exclusive.
- Concevoir nativement pour l'accessibilité visuelle, motrice et cognitive : repères stables, lisibilité, alternatives aux codes couleur, contrôles compréhensibles, interaction sans pression temporelle inutile.
- Respecter les préférences de l'utilisateur ; ne pas inférer une maladie ou un handicap depuis son comportement.
- Utiliser des modules, des règles fluides et des container queries lorsque pertinent. L'adaptation doit rester testable, prévisible et performante.

## Sens et accessibilité

La réflexion sur l'accessibilité cognitive résonne particulièrement avec « Dalida », chanson de Marine consacrée à sa grand-mère. Ce lien nourrit le sens du projet, sans supposer de soutien officiel, ni parler au nom de Marine ou de ses proches.

L'accessibilité n'est ni un thème décoratif ni un mode secondaire ; elle influence la structure du contenu, sa restitution et les interactions.

## Règle de réalisation

Pour chaque évolution de CFO Marine :
1. Identifier le sens éditorial ou analytique et le besoin utilisateur.
2. Concevoir conjointement contenu, présentation, interaction et accessibilité.
3. Implémenter par modules réutilisables, connectés aux données réelles (Supabase comme mémoire ; pas de chiffres en dur).
4. Tester les différents espaces d'affichage, méthodes d'interaction et situations d'accessibilité.
5. Mesurer, corriger et réinjecter les enseignements dans le fond et la forme.

**Principe de synthèse : ce n'est pas le contenu qui doit se plier à un gabarit, ni l'utilisateur à une interface. Le fond, la forme et l'expérience se construisent et s'améliorent mutuellement.**
