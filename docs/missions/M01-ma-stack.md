# M01 — Ma stack : une page qui aide à décider

Cadrage du 14/11/2026. **État : proposition, à valider par Michael** (sections 1, 2 et 4 et les décisions ouvertes en fin de document).

## 1. Objectif

**Proposition :** une freelance qui arrive sur Ma stack comprend en moins d'une minute ce que lui coûtent ses outils et quel est le prochain choix utile à faire, puis le fait.

Dans le périmètre : la page Ma stack (vide, en cours de remplissage, remplie), l'ajout et le retrait d'un outil, les questions sur les formules, la lecture du budget, la section « Et pour la suite ? ».

Hors périmètre : le catalogue, les fiches outils, le back-office, les comptes (connexion, paiement), l'Explorer.

## 2. KPI

Les valeurs de départ ne sont pas encore connues : le lot 0 les relève dans GA4 avant toute modification.

| KPI | Définition | Source | Départ | Cible proposée |
|---|---|---|---|---|
| Activation | Part des visites de Ma stack qui finissent avec 3 outils ou plus | `add_to_stack` par visite | à relever | +50 % relatif |
| Budget complet | Part des stacks de 3 outils ou plus dont toutes les formules sont renseignées | `stack_plan_pick`, `stack_price_saved` | à relever | 40 % |
| Décision | Part des stacks qui prennent au moins une décision (retrait, remplacement, « je garde ») | `stack_decision`, `stack_remove` | à relever | 20 % |
| Compréhension | Essais avec 5 personnes : la personne dit ce que coûte sa stack et ce qu'elle ferait ensuite, sans aide | Protocole R9 existant | jamais mesuré | 4 sur 5 |

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

- **H1.** Le budget est la porte d'entrée qui donne envie de remplir, la compréhension des outils vient après. À trancher par toi, puis à vérifier en essais.
- **H2.** Une seule file de questions (« 1 sur N ») suffit, sans badges dans la grille.
- **H3.** Regrouper par domaine n'aide qu'à partir d'environ 6 outils. En dessous, une liste simple se lit mieux.

## 4. Conception — parcours cible (proposition)

Trois états de la page, une seule question à la fois.

**1. Vide**
- Une phrase de promesse.
- Une recherche d'outil directement dans la page.
- 6 outils fréquents en un clic.
- Objectif : 3 outils en moins de 30 secondes.

**2. En cours (formules inconnues)**
- En tête : le budget partiel, chiffré, avec ce qui manque (« 2 formules à préciser »).
- Juste dessous : la file de questions « 1 sur N », la seule place où l'on demande quelque chose.
- La grille des outils n'affiche que le nom, le logo et le prix retenu. Plus de badge « À vérifier ».

**3. Complète**
- En tête : le budget mensuel et annuel.
- Ensuite les recoupements éventuels, formulés comme une question (« Deux outils pour la même tâche ? ») et jamais comme une perte prouvée.
- Puis « Et pour la suite ? », avec une raison liée à un de ses outils (« Parce que vous utilisez Figma »).

**Grille « Mes outils »**
- Les titres de domaine passent au-dessus de leurs cartes, pleine largeur.
- En dessous de 6 outils, pas de regroupement.
- Un seul indicateur par carte : le prix retenu, ou « Formule ? » s'il manque.

Chaque écran passera d'abord en maquette Storybook pour validation, avant d'être branché.

## 5. Plan de mise en œuvre

Une branche `mission/m01-ma-stack`, un push à la fin. Les deux correctifs déjà commités en local, la barre de filtres au pied de page et le débordement du Storybook, partent avec.

| Lot | Contenu | Fini quand |
|---|---|---|
| 0. Mesure de départ | Relever dans GA4 les 3 KPI chiffrés sur 30 jours. Vérifier que chaque événement remonte. | Tableau de départ rempli dans ce document |
| 1. Décisions | Toi : promesse (H1), cibles des KPI, conception. | Sections 1, 2 et 4 marquées « validé » |
| 2. Maquettes | Les 3 états et la grille dans Storybook, FR/EN, 390/1440. | Validées par toi dans le Storybook en ligne |
| 3. Grille | Titres de domaine au-dessus, pas de regroupement sous 6 outils, un seul indicateur par carte. | Tests e2e réécrits, invariants Storybook verts |
| 4. File de questions | Une seule source de « ce qui manque », retrait des badges redondants. | Parcours complet sans badge « À vérifier » |
| 5. Page vide | Recherche dans la page, outils fréquents, 3 outils en 30 s. | Parcours e2e « vide → 3 outils » |
| 6. Pour la suite | Raison rattachée à un outil de la personne, texte jamais coupé. | Aucune raison générique affichée |
| 7. Mesure | Événements manquants pour les KPI (ex. passage vide → 3 outils). | Visibles dans GA4 en temps réel |
| 8. Recette et mise en ligne | CI complète en local, vérification navigateur, push sur ton accord. | PR fusionnée, site vérifié |
| 9. Bilan | KPI relevés à 2 et 4 semaines. 5 essais R9 si tu les fais. | Décision garder / ajuster |

## Décisions ouvertes (pour toi)

1. **La promesse.** Budget d'abord (« ce que me coûtent mes outils »), compréhension d'abord (« ce que chaque outil m'apporte »), ou les deux dans cet ordre ?
2. **Les cibles des KPI.** Les garder telles quelles, ou attendre les chiffres de départ du lot 0 pour les fixer ?
3. **Les essais avec de vraies personnes (R9).** On les prévoit à la fin de cette mission, ou on les laisse de côté ?
4. **Ce qui ne va pas pour toi aujourd'hui.** Ta capture et ton message disent que la logique des user stories n'est pas bonne. Dis-moi ce que tu attends, pour que la section 4 parte de ton intention et pas seulement de mon analyse.
