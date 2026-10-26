# Ma Stack — copy an invoice safely

Tester intent: enter an invoice without mental conversion, keep its native currency, understand the monthly budget result. Existing PlanChoice already stores amount/currency/period/seats independently of display currency. No schema or rate changes.

Chosen implementation (builder decision within the requested correction): visible invoice-currency selector in quick entry, initially budget currency and then independent; conversion caption with dated reference rate when currencies differ. A label-only fix would leave mixed invoices and display-switch reassignment unresolved. Requiring the detailed editor for currency would preserve the reported discovery problem.

Quick entry is a total monthly invoice, all users included. Annual invoices and catalogue per-seat plans use the detailed editor, opened directly by a link naming currency/users/yearly billing. Nothing is saved until Save. Cancel/close preserves the saved subscription.

Both inputs use strict locale-aware invoice parsing; invalid or incomplete input cannot save or revert to catalogue pricing. Explicit zero is a real declared zero. Native values survive display currency/language changes, reload, account saves and correction. Conversion uses the existing dated site reference, not a live bank rate. No sourced catalogue changes.

Acceptance: tester Cursor Teams5 / Vercel free / GitHub unknown; quick USD, different invoice currency, display-switch during draft, decimals/grouping/invalid/zero; annual /12 and seats multiplication exactly once; detailed direct entry, cancellation, reload; FR/EN phone/desktop keyboard and overflow. Usage-card height remains untouched. Scope is the price-entry flow and its budget explanation, not a guarantee for all site features.
