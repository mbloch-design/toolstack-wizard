# R5 — Qualité des relations Explorer, 9 octobre 2026

Les garde-fous et la recette technique sont préparés localement. **La validation éditoriale R5 reste ouverte : son critère de qualité n’est pas atteint.** Aucune publication ni modification des faits catalogue dans ce lot. Base de travail : R4 local `af8db1a9bf`, issu de main `c42d137826`.

## Ce qui a été examiné

30 sources réparties entre création, collaboration, IA, automatisation, construction web et stockage ; jusqu’à dix résultats par source. Catalogue léger statique visible, avec la même exclusion des fiches consolidées que `useToolSummaries`. Ce pilote local ne certifie pas une éventuelle réponse distante différente. La baseline fournit 300 résultats ; le candidat en fournit 236. Les listes courtes ne sont jamais complétées artificiellement.

Sources du pilote : Figma, Photoshop, After Effects, Blender, Cinema 4D, DaVinci Resolve, Canva, Notion, Obsidian, Slack, Discord, Asana, Trello, ClickUp, ChatGPT, Claude, Perplexity, Midjourney, Zapier, Make, n8n, Webflow, Framer, WordPress, Shopify, Supabase, Vercel, Google Drive, Dropbox, Typeform.

La relecture indépendante examine chaque paire et son périmètre fonctionnel. `credible` = relation suffisamment étayée pour le métier indiqué ; `partial` = pertinente pour une partie seulement ; `unknown` = identité ou preuve insuffisante ; `reject` = rapprochement non justifié. Une acceptation par l’algorithme n’est pas une preuve éditoriale. Les vérifications officielles sélectionnées ne certifient pas les 236 relations.

## Résultat final de la relecture

| Périmètre | Disponibles | Crédibles | Partiels | Inconnus | Rejetés | Places manquantes |
|---|---:|---:|---:|---:|---:|---:|
| Quatre premiers | 114 / 120 | 68 | 40 | 6 | 0 | 6 |
| Huit premiers | 198 / 240 | 127 | 63 | 7 | 1 | 42 |

127/198 = 64,1 % des résultats disponibles dans les huit premiers, ou 127/240 = 52,9 % des places prévues. Les cas partiels et inconnus ne sont pas reclassés grâce à un nouveau libellé. **La cible de 80 % n’est pas atteinte.** Les cinq réserves critiques dans les quatre premiers concernent Framer face à Figma et des identités d’assistant/API ; ce ne sont pas cinq faux positifs certains. Les détails par paire et sources consultées sont dans [la relecture](proofs/explorer-r5-2026-10-09/independent-review.json).

## Activation bornée

Les nouvelles règles et leurs justifications visibles concernent uniquement les routes autour d’un outil parmi les 30 sources du pilote. Hors pilote et pour les objectifs/sélections multi-outils, le moteur et la présentation antérieurs sont conservés. Comparaison automatique avec `af8db1a9bf` : sorties exactement identiques pour les 1 210 sources visibles hors pilote et une sélection multi-source. Ce maintien n’est pas une certification de leur qualité éditoriale.

Le premier build, avec activation générale, a échoué au contrat SEO des liens Explorer. Cette extension a été retirée. Slack ne dispose que de deux destinations dans le candidat audité : Discord et Microsoft Teams. Le contrôle exige désormais ces deux liens précis pour Slack, exclut les autoliens du comptage et conserve trois destinations distinctes minimum ailleurs. Titres, canonical, H1 et épaisseur du texte SSR restent contrôlés. Aucun lien factice ajouté pour atteindre un nombre.

## Corrections implémentées sur le pilote

- Une extension exige que le candidat déclare la source comme hôte. Les applications d’une suite restent des membres de cette suite, sans compatibilité d’extension inventée. L’hôte d’une extension est décrit comme tel.
- Les alternatives explicites sont utilisées avec un usage commun corroborant. Les liens inverses exigent eux aussi cette corroboration. Le cluster étroit `team-chat`, examiné dans le pilote Slack/Discord, permet le rapprochement malgré des tags fonctionnels incohérents.
- Une comparaison déclarée dans le sens source → candidat sans usage commun reste une **comparaison à vérifier**, avec priorité inférieure. Le catalogue garde ses liens ; leur confiance affichée change.
- Catégorie, métier, cluster général et tags trop larges ne suffisent plus : collaboration, no-code, sourcing, social-media, assistant généraliste, automatisation/automation et brainstorming notamment.
- Les cartes indiquent la justification et les usages précis en FR/EN, avec les libellés existants des fonctionnalités mutualisés. L’explication distingue comparaison, extension, suite et usage commun ; un usage commun ne promet pas une intégration.

Les URL, filtres `angle`, destinations, sélection locale, routes et données de paiement restent conservés. Aucun stockage parallèle ni nouvelle dépendance serveur.

## Limites et prochaine reprise catalogue

1. Réconcilier la surface de Claude, DeepSeek, ChatGPT, Gemini et AI Studio : assistant public, API ou plateforme de modèles. La description et les relations doivent viser la même surface ; garder les inconnues jusque-là.
2. Distinguer Figma Design/Figma Sites et le métier actuel de Framer. Le mot « prototypage » partagé ne suffit pas à prouver une substitution globale.
3. Revoir les tags des autres cas partiels/rejetés (notamment workflows, Guideless et outils de diffusion), en les rattachant à des usages précis avec sources et date.
4. Normaliser les synonymes sans confondre des usages distincts. Les listes courtes montrent une insuffisance de preuves, pas un bug à compenser par des suggestions génériques.
5. Rejouer exactement le pilote après ces décisions, et observer sa compréhension avec des utilisateurs. Ne fermer R5 qu’avec les preuves de sortie.

Ces actions sont une entrée bornée pour R6 sur le catalogue commun existant ; aucune correction de données ni migration supplémentaire n’est lancée ici.

## Preuves et reproductibilité

- [Baseline](proofs/explorer-r5-2026-10-09/baseline.json), [candidat](proofs/explorer-r5-2026-10-09/candidate.json), [empreinte du catalogue](proofs/explorer-r5-2026-10-09/manifest.json).
- Rejouer : `node_modules/.bin/tsx scripts/audit-explorer-relations-r5.ts > /private/tmp/r5-replay.json` depuis la racine. La relecture éditoriale n’est pas un test automatique et doit être refaite si les données changent.
- Tests de régression écrits puis constatés en échec avant leurs corrections : clusters pollués, suites, liens inverses, sourcing, comparaisons sans usage et méthodes trop générales.
- Recette Chromium FR/EN 390/1440 px : justification, recadrage/retour, ajout à une collection, persistance, absence de débordement et erreurs JS, canonical et noindex des paramètres personnels.
- La recette place la carte au centre avant le clic. Des actions proches des filtres collants peuvent être interceptées après restauration du scroll : contrôle de focus/scroll à maintenir dans R8, sans clic forcé dans la recette.
- Résultats techniques finaux : voir [verification.md](proofs/explorer-r5-2026-10-09/verification.md).

Repères officiels employés pour juger les périmètres : [Figma Design](https://www.figma.com/design/), [Framer](https://www.framer.com/solutions/cms-website-builder/), [Resolve](https://www.blackmagicdesign.com/products/davinciresolve), [Nuke](https://www.foundry.com/products/nuke-family/nuke), [Claude API](https://www.anthropic.com/claude/api), [WeTransfer](https://wetransfer.com/). Les autres sources sélectionnées figurent dans la relecture.
