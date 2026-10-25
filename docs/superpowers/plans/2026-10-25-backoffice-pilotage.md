# Back-office pilotage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Deliver an administrator workspace with a useful overview, user list and complete readable saved profiles.

**Architecture:** Preserve the existing authenticated Vercel endpoint and session-checked RPC. Add opt-in bounded page enrichment for user summaries and an explicit identity projection on detail, without database migrations. Split workspace, overview and user detail components, reuse the versioned personal-stack normalizer and existing catalogue index.

**Tech Stack:** React 18, TypeScript, React Router, Supabase, existing Iconoir adapter and CSS component layer.

**Spec:** docs/superpowers/specs/2026-10-25-backoffice-design.md

## Global Constraints

- New CSS uses bo-* classes in @layer components; preserve existing diagnostic and login behavior.
- No privileged client key, no writes to user data, no invented analytics or budget conversions.
- Global totals/ranking come from existing RPC and stay independent of pagination/search.
- Restrict first delivery to overview, users with all saved rubrics, stack analysis and explicit source availability. Catalogue editing, demand integration and GA4 reporting remain subsequent integrations.
- Existing RPC includes active confirmed accounts only; show this scope explicitly. Pending/deleted accounts are excluded rather than silently promised as covered.
- Keep all local changes isolated; no push or deployment in this task.

## Review Focus

- Snapshot/source inconsistency must fail closed rather than show empty data.
- Switching views/search/details must never display a previous user's asynchronous response.
- Stored annual/per-seat/custom and zero amounts must remain literal declarations.
- Historical decisions and references missing from the catalogue must remain visible.
- Overview lists must use unfiltered first-page data, never a filtered users page disguised as site-wide activity.

### Task 1: Read contracts and authorized projections

**Files:** api/backoffice-accounts.ts, src/lib/backofficeAccounts.ts, src/lib/backofficeAccountsApi.ts, tests/api/backoffice-accounts.test.ts, src/lib/backofficeAccountsApi.test.ts.
**Interfaces:** optional include=insights in list; optional summary insights {usedTools,wishlistTools,boards,trade,hasDailyRate,amounts,usage,decisions}; detail identity {lastSignInAt,emailConfirmedAt,locale}; reuse PersonalStackV4.
- [x] Add failing HTTP tests for enriched page, withheld raw states and denied requests; malformed/mismatched snapshots fail closed.
- [x] Add failing detail identity/client parsing tests including malformed optional fields.
- [x] Enrich only listed IDs after existing admin+RPC checks; identity only on explicit opt-in detail request and owner validation. No N+1 Auth reads on list.
- [x] Run targeted API and client tests to green.

### Task 2: Workspace, overview and user exploration

**Files:** src/components/backoffice/AccountsDashboard.tsx, BackofficeOverview.tsx, AccountDetailPanel.tsx, backofficeDisplay.tsx, src/pages/BackOfficePage.tsx, src/index.css; corresponding component tests.
**Interfaces:** AccountsDashboard accepts initialView and onOpenHistory; default users preserves standalone entry; BackOfficePage chooses overview. Detail accepts AccountDetail and closes without losing list state.
- [x] Add failing UI tests for overview, user navigation, all saved rubrics, missing fields, annual/per-seat data, source errors and late responses.
- [x] Build persistent compact sidebar and overview from independently loaded global first-page data; maintain users filters/page across view changes.
- [x] Build a readable detail panel with profile, selection/tableaux, declared budget, 1–5 usage, trade/TJM, decisions and expandable normalized data. No fabricated timeline.
- [x] Add stack ranking view and source inventory with explicit GA4 unavailability. Preserve explicit diagnostic entry and logout behavior.
- [x] Run component, route and API tests to green.

### Task 3: Verification and review

**Files:** e2e/backoffice-workspace.spec.ts, docs/CHANGELOG_AI.md, this plan/spec.
- [x] Browser route test with isolated synthetic API data and auth: overview → users → profile tabs, search/page/return, mobile 390px; verify source denied and error states. Never persist real personal data in fixtures.
- [x] Run npm test, npm run test:api, app/API typechecks and npm run build; report unrelated baseline failures if any.
- [x] Independent final review of diff; address important findings with regression tests.
- [x] Update changelog, test record and implementation decisions; leave reviewable changes without deploying.

## Execution decisions

- User's “ok fais” authorizes execution in this chat; proceed natively without another plan-approval round.
- Refreshed origin/main 23c103c42a contains the current accounts implementation. Worktree: /Users/mike/.codex/worktrees/backoffice-pilotage/New project.
- No database changes: leverage existing RPC and enrich at most the selected page's snapshots, then return derived summaries only. Identity lookups are detail-only.
- Global data-completeness aggregation is deferred; coverage in a user detail is exact and overview does not invent global completeness metrics.

## Résultat de vérification

915 tests app, 304 API, 10 parcours Chromium FR/EN 390/1440 : passants ; types app/API et design tokens passants. Build complet PASS (844,7 Mio), compilation SSR finale renouvelée après correction mobile/tokens. Revue indépendante terminée : aucun défaut important ; identité sans snapshot corrigée et testée.

Décisions finales : la navigation est locale au workspace (pas de nouveaux chemins publics ni persistance des identifiants/recherches dans l’URL) ; le catalogue et les demandes restent clairement indiqués comme intégrations ultérieures. La lecture utilise les contrats existants, aucun déploiement/migration effectué. Le core.worktree hérité du dépôt pointait sur le checkout principal : une configuration Git locale à ce seul worktree corrige le chemin sans modifier les sources ni le checkout principal.
