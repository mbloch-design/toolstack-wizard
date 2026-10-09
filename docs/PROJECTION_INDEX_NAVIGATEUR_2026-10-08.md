# Projection de l’index navigateur — 8 octobre 2026

Correctif publié sur `main` et vérifié en production, commit applicatif `81f44da6e0`. Les preuves locales ci-dessous sont complétées par la recette publique en fin de rapport.

## Résultat

Le build navigateur ne transporte plus les **109 lignes déjà exclues par le hook**. Les 1 239 lignes visibles conservent exactement tous leurs champs et leur ordre. La source complète reste à 1 348 lignes : aucun outil, prix, relation ou traduction n’est supprimé des fichiers catalogue.

| Mesure du module réellement construit | Avant | Après | Gain |
|---|---:|---:|---:|
| JavaScript décodé | 1 520 530 octets | 1 419 554 octets | 100 976 octets |
| gzip niveau 9 | 342 193 octets | 325 335 octets | 16 858 octets, **4,93 %** |
| Transfert Chromium sur serveur local gzip, en-têtes compris | 342 457 octets | 325 599 octets | 16 858 octets |

La compression du CDN peut différer. Cette mesure ne démontre pas un gain de temps d’interaction ou de Core Web Vitals. Le module caché conserve le comportement habituel des assets Vite hachés.

## Modification

- `src/lib/toolVisibility.ts` centralise les 113 exclusions identiques auparavant dupliquées dans le hook et le prerender. 109 sont présentes dans l’index actuel.
- `scripts/lib/browser-tool-index.ts` filtre le JSON avant le plugin JSON natif de Vite, uniquement pour le build navigateur. La configuration le place avant React. Aucun fichier dérivé éditable n’est ajouté.
- Le bundle SSR, le mode développement, les générateurs et les lectures de source conservent l’index complet. Le hook conserve son filtre défensif après le merge distant.
- Les tests de contrat SEO et la sonde historique importent/lisent la règle commune. Les seuils SEO et la baseline design restent identiques.

## Vérification

Une fixture construite avec Vite a d’abord échoué sur le transport des alias, puis passé avec le correctif. Elle vérifie la conservation des champs futurs, des prix natifs, des relations et de la source ; le test SSR conserve toutes les lignes, y compris un alias avec seulement un identifiant.

Le build et le rendu ont été exécutés dans une copie isolée de `2cba214536`, avec les seuls fichiers du correctif ajoutés. Les changements locaux de catégories et les exports non suivis sont exclus de cette preuve.

- 251 tests applicatifs, 23 contrats SEO, 99 tests Ma Stack, types application/node, gate design et budgets d’artefact : PASS.
- Import des deux modules réellement émis : égalité complète des 1 239 objets conservés, dans le même ordre.
- **13 162 HTML** identiques après normalisation des seuls noms hachés des fichiers JavaScript ; textes, liens, métadonnées, styles et JSON-LD conservés. Sitemap identique ; SHA-256 des trois sources catalogue identiques.
- **56 parcours d’hydratation FR/EN** sur l’HTML généré : PASS en 4,7 minutes, avec sélection vide/enregistrée, prix, navigation secondaire et rechargement.
- **20 comparaisons de rendu** : cinq parcours (outils, catégorie Communication, Explorer, Ma Stack et guide pilier designer), deux langues, deux largeurs (390/1 440 px). Textes de `main`, liens et JSON-LD identiques ; zéro erreur `pageerror` ; sélection sauvegardée inchangée. Ouverture des filtres outils/catégorie et de l’inspecteur Figma vérifiée. Le transfert de l’index est mesuré dans chaque contexte froid Chromium avec gzip local.

Les appels Supabase sont neutralisés dans ces comparaisons pour mesurer le catalogue statique de façon reproductible. Le correctif ne modifie pas les appels distants ; leur baseline saine reste inconnue dans cet environnement. Aucun classement SEO futur n’est garanti par une preuve d’équivalence du HTML.

## Preuves et prochaine étape

[Résumé machine](../output/tooltrim-browser-projection-2026-10-08/verification.json), [module émis](../output/tooltrim-browser-projection-2026-10-08/built-module.json), [HTML et sources](../output/tooltrim-browser-projection-2026-10-08/html-parity.json), [20 rendus](../output/tooltrim-browser-projection-2026-10-08/rendered-parity.json).

Tests pérennes : `npm test`, `npm run typecheck`, `npm run test:e2e:hydration` après `npm run build`. La fixture Vite est dans `src/lib/browserToolIndexProjection.test.ts`. La sonde d’audit reste reproductible avec `node output/tooltrim-summary-projection-2026-10-08/probe.cjs`.

Publication et recette distante terminées. Un découpage architectural supplémentaire, les essais utilisateurs et une migration vers la projection API distante restent des lots distincts.

## Publication et recette publique

- `main` publié avec le correctif et ses deux commits de mesures/design ; catégories locales et exports non suivis exclus. Vercel confirme le déploiement du commit applicatif `81f44da6e0`.
- [CI du commit applicatif](https://github.com/mbloch-design/toolstack-wizard/actions/runs/37796349909) entièrement réussie : 251 tests applicatifs, 23 contrats SEO, 99 tests Ma Stack, types, design, build/budgets et **56/56 hydratations en 5,5 minutes**. Rapport `hydration-report` archivé jusqu’au 15 octobre 2026, 15:09 UTC.
- **56/56 scénarios sur https://tooltrim.com en 5,7 minutes**, avec les mêmes assertions FR/EN, prix, navigation et conservation de la sélection.
- 14 captures fonctionnelles publiques : dix froides et quatre avec cache, desktop/mobile CPU ×4. Filtres, recherche Notion et inspecteur Figma fonctionnels ; aucune erreur JavaScript ni requête catalogue inachevée ; choix sauvegardés identiques ; aucun chunk catalogue complet chargé. Les appels Supabase restent en échec DNS dans cet environnement, comme lors de la baseline.
- Le module servi contient 1 239 lignes et son SHA-256 est exactement celui du build vérifié : `70bcd1790f9fbd00d6a572752b26306864bcabe5b2d3f5f49782203c33232a44`.
- Comparaison CDN avec la même requête `Accept-Encoding: gzip` : **352 415 → 334 820 octets**, gain **17 595 octets / 4,99 %**. Chromium négocie Brotli et observe environ 318,5 ko transférés à froid ; transfert nul de l’index avec cache. Ces mesures ne prouvent pas un gain d’interaction.

[Publication et CI](../output/tooltrim-browser-projection-2026-10-08/publication.json), [module public](../output/tooltrim-browser-projection-2026-10-08/production-module.json), [compression CDN](../output/tooltrim-browser-projection-2026-10-08/production-gzip.json), [parcours publics](../output/tooltrim-browser-projection-2026-10-08/production-parcours.json). La preuve `verification.json` conserve le statut historique de la recette locale avant publication.

Prochain lot technique : réexaminer les dépendances restantes selon la roadmap, avec un audit actualisé avant toute migration.
