# M01 — Ma stack : une page qui aide à décider

Cadrage du 14/11/2026. **État : promesse validée (« comprendre d'abord », 14/11). KPI et conception à valider.**

## 1. Objectif

**Validé le 14/11 : comprendre d'abord.** Une freelance qui arrive sur Ma stack comprend ce que chacun de ses outils lui apporte, voit où deux outils font la même chose et lequel ajouterait quelque chose de neuf, puis prend une décision qu'elle sait expliquer. Le budget vient en second : il éclaire une décision, il n'est pas la porte d'entrée.

Dans le périmètre : la page Ma stack (vide, en cours de remplissage, remplie), l'ajout et le retrait d'un outil, les questions sur les formules, la lecture du budget, la section « Et pour la suite ? ».

Hors périmètre : le catalogue, les fiches outils, le back-office, les comptes (connexion, paiement), l'Explorer.

## 2. KPI

Les valeurs de départ ne sont pas encore connues : le lot 0 les relève dans GA4 avant toute modification.

| KPI | Définition | Source | Départ | Cible proposée |
|---|---|---|---|---|
| Activation | Part des visites de Ma stack qui finissent avec 3 outils ou plus | `add_to_stack` par visite | à relever | +50 % relatif |
| Exploration | Part des stacks de 3 outils ou plus où la personne ouvre le rôle d'un outil ou une comparaison | `stack_tool_open`, `stack_compare_click` | à relever | 50 % |
| Décision | Part des stacks qui prennent au moins une décision (retrait, remplacement, « je garde ») | `stack_decision`, `stack_remove` | à relever | 20 % |
| Compréhension | Essais avec 5 personnes : la personne dit, sans aide, à quoi sert chacun de ses outils, lesquels se recoupent et ce qu'elle ferait ensuite | Protocole R9 existant | jamais mesuré | 4 sur 5 |

Garde-fous, à ne pas dégrader : temps de chargement de la page, taux de retrait accidentel (retrait puis annulation).

## 3. Réflexion — ce que montre la page aujourd'hui

Observé en local le 14/11/2026 avec Notion, Figma et Slack, et sur ta capture.

**La promesse n'est pas claire.**
- Le titre « On fait les comptes ? » met le budget au premier plan.
- Le document de direction du 5 octobre (`MON_STACK_PRODUCT_DIRECTION.md`) disait l'inverse : comprendre ce que chaque outil apporte, et ne pas faire de suivi de dépenses à ce stade.
- Les deux coexistent sans hiérarchie. C'est la première décision à prendre.

**La grille « Mes outils » mélange titres et cartes.**
- Les noms de domaine (« Créer », « Communiquer ») occupent une case de la grille, à côté des outils, comme s'ils étaient des cartes.
- Avec un outil par domaine, la page alterne titre / carte / titre / carte et ne se lit plus.

**Des étiquettes qui ne disent rien.**
- Chaque outil porte à la fois « Freemium » et « À vérifier ».
- Le filtre « À vérifier 3 » reprend la même information.
- « Price recorded » (ta capture) affiche un tarif comme s'il était connu, alors que l'outil est « Free ».
- La personne ne sait pas ce qu'on attend d'elle.

**Deux endroits pour la même tâche.**
- La carte « Ce qui reste à préciser · 1 sur 3 » pose les formules une par une, et c'est clair.
- La grille demande la même chose par ses badges « À vérifier ».

**La page vide n'oriente pas.**
- On voit un « Bonjour » animé en plusieurs langues.
- Aucune action ne mène directement au premier outil.

**« Et pour la suite ? » est générique.**
- « Alternative au catalogue… » est coupé.
- La raison de la suggestion ne se rattache pas à un outil de la personne.

**On n'a jamais observé de vraies personnes.**
- R9 (5 essais) a été préparé le 13/10, puis reporté.
- Les tests automatiques garantissent que ça marche, pas que c'est compris.

### Hypothèses à vérifier

- **H1 (tranchée le 14/11).** Comprendre d'abord, le budget en second. Reste à vérifier en essais que le rôle des outils donne envie de remplir sa stack sans l'appât du chiffre.
- **H2.** Une seule file de questions (« 1 sur N ») suffit, sans badges dans la grille.
- **H3.** Regrouper par domaine n'aide qu'à partir d'environ 6 outils. En dessous, une liste simple se lit mieux.

## 4. Conception — validée dans son principe le 14/11 (bilan, carte, décision)

La page suit le chemin « constat → compréhension → décision ». Les trois directions esquissées le 14/11 se complètent, dans cet ordre :

**1. Le bilan (en haut, la promesse).** Une phrase de diagnostic, puis ses constats : « 4 outils. Deux font la même chose, et rien ne facture. » La valeur se lit en trois secondes.

**2. La carte (au milieu, la preuve).** La stack est rangée par métier (créer, organiser, communiquer, facturer…), avec le rôle de chaque outil en une ligne et les métiers vides bien visibles. Elle remplace la grille actuelle et ses badges « À vérifier » ou « Freemium ».

**3. Un pas à la fois (au moment d'agir).** Chaque constat du bilan devient une décision, posée une à la fois : « Figma et Canva, vous gardez les deux ? ». La décision est réversible. Le prix n'apparaît qu'ici, quand il aide à trancher.

### Détail par état (proposition précédente, à reprendre dans les maquettes)

Trois états de la page. Le rôle de chaque outil passe devant, le prix derrière.

**1. Vide**
- Promesse : « Voyez ce que chacun de vos outils vous apporte ».
- Une recherche d'outil directement dans la page, et 6 outils fréquents en un clic.
- Dès le premier outil, son rôle s'affiche : la valeur arrive tout de suite, sans longueur minimum.

**2. Quelques outils**
- En tête, une lecture de la stack en une phrase : « Vous créez avec Figma, vous communiquez avec Slack, vous organisez avec Notion. »
- Chaque carte d'outil dit son rôle en une ligne (une phrase éditoriale courte, pas la description commerciale).
- Quand deux outils partagent un rôle, une question apparaît : « Figma et Canva pour la même tâche ? ». Elle mène à une comparaison courte : ce qu'ils partagent, ce que chacun fait seul, et ce qu'on ne sait pas.

**3. Décider**
- Depuis une comparaison : « Je garde les deux », « Je garde Figma », « Je remplace ». La décision est enregistrée et réversible.
- Le prix arrive ici, en appui de la décision : la formule n'est demandée que pour les outils concernés, pas pour toute la stack d'un coup.
- Le budget total reste visible plus bas, en lecture secondaire, sans question imposée.

**« Et pour la suite ? »**
- Chaque suggestion dit ce qu'elle ajouterait par rapport à vos outils : « Ajoute la gestion de clients, que votre stack ne couvre pas », jamais « Alternative au catalogue ».
- « Voir son apport » montre l'outil à côté des vôtres avant tout ajout.

**Grille « Mes outils »**
- Les titres de domaine passent au-dessus de leurs cartes, pleine largeur. En dessous de 6 outils, pas de regroupement.
- Sur chaque carte : logo, nom, rôle en une ligne. Les badges « À vérifier » et « Freemium » disparaissent.

**Ce que ça demande en données** (point de vigilance)
- Une phrase de rôle par outil, vérifiée. Il faut contrôler combien d'outils du catalogue en ont déjà une.
- Des relations typées (même rôle, complément, extension), déjà en partie présentes avec l'Explorer (R5).

Chaque écran passera d'abord en maquette Storybook pour validation, avant d'être branché.

## 5. Plan de mise en œuvre

Une branche `mission/m01-ma-stack`, un push à la fin. Les deux correctifs déjà commités en local, la barre de filtres au pied de page et le débordement du Storybook, partent avec.

| Lot | Contenu | Fini quand |
|---|---|---|
| 0. Mesure de départ | Relever dans GA4 les 3 KPI chiffrés sur 30 jours. Compter les outils du catalogue qui ont une phrase de rôle vérifiée. | Tableau de départ et couverture des rôles notés ici |
| 1. Décisions | Toi : promesse (H1), cibles des KPI, conception. | Sections 1, 2 et 4 marquées « validé » |
| 2. Maquettes | Les 3 états et la grille dans Storybook, FR/EN, 390/1440. | Validées par toi dans le Storybook en ligne |
| 3. Grille | Titres de domaine au-dessus, pas de regroupement sous 6 outils, un seul indicateur par carte. | Tests e2e réécrits, invariants Storybook verts |
| 3b. Rôles | Phrase de rôle FR/EN vérifiée pour les 200 outils les plus recherchés (~70 à écrire, le reste à harmoniser). | Top 200 couvert à 100 % |
| 4. Rôles et recoupements | Phrase de rôle sur chaque carte, lecture de la stack en une phrase, question « même tâche ? » et comparaison courte. Badges redondants retirés. | Parcours « 3 outils → comprendre → décider » en e2e |
| 5. Page vide | Recherche dans la page, outils fréquents, 3 outils en 30 s. | Parcours e2e « vide → 3 outils » |
| 6. Pour la suite | Raison rattachée à un outil de la personne, texte jamais coupé. | Aucune raison générique affichée |
| 7. Mesure | Événements manquants pour les KPI (ex. passage vide → 3 outils). | Visibles dans GA4 en temps réel |
| 8. Recette et mise en ligne | CI complète en local, vérification navigateur, push sur ton accord. | PR fusionnée, site vérifié |
| 9. Bilan | KPI relevés à 2 et 4 semaines. 5 essais R9 si tu les fais. | Décision garder / ajuster |

## Lot 0 — mesures de départ (14/11/2026)

### GA4, 28 derniers jours (17/10 → 13/11/2026)

Seules les personnes qui acceptent la mesure sont comptées. Les chiffres réels sont donc plus élevés.

| Mesure | Valeur |
|---|---|
| Utilisateurs du site | 4 189 |
| Utilisateurs sur Ma stack (FR 21 + EN 27) | 48 (567 vues) |
| Vues par utilisateur sur /fr/ma-stack | 18,9 : très probablement nos propres tests |
| Personnes qui ajoutent un outil (`add_to_stack`) | 17 (97 ajouts) |
| Ouvrent un outil de leur stack (`stack_tool_open`) | 7 |
| Choisissent une formule (`stack_plan_pick`) | 6 |
| Prennent une décision (`stack_decision`) | 4 |
| Ajoutent une suggestion (`stack_reco_add`) | 4 |
| Retirent un outil (`stack_remove`) | 2 |
| Ouvrent une comparaison (`stack_compare_click`) | 1 |

**Lecture**
- L'échantillon est trop petit pour fixer des cibles en pourcentage : 48 personnes, dont une part importante de tests internes.
- Les ordres de grandeur suffisent pour la direction. Environ 1 visiteur du site sur 90 ouvre Ma stack, 1 sur 3 y ajoute un outil, et presque personne n'ouvre une comparaison.
- **Proposition :**
  - remplacer les cibles en pourcentage par des cibles en nombre de personnes sur 28 jours ;
  - exclure le trafic interne de GA4 (filtre d'adresse IP ou paramètre de développeur) avant le bilan ;
  - garder les essais réels (R9) comme mesure principale de la compréhension.

### Couverture des rôles d'outils

| Source | Outils couverts (sur 1 360) |
|---|---|
| Accroche écrite à la main (`toolTaglines.ts`, 2-3 mots) | 92 (7 %) |
| Rôle dans au moins une stack éditoriale (`stacks.ts`) | 595 (44 %) |
| L'un ou l'autre | 624 (46 %) |
| Description courte (`shortDescription`, ~88 caractères, commerciale) | 1 360 (100 %) |

Pondéré par la demande (impressions Google, `tool_demand.json`) :
- **top 50** des outils recherchés : 42 ont une accroche ou un rôle (84 %) ;
- **top 200** : 132 (66 %).

**Lecture.** Les outils qu'on ajoute réellement sont en majorité couverts. Il faut tout de même :
- écrire une phrase de rôle pour les ~70 outils du top 200 qui n'en ont pas ;
- harmoniser les rôles de stack, écrits pour une stack précise (« Code et repo »), en une phrase de rôle propre à l'outil.

La description commerciale ne sert que de dernier recours, et jamais coupée.

**Lot ajouté au plan :** « 3b. Rôles » — une phrase de rôle FR/EN vérifiée pour les 200 outils les plus recherchés, dans un fichier dédié.

## Décisions ouvertes (pour toi)

1. ~~La promesse~~ : **comprendre d'abord**, validé le 14/11.
2. **Les cibles des KPI.** Le lot 0 montre un échantillon trop petit (48 personnes). Proposition : des cibles en nombre de personnes, l'exclusion du trafic interne dans GA4, et les essais R9 comme mesure principale de la compréhension.
3. **Les essais avec de vraies personnes (R9).** On les prévoit à la fin de cette mission, ou on les laisse de côté ?
4. **Ce qui ne va pas pour toi aujourd'hui.** Ta capture et ton message disent que la logique des user stories n'est pas bonne. Dis-moi ce que tu attends, pour que la section 4 parte de ton intention et pas seulement de mon analyse.

## Conception v2 — la page entière (14/11/2026)

### 1. Ce que la page doit faire

Répondre à trois questions, dans cet ordre et une seule fois chacune :

1. **Qu'est-ce que j'ai ?** Les outils, ce que chacun fait, et ce que tout ça coûte.
2. **Est-ce que c'est en ordre ?** L'état de la stack, de « En vrac » à « Stack au top ».
3. **Que faire maintenant ?** Une seule action à la fois, à l'endroit où on la lit.

Tout bloc qui ne répond à aucune des trois disparaît. Tout bloc qui répond à une question déjà traitée fusionne avec celui qui la traite.

### 2. L'ordre de la page

| # | Bloc | Question | Contenu | Action |
|---|---|---|---|---|
| 1 | En-tête | 1 | Titre : « N outils, X € par mois. » Une phrase : « Soit Y € par an, ou Z de votre travail chaque mois. » | Explorer autour de ma stack (secondaire) |
| 2 | État de la stack | 2 | Niveau + « N étapes sur 3 » + 3 lignes (doublons, prix, essentiel), cochées ou avec leur bouton | Le bouton de l'étape ouverte |
| 3 | Ma stack | 1 | « N outils, M métiers sur 5 », les 5 métiers nommés (✓ ou gris), les logos | Ajouter un outil (seule action principale de la page) |
| 4 | Étape en cours | 3 | La décision de la première étape ouverte : départager, choisir une formule… Elle s'ouvre **juste sous l'état**, pas plus bas dans la page | Les choix de la décision, « Plus tard » |
| 5 | Mes outils | 1 | La liste par métier, le rôle de chaque outil, son prix, le badge « Doublon » | Trier, grille/liste, modifier |
| 6 | Où va votre budget | 1 | La répartition par métier, en euros | Aucune |
| 7 | Et pour la suite ? | 3 | Pistes reliées à un manque d'abord (« Pour facturer »), puis les autres | Ajouter à ma stack |

### 3. Ce qui disparaît ou fusionne

- **L'ancien bento** (« Ce qui reste à préciser », « Ce qui sert vraiment », « Résultat ») :
  - la décision devient le bloc 4 ;
  - l'économie réalisée passe dans l'en-tête (« −26 €/mois depuis vos décisions ») ;
  - le jeu « Ce qui sert vraiment » devient une étape bonus, proposée seulement une fois les 3 étapes réglées (« Stack au top… et vraiment utilisée ? »).
- **Les filtres « À vérifier » et « Doublons » de Mes outils** : l'état de la stack les porte déjà. Il ne reste que le tri et l'affichage.
- **Le badge « À vérifier » et l'étiquette « Freemium »** sur les cartes : remplacés par le rôle, et le prix s'affiche seulement s'il est connu.
- **Le compteur « 2 outils sur 3 renseignés » de l'en-tête** : déjà retiré, c'est l'étape « prix ».

### 4. Les états de la page

| État | Condition | En-tête | État de la stack | Ma stack | Étape en cours | Budget | Pistes |
|---|---|---|---|---|---|---|---|
| Vide | 0 outil | « Voyez ce que vos outils font pour vous » + recherche | — | — | — | — | Outils fréquents |
| Démarrage | 1 outil | « 1 outil. Il en faut au moins deux pour parler de stack. » | — | Oui | — | — | Autour de cet outil |
| En vrac | 0 étape réglée | Titre sans montant si aucun prix | Orange, 3 boutons | Oui | Ouverte | — | Manque d'abord |
| Ça prend forme / Presque | 1 ou 2 étapes | Montant partiel | Bleu, lignes cochées | Oui | Ouverte | Si 2 métiers payants ou plus | Manque d'abord |
| Stack au top | 3 étapes | Montant + économie réalisée | Vert, une ligne : « Rangée, chiffrée, complète » + bonus usage | Oui | — | Oui | Autour de la stack |

Un bloc sans rien à dire ne s'affiche pas : jamais de tuile pour dire que tout va bien, une ligne suffit.

### 5. Règles de visualisation

- **Un graphique seulement pour une quantité** : la répartition du budget, en euros, avec chaque part nommée.
- **Un état ou une présence s'écrivent** : étapes cochées, métiers nommés. Pas d'anneau, de jauge ni d'arc sans étiquette.
- **Un chiffre est toujours exact et dit son unité** (« 42 €/mois », « 44 min ») ; un chiffre arrondi le dit (« ≈ »).
- **La couleur suit le sens, jamais la décoration** : vert = réglé, orange = à régler, bleu = la marque. Elle ne porte jamais seule l'information : il y a toujours une coche ou un mot.

### 6. Règles de texte et d'humour

- **Une phrase par bloc**, au plus une touche d'humour, toujours sur la situation, jamais sur la personne.
- Le chiffre d'abord, la blague ensuite : « 0 € facturés ce mois-ci. Vos clients adorent. »
- Aucun texte qui répète un autre bloc.

### 7. Mesure (KPI)

| Action | Événement | KPI |
|---|---|---|
| Ajouter un outil | `add_to_stack` | Activation |
| Bouton d'une étape | `stack_step_click` (nouveau, avec l'étape) | Exploration |
| Départager, choisir une formule | `stack_decision`, `stack_plan_pick` | Décision |
| Niveau atteint | `stack_level` (nouveau, à chaque changement) | Part des stacks « au top » |
