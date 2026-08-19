-- Repasse suivi productivité / juridique :
--   fig-terminal  -> fermé : discontinué par AWS le 1er septembre 2024, rebrandé Amazon Q Developer → archive
--   reclaim-ai    -> doublon de reclaim (même URL officielle reclaim.ai)                              → 301
--   legifrance-pro-> service public gratuit (Légifrance), pas un produit SaaS commercial              → archive
--   captaindoc    -> aucun produit identifiable sous ce nom (pas de présence web)                     → archive
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('fig-terminal','reclaim-ai','legifrance-pro','captaindoc') AND content_status='published';
