-- Repasse creation vague 3 :
--   webxr       -> standard/API W3C (Immersive Web), pas un produit commercial  → archive
--   topaz-video -> doublon de topaz-video-ai (même produit topazlabs.com)        → 301
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('webxr','topaz-video') AND content_status='published';
