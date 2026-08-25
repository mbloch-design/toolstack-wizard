# Tooltrim — Roadmap active Ma stack + Explorer

> Mise à jour : 16 juillet 2026
>
> Statut : **Étape 0 terminée — Étape 1 à lancer**
>
> Ce document pilote l’ordre des travaux sur Ma stack et Explorer. La roadmap générale conserve l’historique du site ; le diagnostic possède sa propre roadmap.

## Cap produit

Tooltrim doit aider l’utilisateur à construire, comprendre et faire évoluer sa stack sans lui faire croire à une personnalisation que les données ne permettent pas encore.

Le produit repose désormais sur deux boucles complémentaires :

1. **Ma stack** : voir ses outils, les ranger par objectif, corriger le rangement et comprendre ce que chaque groupe permet de faire.
2. **Explorer** : partir d’un objectif ou d’un outil, suivre des relations explicables, zoomer d’outil en outil puis ajouter sans perdre le contexte.

La promesse MVP devient :

> Je comprends ma stack par objectif et je peux découvrir, autour de chaque outil, des alternatives, des extensions et des outils complémentaires, puis les ajouter au bon endroit sans perdre mon parcours.

## État actuel validé

### Ma stack

- Vue globale et vues par objectif.
- Ajout multiple dans une destination explicite.
- Organisation et suppression des outils.
- Déplacement des outils et des objectifs par glisser-déposer.
- Persistance locale et fallback `À ranger` lorsque le classement reste ambigu.
- Fiche outil ouverte sans perdre le contexte de la stack.
- Profil estimé et coût mensuel indicatif, sans dépendre encore d’un compte.

### Explorer

- Page dédiée et URL partageable selon la source, la destination et l’angle actif.
- Entrées depuis un objectif ou un outil.
- Navigation télescopique d’outil en outil avec historique navigateur.
- Source visuelle enrichie pour un outil et retour nommé selon l’origine.
- Cartes simplifiées : identité, description, navigation télescopique et ajout distinct.
- Filtres par tags sticky, inspirés de YouTube, avec débordement, flèches et centrage de l’élément actif.
- Terminologie actuelle : `Alternatives`, `Extensions`, `Outils complémentaires`.
- Chargement progressif avec skeleton loader.
- Responsive, clavier et `prefers-reduced-motion` pris en compte.

### Socle technique

- TypeScript, build, validation des design tokens et parcours Explorer passent sur l’état courant.
- 54 tests Ma stack passent lors de la dernière exécution complète connue.
- Le test diagnostic `marc-under-instrumented` échoue indépendamment de ce chantier : score `74`, seuil `80`.
- La CI ne lance pas encore la suite `npm test`, ce qui masque cette dette.

## Ce qui reste à prouver

- La qualité réelle des relations proposées, surtout dans les huit premiers résultats.
- La compréhension spontanée du clic principal d’une carte : « je zoome autour de cet outil ».
- La différence perçue entre alternatives, extensions et outils complémentaires.
- La qualité et la cohérence des descriptions, catégories, logos et images OG.
- L’utilité du parcours auprès d’utilisateurs réels, au-delà de la validation technique.
- Les performances avec un catalogue croissant et les gros bundles de données actuels.
- La mesure du parcours : profondeur d’exploration, retours, ajouts et abandons.

## Invariants produit

- Ne jamais présenter Explorer comme une recommandation personnalisée au profil.
- Toujours rendre la source et la destination compréhensibles.
- Le clic principal d’une carte change la source ; le bouton d’ajout change uniquement la stack.
- Un ajout avec destination fusionne l’objectif sans supprimer les affectations existantes.
- Sans signal fiable, ranger dans `À ranger` plutôt que d’inventer une destination.
- Ne jamais créer de doublon d’un même outil dans la stack.
- Préserver le header, la navigation latérale et l’axe stable des pages Ma stack.
- Conserver des transitions courtes de 150 à 220 ms et une version sans mouvement.
- Rester local-first tant que les comptes et la synchronisation ne sont pas lancés.

## Roadmap

| Étape | Objectif | Statut |
|---|---|---|
| 0 | Créer un checkpoint fiable et aligner documentation, Git et CI | **Terminé** |
| 1 | Rendre les relations d’exploration crédibles et explicables | Prochaine étape |
| 2 | Rendre la navigation télescopique évidente au clic et au retour | À faire |
| 3 | Renforcer le contenu des outils et la qualité du catalogue | À faire |
| 4 | Instrumenter le parcours et le tester avec de vrais utilisateurs | À faire |
| 5 | Optimiser les performances et durcir la préproduction | À faire |

## Étape 0 — Checkpoint et fiabilisation

### Travaux

- [x] Faire l’état des lieux produit, UX et technique.
- [x] Réorienter la roadmap Ma stack autour du pivot Explorer.
- [x] Rejouer la validation complète Ma stack + Explorer sur l’état final.
- [x] Décider du traitement du test diagnostic `marc-under-instrumented`.
- [x] Faire exécuter les tests Ma stack et exploration par la CI sans introduire une panne silencieuse.
- [x] Créer un commit de checkpoint limité aux fichiers suivis du chantier courant.
- [x] Synchroniser la branche distante après demande explicite.

### Résultat du checkpoint technique — 16 juillet 2026

- `npx tsc --noEmit` : PASS.
- `npm run validate:design-tokens` : PASS, aucune dette supplémentaire.
- `npm run test:ma-stack` : PASS, 54 tests sur 54.
- `npm run build` : PASS, y compris SSR, prerender et alias historiques.
- `npm run test:e2e:ma-stack` : PASS, 10 parcours sur 10 de 320 à 1920 px.
- `git diff --check` : PASS.
- Suite globale : 230 tests sur 231 passent. Le seul échec reste le scénario diagnostic GO14 `marc-under-instrumented`, avec un score de 74 pour un seuil attendu de 80.

Décision : ne pas masquer ni abaisser le seuil GO14 dans ce chantier. Cet échec reste une dette du diagnostic et ne remet pas en cause le checkpoint Ma stack + Explorer. La CI exécute désormais explicitement les 54 tests Ma stack et exploration ; l’intégration de toute la suite globale attend la correction du scénario GO14 dans sa roadmap dédiée.

### Critères de sortie

- Working tree du chantier propre et branche distante synchronisée.
- TypeScript, build, design tokens, tests Ma stack et parcours E2E Ma stack/Explorer validés.
- Échec diagnostic corrigé ou explicitement isolé avec une décision documentée.
- CI cohérente avec les validations réellement attendues avant mise en production.

## Étape 1 — Qualité des relations

### Travaux

- Formaliser les trois intentions : substituer, étendre, compléter.
- Constituer un jeu de référence d’environ 30 sources représentatives.
- Évaluer manuellement les dix premiers résultats de chaque source.
- Ajouter des relations éditoriales fortes pour les outils structurants.
- Conserver les heuristiques comme fallback, avec diversification et attribution de la source exacte.
- Éliminer les faux positifs dus à une catégorie trop large ou à un simple mot-clé commun.

### Critères de sortie

- Au moins 80 % des huit premiers résultats sont jugés crédibles dans le jeu de référence.
- Aucun faux positif critique dans les quatre premiers résultats.
- Chaque résultat peut expliquer sa relation sans promesse personnalisée.
- Une source objectif multi-outils identifie l’outil qui a produit le signal principal.

## Étape 2 — Micro-interactions télescopiques

### Travaux

- Donner un retour immédiat au clic sur toute la carte.
- Relier visuellement la carte choisie au nouveau module source.
- Inverser naturellement la transition lors du retour.
- Restaurer le focus et la position utiles lors d’un retour navigateur.
- Vérifier l’absence de conflit entre le clic télescopique et le bouton d’ajout.

### Critères de sortie

- Le changement de source est compris sans ajouter de texte explicatif.
- Quatre utilisateurs sur cinq comprennent qu’ils peuvent continuer à zoomer d’outil en outil.
- Retour, historique, clavier, tactile et réduction des mouvements produisent le même modèle mental.

## Étape 3 — Contenu et catalogue

### Travaux

- Donner à chaque outil une description courte qui explique concrètement ce qu’il permet de faire.
- Normaliser catégories, usages, verticales, groupes de substitution et relations plugin/hôte.
- Distinguer clairement outil, plugin, intégration et composant d’écosystème.
- Contrôler logos canoniques, images OG et fallbacks visuels.
- Détecter les fiches trop pauvres avant qu’elles n’entrent dans les premiers résultats.

### Critères de sortie

- Une carte permet de comprendre l’utilité de l’outil sans ouvrir sa fiche.
- Les données nécessaires au classement sont renseignées sur les outils prioritaires.
- Les visuels ne sont ni déformés ni trompeurs sur mobile et desktop.

## Étape 4 — Mesure et validation utilisateur

### Travaux

- Mesurer les entrées Explorer, changements de tag, changements de source, profondeur, retours, ajouts et sorties.
- Distinguer ajout explicite à un objectif et classement automatique.
- Tester le parcours complet avec au moins cinq utilisateurs cibles.
- Observer sans guider : trouver un outil, comprendre le lien, l’ajouter et revenir à la stack.

### Critères de sortie

- Quatre utilisateurs sur cinq terminent le parcours sans aide.
- Les erreurs de destination et les ajouts involontaires sont absents des tests.
- Les mesures permettent d’identifier où l’exploration devient utile ou se termine.

## Étape 5 — Performance et préproduction

### Travaux

- Découper les gros jeux de données et charger seulement ce qui est nécessaire au parcours courant.
- Réduire les bundles principaux et différer les données catalogue non visibles.
- Rejouer les parcours à 320, 768, 1280 et 1920 px.
- Auditer accessibilité, focus, historique, rechargements directs et états sans résultat.
- Aligner le pipeline de préproduction sur la définition de sortie MVP.

### Critères de sortie

- Pas de blocage perceptible lors du changement de source ou du chargement suivant.
- Aucun échec sur les parcours critiques Ma stack + Explorer.
- Budget de bundle défini puis surveillé en CI.
- Préproduction exploitable pour une session de test sans intervention technique.

## Hors périmètre actuel

- Recommandation personnalisée ou promesse de « meilleur outil pour votre profil ».
- Matching avancé fondé sur un volume de données encore insuffisant.
- Collaboration multi-utilisateur. Le compte facultatif et la synchronisation personnelle sont désormais implémentés ; leur configuration OAuth et leur recette multi-appareils restent à terminer.
- Conseiller IA autonome.
- Calcul financier précis lorsque les prix restent incomplets.
- Nouveaux filtres ou fonctionnalités qui ne servent pas directement la boucle stack-exploration-ajout.

## Prochaines actions concrètes

1. Terminer le checkpoint technique et Git de l’étape 0.
2. Construire le jeu de référence des relations avant de retoucher encore l’interface.
3. Lancer ensuite la passe de micro-interactions télescopiques sur des résultats devenus crédibles.

## Définition de sortie MVP

Le MVP Ma stack + Explorer est prêt lorsque :

- la stack est compréhensible et corrigeable ;
- l’exploration propose des relations crédibles et explicables ;
- le passage d’un outil au suivant est compris sans mode d’emploi ;
- un ajout conserve toujours la bonne destination et le contexte ;
- quatre utilisateurs sur cinq accomplissent le parcours sans aide ;
- les validations fonctionnelles, visuelles, d’accessibilité et de performance passent en préproduction.

## Dette suivie

- `CartPage.tsx` et `src/index.css` restent volumineux et devront être découpés après stabilisation du flux.
- Les données catalogue sont encore chargées dans des bundles trop importants.
- La CI couvre désormais les tests unitaires Ma stack et exploration, mais pas encore le parcours E2E navigateur ni la suite globale tant que GO14 reste rouge.
- L’historique Git récent contient des changements Explorer mêlés à un commit nommé pour la page outil ; le checkpoint doit restaurer une lecture claire de l’état courant.
