# Hydratation avec Ma Stack enregistrée — 8 octobre 2026

## Cause et correction

Le serveur rend une sélection vide. L'ancien initialiseur useState lisait immédiatement localStorage dans le navigateur : les compteurs et CTA différaient dès le premier rendu, provoquant les erreurs React 418/422.

useStackPins utilise désormais useSyncExternalStore avec des snapshots serveur stables, identiques au premier rendu d'hydratation. React restaure ensuite le store local. Les actions, sauvegardes, reprises sur stockage dégradé et événements storage restent sur les mécanismes existants. Aucun changement de format ni migration ; les snapshots sauvegardés valides restent identiques octet pour octet.

## Recette

- Régression unitaire rouge avant correction puis verte : SSR → hydratation avec sauvegarde, absence d'erreur, intégrité de la sauvegarde, second consommateur synchronisé et snapshot serveur indépendant du cache client.
- 249 tests applicatifs, 99 tests Ma Stack, 22 contrats SEO/compactage et TypeScript app/node PASS.
- 56 scénarios Chromium sur le HTML réellement généré : sept outils, FR/EN, présentation/prix, sélection vide/enregistrée ; restauration du CTA, navigation sans nouveau document et rechargement sans altération de la sauvegarde.
- Recette complémentaire Ma Stack, audit technique et prix : 30 scénarios PASS. Le test de rafraîchissement vérifie le nom distant actualisé : les prix éditoriaux ne remplacent plus les prix attestés. Libellé actuel « Fiche complète » repris.
- Serveur de recette aligné sur le fallback des routes SPA FR/EN ; fichiers manquants restent 404. Les tests d'hydratation exigent toujours un bootstrap __SSR_TOOL__ réel.
- Relecture indépendante du hook et des tests, sans anomalie actionable sur la correction.

## HTML et référencement

Build isolé hors changements locaux : 830,4 MiB au total, 718,8 MiB HTML, budgets inchangés PASS. Compactage : 13 162 documents, gain 24,62 MiB. Validation SEO : 13 137 URL sitemap et 2 478 pages Explorer.

Quatre pages de référence ont un arbre HTML équivalent au précédent artefact, à l'exception de la référence attendue au nouveau bundle applicatif. Sitemap identique octet pour octet. Cela vérifie l'absence de régression technique sur ces contrôles ; ce n'est pas une garantie d'évolution des classements.

Preuves : output/tooltrim-stack-hydration-fix-2026-10-08/verification.json. La dette design déjà constatée sur main est inchangée. Catégories locales et exports de catalogue exclus.

## Publication

La vérification publique après déploiement est distincte de la recette locale ; son résultat est communiqué dans le compte rendu de publication.
