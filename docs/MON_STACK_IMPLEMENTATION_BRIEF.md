# Mon Stack — brief d’implémentation progressive

5 octobre 2026. Proposition à transmettre au modèle d’exécution. Aucune fonctionnalité décrite ici n’est livrée par ce document. Complète `MON_STACK_PRODUCT_DIRECTION.md`.

## Résultat recherché

À partir de quelques outils sélectionnés, comprendre leur contribution, examiner une capacité commune et identifier ce qui reste à vérifier avant un choix. La réussite se mesure à une décision mieux expliquée, pas au nombre d’outils ajoutés.

Première livraison : un Focus qui donne un rôle utile et jusqu’à trois relations expliquées à partir de faits vérifiés. La comparaison ciblée arrive ensuite, puis l’examen d’un candidat temporaire.

## Principe de passage à l’échelle

Décrire chaque outil une fois à l’aide d’un vocabulaire commun. Calculer ensuite les rapprochements utiles dans le stack sélectionné. Ne pas écrire un texte spécifique pour chaque paire du catalogue.

Séparer quatre niveaux :

| Niveau | Question | Exemple de vocabulaire proposé |
|---|---|---|
| Territoire | Où situer cet outil ? | Audio, Projets, Automatisation |
| Rôle | À quoi contribue-t-il principalement ? | Éditeur, bibliothèque de ressources, orchestrateur |
| Capacité | Quelle action précise permet-il ? | Enregistrer plusieurs pistes, déclencher une action sur événement |
| Relation | Que sait-on de son rapport à un autre outil ? | Capacité commune documentée, extension d’un hôte, inclusion dans une offre |

Les exemples sont des définitions proposées, pas des attributions vérifiées à des produits.

Un outil peut avoir plusieurs rôles et capacités, indépendamment de son emplacement principal dans la Map. Une capability doit correspondre à une action observable : « collaboration » est trop large pour justifier seule une comparaison. Éviter aussi une granularité telle que chaque produit crée ses propres capacités.

## Réutiliser l’existant

- `src/lib/stackUsage.ts` fournit territoires, classement et libellés d’usage. Conserver cette lecture ; isoler les nouvelles inférences dans un module testable.
- `functional_needs`, `covers` et `substitution_cluster_v2` servent à repérer des candidats à documenter. Leur présence ne valide pas automatiquement une capacité détaillée.
- `host_app`, `bundle_parent` et les références d’alternatives sont des pistes de relations explicites à qualifier. Un hôte renseigné ne prouve pas son exclusivité ; un bundle catalogue ne prouve pas une licence possédée.
- Réutiliser `CartPage`, `StackToolInspector`, `ToolLogo`, le stockage du stack et les composants de provenance disponibles.
- Vérifier les différences entre données résumées et fiches complètes : une propriété absente de l’index ne doit pas devenir une absence fonctionnelle.
- Garder une seule source canonique pour les faits du catalogue. Avant d’ajouter un stockage, identifier le chemin actuel d’édition, validation et publication. Une projection de lecture est acceptable ; une seconde base de faits éditée indépendamment ne l’est pas.

## Contrat de données proposé

À adapter aux contrats de provenance existants après inspection, sans migration improvisée.

1. **Registre de capacités** : identifiant stable, libellés FR/EN, définition courte, domaine, aliases historiques, version. Les synonymes convergent vers le même identifiant ; des capacités différentes restent distinctes.
2. **Rôles d’un outil** : identifiants de rôle, phrase éditoriale courte FR/EN, références des faits qui la justifient.
3. **Faits outil–capacité** : identifiant canonique de l’outil, capacité, assertion `supported` ou `unsupported`, conditions éventuelles (plan, plateforme, version), preuves, date de vérification, statut de revue `draft`, `verified` ou `needs_review`.
4. **Relations explicites** : source, cible, type, direction, conditions et preuves. Réservées aux relations qui ne se calculent pas à partir des capacités : hôte, inclusion dans une offre, intégration documentée, alternative éditorialement qualifiée pour une tâche.
5. **Preuves** : URL officielle précise et passage ou référence qui soutient l’assertion, date, périmètre. Réutiliser le dispositif existant si disponible.

L’absence de fait produit `unknown` dans la lecture, jamais `unsupported`. Une absence explicite demande une preuve aussi solide qu’une présence. Une source qui ne mentionne pas une fonction ne suffit pas à prouver son absence.

Un fait expiré selon la politique du domaine, contradictoire ou non vérifié ne peut pas alimenter une conclusion affirmative. Conserver son historique et signaler le besoin de revue. Ne pas lancer une vérification de toutes les sources à chaque consultation utilisateur.

## Moteur de lecture

Entrées : outils sélectionnés, outil consulté ou candidat, faits vérifiés, tâche facultative. Sortie structurée : rôle, capacités communes, faits documentés pour chaque outil, conditions, inconnues et relations explicites. Chaque résultat conserve ses identifiants de faits pour expliquer sa provenance.

Règles :

- Deux faits compatibles attestant la même capacité autorisent « capacité commune documentée ». Ils ne prouvent ni équivalence de qualité, ni remplacement complet, ni doublon.
- Une capacité attestée pour A et inconnue pour B produit « documentée pour A ; à vérifier pour B ». Ne pas appeler cela un avantage exclusif ou un ajout certain.
- Une condition de plan ou de plateforme est affichée. Si la situation personnelle n’est pas connue, ne pas affirmer que cette capacité est disponible pour cette personne.
- Une relation hôte/extension conserve sa direction. Ne jamais transformer cette relation en alternative.
- Deux rôles différents peuvent être décrits côte à côte. Ne pas en déduire une intégration ou une chaîne de travail opérationnelle.
- Une catégorie ou un cluster commun seuls restent une proximité de classement ; ils ne génèrent pas une explication détaillée.
- Sans faits suffisants, garder le Focus actuel et un état discret « Comparaison détaillée non documentée ». Aucun contenu artificiel pour remplir le bloc.

Affichage : relations explicites pertinentes, puis capacités communes précises, avec ordre stable et trois résultats maximum par défaut. Une tâche choisie filtre les capacités concernées. Les génériques comme « collaboration » ne doivent pas connecter tout le catalogue.

Calculer seulement pour les outils sélectionnés et le candidat consulté, avec un index par capacité si nécessaire. Ne pas précalculer toutes les paires du catalogue. Charger les faits utiles sans télécharger toutes les fiches complètes.

Le moteur et les phrases de restitution sont déterministes. Aucune requête LLM nécessaire à l’ouverture du Focus. Le modèle aide à préparer les données en amont ; la validation et les conditions de publication restent explicites.

## Pilote transversal

Le pilote précédent ciblait les créatifs. Pour vérifier la généralité du modèle, proposer 15 outils déjà présents, répartis en trois ensembles :

- Création : After Effects, Motion Array, Red Giant, Audacity, ZBrush.
- Travail et organisation : Notion, Miro, Slack, Dropbox, Calendly.
- Automatisation et assistants : Make, Zapier, Typeform, ChatGPT, Claude.

Résoudre leurs identifiants canoniques avant l’enrichissement. Ces ensembles testent le modèle ; ils ne prétendent pas que leurs outils sont tous comparables. Documenter seulement les capacités utiles à quelques questions concrètes, environ trois à cinq par outil comme cible initiale, sans quota obligatoire.

Première collecte : trois outils de familles différentes pour éprouver le schéma ; puis lots de quatre à six. Les cas de dépendance, de condition commerciale et de données manquantes doivent être représentés dans les tests, avec fixtures synthétiques lorsque les faits réels ne sont pas encore vérifiés.

Critère de scalabilité : ajouter ensuite un outil documenté d’une autre famille par des données et éventuellement du vocabulaire, sans ajouter une branche React spécifique à son nom. Une nouvelle capacité légitime peut nécessiter une définition ; elle ne doit pas nécessiter un nouveau composant.

## Lots à confier séparément au modèle d’exécution

### Lot 1 — Contrats, adaptateur et règles

Livrer registre initial, types, validation, adaptateur vers le catalogue et moteur pur avec fixtures synthétiques clairement séparées des données publiables. Cartographier le chemin de publication existant avant de choisir le stockage des faits. Ne pas modifier le schéma distant dans ce lot.

Tests nécessaires : synonymes, inconnu versus absence, conditions incompatibles, source non vérifiée, relation dirigée, données partielles, ordre stable, outils de domaines différents. Aucune logique nominative par produit dans les composants.

### Lot 2 — Enrichissement borné

Auditer les trois premiers outils, puis les autres en petits lots. Pour chaque fait, rendre la source officielle, le passage justificatif, les conditions et le statut de revue. Les résumés actuels et connaissances du modèle servent à chercher, pas à certifier.

Livrer données et rapport compact des inconnues/conflits. La validation de structure ne certifie pas l’exactitude des sources : contrôler aussi le soutien réel de chaque affirmation. Garder les propositions non étayées hors de la projection publiée. Ne pas étendre au reste du catalogue dans ce lot.

### Lot 3 — Une contribution utile dans le Focus

User story : « En tant que freelance, je veux comprendre le rôle de cet outil et son lien précis avec mes autres outils, afin de savoir ce que chacun apporte. »

Afficher une phrase de rôle et jusqu’à trois relations expliquées, avec provenance accessible. Réutiliser les comportements du Focus, navigation, mobile et retour au stack. Conserver un état utile sans enrichissement. Pas de nouveau dashboard.

Acceptation : les explications nomment une capacité ou une relation attestée, les conditions sont visibles, les inconnues ne deviennent pas des absences. Aucun changement silencieux de sélection.

### Lot 4 — Comparaison ciblée

User story : « Pour une tâche donnée, je veux comprendre ce qui est documenté pour chacun de ces deux outils afin d’identifier mes critères de choix. »

Présenter trois à cinq critères utiles, avec les trois états : documenté, absence documentée, à vérifier. Utiliser le même moteur. Ne pas créer un classement global, un score de doublon ou un gagnant sans critères personnels.

### Lot 5 — Examiner avant d’ajouter

User story : « Avant d’enregistrer un outil, je veux examiner ce qu’il pourrait apporter à ma sélection actuelle. »

Candidat temporaire depuis la fiche ou Explorer ; retour sans modification du stack ; ajout explicite. Dire « pas encore documenté parmi vos outils » lorsque les données existantes sont incomplètes, jamais « vous ne pouvez pas le faire ».

Les lots 4 et 5 commencent après vérification de l’utilité du lot 3. Les parcours par tâche, comptes, dépenses, connexions aux abonnements et recommandations automatiques restent hors de ce périmètre.

## Vérification de la valeur

Avec cinq personnes, faire examiner un petit stack puis un choix concret. Demander ce qu’elles comprennent de plus, quelle décision elles prendraient et quelle information manque. Observer les justifications avant/après sans suggérer la réponse.

Signal attendu : capacité à expliquer une coexistence, à écarter une fausse équivalence ou à identifier un critère décisif. Si la sortie paraphrase simplement les catégories, améliorer les faits et les critères avant d’ajouter une nouvelle interface.

## Prompt prêt à transmettre — premier lot uniquement

> Travaille sur le lot 1 de docs/MON_STACK_IMPLEMENTATION_BRIEF.md. Lis AGENTS.md, docs/MON_STACK_PRODUCT_DIRECTION.md, les docs Ma Stack et les contrats du catalogue concernés. Inspecte l’état Git ; préserve les travaux en cours. Implémente le registre, les contrats, l’adaptateur et le moteur déterministe avec des fixtures synthétiques isolées. Réutilise la source canonique ; documente le raccordement de publication sans modifier de schéma distant. functional_needs, covers et les clusters sont des indices, pas des faits détaillés automatiquement vérifiés. Une donnée manquante reste inconnue. Aucune inférence de doublon, d’économie, de licence détenue ou d’intégration. Aucune branche UI par nom d’outil et aucun appel LLM au runtime. Écris les tests des invariants du brief, lance les vérifications pertinentes et le build. Mets à jour la documentation de ce lot. Termine par fichiers modifiés, résultats des vérifications et limites précises. Ne lance pas les lots suivants, ne publie pas et ne déploie pas.

Pour chaque lot suivant, transmettre son numéro, son périmètre et ses critères d’acceptation, avec le même document comme référence. Garder les demandes courtes ; éviter de faire redéfinir la stratégie à chaque exécution.
