# GO4 - Email Operations (Worker + Webhook)

Date: 2026-05-27  
Scope: make diagnostic email lifecycle operational end-to-end.

---

## 1) What GO4 adds

### SQL foundation

Migration: `supabase/migrations/20260527170000_go4_email_worker_foundation.sql`

- `public.diagnostic_email_job_events`  
  Status transition event log for every email job update.
- Trigger: automatic `updated_at` refresh on `diagnostic_email_jobs`.
- Trigger: automatic status transition logging in `diagnostic_email_job_events`.
- Queue index for faster worker scans.
- Partial unique index on `(provider, provider_message_id)` to avoid duplicate provider IDs.
- RPC `public.claim_diagnostic_email_jobs(p_limit integer)`:
  - atomically claims jobs (`queued` -> `processing`)
  - increments attempts
  - uses `FOR UPDATE SKIP LOCKED` to prevent race conditions with concurrent workers.

### Edge Functions

- `process-diagnostic-email-jobs`  
  Pulls claimed jobs, sends emails via Resend, updates job states, retries failures with backoff, and writes an `email` restitution.
- `diagnostic-email-webhook`  
  Receives provider events (`sent`, `delivered`, `opened`, `clicked`, `failed`) and reconciles lifecycle state in DB.

---

## 2) Required secrets

Set these in Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIAGNOSTIC_EMAIL_FROM` (example: `ToolTrim <hello@tooltrim.com>`)
- `DIAGNOSTIC_EMAIL_WORKER_KEY` (shared secret to trigger worker endpoint)
- `TOOLTRIM_APP_URL` (example: `https://tooltrim.com`)

Webhook authentication (choose at least one):

- `RESEND_WEBHOOK_SECRET` (signature verification)
- or `DIAGNOSTIC_EMAIL_WEBHOOK_KEY` (shared secret fallback)

---

## 3) How to run

### Worker (manual trigger)

POST `/functions/v1/process-diagnostic-email-jobs` with:

- header: `x-worker-key: <DIAGNOSTIC_EMAIL_WORKER_KEY>`
- optional body:
  - `batchSize` (default `20`, max `100`)
  - `maxAttempts` (default `5`, max `10`)

Example body:

```json
{
  "batchSize": 25,
  "maxAttempts": 5
}
```

Response includes:

- `claimed`
- `sent`
- `retried`
- `failed`

### Webhook

Point provider webhook URL to:

- `/functions/v1/diagnostic-email-webhook`

Supported events mapped to lifecycle:

- `email.sent` -> `sent`
- `email.delivered` -> `delivered`
- `email.opened` -> `opened`
- `email.clicked` -> `clicked`
- `email.bounced`, `email.complained`, `email.failed` -> `failed`

---

## 4) Current lifecycle behavior

1. Frontend queues `diagnostic_report_ready` job at recap validation (GO3).
2. Worker claims queued jobs and sends via Resend.
3. On success:
   - job becomes `sent`
   - `provider_message_id` is stored
   - an `email` restitution entry is written.
4. If `email_preferences.actions = true`, worker auto-queues `diagnostic_followup_24h`.
5. If `email_preferences.checkIn = true`, worker auto-queues `diagnostic_followup_7d`.
6. Webhook updates final delivery/open/click states.

---

## 5) Ops notes

- Deploy both functions before turning on worker cron.
- Use a scheduler (Supabase cron / external cron) to call worker every 1-5 minutes.
- Monitor:
  - `public.vw_backoffice_email_health`
  - `public.diagnostic_email_job_events`
  - `status = 'failed'` with high `attempts`.
