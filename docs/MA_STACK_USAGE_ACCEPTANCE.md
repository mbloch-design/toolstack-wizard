# Usage box — acceptance record

Scope: `StackUsageReview` on `/:lang/ma-stack`, including the history→pair-review→cancel/confirm round trip. This is a finite story/state matrix, not a claim that every browser, assistive technology or possible input has been tested. The existing personal-stack store, account coordinator and save-status UI supply persistence.

## Contract

The person records a paid tool's use, sees it saved locally without changing the active tool, explicitly advances, can pause/skip/resume or revise, and can revisit previous pair decisions. The original card envelope remains constant at a given viewport:285px phone,295px tablet,desktop230–290px. Extra history or enlarged content scrolls inside the scene. No usage-derived savings or suitability verdict.

## Matrix

| Story / state | Required outcome | Evidence |
|---|---|---|
| No tools / only one tool | Existing empty/starter flow, no misleading usage survey | Existing route starter cases |
| All free / no paid question | Honest free summary and inventory link | FR/EN all-free route cases |
| Empty→loaded paid rows | Open first pending tool | Component regression |
| First answer1–5 | Ascending meter on a shared baseline; equal ≥44px full-column targets; one recorded marker; immediate save in place | Unit + route baseline/target/selection geometry |
| Hover/focus | Feedback pictogram/text reacts; recorded meter marker stays on selected level, no write | Component regression + route hover assertions |
| Visible choice / spoken name | Name includes visible label in both languages | FR/EN component regression |
| Skip several / pause / resume | No fabricated answers; first missing resumed; previous answers kept | Component sequence + route persistence |
| Previous / finish with earlier missing | Back preserves values; partial summary remains truthful | Component sequence |
| Complete usage / other decisions remain | Distinguish usage completion from entire stack completion | StackFindings integration |
| Review all / correct one / return | Real per-tool summary shows answered/missing levels and opens any tool; other answers preserved | Component direct-correction sequence + FR/EN route direct-entry/completion |
| Add pending from summary | Reprendre targets new missing row | Component regression |
| Price reorder / remove another row | Current identity unchanged | Component regression |
| Remove current / paid→free | New target cannot inherit preview or setter; keyboard context recovered | Component regression + route data mutation |
| Cloud write pending/error/retry | Local choice stays checked; shared status truthful; retry survives reload | Dedicated route journey |
| Account A→B→A | Answers/scenes follow account, no old preview/answer leak | Dedicated route journey + scope/store tests |
| Reload | Persisted answers restored | Route geometry + retry journeys |
| History / long history | Separate bounded scene, links keyboard reachable | Component +10-choice route history |
| Review pair / cancel | Exactly3 budget answers; cancel separate; mobile opens; saved choice/focus retained | Route pair-review regression |
| Confirm replacement / remove tool | Correct single decision, inventory focus, no duplicate history | Existing route pair cases |
| View tools | Inventory heading receives focus | Route completion |
| Keyboard | Roving radio tabstop, arrows/Home/End, focus visible, no page jump | Component + route keyboard cases |
| FR/EN /320–1440 / short viewport | Height and footer anchors invariant; normal labels unbroken; no horizontal overflow; CTA centers not obscured after scrolling into view | Geometry, label and hit-testing cases + rendered screenshots |
| Long names / very large price | Full name and price grouped together; meter and feedback fit above footer | Long-name regression, actual screenshot + layout assertion |
| Increased text | Flow remains readable inside fixed card, CTA remains reachable | Doubled-text simulation journey; native text-only zoom unverified |
| Reduced motion | Feedback icon has no animation; meter colour transition removed | Route computed-style regression |

## Reproduced defects addressed by this audit

- Pair cancellation was incorrectly a fourth budget tile, carrying two logos and a monthly total; it pushed a real choice below the desktop card. Cancellation belongs in navigation.
- Opening pair history on mobile left the destination collapsed.
- The historical choices were also repeated below the decision card, where they clipped on desktop; they now have one dedicated scene. The single-tool currency caveat remains available when no usage card exists.
- A removed active tool could leave its hovered caption on the replacement; preview must be scoped to tool identity.
- Several visible short radio labels did not occur in accessible names, affecting speech targeting.
- Enlarged text could overlap reserved rows; retain the envelope while allowing scene content to reflow/scroll.

## Limits

Browser execution uses Chromium and synthetic isolated account/server fixtures. No modification of real user accounts. Native screen-reader operation, native browser text-only zoom, every currency/locale/browser, real cloud outage/recovery and arbitrary user data are not certified by this record. Shared account/store tests add boundary evidence; they are distinguished from rendered end-to-end checks. Production verification confirms the deployed revision, domain and served assets; a logged-out production tab does not prove a private signed-in journey.

Verification (2026-10-26): 27 Chromium journeys passed; the eight journeys affected by the final history deduplication passed again after the last correction. The full application suite passed 950 tests; app types and design-token validation passed. The independent source review and actual mobile/desktop screenshots cover the corrected cancellation and history placement. Full application suite, typecheck, design tokens and production build are recorded in CHANGELOG_AI.md. Production publication is verified separately from this local fixture-based acceptance.

## Structure revision — 2026-10-27

The module is a fixed-frame mini-app: context, discrete level meter, reserved reactive feedback and stable command bar. “Outil 1 / 5” indicates position; summary's count indicates completed answers. Icon tiles and the “Son rythme chez vous ?” headline were removed after user feedback. Short labels, blue/peach meter levels and a per-tool editable summary replace decorative choices and the former status-only summary. The scene scrolls for enlarged text/history without growing the card. Long tool names at normal size keep the meter and caption above the footer. Preview from a removed tool cannot relabel an already answered replacement.

Verification of this revision is recorded in CHANGELOG_AI.md. Earlier evidence above remains historical; production publication is verified separately.
