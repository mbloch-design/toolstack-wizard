# GO7 - Diagnostic Intelligence

Date: 2026-05-27  
Scope: functional scoring, stack profile, risk signals, restitution traceability, back-office visibility.

---

## Delivered

### Diagnostic intelligence engine

New computed layer:

- stack profile: healthy, bloated, overlap-heavy, fragile, high-leverage
- stack maturity: emerging, structured, overbuilt, optimized
- primary risk and risk flags
- functional coverage by need/tool group
- focus areas for the user action plan

File:

- `src/utils/diagnosticInsights.ts`

### Dashboard restitution

The result dashboard now shows:

- stack profile
- maturity
- primary risk
- persona-specific interpretation
- action focus areas in the action plan

Updated:

- `src/components/dashboard/DashOverview.tsx`
- `src/components/dashboard/DashActions.tsx`

### Database capture

`diagnostic_sessions` now stores:

- `stack_profile`
- `stack_maturity`
- `primary_risk`
- `risk_flags`
- `functional_coverage`
- `diagnostic_insights`

The dashboard also writes a versioned `diagnostic_restitutions` row with the GO7 summary, details, and score snapshot.

Migration:

- `supabase/migrations/20260527210000_go7_diagnostic_intelligence.sql`

### Back-office visibility

Back-office now exposes:

- stack profile in sessions table
- profile filter
- GO7 diagnostic read in session detail
- restitution history in session detail
- enriched CSV export

Updated:

- `supabase/functions/backoffice-diagnostic/index.ts`
- `src/lib/backofficeApi.ts`
- `src/pages/BackOfficePage.tsx`

---

## Notes

Deployment process remains intentionally out of scope for this GO, per request.
