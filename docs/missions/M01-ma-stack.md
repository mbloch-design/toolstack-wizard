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

## 4. Conception — parcours cible (proposition, révisée « comprendre d'abord »)

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
| 4. Rôles et recoupements | Phrase de rôle sur chaque carte, lecture de la stack en une phrase, question « même tâche ? » et comparaison courte. Badges redondants retirés. | Parcours « 3 outils → comprendre → décider » en e2e |
| 5. Page vide | Recherche dans la page, outils fréquents, 3 outils en 30 s. | Parcours e2e « vide → 3 outils » |
| 6. Pour la suite | Raison rattachée à un outil de la personne, texte jamais coupé. | Aucune raison générique affichée |
| 7. Mesure | Événements manquants pour les KPI (ex. passage vide → 3 outils). | Visibles dans GA4 en temps réel |
| 8. Recette et mise en ligne | CI complète en local, vérification navigateur, push sur ton accord. | PR fusionnée, site vérifié |
| 9. Bilan | KPI relevés à 2 et 4 semaines. 5 essais R9 si tu les fais. | Décision garder / ajuster |

## Décisions ouvertes (pour toi)

1. ~~La promesse~~ : **comprendre d'abord**, validé le 14/11.
2. **Les cibles des KPI.** Les garder telles quelles, ou attendre les chiffres de départ du lot 0 pour les fixer ?
3. **Les essais avec de vraies personnes (R9).** On les prévoit à la fin de cette mission, ou on les laisse de côté ?
4. **Ce qui ne va pas pour toi aujourd'hui.** Ta capture et ton message disent que la logique des user stories n'est pas bonne. Dis-moi ce que tu attends, pour que la section 4 parte de ton intention et pas seulement de mon analyse.
