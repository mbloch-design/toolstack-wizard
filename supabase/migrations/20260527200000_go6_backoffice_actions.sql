-- GO6 - Back-office actions and annotations

-- 1) Admin annotations on diagnostic sessions
ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS admin_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS admin_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_admin_updated_at
  ON public.diagnostic_sessions (admin_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_admin_tags
  ON public.diagnostic_sessions USING GIN (admin_tags);

-- 2) Back-office view enrichment with admin metadata
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
  s.admin_tags,
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
