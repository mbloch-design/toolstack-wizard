-- Repasse analytics :
--   dovetail-ai -> doublon de dovetail (dovetail.com réel ; dovetailai.com fabriqué)  → 301
--   shield-app  -> Shield (analytics LinkedIn) est fermé, et l'URL est vide           → archive
--   seo-mode    -> URL morte (seomode.com n'existe pas)                                → archive
--   ga4         -> doublon de google-analytics (même URL analytics.google.com)      → 301
--   sql         -> pas un produit (langage, la source pointait vers Wikipedia)       → archive
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('dovetail-ai','shield-app','seo-mode','ga4','sql') AND content_status='published';
