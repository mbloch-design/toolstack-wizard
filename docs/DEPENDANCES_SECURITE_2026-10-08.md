# ToolTrim — correctifs des dépendances, 8 octobre 2026

Statut : corrections locales, sans push ni déploiement dans ce lot.

## Résultat mesuré

| Audit npm | Avant | Après | Détail après |
|---|---:|---:|---|
| `npm audit --omit=dev` | 25 entrées | 9 entrées | 5 high, 4 moderate, 0 critical |
| `npm audit` complet | 53 entrées | 17 entrées | 11 high, 6 moderate, 0 critical |

Les trois entrées critiques de l'arbre complet ont disparu. Ces nombres comptent les paquets signalés, propagation aux dépendants comprise : ils ne représentent pas autant d'exploits indépendants. Aucun masquage d'avis ou `audit fix --force`.

`--omit=dev` inclut encore des outils de compilation déclarés production ou transitifs via des peers. Les cinq entrées high restantes de cette vue appartiennent à la chaîne Tailwind/globs de compilation ; le nombre ne décrit pas cinq vulnérabilités exécutées dans le navigateur.

## Changements

- DOMPurify 3.3.3 → 3.4.16 ; React Router DOM 6.30.1 → 6.30.6 et routeur Remix 1.23.4. React et React DOM restent en 18.3.1.
- Vite 5.4.19 → 6.4.4 ; plugins React 4.7.0 / SWC 3.11.0 compatibles ; PostCSS 8.5.29. Tailwind reste en version 3 (3.4.19).
- Vitest 3.2.4 → 4.1.11, compatible avec Vite 6 et Node 20 utilisé en CI. SDK Vercel 5.8.1 → 5.10.2, sans changement des handlers API.
- Mises à jour ciblées des dépendances indirectes : Babel, Rollup, lodash, nanoid, parseurs, glob/minimatch, ws, YAML, tar, ESLint et outils associés. Les mises à jour entraînent 197 changements de versions dans le lockfile ; ce sont des dépendances directes et leurs sous-arbres, pas un renouvellement arbitraire de toutes les bibliothèques produit.
- tsx et path-to-regexp deviennent des dépendances de développement explicites, car les scripts de build et les tests de routage les importent directement.
- Overrides limités à trois versions verrouillées : picomatch 2.3.1 → 2.3.2, path-to-regexp 6.1.0 → 6.3.0, AJV 8.6.3 → version corrigée de la même branche 8. Le SDK Vercel accepte une configuration valide et rejette une configuration invalide avec cet AJV.
- Types Node déclarés explicitement dans le projet qui vérifie aussi les tests et leurs imports serveur : Vitest 4 ne les expose plus implicitement. Les options TypeScript strictes restent inchangées.

## Recette

- `npm ci` sur le lockfile final dans une copie des fichiers commités : PASS ; aucun partage de node_modules avec le checkout initial.
- Après cette installation : 243 tests / 45 fichiers PASS ; typecheck app + node PASS.
- Contrats SEO : 16 PASS ; Ma stack : 93 PASS.
- Build SSR/client + prérendu : PASS ; sitemap 13 137 URL, audit Explorer 2 478 pages et budgets PASS. Artefact : 14 908 fichiers, 845,2 MiB.
- Chromium sur ce build local : 15/15 scénarios FR/EN PASS, dont navigation, tarifs, décisions et synchronisation multi-onglets.
- Démarrage automatique du serveur de développement Vite 6 : 6/6 régressions Chromium PASS ; typecheck du checkout courant également PASS.
- Les snapshots/catalogues régénérés et artefacts du build restent dans la copie isolée ; seules les dépendances, leur lockfile, le contrat de types et la documentation sont retenus.

## Alertes restantes et suite

- Tailwind 3 : braces ≤3.0.3 est encore signalé, avec propagation via chokidar, micromatch et fast-glob. Aucun correctif braces 3 publié lors de cette vérification. Le parseur de sélecteurs 6 reste également signalé, avec propagation via postcss-nested/typography. Les patterns et CSS sont ceux du dépôt ; aucune ingestion de CSS fourni par un visiteur n'a été identifiée. Cela réduit la surface exposée sans constituer une correction de ces avis. Une migration Tailwind 4 exige une recette de rendu du design complet.
- React Router 6.30.6 : deux avis moderate restent déclarés pour toutes les versions 6 dans la base npm, malgré les correctifs backportés de navigation. Aucun contournement du rapport : migrer vers la branche 7 corrigée dans un lot séparé, avec contrôle des routes, redirections, SSR et anciennes URL. Le chemin StaticRouterProvider/deserializeErrors cité par un avis n'est pas consommé par le rendu actuel ; les chemins de navigation doivent néanmoins rester considérés.
- SDK Vercel : undici 5.28.4 et sa dépendance busboy, ainsi que ts-morph/fast-glob, restent signalés dans les dépendances de développement. Les imports du SDK dans les trois handlers API sont des imports de types ; ce paquet n'est pas importé comme moteur HTTP de l'application. Ne pas remplacer aveuglément undici 5 par 6 via un override majeur. Une mise à niveau ou réduction du SDK est à isoler.
- Les avertissements de chunks volumineux et deux résumés llms absents restent visibles. Ce lot n'est pas une optimisation de taille ni une certification de l'infrastructure distante.

Sources : [React Router 6, changelog des backports](https://github.com/remix-run/react-router/blob/v6/CHANGELOG.md), [migration Vite 5 vers 6](https://v6.vite.dev/guide/migration.html), [avis braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [avis navigation React Router](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [avis hydratation React Router](https://github.com/advisories/GHSA-337j-9hxr-rhxg). Les bornes et bilans exacts sont ceux des fichiers JSON d'audit conservés sous `output/tooltrim-dependencies-2026-10-08`, pas une extrapolation du seul changelog.
