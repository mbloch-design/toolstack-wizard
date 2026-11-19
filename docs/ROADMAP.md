# ToolTrim — Roadmap

Ce qui reste à faire, par chantier. Les livraisons passées sont dans [`CHANGELOG_AI.md`](CHANGELOG_AI.md) et dans l'historique Git ; les décisions de design sont datées dans [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md).

> Autres roadmaps actives :
> - [`ROADMAP_DIAGNOSTIC.md`](../ROADMAP_DIAGNOSTIC.md) pour le diagnostic adaptatif ;
> - [`MA_STACK_ROADMAP.md`](./MA_STACK_ROADMAP.md) pour Ma stack et l'exploration contextuelle.
>
> Nettoyée le 19/11/2026 : sprints et phases livrés, bilans du 9 et du 13 octobre, briefs et comptes rendus de S1 et S1 bis, analyse produit de la section agents et schémas de données (désormais imposés par `scripts/lib/agent-access.mjs`) retirés ; Git en garde l'historique.

<a id="suivi-technique-actif"></a>

## Suivi technique actif

| Chantier | Ce qui reste (état au dernier relevé daté) |
|---|---|
| Axe agents et MCP | Fiches MCP avec l'avis de free et les illustrations sur une branche locale, non publiées : voir [la feuille de route R1–R6](#suite-agents). S2 et S3 ci-dessous. |
| Comptes (Livraison A) | Derrière des flags désactivés ; points ouverts avant activation dans [Livraison A](#livraison-a). |
| R3/R7 — Architecture et chargement catalogue | Validés localement au 17/10, publication en attente à reconfirmer : contrôler parcours, requêtes, compression et cache CDN en production après publication. [Mesures et retour arrière](PROJECTION_INDEX_NAVIGATEUR_2026-10-08.md#r7-compact-2026-10-17). |
| R9 — Instrumentation et essais utilisateurs | Événements acceptés par GA4 ; visibilité dans les rapports et exploitation de l'entonnoir à vérifier. Essais réels reportés par le propriétaire, protocole prêt ([R9](R9_RECETTE_UTILISATEURS.md)). |
| R8 — Accessibilité | Couverture exhaustive, WebKit et lecteurs d'écran différés. |
| R11 — SEO | Réexploration Google après publication, à suivre dans Search Console. |
| R5/R6 — Relations et catalogue | Différés ; 172 ajouts en attente et 72 validations STALE conservés. Revoir processus et budget avant reprise. |
| Soumissions et paiement | Chantier séparé : voir [Soumissions](#soumissions). Copie privée locale du jeton Redis à actualiser. |

<a id="suite-agents"></a>
<a id="axe-agentique-mcp"></a>

## Axe agents et MCP

Le MCP est un pilier du site (décision du 16/11) : hub `/agents`, index `/mcp` et `/skills`, une fiche par serveur et par skill officiels, passerelle depuis les fiches outils. Aucun texte de Toolfolio n'est repris ; les faits viennent des éditeurs, les mots sont de ToolTrim. Le modèle de données est contrôlé par `scripts/lib/agent-access.mjs` (`npm run guard:agent-access`).

### Fait — fiches MCP : l'avis d'un free à un autre (Michael, 19/11)

Retour de Michael : les fiches restaient un mode d'emploi (« trop annuaire »). Décisions datées dans `DESIGN_DECISIONS.md` (19/11, une dizaine d'entrées : voix de pair, cartes, rythme typographique, ADN ToolTrim, sources, illustrations).

- **Données** : bloc `advice` dans `research/mcp/<serveur>.json`, validé par `scripts/lib/agent-access.mjs` : `verdict`, `intro` (voix de pair), `situations` (2-3 : `title` court sur une ligne, `gain` titre-bénéfice, `ask`, `source`, `icon`, `scene` facultative), `tips` (3-5) et `pitfalls` (2-4, `workaround` facultatif), chacun avec `title`, `icon` (liste fermée) et sa `source` ; `community: true` pour un retour d'utilisateurs.
- **Fiche** (`AgentSheet`) : verdict en tête ; cartes de situation (scène crayon ou pastille, surtitre, titre, demande en bulle, copie) ; « D'un free à l'autre » (introduction en chapeau, cartes de conseils et de pièges, source au pied de chaque carte) ; « Garder la main » et « Notre avis » sur le blanc ; tableau des actions structuré ; section Sources (pages de l'éditeur).
- **Règles** : jamais « testé » ; vouvoiement ; aucun montant, quota ni durée dans la prose ; un conseil non sourcé est retiré.
- **État au 19/11 (fin de journée)** : les 19 serveurs ont leur `advice` ; Notion, Canva et Stripe ont leurs 9 scènes au crayon ; les 48 scènes des 16 autres sont en cours (session « Cadrer les illustrations dessinées des fiches MCP »). Tout est sur la branche locale `claude/mcp-illustrations` (worktree `admiring-shaw-b9c724`), qui descend de `integration/agents-ma-stack` ; rien n'est fusionné ni poussé. `main` = `origin/main` à 09f5fe04 (CI verte).

### Feuille de route après les fiches MCP (19/11/2026)

Ordre recommandé : R1 puis R2 dans la foulée (ils transforment le travail fait en trafic), R3 et R4 en sessions séparées, R5 en continu. Chaque étape a son brief autonome : une session d'exécution le suit sans relire l'historique. Les points marqués **[Michael]** attendent sa décision.

#### R1 — Mettre en ligne (priorité 1)

**But** : le pilote et la déclinaison sur `main`, CI verte.
**Prérequis** : les 48 scènes faites et vérifiées sur `claude/mcp-illustrations`.
1. **[Michael]** accord pour fusionner `refs/heads/claude/mcp-illustrations` dans `integration/agents-ma-stack` (avance rapide attendue : la branche en descend).
2. Rejouer en local toute la CI, dans l'ordre de `.github/workflows/preprod-ci.yml` : `npm test`, `npm run test:api`, `npm run guard:agent-access`, `npm run typecheck`, `npm run build`, les e2e (`test:e2e:accounts`, `sidebar-preference`, `test:e2e:ma-stack`, analytics, `test:e2e:a11y`, recherche, `test:e2e:r11`, `test:e2e:payment`, `test:e2e:hydration`), puis `lint:ds`, `audit:ds-usage`, `test:ds`, `build-storybook` **seul**, `audit:typo-ds` (doit sortir « 0 écarts »), `check:agents-seo`. Le port 8087 des suites paiement et hydratation peut être pris par un autre serveur : lancer `scripts/serve-generated-html.mjs` sur un autre port et passer `PLAYWRIGHT_BASE_URL`.
3. **[Michael]** accord pour pousser `integration` sur `main` ; surveiller « Preprod CI » jusqu'au vert. La comparaison visuelle ne compare que sous Linux : si elle échoue sur des stories changées volontairement, régénérer les références par le workflow `visual-baselines.yml`, après accord.
**Fait quand** : `origin/main` contient le travail, CI verte, les 19 fiches en ligne.

#### R2 — Récolter le SEO du nouveau contenu (priorité 2)

**But** : que moteurs et assistants lisent l'avis, pas l'ancien mode d'emploi.
1. Réécrire `meta_description` (fr/en, 140 à 155 signes, contrôlé par la garde) des 19 serveurs à partir du verdict et d'une situation, sans prix.
2. Données structurées dans le prérendu (`src/lib/agentsSeo.ts`, source unique avec `vite.config.ts`) : les situations en `HowTo` ou les questions en `FAQPage`, selon ce que Google affiche encore ; vérifier avec `npm run check:agents-seo` et le test de résultats enrichis.
3. Régénérer `public/llms*` (`scripts/gen-llms-files.mjs`, après un build qui produit `dist/sitemap.xml`) pour y inclure verdicts, situations, conseils et pièges.
**Fait quand** : `validate:seo-generated` et `check:agents-seo` passent ; une fiche testée dans l'outil de résultats enrichis.

#### R3 — Faire circuler l'avis sur le site

**But** : l'avis se voit là où le free décide.
1. Bloc « Assistant IA » des fiches outils (`src/data/agents/advice.json`, projeté par `scripts/project-agents.mjs`) : reprendre le verdict et la première situation (scène ou pastille), lien vers la fiche MCP.
2. Cartes du hub `/agents` et de `/mcp` : le verdict en une phrase à la place de la description neutre (`card`, 50 signes au plus : en écrire une version courte par serveur).
3. **[Michael]** valider la carte modifiée en Storybook avant de brancher.
**Fait quand** : les 20 fiches outils concernées et les deux index montrent l'avis ; stories et e2e à jour.

#### R4 — Décliner sur les 60 skills

**But** : les fiches skills sortent du factuel, plus légèrement que les serveurs.
1. Schéma `advice` réduit pour `research/skills/*.json` : `verdict`, 1 ou 2 `situations`, 2 ou 3 `tips`, sources ; garde dans `validateSkillSheet`.
2. Recherche sourcée par lots de 10 (même brief que les serveurs, mêmes règles), relue avant intégration.
3. `SkillSheetView` reprend les cartes de situation et de conseils de la fiche serveur.
**[Michael]** : valider le pilote sur 3 skills avant la série.

#### R5 — Entretenir et mesurer (continu)

1. **Revérification trimestrielle** : chaque bloc `advice` porte une date `checked_on` (à ajouter au schéma) ; une tâche relit les sources, retire ce qui a changé (exemple : Google Analytics a ajouté des outils d'écriture entre deux versions de sa doc) et ce qu'une issue GitHub a corrigé.
2. **Mesure** : événement d'analyse sur « Copier la demande » par situation (et par serveur), dans le respect du consentement existant ; au bout d'un mois, réécrire les situations jamais copiées.
3. **Données ouvertes** : `research/mcp/google-analytics-mcp.json` a `plan: "unknown"` (« Forfait non précisé » sur /mcp) ; le confirmer sur la doc de Google.

#### R6 — Illustrations : après la déclinaison

1. **[Michael]** : choisir la voie de production durable. La recommandation de la session illustrations est une bibliothèque commandée à un illustrateur (une douzaine de personnages et d'objets récurrents, guide de trait, SVG une encre plus calque couleur). Les scènes SVG codées actuelles servent alors de brief et de version provisoire.
2. Étendre les scènes aux skills (R4) seulement après ce choix.

### Plus tard : S2 et S3

- **S2 — Extension** : les ~130 serveurs officiels d'outils du catalogue, puis les serveurs officiels sans outil hôte ; filtre Explorer « connectable à mon assistant » ; signal dans Ma stack ; critère dans les comparatifs.
- **S3 — Serveur MCP ToolTrim** : catalogue et Ma stack interrogeables depuis un assistant. À décider après S2.

<a id="critere-s2"></a>
**Critère pour passer à S2 :** un contrôle automatisé de fraîcheur signale les écarts sur les fiches serveur ; et la section S1 montre des impressions ou des clics après un mois.

**Ce que ToolTrim ne fait pas sur cet axe :** classement par popularité, serveurs et skills tiers non officiels (S1 et S2), reprise de textes de Toolfolio. Les commandes d'installation et le catalogue d'outils, exclus le matin du 16/11, sont réintégrés par la décision révisée.

**Risque principal : la fraîcheur.** Ces faits changent vite ; pas d'extension sans contrôle automatisé (R5) et sans budget convenu.

<a id="livraison-a"></a>

## Comptes — Livraison A (20 octobre 2026)

Implémentation locale derrière flags désactivés : état personnel complet v4, synchronisation avec révision, Google/GitHub/e-mail avec mot de passe, confirmation et récupération, isolation des comptes et suppression reprenable ; consultation comptes/stacks dans le back-office courant. Catalogue JSON conservé, livraison éditeur B séparée. Expérience complète du 21 octobre : formulaire partagé, avatar/menu, paramètres, nom facultatif, identités réellement associées, préférences sur cet appareil et export. Persona/métier/entreprise et qualification progressive restent des évolutions ultérieures.

Recette automatique locale : `npm run test:e2e:accounts` ; [conception](superpowers/specs/2026-10-19-accounts-stack-design.md), [user stories](superpowers/specs/tooltrim-user-stories-mvp.md) et [guide d'exploitation](STACK_ACCOUNT_OPERATIONS.md) versionnés. **Reste ouvert avant activation :** configuration Google/GitHub et e-mail/SMTP réelle, variables serveur/Vercel, migrations sur recette Supabase isolée, permissions/RLS avec rôles réels, concurrence multi-connexion, conseillers après migration et validation fournisseur FR/EN mobile/bureau. Les recettes locales et SQL embarquées ne ferment pas ces points. La recette du serveur généré est distincte et s’exécute sur le dist du build final, via `playwright.accounts-generated.config.ts` ; elle ne certifie pas le CDN réel. Activation et publication seront des opérations distinctes.

<a id="soumissions"></a>

## Soumissions et paiement

Le propriétaire choisit Upstash Redis gratuit et conserve le traitement manuel par email. Le [plan préparé](superpowers/plans/2026-10-09-submission-idempotency.md) couvre réservation atomique, reprises des deux emails, identifiants stables gratuit/payant et recette. Exécuté localement : 175 tests API avec Redis réel, 287 app, 23 SEO, 14 Chromium, types et build PASS. Relecture indépendante suivie de corrections vérifiées. Aucun compte/raccordement distant créé ni publication. Configuration Upstash/Creem/Vercel, quota, sauvegarde distante et rétention restent à attester. [Bilan et décisions](BILAN_SOUMISSIONS_2026-10-09.md).

## Interface — dette et QA

### Responsive et QA global

| Item | Priorité | Notes |
|---|---|---|
| CategoryPage sidebar sticky offset | HAUTE | `sticky top-6` → `calc(var(--navbar-h, 68px) + 20px)` |
| Nettoyage CSS `tc-list-row` orphelin | MOYENNE | Remplacé par `tcr-*`, anciens sélecteurs à supprimer |
| Suppression dead code `ToolCard` default/list-row | MOYENNE | Variants dépréciés mais encore présents dans le fichier |
| Audit breakpoints 1440→375px sur toutes les pages | HAUTE | 10 breakpoints, vérification visuelle |
| GuidesPage filtres scroll horizontal ≤700px | MOYENNE | Vérifier que le scroll fonctionne sur iOS |
| Accessibilité : focus rings, Escape menus, labels boutons | MOYENNE | |

### Homepage

| Item | Priorité |
|---|---|
| Vérifier cohérence typographique eh-hero-title vs td-hero | HAUTE |
| Standardiser H1 hero home avec --font-brand, ls -0.07em | MOYENNE |
| Améliorer section "Stacks en vedette" | BASSE |

### Performance

| Item | Priorité | Notes |
|---|---|---|
| Chargement catalogue : projections et shards | HAUTE | Ancienne mesure 3,3 MB obsolète ; shards outil/stack déjà générés. Mesurer les téléchargements réels avant le prochain découpage ; voir le suivi technique actif. |
| Lazy loading des sections ToolDetail | MOYENNE | ToolVerdictBlock, ToolAlternativesSection |
| Images WebP + srcset | MOYENNE | Logos outils |

### Mode sombre

- Audit global des pages historiques non migrées vers les tokens (dont les classes `ms-*` de Mon Stack V1).
- Prévention du flash de thème au chargement : à évaluer, seulement s'il est perceptible en production.

### Back-office (25 octobre 2026)

Le nouveau workspace bo-* utilise les tokens existants. La validation visuelle détaillée du thème sombre reste différée ; les parcours de lecture et de déconnexion sont contrôlés dans les deux préférences. GA4 et le regroupement leads/soumissions restent des intégrations distinctes, signalées dans le workspace. L’éditeur de fiches JSON et la publication groupée sont implémentés le 26 octobre ; leur activation nécessite un jeton GitHub serveur dédié (voir docs/BACKOFFICE_CATALOG_EDITOR.md).

### Petites dettes

- Colonnes thèmes de GuidesPage dynamiques (aujourd'hui en dur).
- TOC de GuideDetailPage : tester avec des accents dans les titres H2.
- Menu mobile : état de chargement dans le panneau (données Supabase tardives).
- Vérificateur TypeScript strict et baseline design-tokens en échec hors périmètre (relevé du 5/10, à revérifier).
