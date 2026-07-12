# ToolTrim — Roadmap MVP Ma stack

Mise à jour : 2026-07-11

## Vision du MVP

Ma stack est un espace simple pour :

1. prendre les outils que l'on utilise ;
2. les ranger par besoin dans des lots ;
3. obtenir une vue d'ensemble claire.

La promesse de cette première base est :

> Pour tel besoin, j'ai ce lot d'outils.

Les trois verbes du MVP sont donc : **prendre, ranger, voir**.

## Avancement

### 2026-07-10 — Phase 1 démarrée

- Nouveau format local versionné `v2`.
- Besoins suggérés intégrés au modèle.
- Une entrée d'outil peut conserver plusieurs besoins.
- Les outils sans affectation restent identifiables pour la future zone `À ranger`.
- Migration automatique des anciennes listes de slugs, sans perte ni suppression avant écriture réussie.
- Compatibilité conservée avec les composants existants.
- Un ajout depuis un lot enregistre désormais ce lot.
- Les affectations enregistrées sont prioritaires dans la vue ; l'ancien classement automatique reste un fallback transitoire.
- 10 tests ciblés couvrent modèle, migration, persistance, affectation par lot, multi-affectation, suppression et ordre.
- Les outils ajoutés hors d'un lot apparaissent désormais dans `À ranger`.
- Un dialogue permet d'affecter un outil à un ou plusieurs besoins suggérés.
- Un outil déjà rangé peut être réaffecté depuis la vue détaillée de son lot.
- L'utilisateur peut remettre volontairement un outil dans `À ranger`.
- Le dialogue gère le focus clavier, bloque le scroll du fond et passe au-dessus de la navigation mobile.
- La copie du hero est recentrée sur le rangement par besoin.
- Un gestionnaire permet de créer des besoins personnalisés.
- Les besoins personnalisés peuvent être renommés, déplacés et supprimés.
- Supprimer un besoin ne supprime jamais les outils : les outils devenus orphelins reviennent dans `À ranger`.
- Les besoins personnalisés apparaissent comme des lots dans la vue d'ensemble, même lorsqu'ils sont encore vides.
- `Retirer du besoin` conserve l'outil dans Ma stack et le renvoie dans `À ranger` si nécessaire.
- `Supprimer de Ma stack` est désormais une action distincte dans le dialogue de rangement.
- Les cartes de lots affichent désormais les noms des outils, pas seulement leurs logos.
- Chaque lot sépare clairement les actions `Voir le lot` et `Ajouter`.
- Les cartes ne sont plus de faux boutons contenant d'autres boutons : la structure clavier et lecteur d'écran est valide.
- Les lots personnalisés vides affichent un état vide explicite et restent directement composables.
- La vue a été vérifiée sans débordement horizontal sur ordinateur et sur mobile à 390 px.
- Tout nouvel outil ajouté hors d'un lot passe désormais automatiquement par le moteur de classement.
- Le modèle distingue un classement en attente, automatique ou manuel.
- Une correction manuelle, y compris `Laisser à ranger`, n'est jamais écrasée par le moteur.
- Sans signal suffisamment exploitable, le moteur tente une seule fois puis conserve l'outil dans `À ranger`.
- Le classement autonome utilise désormais une hiérarchie explicite : outils connus, signaux fonctionnels, catégorie, puis texte libre.
- Les cas ambigus dans le texte libre ne sont plus rangés arbitrairement dans le premier lot correspondant.
- Les cas trompeurs du catalogue sont couverts : HubSpot rejoint `Vente`, GitHub rejoint `Dev` et Stripe rejoint `Finance`.
- 17 outils représentatifs sont vérifiés directement à partir de leurs vraies fiches catalogue.
- Chaque outil rangé par le moteur affiche désormais `Automatique · Corriger` dans la vue d'ensemble et la vue détaillée.
- Cette action ouvre directement le choix des besoins de l'outil concerné.
- Après une confirmation ou une correction, le rangement devient manuel et l'indication automatique disparaît.
- Le parcours réel `ajouter → rangement automatique → corriger → priorité manuelle` a été vérifié sans erreur.
- Une confirmation indique désormais où l'outil vient d'être rangé après un ajout automatique, un ajout dans un lot ou une correction.
- La confirmation rappelle explicitement qu'un outil présent dans plusieurs besoins est `compté une seule fois`.
- Un outil sans classement fiable reçoit une confirmation l'orientant vers `À ranger`.
- Les besoins suggérés sont désormais formulés comme des actions utilisateur : `Organiser mon travail`, `Créer des visuels`, `Gérer mes finances`, etc.
- Les classements de faible confiance ne sont plus appliqués automatiquement.
- Le budget et les suites ont été retirés du résumé et de la vue détaillée de Ma stack.
- La suppression globale a été retirée des cartes de lots ; elle reste uniquement dans le dialogue explicite de l'outil.
- Le sélecteur contextuel est réduit à une recherche, une liste d'outils et l'action `Ajouter`.
- La vue détaillée est réduite à `voir la fiche / modifier / retirer du besoin`, sans sous-domaines, prix ni relations secondaires.
- Les actions essentielles mesurent 44 px sur mobile et la vue reste sans débordement à 390 px.
- La vue globale suit désormais une grille visuelle régulière de gauche à droite, inspirée des boards Pinterest.
- Les tableaux conservent une hauteur compacte et identique : 320 px sur desktop et 310 px sur petit mobile ; la carte finale d'ajout a été supprimée au profit des actions `+` déjà présentes.
- La vue globale utilise quatre colonnes sur grand écran, puis se replie progressivement en trois, deux et une colonne.
- Les tableaux retrouvent une composition éditoriale colorée : titre court, description du besoin, trois logos alignés puis compteur de surplus, avec les actions `Explorer` et `Ajouter`.
- Les actions de rangement sont réduites à de petits crayons, visibles au survol et toujours accessibles sur mobile.
- La page d'un besoin affiche ses sous-sections verticalement, puis réutilise la card éditoriale commune au catalogue dans une variante compacte de hauteur fixe (226 px) en grille `4 / 2 / 1` : image ou logo, nom, prix, catégorie et utilité. La carte entière ouvre la fiche et le petit crayon permet de corriger le rangement.
- `À ranger` n'apparaît que pour les cas particuliers et prend désormais la forme d'un tableau identique aux autres ; il lance une correction simple outil par outil.
- Le tableau `À ranger` est toujours placé après les besoins normaux, en dernière position de la grille.
- Les logos se chevauchent légèrement pour former un groupe régulier ; le surplus est un vrai bouton rond `+N` ouvrant un panneau compact des outils supplémentaires.
- Toute la surface d'un tableau ouvre désormais son détail, tandis que `+N`, `Ajouter` et `Ranger` conservent leurs interactions propres.
- La navigation globale reste strictement identique au reste du site, avec sa barre latérale et son header sticky.
- Le champ de recherche du header global est désormais plus large, plus contrasté et arrondi, dans une logique inspirée de Pinterest sur l'ensemble du site.
- Dans le contenu de Ma stack uniquement, le grand hero marketing a été remplacé par une barre compacte `titre · outils · besoins · + · …` ; la page d'un besoin reprend la même logique avec `retour · titre · compteur · + · …`.
- Le hero d'un besoin reprend désormais la hiérarchie d'un tableau Pinterest : retour et options discrets, titre et métadonnées, coût mensuel total de Ma stack, puis les actions visuelles `Organiser` et `Ajouter`, sans fonction factice hors MVP. Le coût est calculé sur les outils uniques, même lorsqu'ils répondent à plusieurs besoins.
- Le hero d'un besoin est désormais un en-tête produit compact et continu : `retour → titre et compteurs → coût total → ajouter → options`. Il ne contient plus de grande zone vide ni de modules flottants. Sur mobile, le coût et l'ajout passent sur une seconde ligne.
- L'action globale `Gérer tous les besoins` reste dans le menu `…`, tandis que le crayon de chaque card corrige le rangement local.

Prochaine étape : mesurer les outils encore envoyés dans `À ranger`, puis extraire progressivement la logique restante de la grande page sans modifier l'expérience MVP.

## Contrat produit

### Job utilisateur

> Je sélectionne mes outils, je les range selon les besoins auxquels ils répondent, puis je visualise l'ensemble de ma stack par lots cohérents.

### Capacités indispensables

- Ajouter un outil à Ma stack.
- Créer ou choisir un besoin.
- Ranger un outil dans un ou plusieurs besoins.
- Corriger un classement proposé automatiquement.
- Déplacer ou retirer un outil.
- Lire la vue d'ensemble `besoin → lot d'outils`.

### Vocabulaire recommandé

- **Besoin** : le nom visible du groupe, par exemple `Créer des visuels`, `Gérer mes projets` ou `Facturer`.
- **Lot d'outils** : l'ensemble des outils rangés dans ce besoin.
- **À ranger** : les outils ajoutés qui n'ont pas encore de besoin confirmé.

Dans l'interface, le mot principal doit être `besoin`. Le mot `lot` peut servir à expliquer le contenu d'un besoin, mais ne doit pas créer un deuxième concept concurrent.

## Périmètre strict

Cette roadmap concerne uniquement :

- la sélection des outils ;
- les besoins et lots ;
- le rangement et le déplacement ;
- la vue d'ensemble Ma stack ;
- la persistance locale ;
- la fiabilité du parcours mobile et clavier.

Sont hors MVP :

- verdicts `Garder / Supprimer / Remplacer` ;
- optimisation automatique de stack ;
- détection avancée de doublons ;
- coût réel détaillé ;
- comptes et synchronisation serveur ;
- partage public ;
- recommandations sophistiquées ;
- scoring et IA générative ;
- analytics avancées.

## Historique avant refonte — problèmes désormais traités

Cette section conserve le diagnostic initial ayant guidé la refonte. Les écarts ci-dessous ont depuis été traités dans le socle MVP décrit dans `Avancement`.

### Ce qui est déjà aligné

- Ajout et retrait d'outils depuis les cartes et les fiches.
- Compteur global dans la navigation.
- Persistance locale et synchronisation entre onglets.
- Première vue d'ensemble en huit domaines.
- Cartes montrant le nom du domaine et quelques outils.
- Vue détaillée d'un domaine.
- Sélecteur contextuel permettant d'ajouter sans quitter Ma stack.
- Paramètre d'URL permettant d'ouvrir directement un domaine.

### Les écarts principaux

#### 1. Le rangement n'est pas enregistré

L'état actuel conserve seulement une liste d'identifiants d'outils. Il ne conserve ni les besoins, ni les affectations entre un outil et un besoin.

#### 2. Le classement est imposé

Le système range automatiquement chaque outil dans un seul des huit domaines à l'aide des données du catalogue et de règles internes. L'utilisateur ne peut pas corriger, déplacer ou confirmer ce classement.

#### 3. Un outil ne peut servir qu'un seul besoin

Dans la réalité, Notion peut servir à la documentation et au pilotage de projet, tandis que ChatGPT peut servir à la rédaction et à la recherche. Le MVP doit pouvoir exprimer cette multi-affectation sans dupliquer l'outil dans la stack globale.

#### 4. Le contexte d'ajout n'est pas garanti

Ajouter un outil depuis le lot `Organisation` ne garantit pas qu'il restera dans ce lot. Après l'ajout, la classification automatique peut l'envoyer ailleurs.

#### 5. Les besoins vides sont difficiles à démarrer

La vue principale affiche surtout les domaines contenant déjà des outils. Le bouton générique d'ajout renvoie au catalogue au lieu de permettre de créer un besoin puis de composer son lot directement.

#### 6. Des fonctions secondaires parasitent le cœur du MVP

Budget, suites, scoring, recommandations et nombreux filtres du sélecteur occupent une place importante alors que le geste essentiel `ranger dans un besoin` n'existe pas encore.

#### 7. La base technique est trop concentrée

La page principale mélange modèle de données, classification, recommandations, budget et rendu dans un fichier de plus de 2 400 lignes. Aucun test fonctionnel ciblé ne protège le parcours `Ajouter → Ranger → Voir`.

#### 8. Des problèmes UX restent à corriger

- cartes déclarées comme boutons et contenant d'autres boutons ;
- dialogue sans focus initial ni focus trap ;
- scroll de la page derrière le dialogue ;
- navigation mobile affichée au-dessus du dialogue ;
- hiérarchie de titres irrégulière ;
- petites cibles tactiles.

## Modèle minimal recommandé

### Besoin

```ts
type StackNeed = {
  id: string;
  name: string;
  order: number;
  source: "suggested" | "custom";
};
```

### Entrée de stack

```ts
type StackToolEntry = {
  toolSlug: string;
  needIds: string[];
  addedAt: string;
};
```

Un outil appartient une seule fois à Ma stack, mais peut être affiché dans plusieurs besoins grâce à `needIds`.

Si `needIds` est vide, l'outil apparaît dans `À ranger`.

### Suggestions de départ

Les huit domaines existants peuvent servir de besoins suggérés au démarrage. Ils ne doivent plus être des catégories imposées.

La classification actuelle peut proposer un besoin lors de l'ajout, mais l'utilisateur doit pouvoir :

- confirmer la proposition ;
- choisir un autre besoin ;
- créer un besoin ;
- sélectionner plusieurs besoins ;
- laisser temporairement l'outil dans `À ranger`.

## Parcours MVP cible

### Ajouter

1. L'utilisateur clique sur `Ajouter à Ma stack`.
2. L'outil rejoint la stack.
3. Une étape légère demande : `À quel besoin répond cet outil ?`
4. Le système présélectionne éventuellement un besoin suggéré.
5. L'utilisateur confirme, corrige ou choisit `Je rangerai plus tard`.

### Ranger

Depuis Ma stack, l'utilisateur peut :

- ouvrir `À ranger` ;
- affecter un outil à un ou plusieurs besoins ;
- déplacer un outil ;
- retirer un outil d'un besoin sans le supprimer totalement ;
- supprimer totalement l'outil de Ma stack ;
- créer, renommer et réordonner ses besoins.

### Voir

La vue d'ensemble affiche pour chaque besoin :

- son nom ;
- le nombre d'outils ;
- les logos et noms des outils ;
- une action simple pour ouvrir ou modifier le lot.

La page doit permettre de comprendre la stack sans ouvrir les fiches outils.

## Roadmap

### Phase 0 — Valider le cadre MVP

Durée indicative : une demi-journée à un jour.

- Valider `besoin` comme concept principal de l'interface.
- Valider que les besoins peuvent être proposés et personnalisés.
- Valider qu'un outil peut répondre à plusieurs besoins.
- Définir la différence entre `Retirer du besoin` et `Supprimer de Ma stack`.
- Retirer de la priorité MVP les verdicts, le coût détaillé et l'optimisation.

Critère de sortie : le parcours peut être résumé sans ambiguïté par `Je prends, je range, je vois`.

### Phase 1 — Construire le vrai modèle de rangement

Durée indicative : 2 à 3 jours.

- Versionner le format de stockage local.
- Ajouter les besoins et les affectations `outil ↔ besoins`.
- Autoriser plusieurs besoins par outil.
- Créer automatiquement `À ranger` pour les affectations non confirmées.
- Migrer sans perte la liste actuelle de slugs.
- Utiliser la classification actuelle pour préaffecter les outils existants.
- Ajouter des tests de migration, persistance et multi-affectation.
- Extraire le modèle et la persistance hors de la page principale.

Critère de sortie : après rechargement, chaque outil reste dans les besoins choisis ou dans `À ranger`.

### Phase 2 — Livrer les gestes essentiels

Durée indicative : 3 à 5 jours.

- Demander ou confirmer le besoin lors de l'ajout.
- Créer un besoin depuis Ma stack.
- Renommer et réordonner un besoin.
- Affecter un outil à plusieurs besoins.
- Déplacer un outil entre besoins.
- Retirer un outil d'un besoin sans le supprimer globalement.
- Supprimer clairement un outil de Ma stack.
- Permettre de composer un besoin vide sans passer par un détour confus dans le catalogue.
- Ajouter des retours visuels simples après chaque action.

Critère de sortie : l'utilisateur garde le contrôle total du rangement proposé par le système.

### Phase 3 — Simplifier la vue d'ensemble

Durée indicative : 2 à 3 jours.

- Faire de chaque carte la réponse à `Pour ce besoin, j'ai ces outils`.
- Afficher noms et logos sans dépendre uniquement d'un compteur.
- Donner une place visible à `À ranger` lorsqu'il contient des outils.
- Simplifier la vue détaillée autour du lot, sans reproduire une fiche catalogue.
- Reléguer ou masquer le budget tant qu'il détourne du job principal.
- Réduire le nombre d'actions `Ajouter` concurrentes.
- Conserver la classification automatique comme aide discrète.

Critère de sortie : la vue principale suffit pour expliquer oralement sa stack besoin par besoin.

### Phase 4 — Fiabiliser le MVP

Durée indicative : 2 à 3 jours.

- Ajouter des tests fonctionnels sur :
  - ajouter ;
  - ranger ;
  - multi-affecter ;
  - déplacer ;
  - recharger ;
  - retirer d'un besoin ;
  - supprimer de Ma stack.
- Corriger les contrôles interactifs imbriqués.
- Corriger le focus et le blocage du scroll du dialogue.
- Placer la navigation mobile sous le dialogue.
- Corriger titres et cibles tactiles.
- Tester 320, 390, 768, 1024 et 1440 px.
- Faire une recette courte avec 5 à 10 utilisateurs et des stacks de 5 à 20 outils.

Critère de sortie : aucun outil ne disparaît, aucun rangement n'est imposé et le parcours fonctionne sur mobile comme au clavier.

## Critères de réussite du MVP

- Depuis une stack vide, obtenir une vue utile en moins de trois minutes.
- Tout outil apparaît dans au moins un besoin ou dans `À ranger`.
- Aucun outil ne disparaît silencieusement.
- Tout classement automatique peut être corrigé.
- Un outil peut appartenir à plusieurs besoins sans être compté plusieurs fois dans la stack globale.
- L'utilisateur peut dire, depuis la vue d'ensemble : `Pour ce besoin, j'ai ce lot d'outils`.
- Les données restent intactes après rechargement.
- Le parcours ne bloque ni sur mobile ni au clavier.

## Priorisation stricte

### Maintenant

1. Besoins et affectations persistées.
2. Zone `À ranger`.
3. Correction et multi-affectation manuelles.
4. Parcours `Ajouter → Ranger → Voir`.
5. Tests du parcours essentiel.

### Après le MVP

- Budget détaillé et coûts réels.
- Doublons et optimisation.
- Verdicts de décision.
- Comptes et synchronisation.
- Partage et export.
- Recommandations avancées.
- Mesure produit approfondie.

## Ce que nous arrêtons pendant le MVP

- Refaire le hero sans améliorer le rangement.
- Ajouter des règles de scoring pour compenser l'absence de contrôle utilisateur.
- Imposer un domaine sans possibilité de correction.
- Confondre ajout global et ajout à un besoin.
- Ajouter des filtres avant de rendre le déplacement possible.
- Faire du budget la promesse principale de cette première base.
- Étendre le chantier aux pages publiques Stacks ou au diagnostic.

## Prochain chantier recommandé

Commencer par la Phase 1 : définir le nouveau format local, migrer les slugs actuels vers des entrées affectées aux besoins existants, créer `À ranger`, puis écrire les tests de persistance.

Une fois ce socle fiable, l'interface pourra enfin permettre à l'utilisateur de confirmer, corriger et composer ses lots.
