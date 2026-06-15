# GO8 - Funnel Recovery

Date: 2026-05-27  
Scope: user session recovery, abandonment traceability, and action-plan persistence.

---

## Delivered

### Resume diagnostic

The diagnostic funnel now stores a local recovery envelope with:

- current step
- session answers
- selected tools
- DB session id/token
- email queue flag
- final-save flag

When the user comes back on the same language route, ToolTrim resumes the funnel instead of starting from zero. A small recovery banner lets the user continue or restart cleanly.

Files:

- `src/lib/diagnosticRecovery.ts`
- `src/components/DiagnosticRouter.tsx`

### Abandonment and resume tracking

The client now updates operational state when the page is hidden or closed:

- `abandoned_at`
- `last_client_seen_at`
- `recovery_state`

When a saved diagnostic is resumed, the session is marked with:

- `resumed_at`
- `recovery_state.status = resumed`
- `session_resumed` funnel event

### Action-plan persistence

Checked dashboard actions are now persisted locally and in Supabase:

- `actions_completed`
- `action_state.completed_action_ids`
- `action_state.recovered_savings`
- `action_state.total_savings`

Updated:

- `src/components/dashboard/DashActions.tsx`

### Back-office visibility

The back-office session view and CSV export now include:

- last client signal
- last resume time
- recovery state
- action state
- recovered savings from completed actions

Updated:

- `supabase/migrations/20260527220000_go8_recovery_and_action_state.sql`
- `src/lib/backofficeApi.ts`
- `src/pages/BackOfficePage.tsx`

---

## Notes

Supabase security posture kept aligned with current docs: the new fields are added to an existing RLS-protected table rather than exposing a new public table.

Deployment process remains intentionally out of scope for this GO.
