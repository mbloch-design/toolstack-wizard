-- Repasse creation vague 2 :
--   magicbrief -> fermé (magicbrief.com : "shut down on July 31, 2026", équipe → Canva)  → archive
--   modo       -> arrêté par Foundry (winding down, plus de releases)                      → archive
--   opusclip   -> doublon de opus-clip (opus.pro)                                           → 301
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('magicbrief','modo','opusclip') AND content_status='published';
