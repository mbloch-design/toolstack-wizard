-- GO28 targeted diagnostic write path SQL.
-- Purpose: restore the live diagnostic tunnel without exposing back-office data.
-- Safe to run from the Supabase SQL Editor.

ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS session_token uuid NOT NULL DEFAULT gen_random_uuid();

DROP POLICY IF EXISTS "Anyone can insert diagnostic_sessions" ON public.diagnostic_sessions;
CREATE POLICY "Anyone can insert diagnostic_sessions"
ON public.diagnostic_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Read diagnostic_sessions by session_token" ON public.diagnostic_sessions;
CREATE POLICY "Read diagnostic_sessions by session_token"
ON public.diagnostic_sessions
FOR SELECT
TO anon, authenticated
USING (
  session_token IS NOT NULL
  AND session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
);

DROP POLICY IF EXISTS "Anyone can update diagnostic_sessions" ON public.diagnostic_sessions;
DROP POLICY IF EXISTS "Update diagnostic_sessions by session_token" ON public.diagnostic_sessions;
CREATE POLICY "Update diagnostic_sessions by session_token"
ON public.diagnostic_sessions
FOR UPDATE
TO anon, authenticated
USING (
  session_token IS NOT NULL
  AND session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
)
WITH CHECK (
  session_token IS NOT NULL
  AND session_token::text = ((current_setting('request.headers', true))::json ->> 'x-session-token')
);

GRANT INSERT, UPDATE ON public.diagnostic_sessions TO anon, authenticated;
GRANT SELECT (id, session_token) ON public.diagnostic_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_sessions TO service_role;

GRANT INSERT ON public.diagnostic_step_events TO anon, authenticated;
GRANT INSERT ON public.diagnostic_session_snapshots TO anon, authenticated;
GRANT INSERT ON public.diagnostic_email_jobs TO anon, authenticated;
GRANT INSERT ON public.diagnostic_restitutions TO anon, authenticated;
GRANT INSERT ON public.diagnostic_report_artifacts TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_step_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_session_snapshots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_email_jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_restitutions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_report_artifacts TO service_role;

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
