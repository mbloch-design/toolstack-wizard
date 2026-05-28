-- GO26 targeted preprod SQL.
-- Purpose: unblock live preprod validation without repairing the whole remote
-- migration history. Safe to run from Supabase SQL Editor.

-- Diagnostic lifecycle metadata.
ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_step_id SMALLINT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS funnel_version TEXT NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS admin_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stack_profile TEXT,
  ADD COLUMN IF NOT EXISTS stack_maturity TEXT,
  ADD COLUMN IF NOT EXISTS primary_risk TEXT,
  ADD COLUMN IF NOT EXISTS risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS functional_coverage JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS diagnostic_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_client_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS diagnostic_context JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_created_at
  ON public.diagnostic_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_email
  ON public.diagnostic_sessions (email);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_persona
  ON public.diagnostic_sessions (persona);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_admin_updated_at
  ON public.diagnostic_sessions (admin_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_admin_tags
  ON public.diagnostic_sessions USING GIN (admin_tags);
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
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_last_client_seen_at
  ON public.diagnostic_sessions (last_client_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_resumed_at
  ON public.diagnostic_sessions (resumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_recovery_state
  ON public.diagnostic_sessions USING GIN (recovery_state);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_action_state
  ON public.diagnostic_sessions USING GIN (action_state);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_diagnostic_context
  ON public.diagnostic_sessions USING GIN (diagnostic_context);

-- Types used by diagnostic operational tables.
DO $$
BEGIN
  CREATE TYPE public.diagnostic_email_status AS ENUM (
    'queued',
    'processing',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.diagnostic_restitution_channel AS ENUM (
    'dashboard',
    'email',
    'pdf',
    'share'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.diagnostic_report_format AS ENUM (
    'pdf',
    'json',
    'html'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Funnel events and snapshots.
CREATE TABLE IF NOT EXISTS public.diagnostic_step_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL,
  event_name TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'web',
  lang TEXT,
  persona TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_step_events_session_created
  ON public.diagnostic_step_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_step_events_step
  ON public.diagnostic_step_events (step_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_step_events_name
  ON public.diagnostic_step_events (event_name, created_at DESC);

ALTER TABLE public.diagnostic_step_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert diagnostic_step_events by session_token" ON public.diagnostic_step_events;
CREATE POLICY "Insert diagnostic_step_events by session_token"
ON public.diagnostic_step_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.diagnostic_sessions ds
    WHERE ds.id = diagnostic_step_events.session_id
      AND ds.session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
  )
);

CREATE TABLE IF NOT EXISTS public.diagnostic_session_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  step_id SMALLINT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_pct NUMERIC(5,2),
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_session_snapshots_session_created
  ON public.diagnostic_session_snapshots (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_session_snapshots_step
  ON public.diagnostic_session_snapshots (step_id);

ALTER TABLE public.diagnostic_session_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert diagnostic_session_snapshots by session_token" ON public.diagnostic_session_snapshots;
CREATE POLICY "Insert diagnostic_session_snapshots by session_token"
ON public.diagnostic_session_snapshots
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.diagnostic_sessions ds
    WHERE ds.id = diagnostic_session_snapshots.session_id
      AND ds.session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
  )
);

-- Email lifecycle, restitution, and report artifacts.
CREATE TABLE IF NOT EXISTS public.diagnostic_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr',
  status public.diagnostic_email_status NOT NULL DEFAULT 'queued',
  provider TEXT,
  provider_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_session
  ON public.diagnostic_email_jobs (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_status_schedule
  ON public.diagnostic_email_jobs (status, scheduled_for, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_template
  ON public.diagnostic_email_jobs (template_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_queue_scan
  ON public.diagnostic_email_jobs (scheduled_for, created_at)
  WHERE status = 'queued';
CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_provider_message_unique
  ON public.diagnostic_email_jobs (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE public.diagnostic_email_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert diagnostic_email_jobs by session_token" ON public.diagnostic_email_jobs;
CREATE POLICY "Insert diagnostic_email_jobs by session_token"
ON public.diagnostic_email_jobs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.diagnostic_sessions ds
    WHERE ds.id = diagnostic_email_jobs.session_id
      AND ds.session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
  )
);

CREATE TABLE IF NOT EXISTS public.diagnostic_email_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.diagnostic_email_jobs(id) ON DELETE CASCADE,
  status_from public.diagnostic_email_status,
  status_to public.diagnostic_email_status NOT NULL,
  event_source TEXT NOT NULL DEFAULT 'worker',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_email_job_events_job_created
  ON public.diagnostic_email_job_events (job_id, created_at DESC);

ALTER TABLE public.diagnostic_email_job_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_diagnostic_email_job_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_diagnostic_email_jobs_set_updated_at ON public.diagnostic_email_jobs;
CREATE TRIGGER trg_diagnostic_email_jobs_set_updated_at
BEFORE UPDATE ON public.diagnostic_email_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_diagnostic_email_job_updated_at();

CREATE OR REPLACE FUNCTION public.log_diagnostic_email_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.diagnostic_email_job_events (
      job_id,
      status_from,
      status_to,
      event_source,
      metadata
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'db-trigger',
      jsonb_build_object(
        'attempts', NEW.attempts,
        'provider', NEW.provider,
        'provider_message_id', NEW.provider_message_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_diagnostic_email_jobs_status_change ON public.diagnostic_email_jobs;
CREATE TRIGGER trg_diagnostic_email_jobs_status_change
AFTER UPDATE ON public.diagnostic_email_jobs
FOR EACH ROW
EXECUTE FUNCTION public.log_diagnostic_email_job_status_change();

CREATE OR REPLACE FUNCTION public.claim_diagnostic_email_jobs(p_limit integer DEFAULT 20)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  email TEXT,
  template_key TEXT,
  locale TEXT,
  attempts INTEGER,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT j.id
    FROM public.diagnostic_email_jobs j
    WHERE j.status = 'queued'
      AND j.scheduled_for <= now()
    ORDER BY j.created_at ASC
    LIMIT GREATEST(COALESCE(p_limit, 20), 1)
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.diagnostic_email_jobs j
    SET
      status = 'processing',
      attempts = j.attempts + 1,
      last_error = NULL
    WHERE j.id IN (SELECT id FROM candidates)
    RETURNING j.id, j.session_id, j.email, j.template_key, j.locale, j.attempts, j.metadata
  )
  SELECT
    c.id,
    c.session_id,
    c.email,
    c.template_key,
    c.locale,
    c.attempts,
    c.metadata
  FROM claimed c;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_diagnostic_email_jobs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_diagnostic_email_jobs(integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.diagnostic_restitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  channel public.diagnostic_restitution_channel NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_restitutions_session
  ON public.diagnostic_restitutions (session_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_restitutions_channel
  ON public.diagnostic_restitutions (channel, generated_at DESC);

ALTER TABLE public.diagnostic_restitutions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.diagnostic_report_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  restitution_id UUID REFERENCES public.diagnostic_restitutions(id) ON DELETE SET NULL,
  format public.diagnostic_report_format NOT NULL DEFAULT 'pdf',
  storage_path TEXT,
  public_url TEXT,
  byte_size BIGINT,
  checksum TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_report_artifacts_session
  ON public.diagnostic_report_artifacts (session_id, generated_at DESC);

ALTER TABLE public.diagnostic_report_artifacts ENABLE ROW LEVEL SECURITY;

-- Back-office views.
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
  s.last_client_seen_at,
  s.resumed_at,
  COALESCE(s.recovery_state, '{}'::jsonb) AS recovery_state,
  COALESCE(s.action_state, '{}'::jsonb) AS action_state,
  COALESCE(s.diagnostic_context, '{}'::jsonb) AS diagnostic_context,
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

CREATE OR REPLACE VIEW public.vw_backoffice_email_health AS
SELECT
  date_trunc('day', j.created_at) AS day,
  j.template_key,
  j.locale,
  COUNT(*) AS total_jobs,
  COUNT(*) FILTER (WHERE j.status = 'queued') AS queued_jobs,
  COUNT(*) FILTER (WHERE j.status = 'sent') AS sent_jobs,
  COUNT(*) FILTER (WHERE j.status = 'delivered') AS delivered_jobs,
  COUNT(*) FILTER (WHERE j.status = 'opened') AS opened_jobs,
  COUNT(*) FILTER (WHERE j.status = 'clicked') AS clicked_jobs,
  COUNT(*) FILTER (WHERE j.status = 'failed') AS failed_jobs
FROM public.diagnostic_email_jobs j
GROUP BY 1, 2, 3
ORDER BY day DESC, template_key ASC;

ALTER VIEW public.vw_backoffice_diagnostic_sessions SET (security_invoker = true);
ALTER VIEW public.vw_backoffice_email_health SET (security_invoker = true);

REVOKE ALL ON public.vw_backoffice_diagnostic_sessions FROM PUBLIC;
REVOKE ALL ON public.vw_backoffice_diagnostic_sessions FROM anon;
REVOKE ALL ON public.vw_backoffice_diagnostic_sessions FROM authenticated;
GRANT SELECT ON public.vw_backoffice_diagnostic_sessions TO service_role;

REVOKE ALL ON public.vw_backoffice_email_health FROM PUBLIC;
REVOKE ALL ON public.vw_backoffice_email_health FROM anon;
REVOKE ALL ON public.vw_backoffice_email_health FROM authenticated;
GRANT SELECT ON public.vw_backoffice_email_health TO service_role;

COMMENT ON VIEW public.vw_backoffice_diagnostic_sessions IS
  'Back-office only. Access through service-role Edge Function backoffice-diagnostic.';

COMMENT ON VIEW public.vw_backoffice_email_health IS
  'Back-office only. Access through service-role Edge Function backoffice-diagnostic.';
