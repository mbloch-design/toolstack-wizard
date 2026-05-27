-- GO7 - Diagnostic intelligence layer (stack profile, risk flags, functional coverage)

ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS stack_profile TEXT,
  ADD COLUMN IF NOT EXISTS stack_maturity TEXT,
  ADD COLUMN IF NOT EXISTS primary_risk TEXT,
  ADD COLUMN IF NOT EXISTS risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS functional_coverage JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS diagnostic_insights JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_stack_profile
  ON public.diagnostic_sessions (stack_profile);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_stack_maturity
  ON public.diagnostic_sessions (stack_maturity);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_primary_risk
  ON public.diagnostic_sessions (primary_risk);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_risk_flags
  ON public.diagnostic_sessions USING GIN (risk_flags);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_diagnostic_insights
  ON public.diagnostic_sessions USING GIN (diagnostic_insights);

CREATE OR REPLACE VIEW public.vw_backoffice_diagnostic_sessions AS
WITH step_counts AS (
  SELECT
    e.session_id,
    COUNT(*) AS event_count,
    MAX(e.created_at) AS last_event_at,
    MAX(e.step_id) AS max_step_seen
  FROM public.diagnostic_step_events e
  GROUP BY e.session_id
),
email_counts AS (
  SELECT
    j.session_id,
    COUNT(*) AS email_jobs_count,
    COUNT(*) FILTER (WHERE j.status IN ('sent', 'delivered', 'opened', 'clicked')) AS email_sent_count,
    COUNT(*) FILTER (WHERE j.status = 'failed') AS email_failed_count,
    MAX(j.created_at) AS last_email_job_at
  FROM public.diagnostic_email_jobs j
  GROUP BY j.session_id
)
SELECT
  s.id AS session_id,
  s.created_at,
  s.updated_at,
  s.completed_at,
  s.abandoned_at,
  s.first_name,
  s.email,
  s.persona,
  s.language,
  s.source,
  s.funnel_version,
  s.last_step_id,
  s.health_score,
  s.health_label,
  s.stack_total_cost,
  s.estimated_waste,
  s.optimized_cost,
  s.annual_savings,
  s.actions_completed,
  s.stack_profile,
  s.stack_maturity,
  s.primary_risk,
  COALESCE(s.risk_flags, '[]'::jsonb) AS risk_flags,
  COALESCE(s.functional_coverage, '[]'::jsonb) AS functional_coverage,
  COALESCE(s.diagnostic_insights, '{}'::jsonb) AS diagnostic_insights,
  COALESCE(s.admin_tags, ARRAY[]::text[]) AS admin_tags,
  s.admin_note,
  s.admin_updated_at,
  COALESCE(sc.event_count, 0) AS event_count,
  sc.last_event_at,
  sc.max_step_seen,
  COALESCE(ec.email_jobs_count, 0) AS email_jobs_count,
  COALESCE(ec.email_sent_count, 0) AS email_sent_count,
  COALESCE(ec.email_failed_count, 0) AS email_failed_count,
  ec.last_email_job_at
FROM public.diagnostic_sessions s
LEFT JOIN step_counts sc ON sc.session_id = s.id
LEFT JOIN email_counts ec ON ec.session_id = s.id;
