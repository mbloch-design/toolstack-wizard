-- Repasse gestion de projet :
--   monday -> doublon de monday-com (même URL monday.com, même produit) → 301
UPDATE public.tools SET content_status='archived'
WHERE slug='monday' AND content_status='published';
