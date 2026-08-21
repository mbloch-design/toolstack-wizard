-- Avocode : service arrêté (sunset annoncé, fin de service le 1er octobre 2023)
UPDATE public.tools SET content_status='archived'
WHERE slug = 'avocode' AND content_status='published';
