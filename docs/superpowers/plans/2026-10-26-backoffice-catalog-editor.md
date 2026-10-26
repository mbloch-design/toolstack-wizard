# Back-office catalogue — implementation plan

> **For agentic workers:** use superpowers:subagent-driven-development for isolated backend work and a final independent review.

**Goal:** Edit existing catalogue JSON records through admin forms and publish all saved drafts with one global action.
**Architecture:** Server-only GitHub source read + existing Upstash transport in a dedicated draft hash; immutable identities, optimistic concurrency, one Git commit on main and the existing production build.
**Tech Stack:** Existing React/TypeScript/Vercel/Supabase Auth/Upstash, no new dependencies.
**Spec:** `docs/superpowers/specs/2026-10-26-backoffice-catalog-editor-design.md`.

## Global constraints
- Existing AppShellV2 and bo/mk CSS; no second shell or sidebar.
- Server confirmed-email allowlist, active sessions, fixed repository/path/main; no browser secret.
- No real catalogue facts changed for tests; stage explicit files.
- Publication means all saved drafts at the reviewed revision, never current unsaved form text or unrelated code.

## Review focus
- Stale browser overwriting a newer draft must return conflict.
- Source main changing one edited fiche must preserve all drafts and refuse publication.
- GitHub ref update timing out after acceptance must reconcile safely on retry.
- New draft saved during publication must survive cleanup.
- Missing provider configuration must never appear as a successful save/publication.

### Task 1: Backend contract and atomic publication
Files: `src/lib/backofficeCatalog.ts`, `api/_backoffice-catalog-{github,store}.ts`, `api/backoffice-catalog.ts`, corresponding tests.
- [x] Write failing tests for auth, contract, stale revisions, batch publication, failures and cleanup.
- [x] Implement shared types/allowed fields/validation, source read at fixed SHA, CAS Redis state, batch publisher.
- [x] Run targeted API/contract tests and types; fix issues.

### Task 2: Integrated editor
Files: `src/lib/backofficeCatalogApi.ts`, `src/components/backoffice/CatalogEditor.tsx`, `CatalogFields.tsx`, `AccountsDashboard.tsx`, `src/index.css`, component tests.
- [x] Write failing UI tests for search/edit/save/preview/global review/publish/conflicts.
- [x] Implement accessible forms using the shared contract and existing design tokens.
- [x] Preserve unsaved edits/errors, add beforeunload guard, integrate Fiches navigation.
- [x] Run component tests and app types.

### Task 3: Acceptance and deployment configuration
Files: browser fixture/spec, docs runbook/changelog.
- [x] Run synthetic desktop/mobile browser journeys and inspect actual route screenshots.
- [x] Independent review; repair important findings with regression tests.
- [x] Run app/API tests, TypeScript, design tokens, full build.
- [x] Configuration inspectée : Redis déjà présent, jeton GitHub dédié absent. Exigence d’activation documentée ; aucun secret personnel réutilisé.
- [x] Build complet validé ; commit final et publication main demandée, avec contrôle de parité distante et statut de déploiement distinct.

## Execution evidence
- TDD: UI missing component, deferred-save race, browser Back and signout losses reproduced before fixes.
- Independent review found three actionable issues; all three re-reviewed resolved.
- Additional schema tests: plan deletion matches immutable plan identities and unsupported inherited properties are rejected.
- Real Redis built only under /tmp and exercised with the existing isolated test fixture; no production writes.
- Current main e279666d17 integrated by rebase after concurrent publication; additive changelog resolution, no catalogue data changed.

Final verification: 945 app tests, 390 API tests including real isolated Redis, 16 browser journeys plus 6 editor reruns, full TypeScript, design tokens, complete production build/SEO/routes/budgets PASS. Dedicated GitHub credential remains a documented production activation prerequisite.

Post-rebase integration verification: 966 app tests, all TypeScript projects, design tokens, SSR compilation, 16 Chromium journeys PASS. Backend remained byte-identical to its 390-test verification.
