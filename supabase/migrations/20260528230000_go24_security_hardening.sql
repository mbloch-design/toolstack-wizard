-- GO24 - Security hardening before preprod/prod
-- - Remove historical public write/delete policies on catalog tables.
-- - Explicitly protect back-office views from anon/authenticated Data API access.

-- 1) Catalog is public-read, but no longer public-write.
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete tools" ON public.tools;

-- Keep the intended public read policies from the original catalog migrations.
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read tools" ON public.tools;
CREATE POLICY "Public read tools"
  ON public.tools FOR SELECT TO anon, authenticated
  USING (true);

-- 2) Back-office views contain emails and operational metadata.
-- They must be reachable only through service-role Edge Functions.
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
