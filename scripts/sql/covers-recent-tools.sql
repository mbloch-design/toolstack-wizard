-- covers / functional_needs des outils « Recently Added ».
-- Ces deux champs ne sont pas des images : ce sont les besoins fonctionnels
-- couverts, consommés par le bloc Fonctionnalités, « Explorer autour de » et
-- l'appariement. Laissés vides, les 14 fiches sortaient de ces surfaces.
--
-- Les termes ci-dessous sont tous DÉJÀ présents dans le catalogue (notes,
-- knowledge-management, ai-general, task-management, collaboration,
-- documentation, transcription, analytics, creation, templates) : on ne crée
-- aucun terme de vocabulaire, on rattache à l'existant.
UPDATE public.tools AS t
SET covers = v.tags::jsonb, functional_needs = v.tags::jsonb
FROM (VALUES
  ('bear',        '["notes","knowledge-management"]'),
  ('craft',       '["notes","collaboration","documentation","task-management"]'),
  ('octarine',    '["notes","knowledge-management"]'),
  ('hejour',      '["notes"]'),
  ('lunatask',    '["notes","task-management"]'),
  ('notebook-lm', '["notes","knowledge-management","ai-general"]'),
  ('grokipedia',  '["documentation","ai-general"]'),
  ('wispr-flow',  '["transcription","ai-general"]'),
  ('quillbot',    '["creation","ai-general"]'),
  ('essaytone',   '["creation","ai-general"]'),
  ('cudekai',     '["creation","ai-general"]'),
  ('rezi',        '["templates","ai-general"]'),
  ('outrank',     '["creation","analytics","ai-general"]'),
  ('uncovr',      '["analytics"]')
) AS v(slug, tags)
WHERE t.slug = v.slug
  AND (t.covers IS NULL OR t.covers = 'null'::jsonb OR jsonb_array_length(COALESCE(t.covers, '[]'::jsonb)) = 0);
