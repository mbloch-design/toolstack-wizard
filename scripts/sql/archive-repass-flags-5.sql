-- Repasse design :
--   are-na -> doublon de arena (are.na est le vrai site ; arena.com pointe ailleurs) → 301
UPDATE public.tools SET content_status='archived'
WHERE slug = 'are-na' AND content_status='published';
