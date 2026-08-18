-- Repasse communication :
--   elgato-stream-deck -> doublon de elgato ; elgatostreamdeck.com ne résout pas (URL fabriquée) → 301
UPDATE public.tools SET content_status='archived'
WHERE slug='elgato-stream-deck' AND content_status='published';
