-- GO4 - Email worker foundation (claim queue, status history, worker-safe indexes)

-- 1) Status transition history for operational debugging and back-office traceability
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

-- 2) Keep diagnostic_email_jobs.updated_at consistent for every worker/webhook update
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

-- 3) Persist all status changes in a dedicated event stream
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

-- 4) Worker query performance and idempotence
CREATE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_queue_scan
  ON public.diagnostic_email_jobs (scheduled_for, created_at)
  WHERE status = 'queued';

CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_email_jobs_provider_message_unique
  ON public.diagnostic_email_jobs (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

-- 5) Atomic claim RPC: claim queued jobs without race conditions (FOR UPDATE SKIP LOCKED)
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
