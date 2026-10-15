# Vérification technique R5

- `npm test` : 52 fichiers, 310 tests PASS.
- `npm run test:ma-stack` : 13 fichiers, 117 tests PASS (18 régressions Explorer ajoutées).
- `npm run test:seo-contracts` : 4 fichiers, 25 tests PASS.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5197 node_modules/.bin/playwright test e2e/explorer-relations-r5.spec.ts --workers=1` : 4/4 PASS, FR/EN 390/1440 px. Recadrage, retour, collection choisie, persistance, raisons, canonical/noindex, pas de débordement/erreur JS. Aucun clic forcé.
- Le replay de `scripts/audit-explorer-relations-r5.ts` est identique au candidat enregistré.
- `git diff --check` PASS.
- Revue indépendante finale : aucun nouveau blocker de code ; gate éditorial NOT_ATTAINED. Les deux états ne sont pas confondus.
- Premier test navigateur : action masquée desktop au survol et/ou sous filtre collant après retour. Recette finale centre la carte et la survole comme un parcours de lecture ; contrôle focus/scroll après retour conservé pour R8.
- Aucun compte, aucun email, aucune session de paiement ou écriture distante dans ce lot.

- Bornage : les 236 relations du pilote restent identiques ; les 1 210 sources visibles hors pilote et une sélection multi-source reproduisent exactement `af8db1a9bf`.
- Premier build production FAILED : application globale des règles strictes faisait tomber de nombreuses pages sous le minimum de liens. Activation restreinte au pilote et contrôle Slack exigeant les deux destinations auditées précisément ; minimum trois ailleurs, sans autolien.
- `npm run typecheck` : application, scripts Node et API PASS.
- Dernière revue indépendante du bornage : aucun blocker ; fonctions legacy identiques à la baseline et UI/algorithme limités au même périmètre. Objectifs/stack explicitement conservés en legacy, y compris avec une seule source.
- Build final borné : `npm run build` PASS ; 13 147 URL sitemap validées, 2 480 pages Explorer auditées, 13 172 documents HTML équivalents, budgets de sortie PASS. Aucune modification de données générées à inclure dans le commit.
- Recette finale sur `vite preview` du build de production : 4/4 PASS en 34,7 s, FR/EN 390/1440 px ; absence des justifications/note sur Netlify hors pilote vérifiée après recadrage. Première tentative : retour affiché mais attente `load` expirée ; trace analysée, attente corrigée en `domcontentloaded` sans retirer les assertions de navigation ni de persistance.
