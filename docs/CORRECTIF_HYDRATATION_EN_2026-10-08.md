# Parité d'hydratation des fiches EN — 8 octobre 2026

## Cause et correction

Le serveur rend la fiche avec l'objet outil complet, mais `stripUnservedLocale` supprimait ses champs FR dans le bootstrap anglais. Ces champs servent encore aux conditions d'affichage (`shortDescription`), au statut gratuit/payant (`pricing`) et au score historique (`pros`, `cons`, `pricing.free`). Notion EN perdait notamment son sous-titre après hydratation, avec des erreurs React #418/#422.

Le bootstrap EN conserve désormais l'objet complet. La projection FR reste inchangée, avec ses traductions de secours. Les deux chemins du prérendu (fiche et sous-pages) utilisent le même correctif. Aucun changement du catalogue, des composants, des prix ou du HTML serveur.

## Vérifications

- Test rouge avant correction : Notion EN perd son sous-titre présent dans le HTML sans JavaScript.
- 28 tests Chromium sur sept outils, FR/EN, présentation/prix : présence du bootstrap, contenu conservé, absence d'erreurs d'hydratation, changement d'onglet par React sans requête de document.
- 56 routes : le renderer compilé, alimenté uniquement par le bootstrap livré, reproduit exactement l'arbre HTML généré (présentation, prix, alternatives, avis).
- 248 tests applicatifs, 22 contrats SEO/compactage et TypeScript app/node PASS.
- Build complet PASS : 13 137 URL SEO, 2 478 pages Explorer, 13 162 documents compactés avec contrôle d'équivalence.
- Comparaison avec quatre pages de production avant correction : contenu rendu, métadonnées et JSON-LD équivalents ; les valeurs déjà présentes dans le bootstrap restent identiques. Seuls les champs FR manquants sont rétablis sur Notion EN.
- Relecture indépendante : correction validée ; test renforcé pour prouver la navigation React et configuration dédiée au HTML généré.

Les tests couvrent un échantillon de sept outils sans état Ma stack préenregistré, pas chaque interaction de tout le catalogue. Le contrôle des tokens de design présente toujours la dette documentée dans le rapport de compactage ; aucun fichier de style ou composant n'est modifié par ce correctif.

## Recette publique et autre cas repéré

Correctif `244d7a9d52` déployé et vérifié : quatre HTML publics correspondent exactement à l'artefact local ; robots et sitemap répondent 200. Les **28 parcours FR/EN en production passent** sans erreur d'hydratation, avec navigation React.

La première recette publique échouait sur cinq navigations déclenchées immédiatement après le chargement. Le test attend désormais la classe de révélation installée par l'effet de montage de ToolDetailPage avant de cliquer ; le contenu et les erreurs restent contrôlés. La préférence de mouvement est explicite. Cette attente ne modifie pas l'état initial du produit.

Une sonde distincte avec un outil déjà épinglé en localStorage révèle encore des erreurs #418/#422 sur Notion FR/EN. `useStackPins` lit cet état pendant son initialisation, alors que le SSR ne connaît pas la stack locale : le bouton et son icône diffèrent au premier rendu. Ce cas préexistant, distinct de la projection EN, reste à corriger. Il devient la prochaine priorité avant la réduction de nouveaux champs.

## Poids et recette reproductible

Artefact : **830,4 MiB**, dont **718,8 MiB de HTML**, contre 820,6 / 709,0 MiB avant correction. Les 9,8 MiB rétablis servent à conserver le rendu et les calculs ; les budgets existants de 836 / 721 MiB passent sans modification. Le compactage retire toujours 24,62 MiB de formatage documentaire.

```sh
npm run build
npm run test:e2e:hydration
```

La configuration dédiée sert les fichiers `dist/**/index.html` sur les URL propres. Le serveur de développement et Vite preview ne constituent pas une recette fiable de ces fichiers prérendus. Pour tester une publication : `PLAYWRIGHT_BASE_URL=https://tooltrim.com npm run test:e2e:hydration`.

Preuves de parité et d'équivalence : `output/tooltrim-hydration-fix-2026-10-08/`.

Prochains lots séparés : parité du rendu avec Ma stack déjà enregistrée, puis retrait des sept champs historiques candidats de l'audit après vérification de leurs parcours interactifs. Aucune suppression appliquée ici.
