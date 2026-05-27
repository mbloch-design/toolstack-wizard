# GO2 - Data Contract Diagnostic

Date: 2026-05-27  
Scope: funnel diagnostic, persistence, email lifecycle, restitution, back-office.

---

## 1) Goal

Define a durable data contract so ToolTrim can:

- persist the full diagnostic journey (not only final result),
- recover abandoned sessions,
- drive report email delivery and follow-ups,
- expose reliable back-office data for operations and product decisions,
- keep every restitution versioned and traceable.

---

## 2) Canonical session object

Canonical record: `public.diagnostic_sessions`

Existing fields stay valid. GO2 extends lifecycle tracking with:

- `updated_at`
- `completed_at`
- `abandoned_at`
- `last_step_id`
- `source` (`web` by default)
- `funnel_version` (`v1` by default)
- `consent_marketing`
- `consent_at`

Session identity:

- `id` = technical session id
- `session_token` = scoped token used in RLS checks via `x-session-token` header

---

## 3) Funnel-level persistence

### `public.diagnostic_step_events`

Purpose: immutable event stream for analytics/debug.

Core columns:

- `session_id`
- `step_id`
- `event_name`
- `event_payload` (`jsonb`)
- `source`, `lang`, `persona`, `created_at`

Recommended `event_name` convention:

- `step_viewed`
- `step_completed`
- `step_back`
- `validation_error`
- `tool_selected`
- `tool_unselected`
- `email_opt_in_changed`
- `report_requested`
- `session_completed`
- `session_abandoned`

### `public.diagnostic_session_snapshots`

Purpose: recovery and replay of user state by step.

Core columns:

- `session_id`
- `step_id`
- `snapshot` (`jsonb`)
- `completion_pct`
- `is_final`
- `created_at`

Snapshot should contain only the minimal state needed to restore UX.

---

## 4) Email lifecycle contract

### `public.diagnostic_email_jobs`

Purpose: queue + delivery state machine for diagnostic emails.

Core columns:

- `session_id`
- `email`
- `template_key`
- `locale`
- `status`
- `provider`, `provider_message_id`
- `attempts`
- `scheduled_for`
- `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `failed_at`
- `last_error`
- `metadata`

Status enum:

- `queued`
- `processing`
- `sent`
- `delivered`
- `opened`
- `clicked`
- `failed`
- `cancelled`

Recommended initial `template_key` set:

- `diagnostic_report_ready`
- `diagnostic_followup_24h`
- `diagnostic_followup_7d`
- `diagnostic_reactivation_30d`

---

## 5) Restitution contract

### `public.diagnostic_restitutions`

Purpose: version every generated output.

Core columns:

- `session_id`
- `channel` (`dashboard`, `email`, `pdf`, `share`)
- `version`
- `summary`
- `details`
- `score_snapshot`
- `generated_at`

### `public.diagnostic_report_artifacts`

Purpose: store references to rendered files.

Core columns:

- `session_id`
- `restitution_id` (nullable)
- `format` (`pdf`, `json`, `html`)
- `storage_path`
- `public_url`
- `byte_size`
- `checksum`
- `generated_at`

---

## 6) Back-office read models

### `public.vw_backoffice_diagnostic_sessions`

Session-level operational view:

- identity/context (`session_id`, `persona`, `language`, `source`, `funnel_version`)
- KPI state (`health_score`, `estimated_waste`, `annual_savings`, `actions_completed`)
- funnel activity (`event_count`, `last_event_at`, `max_step_seen`)
- email activity (`email_jobs_count`, `email_sent_count`, `email_failed_count`)

### `public.vw_backoffice_email_health`

Daily deliverability view by template/locale:

- `total_jobs`, `queued_jobs`, `sent_jobs`, `delivered_jobs`, `opened_jobs`, `clicked_jobs`, `failed_jobs`

---

## 7) Security contract

RLS principle:

- client writes are token-scoped by `session_token` and request header `x-session-token`,
- anonymous broad reads are not allowed on operational tables,
- back-office queries run through service role.

GO2 migration enforces insert policies on new funnel tables with token check against `diagnostic_sessions`.

---

## 8) Implementation order for GO3

1. Create session as early as possible in the funnel (step 0 or step 1).  
2. Persist `step_viewed` + `step_completed` events at each transition.  
3. Persist snapshots at critical steps (persona, selected tools, email, closing, results).  
4. Queue email job when user validates report-by-email step.  
5. Generate restitution records on dashboard render and PDF generation.  
6. Build admin pages on top of `vw_backoffice_diagnostic_sessions` and `vw_backoffice_email_health`.

---

## 9) Known compatibility notes

- Existing `diagnostic_sessions` and `selector_results` flows remain valid.
- Existing frontend share links currently target routes that do not exist yet; GO3/GO4 should align share URLs and route handling.
- Existing report email UX has a pending TODO in `DiagStep6bEmailRecap`; GO4 should wire `diagnostic_email_jobs` immediately after email capture.
