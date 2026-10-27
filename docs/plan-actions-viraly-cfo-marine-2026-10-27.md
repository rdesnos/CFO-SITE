# CFO Marine — Plan d'action 3 : Viraly et diffusion sociale

Date : 27 octobre 2026.
Exigence : des publications adaptées qui font découvrir la valeur de CFO et apportent des visites et des lectures mesurables.
Pilotage et dépendances : [plan commun](plans-actions-cfo-marine-2026-10-27.md).

## État vérifié au cadrage

Lecture Viraly du 27 octobre 2026 : ensemble social CCHacml7, fuseau Europe/Paris ; trois canaux exposés et marqués actifs.

| Réseau | Compte | Identifiant Viraly |
| --- | --- | --- |
| Facebook | Chroniques d'une fille ordinaire | UryqSPGm |
| Instagram | Chroniques fille ordinaire | SEgJIZq6 |
| X, libellé Twitter dans Viraly | Chroniques d'une fille ordinaire | DLEXyf2P |

Ce statut ne prouve pas une publication réussie. TikTok n'apparaît pas dans cet inventaire ; vérifier son accès avant de l'intégrer au planning, sans supposer sa connexion.

Une lecture de dix entrées parmi les 83 annoncées par Viraly montre des brouillons, des publications historiques et un post Facebook « Entre les lignes » publié le 16 octobre. Il s'agit d'un échantillon, pas d'un audit exhaustif ni d'un classement garanti par date. Des dates programmées existent sur des brouillons : seul le statut et la présence native établissent une publication.

## Actions ordonnées

| ID | Action précise | Livrable / preuve attendue | Dépendance |
| --- | --- | --- | --- |
| V01 | Inventorier tous les posts CFO Marine par canal, en paginant jusqu'au total annoncé. Distinguer brouillon, attente, programmé, publié et échec ; classer les publications par date réelle de publication. | Registre avec identifiant, statut, date effective, URL native, contenu CFO lié, visuel, suivi de lien et anomalie. Ne pas déduire la période publiée d'un filtre sur date de création. | Aucune |
| V02 | Tester le parcours de mesure existant et définir la convention de liens par réseau et contenu. Vérifier GA4 sur le domaine public et le traitement des consultations internes. | Convention UTM, URL de destination, événement de lecture défini et preuve de remontée ; un test reste identifié comme test. | V01 |
| V03 | Sélectionner trois contenus CFO prêts : une information actuelle, un dossier de fond et un enseignement issu de données fiables. Vérifier page, mobile, source, date et aperçu de partage avant préparation. | Matrice des trois contenus, angle, public, bénéfice lecteur, URL exacte et validité des données. Si une catégorie n'est pas prête, la laisser bloquée. | I05 pour l'information ; D06 pour la donnée |
| V04 | Préparer les déclinaisons Facebook, Instagram et X de chaque contenu retenu, en réutilisant ou corrigeant les brouillons pertinents plutôt qu'en créant des doublons. | Jusqu'à neuf publications candidates, adaptées au réseau, avec texte, visuel ou format approprié, alternative textuelle et destination traçable. | V02–V03 |
| V05 | Construire un premier calendrier de sept jours, selon la valeur et la fraîcheur des contenus et les signaux disponibles. Vérifier les autorisations avant programmation ou publication. | Calendrier Europe/Paris, espacement cohérent, correspondance post/page et état d'autorisation ; aucun horaire optimal inventé sans données. | V04 |
| V06 | Après autorisation applicable, publier ou programmer le lot retenu ; contrôler chaque résultat sur le réseau natif et l'ouverture de la bonne page CFO. | Identifiant Viraly, statut final, URL native, capture utile et destination fonctionnelle. Les échecs passent dans une file de reprise contrôlée. | V05 |
| V07 | Vérifier l'exploitation : traitement des échecs, expiration des accès, doublons, actualités périmées et métriques absentes. Préparer le rapprochement Viraly/GA4. | Suivi des incidents, reprise idempotente, métriques manquantes distinguées des zéros ; pipeline régulier indépendant de cette conversation. | V06 |
| V08 | Mesurer le lot à J+1, J+3 et J+7 après chaque publication ; effectuer une revue à quatorze jours après démarrage du pilote. | Bilan par réseau, contenu et format ; décisions motivées sur message, format, destination et horaire, sans conclure à partir d'un seul faible échantillon. | V06–V07 |

## Adaptation éditoriale

| Réseau | Forme de travail initiale | Parcours vers CFO à vérifier |
| --- | --- | --- |
| Facebook | Accroche autonome, information ou enseignement précis, visuel utile et invitation claire à approfondir. | Lien direct vers la page pertinente, aperçu cohérent et balises UTM. |
| Instagram | Visuel ou carrousel lisible dans son contexte ; une idée principale ; légende complémentaire. | Vérifier les formats et liens réellement disponibles : lien du profil ou autre surface cliquable prise en charge. Un lien écrit dans une légende n'est pas présumé cliquable. |
| X | Message concis centré sur un fait ou un enseignement ; source et prolongement CFO identifiables. | Lien direct suivi et contrôle de l'aperçu. |
| TikTok | Accès, formats, moyens de production et capacité de diffusion à établir. | Canal bloqué jusqu'à vérification ; aucune publication promise. |

Les déclinaisons prolongent la valeur de la page CFO. Écarter les promesses de contenu « bientôt disponible » quand une publication peut conduire vers une page complète. Respecter le caractère indépendant et non officiel, les droits des visuels et la médiathèque de référence.

## Mesure de l'apport au site

Convention initiale à normaliser avec les liens existants :
- utm_source : facebook, instagram ou x ;
- utm_medium : social ;
- utm_campaign : cfo_marine_<periode_ou_operation> ;
- utm_content : <identifiant_contenu>_<format>_<variante>.

Conserver les identifiants de campagne pour comparer les variantes ; ne jamais placer de donnée personnelle dans les paramètres. Les liens de test portent une campagne distincte.

Indicateurs par post : publication réellement réalisée, portée/impressions si disponibles, clics de lien si disponibles, sessions attribuées sur CFO, sessions engagées et lecture qualifiée. Une métrique non fournie reste indisponible. Le taux de clic est calculé seulement avec des clics et impressions comparables.

Pour les articles, proposer initialement une lecture qualifiée combinant un temps actif et une progression de lecture ; définir ses seuils avant instrumentation. Pour le cockpit, définir une interaction ou consultation adaptée. Ne pas assimiler automatiquement le taux d'engagement GA4 à une lecture complète. Vérifier consentement et déclenchement avant de s'appuyer sur ces mesures.

Distinguer organique et payant. Aucun achat publicitaire ni changement de budget n'est engagé par ce plan. Aucun volume de visites n'est garanti.

## Première livraison attendue et clôture

Premier livrable : inventaire complet, liens de mesure testés et trois contenus candidats avec déclinaisons prêtes dans Viraly. La préparation ne vaut ni programmation ni publication.

Clôture initiale : chaque publication retenue est vérifiée sur son réseau, mène à une page CFO prête et possède un suivi exploitable ou une limite d'attribution explicitée ; la revue du pilote distingue production, diffusion et acquisition réellement obtenue.
