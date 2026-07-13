# Tooltrim — Direction MVP Ma stack

Mise à jour : 2026-07-13
État : **P0/P1 terminés — prêt pour recette utilisateurs**

## Livraison P0/P1 — 13 juillet 2026

- 49 tests Ma stack passent : état, persistance, hook, rangement et coût.
- Le benchmark fixe de 100 outils couvre les huit besoins et passe les seuils MVP.
- 201 contrôles de pertinence des sélecteurs passent.
- 9 parcours navigateur protègent `Ajouter → Ranger → Voir → Corriger`, le rechargement et les suppressions.
- Les largeurs 320, 390, 768, 1024 et 1440 px sont vérifiées sans débordement.
- La persistance possède une copie locale valide, une récupération après corruption et un état d'erreur visible.
- Le coût distingue désormais `Gratuit`, `Prix inconnu` et `À partir de…` et reste dédupliqué.
- L'ajout global et contextuel utilise le même sélecteur intégré, avec état `Ajouté`.
- Les cartes expliquent le rôle contextuel et ne montrent plus le prix dans un besoin.
- La correction est réversible ; la suppression est secondaire et confirmée.

## Cap produit

Ma stack permet de :

1. prendre les outils que l'on utilise ;
2. laisser Tooltrim les ranger par besoin ;
3. comprendre immédiatement ses lots d'outils ;
4. corriger les exceptions sans refaire tout le rangement.

La promesse reste :

> Pour tel besoin, j'ai ce lot d'outils.

Les quatre gestes du MVP sont : **ajouter, ranger, voir, corriger**.

## Mindset produit

- L'automatisation est la règle ; la correction manuelle est l'exception.
- La vue d'ensemble doit rester plus importante que la fiche détaillée.
- Un outil existe une seule fois dans Ma stack, même s'il répond à plusieurs besoins.
- Un doute de classement doit produire `À ranger`, jamais un mauvais classement affirmatif.
- Une nouvelle fonction n'entre dans le MVP que si elle améliore directement `Ajouter → Ranger → Voir → Corriger`.
- La navigation globale, le header et le gabarit de la fiche sont désormais figés.

## Point d'étape

### Ce qui est réellement construit

#### Socle et persistance

- Format local versionné `v2`.
- Migration des anciennes listes de slugs sans suppression préalable.
- Besoins suggérés et besoins personnalisés.
- Création, renommage, réordonnancement et suppression des besoins personnalisés.
- Affectation d'un outil à plusieurs besoins.
- Distinction entre classement `pending`, `auto` et `manual`.
- Une correction manuelle n'est jamais écrasée par le moteur.
- Suppression d'un besoin sans suppression de ses outils.
- Synchronisation de l'état entre les onglets du navigateur.

#### Rangement autonome

- Classement fondé dans cet ordre sur : outil connu, signaux structurés, catégorie, texte.
- Les classements de faible confiance restent dans `À ranger`.
- Les cas ambigus ne sont pas forcés dans le premier besoin trouvé.
- Confirmation du besoin choisi après classement automatique.
- Correction possible vers un ou plusieurs besoins.

#### Parcours et interface

- Vue globale en tableaux : quatre colonnes puis adaptation responsive.
- Tableaux de hauteur régulière avec piles de logos et compteur `+N`.
- `À ranger` traité comme un tableau normal et placé en dernier.
- Ajout contextuel depuis un besoin sans quitter Ma stack.
- Sous-page d'un besoin organisée en sous-sections.
- Fiche outil pleine page avec sidebar de contexte Ma stack.
- Navigation précédent/suivant entre les outils d'un même besoin.
- Coût calculé sur les outils uniques, sans double comptage multi-besoins.
- Correction du rangement accessible depuis les tableaux, les cartes et la fiche.
- Navigation globale et recherche identiques au reste du site.

#### Preuves existantes

- 16 tests unitaires du modèle et de la persistance.
- 19 tests du moteur de classement automatique.
- 201 contrôles de pertinence des sélecteurs de besoins.
- Vérifications manuelles desktop et mobile, notamment à 390 px.

### Ce qui n'est pas encore prouvé

- Cinq utilisateurs réels n'ont pas encore exécuté le scénario complet sans aide.
- Le temps réel pour obtenir une stack utile de dix outils n'est pas encore mesuré.
- Le benchmark de 100 outils protège le moteur, mais ne remplace pas l'observation des exceptions propres à chaque stack.
- Le besoin d'un compte et d'une synchronisation n'est volontairement pas validé.

## Décisions figées

### Interface

- Vue globale : tableaux Pinterest-like, quatre colonnes sur grand écran.
- Sous-page : sous-sections verticales et cartes compactes.
- Fiche outil : pleine page avec sidebar droite Ma stack ; carte de contexte inline sur mobile.
- `À ranger` : toujours en dernier et réservé aux cas incertains.
- Organisation : boutons discrets, correction locale, pas de glisser-déposer au MVP.

### Rangement automatique

- Le moteur choisit un besoin principal uniquement lorsque la confiance est suffisante.
- Les cas ambigus restent dans `À ranger`.
- L'affectation automatique à plusieurs besoins ne sera ajoutée que si le benchmark montre un gain net sans créer de bruit.
- La correction manuelle reste prioritaire et définitive.

### Données

- Le MVP reste local-first.
- Aucun compte ou backend de synchronisation avant validation de l'usage.
- Le coût reste indicatif et secondaire.

## Roadmap réorientée

### Étape 1 — Fiabiliser le cœur

Priorité : **P0**
Statut : **terminé le 13 juillet 2026**.

#### 1. Tests de bout en bout

Automatiser dans un vrai navigateur :

1. stack vide → ajout global → classement automatique → vue d'ensemble ;
2. ajout depuis un besoin → outil visible dans le bon lot ;
3. outil incertain → `À ranger` → correction ;
4. multi-affectation → outil affiché dans plusieurs besoins mais compté une fois ;
5. rechargement → besoins, ordre et affectations conservés ;
6. retrait d'un besoin → outil conservé dans Ma stack ;
7. suppression de Ma stack → outil et affectations supprimés ;
8. besoin personnalisé supprimé → outils orphelins renvoyés dans `À ranger`.

#### 2. Sécuriser la persistance locale

- Intercepter les échecs d'écriture et de quota.
- Conserver une dernière copie locale valide.
- Détecter un état corrompu.
- Proposer une récupération explicite au lieu d'afficher silencieusement une stack vide.
- Tester ces états d'échec.

#### 3. Benchmarker le rangement automatique

- Constituer un jeu fixe de 100 outils représentatifs des huit besoins.
- Définir pour chaque outil : besoin principal acceptable, besoins secondaires éventuels ou `À ranger`.
- Mesurer séparément : bons classements, mauvais classements affirmatifs et cas non classés.
- Corriger uniquement les erreurs révélées par ce benchmark.

Objectifs :

- au moins 85 % de classements acceptables sans correction ;
- moins de 5 % de mauvais classements affirmatifs ;
- moins de 25 % des outils envoyés dans `À ranger`.

#### 4. Rendre le coût honnête

- Distinguer `Gratuit`, `Prix inconnu` et `À partir de…`.
- Renommer le total `Coût mensuel estimé`.
- Indiquer discrètement le nombre de prix non renseignés.
- Ajouter un test de déduplication du coût pour les outils multi-besoins.

Critère de sortie : aucun parcours essentiel ne perd, ne duplique ou ne masque un outil après rechargement.

### Étape 2 — Terminer l'ergonomie du parcours essentiel

Priorité : **P0 puis P1**
Statut : **terminé le 13 juillet 2026**.

#### 1. Unifier l'ajout

- Utiliser le même sélecteur intégré depuis la vue globale et depuis un besoin.
- Ne plus renvoyer au catalogue pour une action d'ajout Ma stack.
- Afficher le rôle ou le besoin suggéré dans les résultats.
- Après clic, conserver la ligne avec l'état `Ajouté` puis afficher son rangement.

Objectif : `Ajouter → Rangé → Visible` en moins de trois secondes et sans changement de contexte.

#### 2. Faire expliquer les cartes

Chaque carte d'un besoin doit répondre à :

> À quoi cet outil me sert-il ici ?

Contenu cible :

- nom ;
- type discret ;
- description courte ;
- rôle contextuel `Sert à…` ;
- prix uniquement dans la fiche outil.

#### 3. Alléger la correction

- Besoins cochés au centre de l'action.
- `Enregistrer` comme action primaire.
- `Mettre à ranger` comme action secondaire.
- Suppression dans `…`, avec confirmation.
- Retour de confirmation avec possibilité d'annuler.

#### 4. Finir clavier et mobile

- Focus initial, boucle clavier, fond bloqué et focus restauré dans le sélecteur.
- Cartes mobiles horizontales de 110 à 130 px.
- Cibles tactiles d'au moins 44 px.
- Vérification à 320, 390, 768, 1024 et 1440 px.

Critère de sortie : la page d'un besoin est comprise sans ouvrir une fiche, et le parcours complet fonctionne au clavier comme au tactile.

### Étape 3 — Valider avec de vrais utilisateurs

Priorité : **prochaine étape, avant toute extension**
Durée indicative : 1 à 2 jours de préparation, puis recette.

Tester avec 5 à 10 personnes possédant des stacks de 5 à 20 outils.

Scénario :

1. démarrer avec une stack vide ;
2. ajouter dix outils ;
3. expliquer la vue obtenue ;
4. corriger un outil ;
5. affecter un outil à deux besoins ;
6. recharger et retrouver l'ensemble.

Mesures :

- temps jusqu'à la première stack utile ;
- taux de classements conservés sans correction ;
- nombre d'outils laissés dans `À ranger` ;
- réussite sans aide de l'ajout, de la correction et du retour à la vue globale ;
- compréhension de la règle de coût unique.

Critère de sortie : au moins 4 utilisateurs sur 5 terminent le parcours sans aide et peuvent expliquer leur stack besoin par besoin.

## Ordre exact des prochains chantiers

1. Faire la recette avec 5 utilisateurs possédant 5 à 20 outils.
2. Mesurer temps de mise en place, corrections et compréhension des lots.
3. Corriger uniquement les blocages observés par plusieurs utilisateurs.
4. Rejouer les 49 tests, le benchmark, les 201 contrôles et les 9 parcours navigateur.
5. Décider seulement ensuite si un compte et une synchronisation sont nécessaires.

## Définition de sortie du MVP

Le MVP est prêt lorsque :

1. ⏳ une stack utile de dix outils est obtenue en moins de trois minutes ;
2. ✅ au moins 85 % des classements du benchmark sont acceptables sans correction ;
3. ✅ les parcours essentiels passent automatiquement après rechargement, sans perte ni duplication ;
4. ✅ aucun blocage n'existe sur les largeurs cibles ni au clavier ;
5. ⏳ au moins 4 utilisateurs sur 5 réussissent le scénario sans aide ;
6. ⏳ la vue globale suffit à des utilisateurs réels pour dire : `Pour ce besoin, j'ai ce lot d'outils`.

## Après le MVP

- Comptes et synchronisation multi-appareils.
- Partage ou export de stack.
- Coûts réels et gestion détaillée des abonnements.
- Détection de doublons.
- Suggestions de remplacement et optimisation.
- Recommandations avancées.
- Mesure produit automatisée.

## Ce que nous arrêtons maintenant

- Refaire le hero, les tableaux, les cartes, la fiche outil ou la navigation globale.
- Ajouter de nouveaux blocs de contenu à la fiche outil.
- Ajouter du scoring, des filtres ou des règles automatiques sans benchmark.
- Ajouter du glisser-déposer.
- Étendre Ma stack aux pages publiques, au diagnostic ou aux stacks éditoriales.
- Commencer les comptes, le partage, le budget détaillé ou l'optimisation.
- Refactorer tout `CartPage` avant d'avoir sécurisé le parcours.

## Dette technique autorisée

`CartPage.tsx` et `index.css` restent trop volumineux. Cela ne justifie pas une réécriture avant validation du MVP.

Extraire uniquement quand un chantier touche déjà la zone concernée :

- configuration des besoins et sous-sections ;
- calcul du coût ;
- sélecteur d'outils ;
- dialogue de correction ;
- fiche outil.

Chaque extraction doit conserver le comportement et ajouter ou maintenir les tests associés.
