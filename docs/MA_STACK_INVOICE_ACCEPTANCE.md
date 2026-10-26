# Invoice entry — acceptance scope

This audit follows the tester's task: private Cursor/GitHub/Vercel stack, Cursor Teams five seats, Vercel free, GitHub still unknown, then copying a monthly or annual invoice. It covers quick entry, detailed editing, calculation, local/account persistence, conversion explanation and the neighbouring usage/decision scenes.

## Required behavior

- Recorded invoice cents are preserved in the displayed total and associated tool amounts; monetary values are formatted to cents rather than rounded to whole units.
- An unknown price stays excluded and labelled unknown; it is never inferred to be zero.
- The invoice stores its amount, currency and billing period. The budget display currency only converts that source; changing display currency cannot reinterpret a draft or saved invoice.
- Quick entry asks for the monthly invoice total, all users included. A visible EUR/USD/GBP selector starts with the budget currency. Different currencies show the native monthly amount and its converted budget equivalent with the site's dated reference rate.
- Detailed entry explicitly names currency/users/yearly billing and opens its form directly. Annual invoice totals divide by twelve; per-seat catalogue plans multiply by seats exactly once. A copied invoice total does not inherit the old seat multiplier.
- Invalid input cannot save, clear the stored amount or silently fall back to a catalogue plan. Explicit zero is accepted. Switching from zero back to a paid subscription removes the old zero override.
- Cancel and Save return focus to the visible subscription control; closing the sheet returns to its trigger or the remaining tool. A different personal-stack scope/epoch gets a fresh editor and no prior draft.
- Formats are locale-aware: decimal point/comma to cents; English comma thousands; French grouped spaces/NBSP. Unsupported currencies, scientific/hex syntax, negatives, malformed grouping and excess decimals are not guessed.

## Evidence matrix

| Scenario | Evidence |
|---|---|
| Tester baseline USD200, GitHub unknown | Actual route with synthetic saved subscription setup; stored Cursor Teams5 retained |
| Quick default USD and native EUR/USD/GBP choices | Component tests and FR/EN route journeys |
| Display switch during draft | Component test + actual desktop currency picker |
| Mixed invoice→budget conversion | Native values preserved; equivalent and dated reference visible in both editors |
| Decimals/grouping/invalid/zero | Shared parser and both editor component regressions |
| Annual, seats, replacing a plan with invoice total | Detailed editor tests and annual route save |
| Detailed direct open and cancellation | Actual FR/EN phone/desktop, focus and no write |
| Save, reload and retained source | Authenticated route fixtures with synthetic accounts |
| Zero→paid→zero | Actual route switch/editor regression |
| Scope boundary with same tool open | Actual route + simulated store-scope transition; old draft reproduced before remount fix |
| Responsive, keyboard, usage height | Rendered captures, control geometry, Enter and focus, neighbouring usage journeys |

## Findings addressed

Euro hardcoded in a field whose save used budget currency; silent draft reassignment after a budget currency switch; detailed invalid edits reverting to entry pricing; JavaScript number syntax interpreted as invoice values; hidden second editor step and labels omitting currency; no conversion explanation on the active budget; obsolete illustration padding compressing the mobile question; zero override preventing reactivation; missing return focus; editor draft surviving the store scope boundary; invoice totals rounded to whole currency units.

## Limits

Tests run in Chromium with isolated synthetic Auth/API fixtures, not real customer accounts. The scope transition test exercises the application's store boundary; it is not a live cross-account browser session certification. Rates remain the site's reference dated 2026-08-27, not live bank rates. No exchange-rate, catalogue-price, tax or billing-model research was performed or implied. Native assistive technologies and every browser/locale are outside this finite matrix. This is a pricing-flow audit, not a whole-product sign-off.

Local verification (2026-10-26): 1,025 application tests /125 files; app typecheck and design-token validation passed. 34 Chromium journeys passed, including seven invoice journeys and 27 neighbouring usage/decision regressions. Independent calculation/state and source/ergonomics reviews completed; actual FR/EN phone/desktop screenshots inspected. The existing signup/confirmation/save/reload journey passed separately. Full production build, routing, generated SEO and output budgets passed. Deployed revision verification is recorded separately in the release result.
