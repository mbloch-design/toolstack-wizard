-- Repasse IA généraliste — doublons (le slug conservé est celui portant l'URL réelle) :
--   openai       -> doublon de chatgpt (le produit, bien plus recherché)   → 301
--   anthropic    -> doublon de claude (le produit, bien plus recherché)    → 301
--   descript     -> doublon de descript-ai                               → 301
--   flux         -> doublon de flux-ai                                   → 301
--   kling-ai     -> doublon de kling                                     → 301
--   magnific-ai  -> doublon de magnific                                  → 301
--   otter        -> doublon de otter-ai (otter.ai est le vrai produit)   → 301
--   figma-weave  -> fonctionnalité de Figma, pas un produit autonome     → 301 vers figma
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('openai','anthropic','descript','flux','kling-ai','magnific-ai','otter','figma-weave')
AND content_status='published';
