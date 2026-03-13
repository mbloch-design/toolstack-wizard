
DROP POLICY "Public read selector_results by share_token" ON public.selector_results;

CREATE POLICY "Read selector_results by share_token"
  ON public.selector_results FOR SELECT
  TO anon, authenticated
  USING (share_token IS NOT NULL AND share_token::text = current_setting('request.headers', true)::json->>'x-share-token');
