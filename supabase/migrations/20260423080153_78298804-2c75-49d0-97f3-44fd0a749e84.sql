-- Add session_token to diagnostic_sessions to scope updates
ALTER TABLE public.diagnostic_sessions
  ADD COLUMN IF NOT EXISTS session_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Replace permissive UPDATE policy with token-scoped one
DROP POLICY IF EXISTS "Anyone can update diagnostic_sessions" ON public.diagnostic_sessions;

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