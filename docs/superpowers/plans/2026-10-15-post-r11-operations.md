# Post-R11 operations implementation plan

> Execute inline with superpowers:executing-plans. User approved the consolidated roadmap sequence. No real payment or unsolicited email.

Goal: close delivery, isolate submission tests, reconcile operations and sponsored offer before catalogue work.

## Constraints
Preserve unrelated work and catalogue pilot; existing isolated branch; no secrets in output. No publication without verified scope. Redis rotation uses the official provider workflow and must preserve existing access until replacement is configured.

## Tasks
- [x] 1. Confirm CI/Vercel for ffbb3f7ac7 and public route behavior.
- [x] 2. Reproduce cross-origin APIs in e2e/submit-payment.spec.ts with an origin assertion before fulfilling requests (red). Remove localhost-to-production branches in src/pages/SubmitToolPage.tsx; keep same-origin /api paths (green). Run payment journeys in both languages; default local without API must not claim success.
- [ ] 3. Reconcile deployed submission proofs, maintenance access, backup and Redis rotation prerequisites; perform only supported verified operations, leave precise blockers if access missing.
- [x] 4. Audit sponsored offer against available placements; preserve contact-only nature and avoid promising nonexistent fixed delivery. Apply minimal factual copy correction with tests if required.
- [ ] 5. Check accessible reporting and reproduced search defects; prepare bounded R5/R6 process without publishing fiche work.
- [x] 6. Independent whole-change review, appropriate types/build/browser validation; update roadmap and changelog.

## Ledger
Existing isolated checkout stack-discovery-release reused. No shared API contract across tasks beyond the production submission endpoints: their names and payloads remain unchanged. Task 2 changes browser origin selection only. Full detailed commercial feature construction is not inferred from an audit finding.

Ruling: sponsorship is deferred by explicit user reply; exact existing offer restored. No placement feature or commercial copy change included.
Task 2: 6 cross-origin branches reproduced; fixed same-origin; independent observer covers specialized mocks. Additional invalid badge response tests red then green (4 cases). Dev browser16, app379, types PASS. Final build pending.
Task 3: Free tier/eviction/quota checked read-only; credential rotation not executed because browser policy requires user handoff for changing authentication credentials. No secrets revealed.
Task 5: GA4 read-only report inspected to14Oct; two historical events visible, new events not yet visible in that reporting range. No product efficacy inferred. Five-tool canary process proposed, not launched.

Task 1: complete — CI38763760190 success; Vercel success forffbb3f7ac7; R11public21 and both writer guide descriptions PASS.
Task 2: final build PASS; 379 app tests and app types reconfirmed after restoring exact sponsored offer. Artifact browser recipe in progress.

Task 6: complete for the implemented patch — final independent review clean; app379/types/build PASS; artifact browser16 PASS. No new push. Task3 remains operator handoff; Task5 reporting partial and search reproduction still open, R5/R6 process proposed.
