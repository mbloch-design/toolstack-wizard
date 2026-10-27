# Design System Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current design the default through autonomous shared UI, owned styles, one predictable production cascade and enforced removal of replaced implementations.

**Architecture:** Keep the current React/Vite application and approved public appearance. Replace the critical-CSS approximation, consolidate style ownership, migrate controls through a neutral UI entry point and remove legacy cascade compilation once native output is verified. Back-office is the first complete consumer; account, Stack and public consumers follow.

**Tech Stack:** React18, TypeScript, Tailwind4, PostCSS, Vitest, Playwright; existing Radix mechanics where relevant.

**Spec:** `docs/superpowers/specs/2026-10-27-design-system-reset-design.md`

## Global Constraints

- No auth/data/API contract or catalogue fact changes; all existing maintained admin/history functions remain accessible.
- No new UI framework. Current public appearance is preserved; internal control details are delegated to the implementer.
- New UI is ancestor-independent; domain layout cannot redefine shared primitive appearance.
- Replace and delete in the same lot; no indefinite legacy layer. Final completion requires removing `legacyCssCascade()`.
- Preserve active themes, responsive states, keyboard behavior and reduced motion.
- Work in the existing isolated worktree, explicit staged paths only; native source modules, no checked-in generated CSS/build output.

## Review Focus

- Critical versus full CSS: class order, compound/complex selectors, nested media/supports/layers, important declarations, root variables and pseudo states must preserve compiled precedence (Task2/4).
- Nonvisual semantics: button submit/reset, links with modifiers, disabled/loading activation, focus/ref, errors and long labels (Task3/5/6).
- Domain scope leakage: a primitive inside/outside Stack/account/admin must retain its intended variant (Task3/7).
- Dead-code false positives: JSON editorial classes, dynamic class construction and historical admin route are actual consumers (Task1/7).
- Browser parity must use built output; screenshots from Vite dev alone cannot certify final cascade (Task1/8).

## Task 1: Baseline and removal inventory

**Files:** create `e2e/design-system.spec.ts`, `playwright.design-system.config.ts`, `docs/DESIGN_SYSTEM_MIGRATION.md`; workspace-only baseline screenshots/computed-style records. Update validated spec status.
**Interfaces:** consumes existing `dist` and real public routes; produces an explicit consumer/removal ledger and deterministic browser baseline reused by Task8.
- [ ] Capture representative current public routes and controls from production preview at390/1440px, FR/EN; record fonts, geometry, color and styles after full CSS.
- [ ] Inventory generic button/field families, direct copied classes, domain controls and dynamic editorial consumers. Attach each legacy owner to a migration task.
- [ ] Add tests for desired standalone primitives, blocked imports and critical CSS; watch each new behavior fail before implementing its owning task.
- [ ] Commit baseline/inventory as `test(design): establish rendered and ownership contracts`.

## Task 2: Compiled AST critical CSS

**Files:** create `scripts/lib/compiled-critical-css.mjs` and `.test.mjs`; modify CSS extraction integration in `vite.config.ts`, related existing tests.
**Interfaces:** `createCriticalCssExtractor(css: string): (markup: string) => string`. Produces a conservative subset of the compiled AST in original order with ancestor wrappers, global foundations, keyframes/fonts/custom-properties and selector dependencies retained; false-positive inclusion is preferable to dropping applicable rules.
- [ ] Red tests: `.a`/`.b` source order independent of class attribute order; nested layers/media/supports; compound and escaped classes; pseudo/state selectors; source CSS tokens must not be read separately.
- [ ] Implement with PostCSS AST and selector parsing where needed; build index once per compiled sheet, not once per page. Replace both `extractCriticalCss` and manual `buildClassRuleIndex`/`extractUsedUtilityCss` approximations.
- [ ] Run script tests and a representative prerender. Confirm existing CSS budgets; adjust extraction based on measured output, never by deleting contextual wrappers.
- [ ] Commit `fix(css): derive critical styles from the compiled AST`.

## Task 3: Neutral shared UI contracts

**Files:** create `src/components/ui/primitives.tsx`, `primitives.test.tsx`, `src/styles/ui.css`, test-only reference fixture; retain existing overlay mechanics.
**Interfaces:** exports `Button`, `ButtonLink`, `TextLink`, `IconButton`, `Input`, `Select`, `Textarea`, `Field`, `Surface`, `PageHeader`, `Toolbar`, `Segmented`, `ActionRow`. Props use native HTML types plus explicit variants/sizes; Link uses existing router adapter. Prefix `ui-*`, no `.ms-*`/`.ac-*`/`.bo-*` required. Default controls min44px, compact40px explicit; variants primary/secondary/quiet/danger and explicit public/Stack adaptations if needed for appearance preservation. Field manages label/help/error IDs accessibly; callbacks/ref/native type semantics must survive.
- [ ] Red tests for native submit type, loading/disabled suppression, navigation semantics, ref, labeled IconButton, Field error/help association, keyboard segment behavior.
- [ ] Implement autonomous styles using canonical foundation variables, no inline appearance literals or ancestor selectors; `Button` default type button, explicit submit preserved.
- [ ] Test rendered controls inside and outside domain ancestors, long labels and reduced motion. Keep fixture development/test-only.
- [ ] Commit `feat(ui): add autonomous shared control primitives`.

## Task 4: Native CSS ownership and tokens

**Files:** `src/index.css`, new `src/styles/foundations.css`, `src/styles/domains/*.css`, `postcss.config.js`, `tailwind.config.ts`; remove `scripts/lib/legacy-css-cascade.mjs` and replace its test with native emitted-cascade tests.
**Interfaces:** central stylesheet imports native layers and source modules explicitly. Foundation declarations have one owner; theme/breakpoint variants retain their contexts. Tailwind utilities remain in the correct application precedence relative to domain rules.
- [ ] Red tests reproduce old source/output reorder and unconditional duplicate root tokens; assert the intended native order including important declarations and generated utilities.
- [ ] Extract source nodes by current effective order, classify foundation/component/domain ownership, consolidate replaced definitions. Ruling permitted: shared native component layer for application styles and generated utilities when necessary to preserve existing public specificity; do not add a replacement flattening plugin.
- [ ] Remove duplicate root definitions preserving the current winning value. Keep only semantic domain variables or exact tracked migration aliases; no new arbitrary aliases to satisfy counts.
- [ ] Remove legacy plugin and old approximations after Task2; verify production CSS and baseline routes before committing.
- [ ] Commit `refactor(css): establish owned styles and native cascade`.

## Task 5: Complete back-office migration

**Files:** `src/pages/BackOfficePage.tsx`, `src/components/backoffice/*.tsx`, new `src/styles/domains/backoffice.css`, existing backoffice component/API/browser tests.
**Interfaces:** uses Task3 primitives; no StackKit imports, `ms-page`, `ac-page-header`, `mk-*` or generic `ba-button` control implementations. Admin layout/content selectors remain `bo-*`; field primitives own control appearance. History still uses existing data/actions.
- [ ] Red ownership and interaction tests for admin login, navigation, user detail, draft editing/global publish and historical diagnostic controls.
- [ ] Migrate every maintained admin branch and copied class, convert fields/action/links with correct semantics, remove former styles rather than override them.
- [ ] Run all backoffice components and isolated account-server journeys390/1440px FR/EN, keyboard/focus/errors/pending states.
- [ ] Commit `refactor(backoffice): consume the shared UI system`.

## Task 6: Accounts and Ma Stack composition

**Files:** `src/components/account/*.tsx`, account pages, `StackKit.tsx`, generic stack form controls, account/Stack CSS owner modules and relevant tests.
**Interfaces:** account generic controls use Task3; `StackKit` reexports/composes shared mechanics with explicit Stack variants, and retains only Stack-specific cards/dataviz. No anonymous inherited shape change.
- [ ] Red tests for account submit/error/loading/identity switch and Stack action/ref/navigation contracts in their old and neutral ancestor contexts.
- [ ] Replace ac-button/form appearance and mk-button/link/segment implementation; remove their old CSS definitions and direct duplicated consumers.
- [ ] Run account/Stack tests and representative usage, invoice, pair and auth journeys; preserve current approved public dimensions through explicit variants.
- [ ] Commit `refactor(ui): unify account and stack controls`.

## Task 7: Public consumers, documentation and enforcement

**Files:** generic CTA/control consumers in active public routes/components; `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `scripts/validate-design-tokens.mjs`, new ownership validator/tests/manifest and CI/package configuration.
**Interfaces:** one shared UI import point; domain-specific controls explicitly owned. Exact exception manifest contains consumer, reason, owner, removal condition; no aggregate credit for new violations.
- [ ] Red validator tests for copied old generic classes, imports of business kits in migrated generic consumers, duplicate unconditional tokens, page redefinition of primitive appearance and new important/unlayered rules in owned modules.
- [ ] Migrate generic public actions/links using named variants; keep intentional domain controls as composed/owned controls. Verify each proposed dead style against code graph, dynamic content and route/state evidence before deletion.
- [ ] Replace contradictory active DS documentation with current contracts and references; remove copied palette from AGENTS, correct actual shell/compilation in architecture. Historical evidence stays in Git.
- [ ] Wire ownership/production-preview gates into CI; retain useful dynamic dataviz styles and explain exact exceptions.
- [ ] Commit `refactor(design): enforce one active UI contract`.

## Task 8: Whole-system verification and closure

**Files:** browser fixture/config, rendered snapshots, migration record, changelog; no product behavior scope expansion.
**Interfaces:** consumes Task1 baseline and all migrated modules; produces reviewable final diff, tests and removal evidence.
- [ ] Run full application/API/research CSS tests, types, design ownership/tokens, full production build and SEO/route budgets. Separate environmental skips from passing executed tests.
- [ ] Run production-preview baseline comparisons and critical/full CSS tests; exercise real isolated backoffice/account/Stack interactions and public routes desktop/mobile FR/EN.
- [ ] Fix regressions with red/green evidence, request whole-branch independent review, handle important findings before completion.
- [ ] Verify removal inventory: no legacy cascade plugin, no independent raw-source critical parser, no migrated generic controls owned by business kits, no superseded active DS rules.
- [ ] Update migration record/CHANGELOG with exact scope, remaining deliberate domain variants and evidence. Commit `docs(design): record verified system migration`.

## Execution

Architecture approved; user explicitly requested implementation. Execute continuously via scoped subagents and coordinator integration, making routine technical decisions without asking the user to redefine internal visuals. Existing publish authorization is evaluated separately against final verified scope; do not present local changes as deployed.
