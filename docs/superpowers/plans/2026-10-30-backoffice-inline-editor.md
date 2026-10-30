# Complete fiche editor implementation plan

> For agentic workers: use superpowers:subagent-driven-development task by task with TDD, scoped commits and task reviews. The owner approved this whole-fiche plan and requested implementation on 30 October 2026. Do not pause for ordinary implementation choices.

**Goal:** deliver complete direct fiche editing inside the existing super-administrator back office, using durable real drafts and one global publication action; prepare reusable field capabilities for later restricted publisher accounts without opening them now.

**Architecture:** use current main as the release base; port only the neutral common controls required from the prior design branch. Share raw-catalogue projection and actual public fiche presentation with a controlled private editing mode. Keep the existing authenticated catalogue API, JSON source, Redis versioning and GitHub publication transport, extending their validation and field capabilities.

**Tech Stack:** React 18, declarative React Router, TypeScript, Vite, existing private catalogue API, Redis, GitHub. No new rich-editor, state-management or media-storage dependency.

**Spec:** docs/superpowers/specs/2026-10-29-fiche-inline-editor-design.md; the owner's LAST directions override historical alternatives: the entire fiche, edit at the actual block, offers edited directly together, no lateral duplicate form or separate offer-edit screen. Field coverage and action matrix: docs/BACKOFFICE_FICHE_FIELD_COVERAGE.md and docs/BACKOFFICE_FICHE_UX_AUDIT.md.

## Global constraints

- All administrable fiche families: presentation, classification/usages/audiences, editorial analysis/verdict/rating, plans/pricing, media, official/commercial links, relations/migration, SEO and typed editorial metadata. System/generated/identity fields remain protected with explanations; preserve unknown stored fields.
- Existing super-admin authentication and email allowlist remain authoritative. Future publishers use the same components with server-computed capabilities; no new publisher role/login/billing/moderation is shipped.
- No runtime use of the throwaway HTML prototype, iframe, copied public markup or post-render DOM editing in production.
- Use common controls and Iconoir, business-owned bo-/td- layout styles, no Tailwind inline or new duplicate palette. Public pages, themes and reduced motion retain their current appearance and behavior.
- JSON remains the source; no new Supabase catalogue or authorisation-table migration. No actual catalogue publication from automated tests.
- Structural draft validation differs from business publish validation, including when loading persisted drafts. Preserve unchanged historic irregularities while blocking newly introduced unsafe/incoherent content.
- API version/baseHash/revision CAS, source-conflict detection, no-force publication and conditional cleanup remain intact. One global publication; commit receipt is not deployment confirmation.
- Plan mode ended; implementation is authorised. Existing .superpowers mock sessions and unrelated source work are not disposable.

## Review focus

1. Null/absent/historic pricing values must never become invented first-option defaults or free zero; quote and unknown need distinct persisted intent.
2. Delayed autosave acknowledgments, expiry/conflicts and invalid intermediate input must not lose newer edits or falsely claim saved/published.
3. Shared FR/EN price facts must preserve genuinely independent currencies/markets and untranslated editorial text.
4. Shared public presentation must not fetch over the draft, emit public analytics/SEO, execute shopping/navigation or diverge on hidden fallbacks.
5. Restricted capabilities must be enforced by server path validation, even for forged whole-document PUTs; unknown fields and existing drafts must survive extension.

## Task 1: neutral controls and shared raw projection

Files: common UI controls/styles, pure catalogue-to-Tool mapper, existing hook/prerender callers and focused tests. Port prepared primitives from the prior worktree commit rather than introducing another control family. Keep existing main CSS architecture and extend only missing canonical tokens needed by these controls; do not port the unfinished global CSS reset.

Interfaces:
- Export `mapToolFromJson(raw: unknown): Tool` from a pure shared library; same mappings/fallbacks and audited URL corrections as current public hook, preserve effective current public behavior.
- Common Button/Input/Select/Textarea controls preserve accessible labels, focus, disabled/read-only states, variants and minimum touch-target sizes.
- Public hook imports the pure mapper; it remains the source loader, not an editor persistence mechanism.

- [ ] Write failing mapper parity and neutral-control tests, including null/zero and URL-correction fixtures.
- [ ] Run RED, implement minimum port/extraction, run GREEN plus existing relevant hook/UI tests and type checks.
- [ ] Commit explicit paths and provide task report.

## Task 2: registry, capabilities and durable draft/publication contracts

Files: `src/lib/backofficeCatalog.ts`, new focused catalogue-schema/policy modules, client API adapter, catalogue API/store/contracts and tests. Keep the transport signatures of existing GET/PUT/DELETE/POST and add backwards-compatible response metadata.

Interfaces:
- `CatalogCapabilities = { editablePaths: string[]; canSaveDraft: boolean; canDiscardDraft: boolean; canPublishAll: boolean }` generated from authenticated server actor and the registry; paths are normalized patterns with array wildcards, not arbitrary client grants.
- `CatalogValidationIssue = { path: string; code: string; severity: 'error'|'warning'; stage: 'draft'|'publish' }`; detail/save responses expose `capabilities` and `validation`, and failed publish exposes issues grouped by slug.
- Registry covers observed root and nested business paths with typed controls, optional deletion semantics, ownership and public consumers; aliases and generated/research/identity data are explicit. Do not expose a raw JSON editor.
- Separate `validateCatalogDraft(base, value)` (safe shape/types/allowed changes, incomplete strings/nulls accepted per path) and `validateCatalogPublication(base, value)` (changed paths/dependencies complete with sources). Existing `validateCatalogTool` remains compatible as the strict publication wrapper. Redis decode uses structural validation.
- `priceStatus?: 'paid'|'free'|'quote'|'unknown'|'usage'` on plans is persisted for new/edited price intent; legacy absent status retains legacy public presentation until edited. Extend typed billing periods to the already supported server enum, including one-time/usage; preserve unknown unchanged historic values.
- `priceObservationId?: string` links only truly common facts within one tool. Initialize a deterministic shared ID only for matching planKey, nonempty identical source URL/date and all equal price facts (amount, currency, period, commitment, unit, market, tax, availability); keep uncertain observations separate. Future edits propagate linked facts, not names/summaries/features. Reject forged identity changes/unrelated links. No cross-tool link effects.
- Per-currency comparison references, stable unique planKey, source requirements, unchanged historic compatibility, explicit optional deletions; publication uses the effective shared price resolver and shows remaining fallbacks.

- [ ] Write RED contract tests for incomplete draft save/load, optional deletion, extended rating/verdict/taxonomy fields, denied actor/path, EUR/USD references, quote/unknown, linked/independent observations and legacy unchanged neighbors.
- [ ] Implement, run GREEN including existing API/Redis/CAS suites and native API TypeScript compatibility.
- [ ] Commit explicit paths and report interfaces and any ledgered rulings.

## Task 3: actual shared fiche presentation and direct editing blocks

Files: public fiche page/components, new focused backoffice editing context/blocks and business styles, component tests.

Interfaces:
- A controlled private presentation input supplies `tool`, related summaries/categories, locale, currency, subpage and edit context; bypass public tool fetch when supplied. Public route/prerender keep current loaders and effects. The private mode must not overwrite the draft or emit public SEO/analytics/actions.
- `CatalogEditingContext` supplies raw `value`, immutable published/base value, capabilities, field issues and `onChange(path, value)`/`onRemove(path)`/collection operations. Controls use registry paths and stable collection identities, with unknown fields preserved.
- The shared actual presentation renders read content by default and in-place controls only where capabilities allow. Do not duplicate ToolDetailPage or copy the prototype's DOM/iframe strategy.
- Text, list and structured fields are editable at their blocks; add/remove/order are local, keyboard-accessible and focus-preserving. Five rating axes and proofs/dates are editable for super-admin; final score remains derived.
- Plans remain together, editable name/amount/type/currency inside each box, with in-box expandable billing/features/source settings, add/order/remove/undo and conditional reference replacement. No side form or separate offer-edit route. Derive monthly equivalents, shared facts and provenance through common resolvers, not duplicated price logic.
- Media reflect existing effective curated/JSON sources, URLs and fallbacks; do not pretend unsupported uploads exist. SEO per language/subpage, taxonomy assignment from existing vocabularies and relations use typed controls. Less common business fields appear inside the corresponding block's expandable settings; protected/generated information stays explicit.

- [ ] Write RED component tests for all edit families, read-only capabilities, adding missing values, shared-render parity, no network overwrite/public effects, safe plain text/IME, focus and inline price operations.
- [ ] Implement GREEN; run shared public fiche/pricing/rating/SEO tests and type checks.
- [ ] Commit explicit paths; report any registry/presentation mismatch rather than silently omitting a field.

## Task 4: integrate complete editor session into existing back office

Files: catalogue workspace/editor container and focused hooks, API adapter consumer tests and account-dashboard integration.

Interfaces:
- Add an `Édition directe` entry in existing Fiches for each record, retaining the old form as a secondary temporary fallback. Deep link `/{lang}/back-office?view=catalog&tool={slug}&editor=inline`; reload restores the selected persisted draft. Preserve search/list page on return.
- Use Task 3 controlled presentation and Task 2 metadata. Default deny if capabilities are absent. The same components accept later restricted capabilities without implementing publisher access now.
- Autosave after 1000ms idle/valid edit completion, one active save per fiche. Acknowledge only sent snapshot; keep newer local changes and queue next save with returned version. Invalid unsafe/network/401/403/409 states preserve input and explain recovery. No new localStorage copy of personal/catalogue drafts.
- User-facing states distinguish local changes, saving, saved draft, publish blockers, transmission receipt and confirmed deployment. Stable return and simple language; inline fields require no CMS knowledge.
- One `Mettre en ligne` opens review of all modified records and grouped changes/issues. Flush pending saves before review; stale revision requires re-review, never a silent partial publish. Existing global publish CAS and cleanup preserved. No real catalogue POST from browser tests.

- [ ] Write RED fake-timer/API integration tests for multi-field autosave, late acknowledgments, reopening/reload, invalid draft, expiry/conflict, deep link/access denial and all-record publication.
- [ ] Implement GREEN, extend current catalogue browser fixtures and FR/EN backoffice tests.
- [ ] Commit explicit paths, record task verification.

## Task 5: final acceptance, release and live verification

Files: focused API/component/browser fixtures and tests, active docs/changelog; fix only verified integration findings.

- [ ] Exercise Notion, Attio, Asana, Chronokura and a fiche without plans/rating; every family supports first addition, edits, removal, order where relevant, undo and durable reload.
- [ ] Compare raw input → editor → persisted/reloaded draft → shared public presentation, index/cards, SEO and derived pricing. Include EUR/USD, native/converted fallbacks, missing/one-time/usage values and active URL-correction fixtures.
- [ ] Check 390/768/1440px, FR/EN, keyboard/IME/focus/zoom/reduced motion; restricted-policy tests cover read-only/hidden controls and server-forged requests without opening real publisher accounts.
- [ ] Run app/API/Redis tests, type checks, current main CI commands, full production build through final audits, then rendered-route acceptance. No real catalogue publication in automated tests.
- [ ] Fresh whole-branch review; fix important findings with failing regression tests first. Commit targeted changes, preserve unrelated work and data.
- [ ] Release to the existing production project after green checks; verify deployment READY and authenticated direct-editor opening plus real draft save/reload. Use a record without an existing draft and discard only the exact test revision, or let the owner perform the write check. Never publish sample content or destroy another user's draft.
- [ ] Report exact commit/deployment, verified behaviors, any remaining limitations; do not call deployment READY based solely on a successful local build.
