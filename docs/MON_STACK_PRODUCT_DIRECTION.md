# Mon Stack — direction produit proposée

5 octobre 2026. Document de réflexion et de transmission ; aucune fonctionnalité de cette proposition n’est implémentée ici.

## Problème à résoudre

Le freelance connaît ses outils individuellement mais éprouve des difficultés à arbitrer son environnement : ce qu’il peut déjà accomplir, ce que chaque outil apporte, ce qu’un nouvel abonnement changerait, et ce qu’il faudrait préserver lors d’un changement.

Promesse proposée : **Comprendre ce que mes outils me permettent déjà de faire, pour décider quoi ajouter ou faire évoluer.**

La sélection personnelle fournit un contexte précieux. Elle n’établit ni les usages réels, ni les plans souscrits, ni les dépenses. Le produit doit distinguer capacité catalogue, relation connue et situation déclarée par la personne.

Ces frictions sont des hypothèses produit à vérifier avec des utilisateurs ; elles ne constituent pas des résultats d’une étude d’usage.

## Ce que la V2 résout et ce qui manque

Stack facilite l’inventaire, Map la lecture des territoires, Focus la consultation contextuelle et la fiche l’information complète. Ces quatre niveaux restent pertinents.

La valeur actuelle plafonne quand le Focus restitue ce que le nom du produit et quelques connaissances suffisent à savoir. « Audacity / Audio / Montage audio / Gratuit » explique son classement mais apporte peu à une personne qui utilise déjà Audacity. « Motion Array et Red Giant sont également dans Vidéo & Motion » montre une proximité, sans expliquer ce qui les rapproche ou les distingue.

La boucle reste souvent : ajouter → regarder → fermer. Une prochaine passe devrait permettre : **comprendre une contribution → examiner une question → prendre une décision explicable.**

## Frictions prioritaires

1. Effort de constituer un stack avant d’obtenir un bénéfice concret. Donner une première compréhension dès quelques outils ; aucune longueur minimum artificielle.
2. Classification qui rend le catalogue plus lisible mais ne révèle pas le fonctionnement du travail. Un territoire commun peut contenir des rôles différents.
3. Relations trop génériques pour arbitrer. Alternative, contribution complémentaire, dépendance à un hôte et appartenance au même territoire doivent être distinguées.
4. Passage de la fiche au stack qui laisse la comparaison à la charge de l’utilisateur. Le produit peut rappeler les éléments personnels pertinents au moment de l’exploration.
5. Limite des données : les capacités connues ne révèlent pas ce que la personne utilise réellement. Une information ponctuelle et facultative peut devenir utile au moment d’une décision, sans questionnaire d’entrée.
6. Faible motif de retour. Une nouvelle tâche, l’examen d’un outil ou une évolution du stack sont des déclencheurs plus solides qu’une consultation régulière de l’inventaire.

## Quatre axes possibles

| Axe | Bénéfice | Prérequis | Priorité proposée |
|---|---|---|---|
| Rôle des outils dans un territoire | Comprendre les contributions plutôt que seulement les catégories | Rôles éditoriaux courts, fondés sur des fonctions connues | Première passe |
| Comparaison contextualisée | Expliquer ce que deux outils présents ou envisagés partagent et apportent chacun | Petites matrices de capacités vérifiées et relations typées | Première passe sur un pilote |
| Apport d’un outil envisagé | Voir ce qu’il pourrait ajouter à l’ensemble existant avant de l’enregistrer | Capacités suffisamment précises, question ou tâche facultative | Après le pilote de comparaison |
| Lecture par tâche ou parcours de travail | Relier les outils à un résultat concret, avec les passages et limites utiles | Parcours éditoriaux vérifiés ; distinguer usage possible et intégration attestée | Exploration ultérieure |

Un suivi de dépenses, de licences et d’usage réel serait une autre direction, avec une collecte et une maintenance nettement plus importantes. Il ne constitue pas la prochaine petite évolution recommandée.

## User stories et résultats attendus

### 1. Comprendre des contributions différentes

**En tant que créatif qui utilise plusieurs outils vidéo, je veux comprendre la contribution de chacun dans ce territoire, afin de savoir pourquoi ils peuvent coexister et ce que j’attends de chaque outil.**

Parcours : ouvrir Vidéo & Motion, sélectionner un outil, lire son rôle principal et les contributions des autres outils présents.

Exemple de distinction à documenter : ressources/templates d’un côté, production/effets de l’autre. Une proximité de rôle n’est pas une preuve d’interchangeabilité. Une complémentarité de fonctions n’est pas une intégration technique attestée.

Acceptation :
- Une phrase de rôle utile remplace une description commerciale longue.
- Chaque relation affichée a un type compréhensible et une explication spécifique.
- La provenance fonctionnelle est accessible ; une relation insuffisamment documentée est omise ou présentée comme proximité générale.
- La personne peut expliquer pourquoi deux outils sont présents sans recevoir une injonction de suppression.

### 2. Arbitrer deux outils proches

**En tant que freelance qui hésite entre deux outils pour une même tâche, je veux voir leurs capacités communes et leurs différences utiles dans le contexte de mon stack, afin de choisir selon mon besoin.**

Parcours : depuis un Focus, ouvrir une comparaison locale de deux outils proches ; choisir, si nécessaire, une tâche pertinente parmi quelques options courtes.

Acceptation :
- La comparaison s’appuie sur des capacités vérifiées ; une catégorie ou un cluster seuls ne suffisent pas à affirmer un recouvrement précis.
- Elle expose quelques différences décisives et les limites pertinentes.
- Elle distingue « capacité documentée », « non évaluée » et « absence documentée ».
- Le prix catalogue demeure distinct du prix payé par la personne.
- Elle conserve le retour au stack et ses quatre niveaux de lecture ; aucune nouvelle destination générique ne doit être créée par défaut.

### 3. Comprendre ce qu’un candidat ajouterait

**En tant que freelance qui découvre un nouvel outil, je veux comprendre ce qu’il pourrait apporter par rapport à mes outils déjà sélectionnés, afin d’éviter un ajout dont je ne comprends pas l’utilité.**

Parcours : depuis une fiche, « Voir son apport à mon stack » ; le Focus montre les quelques outils concernés, les capacités partagées documentées et les contributions distinctes connues. L’enregistrement reste une action explicite.

Acceptation :
- Le candidat reste temporaire jusqu’à son ajout ; quitter l’examen conserve la sélection personnelle.
- Aucun score global, pourcentage de doublon ou verdict automatique.
- Si les données ne permettent pas une comparaison utile, l’interface l’indique sobrement plutôt que de fabriquer une conclusion.
- Sans besoin déclaré, parler de contribution distincte connue, jamais d’un besoin personnel manquant.
- Avec une tâche facultative, la lecture peut être restreinte à cette tâche sans transformer l’entrée en questionnaire.

### 4. Examiner une tâche avec ses outils existants

**En tant que créatif qui reçoit une nouvelle demande client, je veux repérer ce que mes outils actuels peuvent déjà prendre en charge et ce qui reste à vérifier, afin d’étudier une solution avant de chercher un nouvel outil.**

Pilote possible : produire une courte vidéo client. Les étapes doivent être éditorialement vérifiées. Ne pas déduire une chaîne d’intégrations de la seule appartenance à des territoires.

Acceptation :
- La tâche est explicitement choisie par la personne.
- Seules les étapes et capacités documentées sont proposées.
- « Non évalué » reste distinct de « aucun outil sélectionné ne couvre cette capacité ».
- Une étape non couverte ne déclenche pas automatiquement une recommandation commerciale.

### 5. Préserver ce qui compte lors d’un changement

**En tant que freelance qui envisage de remplacer un outil, je veux comprendre les capacités et dépendances connues à préserver, afin de comparer les possibilités avec moins d’incertitude.**

Piste ultérieure. Lire les hôtes, bundles, exports et relations disponibles ; qualifier leurs limites. Une inclusion dans un plan catalogue ne prouve pas que la personne possède ce plan. Aucun remplacement ou retrait automatique.

## Proposition de pilote avant extension

Cibler d’abord les créatifs solos, cohérents avec le cas de 3D, design, vidéo et audio examiné. Cela reste une hypothèse de segment à tester, sans exclure ensuite les autres freelances.

1. Sélectionner un petit ensemble de 10 à 15 outils déjà connus.
2. Auditer leurs capacités utiles et 6 à 10 relations. Pour chaque relation : type, explication courte, source, périmètre et limites.
3. Écrire quelques comparaisons réellement éclairantes avant de dessiner les composants.
4. Réutiliser la Map et le Focus existants pour exposer ces lectures.
5. Tester avec cinq personnes du segment : identifier les rôles, expliquer une proximité, puis examiner un ajout ou un arbitrage.

Exemple de test : « Voici vos outils et ce besoin. Montrez ce que vous utiliseriez, ce que vous devez vérifier et pourquoi vous ajouteriez éventuellement un outil. » Observer si les informations produit améliorent effectivement leur raisonnement.

Critère de progrès : la personne peut justifier une décision ou identifier une question pertinente qu’elle ne voyait pas avant. Le nombre d’outils ajoutés, le temps passé sur la Map et l’ouverture de fiches ne suffisent pas, seuls, à prouver la valeur.

## Transmission à un modèle d’exécution moins coûteux

Avant toute modification, choisir le pilote et écrire une petite matrice de relations/capacités auditée. Réutiliser CartPage, StackToolInspector, ToolLogo, le stockage V1 et la couche de classification existante. Conserver le design system et les routes. Implémenter une seule user story au départ : contribution des outils et relation expliquée dans le Focus.

Ne pas déduire « doublon », « suppression possible », « économie » ou « intégration » d’une catégorie ou d’un cluster. Ne pas générer des centaines de relations en texte libre pour combler un manque de données. Montrer le contexte, les différences utiles et les limites connues, avec une action vers une comparaison ciblée.

Élargir le pilote seulement lorsque la qualité des explications et leur utilité auprès des personnes testées sont établies. L’examen d’un candidat temporaire et la lecture par tâche font l’objet de passes séparées.

## Repère externe

Les solutions de rationalisation d’entreprise illustrent une limite importante : Zylo met en avant l’analyse d’usage, de dépenses et de contrats pour décider d’une consolidation. Mon Stack ne dispose pas de ces données personnelles ; sa prochaine valeur doit donc être fondée sur la compréhension des capacités et les décisions contextualisées, sans promettre des économies mesurées.

Source consultée : https://zylo.com/solutions/application-redundancy
