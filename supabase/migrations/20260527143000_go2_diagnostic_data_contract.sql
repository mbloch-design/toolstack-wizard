-- GO2 - Diagnostic data contract (funnel events, snapshots, email lifecycle, restitution, back-office views)

-- 1) Extend diagnostic_sessions with lifecycle metadata (idempotent)
ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_step_id SMALLINT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS funnel_version TEXT NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_created_at
  ON public.diagnostic_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_email
  ON public.diagnostic_sessions (email);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_persona
  ON public.diagnostic_sessions (persona);

-- 2) Types for lifecycle tables (safe create)
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

-- 3) Funnel events: each interaction can be tracked for analytics and debugging
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

-- 4) Session snapshots: progressive persistence at each step for recovery / back-office replay
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
  ON public.diagnostic_session_snapshots (step_id, created_at DESC);

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

-- 5) Email jobs: queue + delivery lifecycle for report and follow-up emails
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

-- Worker updates status using service role. For authenticated/anon clients, keep updates locked down.
DROP POLICY IF EXISTS "Update diagnostic_email_jobs by service token" ON public.diagnostic_email_jobs;
CREATE POLICY "Update diagnostic_email_jobs by service token"
ON public.diagnostic_email_jobs
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- 6) Restitutions: every generated output is versioned (dashboard/email/pdf/share)
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

DROP POLICY IF EXISTS "Insert diagnostic_restitutions by session_token" ON public.diagnostic_restitutions;
CREATE POLICY "Insert diagnostic_restitutions by session_token"
ON public.diagnostic_restitutions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.diagnostic_sessions ds
    WHERE ds.id = diagnostic_restitutions.session_id
      AND ds.session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
  )
);

-- 7) Report artifacts: references to rendered report files
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

DROP POLICY IF EXISTS "Insert diagnostic_report_artifacts by session_token" ON public.diagnostic_report_artifacts;
CREATE POLICY "Insert diagnostic_report_artifacts by session_token"
ON public.diagnostic_report_artifacts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.diagnostic_sessions ds
    WHERE ds.id = diagnostic_report_artifacts.session_id
      AND ds.session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
  )
);

-- 8) Back-office views (service-role usage)
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
