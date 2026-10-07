# ToolTrim — revue technique livraison, 7 octobre 2026

Audit local en lecture seule de `/Users/mike/Documents/New project`. Aucune modification des sources, Git ou DB ; aucun build lancé dans le checkout principal ; aucun install, aucun test complet dupliqué. Le root réalise le build sur snapshot et les vérifications navigateur. Ce rapport porte sur les contrats, gates et défauts reproductibles, pas sur la santé du déploiement distant.

## Constats actionnables

### P1 — Le premier gate CI vise des tests supprimés et arrête le workflow

- Preuve : `.github/workflows/preprod-ci.yml:36-37` exécute `npm run validate:diagnostic` avant les autres étapes. `scripts/validate-creative-diagnostic.mjs:17-30` appelle Vitest sur sept fichiers sous `src/test/diagnostic/`. Le répertoire et les sept fichiers sont absents du checkout actuel.
- Reproduction : commande Vitest exacte du gate, avec `--config vitest.diagnostic.config.ts` et ses sept filtres. Résultat : `No test files found, exiting with code 1`. Journal : `/private/tmp/tooltrim-ci-diagnostic-repro.log`.
- Impact : les PR main/preprod et pushes codex/preprod ne peuvent atteindre Typecheck, Ma Stack ou Build dans ce workflow. Les anciens scripts structuraux suivants ne réparent pas l'échec de cette étape.
- Correction proposée : réaligner le workflow sur les suites et gates du produit actuellement conservé. Ne pas ressusciter le diagnostic archivé pour satisfaire une commande obsolète.
- Confiance : haute, exécuté localement ; pas de consultation des runs GitHub distants.

### P1 — Le gate TypeScript annonce un succès sans lire les sources

- Preuve : `.github/workflows/preprod-ci.yml:42-43`, `scripts/validate-creative-diagnostic.mjs:9-12` et `package.json`/`verify:preprod` utilisent `tsc --noEmit`. `tsconfig.json:15-21` a `files: []` et des références app/node ; cette invocation ne parcourt pas les références.
- Reproduction : `node_modules/.bin/tsc --noEmit --listFiles` donne exit 0 et zéro ligne (`/private/tmp/tooltrim-tsc-root-listfiles.log`). `node_modules/.bin/tsc --noEmit -p tsconfig.app.json` analyse réellement les sources et produit 38 diagnostics (`/private/tmp/tooltrim-tsc-app.log`, comptage des lignes `error TS`). Le root a indépendamment mesuré la baseline dans `/private/tmp/tooltrim-types-20261007.log` ; les écarts de compte éventuels correspondent à son timing/aux edits concurrents.
- Exemples : alias Vite `@/routes/detailPages` inconnu de TS ; import `ToolSummary` depuis le mauvais module ; contrat numérique des posts vs chaîne du moteur de recherche.
- Impact : une release avec erreurs de type passe ce contrôle sans vérification. Vite transpile TypeScript et ne remplace pas ce contrôle.
- Correction proposée : commande explicite `tsc --noEmit -p tsconfig.app.json` puis `-p tsconfig.node.json`, avec alias conditionnel déclaré pour TS. Conserver les dettes baseline dans un lot distinct ; ne pas confondre réparation du gate et suppression globale de toutes les erreurs préexistantes.
- Confiance : haute, reproduction exécutée ; diagnostics de type ne prouvent pas à eux seuls un bug runtime.

### P1 — Le build autorise une fiche indexable avec contenu SSR vide

- Preuve : `vite.config.ts:951-955` accepte une erreur de chargement du renderer en passant au prérendu de seules métadonnées ; `vite.config.ts:1130-1137` capture l'échec SSR d'une fiche et écrit quand même l'HTML. `scripts/validate-generated-seo.mjs:38-55` valide présence fichier/canonical/robots/hreflang, sans H1, contenu principal ou payload d'hydratation. `scripts/build-production.mjs:145-150` annonce PASS après ce validateur et les audits restants.
- Reproduction isolée : `/private/tmp/tooltrim-quality-fixture-20261007/dist/fr/tool/notion/index.html` contient seulement title, canonical et `<div id="root"></div>`. Sitemap avec une URL auto-canonique. Le vrai `validate-generated-seo.mjs` retourne `PASS: 1 unique, indexable...`. Le vrai `audit-explorer-seo.mjs` retourne `PASS: 0 pages...` car il ne vérifie pas l'existence/couverture de la famille (`scripts/audit-explorer-seo.mjs:9-14`, `45-51`).
- Impact : échec renderer/fiche peut produire une release avec métadonnées et sitemap corrects mais contenu principal absent pour les lecteurs sans JS, moteurs et extracteurs. Cette preuve démontre un trou du gate, pas une fiche actuellement vide en production.
- Correction proposée : faire échouer l'erreur de renderer/SSR indexable, ou gate de contenu/payload et couverture par familles attendues. Reprendre l'invariant déjà écrit dans `docs/SUPABASE_TOOL_CATALOG_MIGRATION.md` : contenu principal + H1 + metadata + prix publiés + liens + JSON-LD cohérent présents avant JS.
- Confiance : haute sur le gate (fixture exécutée), impact en production conditionnel à un échec SSR réel. Le build snapshot root déterminera l'état actuel.

### P2 — La recherche enrichie tombe en fallback dès que les guides réels sont indexés

- Preuve : `src/hooks/useSupabaseData.ts:348-352` conserve `p.id` dans mapPost ; tous les posts locaux sont sans `id` (39 FR, 46 EN). `src/hooks/useCatalogSearch.ts:143-150` génère `id: guide-${post.id}` et `entityId: post.id`. `src/lib/catalogSearch.ts:24-36` définit `entityId` chaîne et fait `insertMultiple` ; `src/hooks/useCatalogSearch.ts:67-71` conserve un fallback textuel quand le moteur rejette l'index.
- Reproduction avec les tableaux de posts locaux et le même mapping guide/schema Orama : FR et EN rejettent `DOCUMENT_ALREADY_EXISTS: A document with id "guide-undefined" already exists.` Une ligne guide avec `entityId: 1` rejette `SCHEMA_VALIDATION_FAILURE` sur entityId. Les posts Supabase sont déclarés numériques (`useSupabaseData.ts:320-321`).
- Impact : fuzzy/usage search indisponible après chargement guides ; fallback reste utilisable, donc pas de page blanche. La résolution `SearchModal.tsx:104,159` par id doit être alignée ; convertir seulement entityId en chaîne casse cette Map numérique. Les clés de fallback `article-${post.id}` sont également dupliquées (`SearchModal.tsx:114`).
- Couverture : `src/lib/catalogSearch.test.ts` emploie des guides synthétiques avec identifiants chaîne, pas les posts réels ni le mapping du hook ; les tests moteur peuvent passer malgré ce défaut d'intégration.
- Correction proposée : identité guide stable par slug/lang, et lookup par slug côté UI ; petit test du mapping avec vrais contrats local sans id / distant id numérique.
- Confiance : haute sur rejet d'index exécuté, pas de contrôle navigateur réalisé ici. P2 car fallback utilisable ; traiter pendant ce lot si petite correction autorisée.

### P2 — Démarrage automatique Playwright attend le mauvais port

- Preuve : `playwright.config.ts:12,24-27` attend 8080 mais démarre `npm run dev -- --host 127.0.0.1` sans port. `vite.config.ts:2503` laisse `port` undefined si `PORT` n'est pas défini. La valeur par défaut de Vite installé est 5173. Vérification locale directe du code installé possible, pas besoin d'affirmer un port distant.
- Impact : nouveau checkout/session sans `PORT=8080` et sans `PLAYWRIGHT_BASE_URL` attend deux minutes puis échoue. `reuseExistingServer: true` peut de plus reprendre un serveur sans preuve qu'il correspond au commit testé.
- Correction proposée : `--port 8080 --strictPort`, ou BASE_URL explicite pointant un build snapshot identifié.
- Confiance : haute sur le contrat de configuration, démarrage complet non exécuté pour éviter un serveur concurrent inutile.

## Couverture et limites

- Lecture : AGENTS.md, ARCHITECTURE.md, audit produit existant, plan de migration catalogue, package/scripts, Vite/prérendu/sitemap/CSS critique, entry SSR/client/hydratation, métadonnées/robots, redirects et headers Vercel, workflow CI, configs Vitest/Playwright, suites existantes et moteur de recherche.
- CI contient un gate diagnostic hérité plus une suite Ma Stack ciblée ; elle ne lance pas la suite générale `npm test`, les scripts tests `.mjs` sous `scripts/`, les E2E ni lint. Après réparation diagnostic, la couverture restante doit être décrite précisément, pas appelée test exhaustif.
- Full suite lancée par root : baseline communiquée 36 fichiers, 190 passent / 2 échouent, environnement node. Cela ne valide pas des comportements jsdom/navigateurs.
- Hydratation : fiches/comparatifs/guides/stacks avec payloads utilisent hydrateRoot (`src/main.tsx`), pages SSR sans ces payloads passent par createRoot (HTML serveur remplacé). Ce choix est connu dans l'architecture ; aucun CLS mesuré sur build actuel dans ce sous-audit, donc pas de constat perf supplémentaire sans trace.
- SSR et client ne partagent pas tous les routesets : pages lazy côté client importées synchrones dans des renderers dédiés SSR. Le sitemap et SEO static sont construits manuellement. Tests `guideSlugMaps` vérifient une partie des dérives de traductions, pas la totalité des contrats metadata/HTML après navigation.
- Build Source Supabase délibérément désactivée `vite.config.ts:346` par `SB_SOURCE_DISABLED_WHILE_CODEX_RESTRUCTURES=true` ; getMergedTools et getProjectedFicheTools retournent le JSON local. Dette/migration explicite, pas une indisponibilité DB observée ni un bug de permissions.
- Artefact : vrai gate budgets/doublons existe, ceilings environ 860 MiB total / 745 MiB HTML / 15 MiB JS / 36 MiB CSS. Cela limite la régression globale, pas Core Web Vitals ni coût de première navigation. Les montants présents dans les commentaires historiques ne sont pas mesures actuelles.
- Dépendances : lock npm présent, CI npm ci, Node20 explicite. tsx est exécuté par build mais seulement transitif dans lock (4.21.0), pas déclaré dans devDependencies ; fragilité future P2, pas failure actuel de npm ci prouvé. Aucun package install ni audit de vulnérabilités : aucune vulnérabilité conclue sur seul numéro de version.
- Vercel : 211 redirects déclarés, rewrites SPA /fr et /en, headers CSP/caches déclarés. Pas de requêtes production ni vérification de statut/cache/fallback réels ; le root peut vérifier le build rendu localement mais localhost ne reproduit pas les headers/ordre Vercel.
- Aucun audit exhaustif accessibilité, Safari/WebKit, perf réseau, sécurité API/DB dans cette sous-tâche. L'utilisateur a déjà reporté consolidation a11y/WebKit et refonte bundles jusqu'à stabilisation migration DB ; mémoire consultée `MEMORY.md:676-677` et reprise de cette limite, pas de nouveaux chantiers proposés.

## Ordre conseillé

1. Réparer workflow CI obsolète et vérité du gate TS, sans chantier global de types.
2. Refuser le prérendu vide et vérifier le contenu indexable sur le build snapshot.
3. Corriger identité guides/recherche si le root conserve ce petit bug dans la portée.
4. Config port Playwright dans le même lot de fiabilisation des preuves.
5. Backlog séparé : couverture complète en CI, types baseline, contrats metadata navigation/hydratation, performances/a11y multi-navigateur après migration.
