# Invoice currency implementation plan

> **For agentic workers:** Use Superpowers verification and independent review; user has authorized implementation and scoped push in this conversation.

**Goal:** Make invoice entry explicit, safe and consistent across quick and detailed pricing.
**Architecture:** Preserve PlanChoice; separate invoice currency from display currency; reuse dated conversions and strict parsing.
**Tech Stack:** React, TypeScript, CSS components layer, Vitest, isolated-account Playwright.

- [x] Reproduce wrong quick label and invalid detailed-save behavior before correction.
- [x] Quick invoice field: explicit currency, stable native draft, converted budget preview and dated explanation.
- [x] Detailed editor: direct open, discoverable labels, input validation, zero/annual/seats/cancel regression coverage.
- [x] Actual route: tester stack, mixed currency, reload, display switch, FR/EN responsive and keyboard checks.
- [ ] Independent review; full tests, app types, tokens and build; explicit scoped commit/push and production verification.
