-- Repasse nocode-web :
--   relume-ai -> doublon de relume (relume.io est le vrai site ; relumeai.com fabriqué) → 301
--   pageai    -> domaine parké (pageai.io à vendre), pas un produit                      → archive
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('relume-ai','pageai') AND content_status='published';
