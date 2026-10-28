# Ma Stack — discovery doorway

User wants this section to encourage discovery. Keep it compact and exploratory: up to three varied, renewable suggestions; a prominent contextual Explorer CTA; discover before adding. Standing user instruction is implementation, verification and push without another approval loop.

## Design
- Replace suite-only recommendations and the unsupported “none overlaps” promise with honest alternatives, shared-use neighbours, extensions and suite relationships already described by the catalogue.
- Use audited relations with precise catalogue reasons. Exclude uncertain comparisons, attached modules and existing stack members. Diversify declared product family/source/direction so three picks do not all belong to one suite when other candidates exist.
- Build a focused StackDiscovery component: reuse ToolCardEditorial media anatomy (16:10 image, open content, identity/category and precise context), existing Ma Stack section title/link and secondary Button. No custom border shells, coloured pills or blue CTA. Entire shared card opens details; Add uses the shared media-action surface with pending/added protection and 44px controls. Three cards maximum, renewed on demand without catalogue reload. No price-led shopping grid.
- Keep an added card visible with an Added state until the person requests other ideas. Scope/remount with the account epoch. Remove stale suggestions if their source tool disappears. Always expose Explorer even when no justified local suggestions exist. Empty stack keeps existing starter.

## Implementation and verification
1. Test candidate selection/diversity, known relation fallback, exclusions, deterministic batches.
2. Extract CartPage recommendation calculation into stackDiscovery helper and render StackDiscovery. Replace existing CSS section in components layer.
3. Test component renewal, added-state stability, empty pool and direct detail/Explorer paths. Actual route FR/EN phone/desktop with Firefly/Adobe example, renewal, addition/reload and Explorer return. Check responsive layout, control targets and no overflow.
4. Update active design/changelog docs. Run relevant unit/type/design checks, build and scoped push; distinguish Git publication from production deployment.

## Repeatable acceptance

The five discovery journeys are registered in the account fixture suite, excluded from the plain Vite suite. Run `npm run test:e2e:accounts -- e2e/stack-discovery-section.spec.ts` with the configured Playwright Chromium installed. This retains the synthetic API/account boundary after deleting session-only test configs.
