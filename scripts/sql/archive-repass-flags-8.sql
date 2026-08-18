-- Repasse communication :
--   elgato-stream-deck -> doublon de elgato ; elgatostreamdeck.com ne résout pas (URL fabriquée) → 301
UPDATE public.tools SET content_status='archived'
WHERE slug='elgato-stream-deck' AND content_status='published';

-- around : produit arrêté le 31 mars 2025, migré vers Miro Video Calls → archive
UPDATE public.tools SET content_status='archived'
WHERE slug='around' AND content_status='published';
