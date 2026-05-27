# GO6 - Back-office Actions

Date: 2026-05-27  
Scope: add operational actions in back-office (without deployment procedure in this phase).

---

## Delivered

### Session annotations

- Admin tags and notes on each diagnostic session.
- Persisted in `diagnostic_sessions`:
  - `admin_tags text[]`
  - `admin_note text`
  - `admin_updated_at timestamptz`

### Email job controls

- Back-office action endpoints for email jobs:
  - `retry_now` (requeue immediately)
  - `schedule` (+1h from UI)
  - `cancel` (set status `cancelled`)

### CSV export

- Export sessions table to CSV.
- Export recent email jobs table to CSV.

### UI updates

- Sessions table now shows admin tags.
- Session detail drawer now includes:
  - tags editor
  - internal note
  - save action
- Emails tab now includes recent jobs table with action buttons.

---

## Files added/updated

- `supabase/migrations/20260527200000_go6_backoffice_actions.sql`
- `supabase/functions/backoffice-diagnostic/index.ts`
- `src/lib/backofficeApi.ts`
- `src/pages/BackOfficePage.tsx`
