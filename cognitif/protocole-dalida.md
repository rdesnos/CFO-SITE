# CFO Marine — Expérimentation UX cognitive « Dalida »

Date : 21 octobre 2026
Statut : protocole de prototype, non validé cliniquement et non publié sur le site.
Rattachement : [principes-conception-cfo-marine.md](./principes-conception-cfo-marine.md)

## Intention

Expérimenter une expérience d'écoute et de découverte éditoriale autour de la chanson « Dalida », permettant à des personnes aux besoins cognitifs variés — y compris certaines personnes vivant avec Alzheimer — de retrouver leurs repères, de choisir leur parcours et d'accéder au contenu sans charge de mémoire imposée.

La chanson donne un sens éditorial au chantier, sans laisser entendre un soutien ou une validation de Marine, de sa famille ou de soignants.

## Hypothèses testables, non résultats acquis

H1 — Des libellés explicites, une navigation stable et des actions réversibles diminuent les erreurs d'orientation.
H2 — Un accès direct à l'écoute, au texte de présentation et au retour à l'accueil diminue le nombre d'étapes nécessaires pour accomplir une tâche.
H3 — La possibilité d'interrompre et de reprendre avec consentement aide à maintenir l'autonomie.
H4 — La suppression des distractions non sollicitées améliore le confort de certaines personnes, mais les besoins individuels peuvent diverger.
H5 — Les mêmes composants et fonctionnalités peuvent être rendus accessibles au clavier, au tactile, au zoom et aux technologies d'assistance.

## Première maquette fonctionnelle (périmètre)

- En-tête permanent : « CFO Marine » + bouton « Accueil ».
- Page de découverte : titre « Dalida », courte présentation, une action principale « Écouter » (uniquement si source audio licite et intégrable disponible), « Découvrir l'histoire », « Revenir ».
- Lecteur à contrôles HTML natifs (pas de lecture automatique, source uniquement avec droit/licence et accord d'intégration).
- Page de lecture : paragraphes courts, titrage explicite, éléments visuels non essentiels décrits ; pas de textes de paroles reproduits sans autorisation.
- État de lecture/situation : reprise facultative, jamais persistée sans base légale et consentement adapté ; mécanisme d'effacement immédiat.
- Pas d'interface étiquetée « mode Alzheimer ». Options de confort communes à tous.
- Aucune collecte de diagnostic, inférence de pathologie, suivi individuel caché ou personnalisation clinique.

## Composants réutilisables RU-01

1. CFORouteLandmark : position, titre, retour à l'accueil et au contenu précédent.
2. CFOChoicePanel : actions claires, alternatives équivalentes, pas de menus ambigus.
3. CFOAccessibleMedia : commandes natives, transcription ou contenu alternatif autorisé.
4. CFOReadableStory : blocs courts, hiérarchie sémantique, zoom et reflow.
5. CFOResumePrompt : rétablir une action interrompue de manière facultative et contrôlable.

## Critères d'acceptation techniques

- WCAG 2.2 AA pour les parcours testés ; compléments W3C COGA (non équivalents à une certification).
- Navigation complète au clavier, focus visible, titres et régions sémantiques, aucun piège clavier.
- Zoom 200 % et reflow à 320 CSS px (exceptions documentées).
- Contraste texte 4,5:1 et composants non textuels 3:1, sauf exceptions normatives ; aucune information portée uniquement par la couleur.
- Pas de démarrage automatique de son/animation ; compatibilité prefers-reduced-motion.
- Tests sur conteneurs compact/intermédiaire/large, souris, tactile, clavier, lecteur d'écran.
- Reprise de parcours sans demander à l'utilisateur de mémoriser son emplacement.
- Aucune donnée de santé conservée.

## Protocole de test humain

Co-conception volontaire avec personnes concernées, aidants si souhaité, et spécialistes UX/accessibilité. Consentement adapté, droit au retrait, pauses sans pénalité, aucune tâche jugée « échec » pour la personne. Ne pas publier de résultats concernant la maladie sans protocole méthodologique et relecture appropriés.

Scénarios :
1. Retrouver la chanson depuis l'accueil.
2. Démarrer et arrêter une écoute.
3. Consulter son contexte et retrouver le lecteur.
4. Quitter puis reprendre un parcours.
5. Corriger une erreur de navigation.

Mesures anonymisées et consenties : réussite du parcours, nombre d'actions inutiles, demandes d'aide, ressenti subjectif, charge perçue ; ne pas inférer le statut médical à partir des métriques.

## Documentation de référence

- W3C COGA : https://www.w3.org/TR/coga-usable/
- Alzheimer's Society — co-creation : https://www.alzheimers.org.uk/research/our-research/dementia-innovation/guide-designing-dementia-products-services
- Alzheimer's Society — accessibilité du site : https://www.alzheimers.org.uk/about-us/accessibility

## Portes de validation

A. Vérifier la structure réelle du site et des modules avant intégration.
B. Construire une maquette isolée sans publication et procéder aux tests techniques.
C. Mener une revue éditoriale/juridique (contenu, images, musique) et accessibilité.
D. Consulter des utilisateurs concernés, réviser en fonction des retours.
E. N'intégrer au site public qu'après validation explicite.

Ce chantier nourrit réciproquement le fond éditorial, la forme et l'expérience utilisateur.
