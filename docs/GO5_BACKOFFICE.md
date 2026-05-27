# GO5 - Back-office Diagnostic

Date: 2026-05-27  
Scope: operational UI + secure data access for diagnostic and email lifecycle monitoring.

---

## 1) Delivered

### Edge Function

`supabase/functions/backoffice-diagnostic/index.ts`

- Admin-protected endpoint (header `x-admin-key`).
- Uses service role to read operational objects.
- Two modes:
  - `dashboard`: sessions + email health + recent email jobs.
  - `session_detail`: full detail for one session (events, snapshots, email jobs, email job events).

### Frontend page

`src/pages/BackOfficePage.tsx`  
`src/lib/backofficeApi.ts`

- Route: `/:lang/back-office`
- Admin key gate (stored in local storage for the current browser).
- KPI cards for session and email performance.
- Filters: period, persona, status, search, volume.
- Sessions table with detail drawer.
- Email tab with deliverability summary + health table.

### Routing / config

- App route added in `src/App.tsx`
- Function exposed in `supabase/config.toml`:
  - `[functions.backoffice-diagnostic]`
  - `verify_jwt = false` (auth handled by `x-admin-key` in function)

---

## 2) Required secrets

Set in Supabase secrets:

- `BACKOFFICE_ADMIN_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 3) How to access

1. Deploy the new Edge Function.
2. Open:
   - `/fr/back-office`
   - or `/en/back-office`
3. Enter `BACKOFFICE_ADMIN_KEY`.

---

## 4) Notes

- Back-office page is forced `noindex`.
- Data is read-only in GO5.
- This is ready for GO6 additions (actions: resend/cancel job, session tagging, export CSV).
