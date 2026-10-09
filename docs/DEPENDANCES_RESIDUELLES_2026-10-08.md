# Dépendances restantes — contre-audit du 8 octobre 2026

Audit actualisé sur `4f6c857ed5`, après publication de la projection navigateur. Ce lot conserve les dépendances et le code applicatif. Les versions proposées ci-dessous ne sont pas déclarées installées ou validées par un build.

## Résultat

| Vue npm | Total de paquets signalés | High | Moderate | Critical |
|---|---:|---:|---:|---:|
| Arbre complet | 17 | 11 | 6 | 0 |
| `--omit=dev` | 9 | 5 | 4 | 0 |

Les chiffres du premier audit sont confirmés. Ce sont des paquets signalés, propagation comprise, et non 17 vulnérabilités indépendantes. Aucune nouvelle correction compatible des branches utilisées n’a été identifiée pour clôturer ces chaînes. Les anciens bilans restent conservés dans [le rapport initial](DEPENDANCES_SECURITE_2026-10-08.md).

## Exposition et décision

| Chaîne | Présence dans ToolTrim | Décision |
|---|---|---|
| React Router 6.30.6 — 2 entrées moderate | Bibliothèque de navigation navigateur et SSR. `BrowserRouter`/`Routes` côté client, `StaticRouter` côté serveur. Pas de Data Router ni de `StaticRouterProvider`. | Priorité 1 : migration isolée vers 7.18.4, compatible React 18/Node 20 selon les métadonnées publiées. |
| Tailwind 3.4.19 — braces/chokidar/micromatch/fast-glob et parseur de sélecteurs | Compilation des patterns/CSS du dépôt. La vue npm production comprend des peers de build ; elle ne démontre pas leur exécution chez le visiteur. | Lot distinct. Pas de patch braces 3 au-delà de 3.0.3 ni de parseur 6 corrigé au-delà de 6.1.4 identifié. Tailwind 4 demande une comparaison du rendu complet. |
| SDK `@vercel/node` 5.10.2 — undici/busboy et ts-morph | Trois imports **de types** dans `api/contact.ts`, `api/submission-progress.ts`, `api/verify-badge.ts`. Aucun import runtime du SDK identifié dans ces handlers. | Réduire la dépendance de types dans un lot distinct, après ajout d’une recette des handlers. Le SDK latest publié, 23.0.0, dépend encore d’undici 5.28.4 et de ts-morph 12.0.0 : changer seulement sa version ne clôt pas ces chaînes. |

L’avis d’injection de constructeur lors de l’hydratation exclut explicitement le **mode déclaratif** utilisé ici : ce chemin n’est donc pas applicable à l’architecture constatée. L’avis de redirection concerne les chemins non fiables transmis aux mécanismes de navigation ; sa correction est publiée à partir de 7.18.0. Cette distinction réduit l’alerte d’hydratation à sa portée réelle sans masquer le rapport npm. Sources : [avis hydratation](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg), [avis navigation](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6).

Les navigations inspectées construisent principalement des chemins internes avec préfixe de langue et paramètres encodés. Le retour Explorer lit aussi `location.state.explorerReturnTo` avant `navigate` (`ExplorerPage.tsx:430`) ; sa provenance doit entrer dans la recette de migration. Cela ne constitue pas une démonstration d’exploitation distante : aucun parcours d’injection attaquant n’a été établi dans cet audit.

Braces est signalé pour des patterns profondément imbriqués ; le parseur pour un coût quadratique des sélecteurs. Les entrées de compilation sont celles du dépôt dans les usages inspectés ; aucune ingestion publique de patterns/CSS n’a été identifiée. Sources : [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [parseur](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). Ce constat n’atteste pas la configuration distante ou les futures sources de contribution.

## Lot suivant préparé : React Router 7

Le périmètre recommandé conserve React 18, Vite et le prerender actuel. Il migre la bibliothèque de navigation, sans adoption du framework React Router, sans réécriture des routes et sans changement des slugs/URL publiques.

1. Créer une copie isolée du commit publié et établir les tests des anciennes URL avant modification. Traiter explicitement `diagnostic/*` et `selector/*` : leurs redirections relatives `../ma-stack` peuvent être affectées par la nouvelle résolution des splats.
2. Vérifier les deux transitions pertinentes au mode déclaratif : `v7_relativeSplatPath` et `v7_startTransition`. Ne pas activer les flags de Data Router absent du projet. [Guide officiel versionné](https://github.com/remix-run/react-router/blob/react-router@7.18.4/docs/upgrading/v6.md).
3. Installer 7.18.4 dans cette copie, adapter l’import serveur `react-router-dom/server` au nouvel export et contrôler les imports/tests concernés. Le package 7.18.4 conserve les re-exports DOM mais n’exporte plus le sous-chemin `/server` ; le dossier `router-target.json` conserve les métadonnées exactes.
4. Exécuter tests applicatifs, SEO, Ma Stack, types, gate design et build. Comparer texte, liens, métadonnées, JSON-LD et sitemap générés ; tout écart fonctionnel/SEO doit être expliqué avant publication.
5. Recette sur HTML généré : 56 hydratations FR/EN, onglets des fiches, retour/précédent, filtres, recherche, Ma Stack, scroll et deep links. Ajouter les anciennes URL et les destinations non fiables à la couverture. Tester aussi le serveur dev pour les transitions/lazy imports.
6. Vérifier la disparition des deux entrées Router dans les audits avant/après. Les autres chaînes doivent rester visibles et documentées. Publication, CI et recette publique dans un second temps, une fois cette migration vérifiée.

Critère de sortie : avis Router supprimés par une version corrigée, routes et contenu SEO conservés, stockage/persistance inchangés, recette complète réussie. La migration n’est pas réalisée dans ce lot d’audit.

## Précondition du lot SDK

Les typechecks actuels couvrent `src` et la configuration Vite/Playwright ; **les trois handlers `api/*.ts` ne font pas partie de ces configurations explicites**. Avant une réduction du SDK, ajouter un contrôle TypeScript API et des fixtures locales des réponses/méthodes/corps/CORS, en neutralisant les envois Resend et les accès réseau. Une requête réelle envoyant un email n’est pas une recette nécessaire à cet audit.

Une réduction de types ne corrige pas automatiquement le runtime géré par Vercel. Ne pas remplacer arbitrairement undici 5 par une branche majeure avec un override. [Contrat officiel du runtime Node Vercel](https://vercel.com/docs/functions/runtimes/node-js).

## Preuves et limites

[Résumé/hash des packages](../output/tooltrim-dependencies-residual-2026-10-08/summary.json), [audit complet](../output/tooltrim-dependencies-residual-2026-10-08/audit-full.json), [audit omit-dev](../output/tooltrim-dependencies-residual-2026-10-08/audit-omit-dev.json), [cible Router](../output/tooltrim-dependencies-residual-2026-10-08/router-target.json), [SDK latest](../output/tooltrim-dependencies-residual-2026-10-08/vercel-latest.json).

Commandes exécutées : `npm audit --json`, `npm audit --omit=dev --json`, `npm explain undici/postcss-selector-parser/braces`, `npm view` des versions/prérequis ci-dessus. Les audits sortent avec le code 1 attendu lorsque des avis restent ouverts ; les fichiers JSON contiennent les résultats, sans erreur de collecte. Sources et usages locaux vérifiés en complément.

Ce lot n’a pas lancé de nouvelle recette runtime : le code et les packages sont identiques au commit publié. Les résultats de la CI précédente ne sont pas présentés comme validation d’une migration non réalisée. Les travaux locaux de catégories et de catalogue restent exclus.

## Suite — 9 octobre 2026

La migration Router 7.18.4 est publiée et vérifiée (`88d7f5d7a5`, CI et recette publique) : audits après migration à 15 entrées complètes et 7 omit-dev, zéro critique. Le snapshot initial ci-dessus reste historique. [Migration, limites et preuves](MIGRATION_REACT_ROUTER_2026-10-09.md). Les lots SDK et Tailwind restent séparés.

## Précondition SDK réalisée localement — 9 octobre 2026

Le contrôle strict API, 82 contrats de handlers et leur intégration aux commandes/CI sont ajoutés ; relecture indépendante terminée. Handlers et lockfile inchangés, aucun avis retiré par ce lot. La réduction SDK reste distincte. [Contrats, détection de régressions et limites](CONTRATS_API_2026-10-09.md). Lot local non publié.
