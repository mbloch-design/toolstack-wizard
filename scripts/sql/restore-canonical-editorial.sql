-- RESTAURATION : la repasse niveau A a écrasé l'éditorial canonical de 6 fiches
-- dans public.tools. La source de vérité (catalog_private.tool_editorial_content)
-- est intacte : on la republie vers public.tools pour ces slugs uniquement.
UPDATE public.tools t SET
  short_description    = COALESCE(fr.short_description, t.short_description),
  long_description     = COALESCE(fr.long_description,  t.long_description),
  verdict              = COALESCE(fr.verdict,     t.verdict),
  pros                 = COALESCE(fr.pros,        t.pros),
  cons                 = COALESCE(fr.cons,        t.cons),
  use_cases            = COALESCE(fr.use_cases,   t.use_cases),
  relevant_for         = COALESCE(fr.relevant_for,t.relevant_for),
  short_description_en = COALESCE(en.short_description, t.short_description_en),
  long_description_en  = COALESCE(en.long_description,  t.long_description_en),
  verdict_en           = COALESCE(en.verdict,   t.verdict_en),
  pros_en              = COALESCE(en.pros,      t.pros_en),
  cons_en              = COALESCE(en.cons,      t.cons_en),
  use_cases_en         = COALESCE(en.use_cases, t.use_cases_en)
FROM catalog_private.tool_editorial_content fr
LEFT JOIN catalog_private.tool_editorial_content en
  ON en.tool_id = fr.tool_id AND en.lang = 'en'
WHERE fr.tool_id = t.id
  AND fr.lang = 'fr'
  AND t.slug IN ('calendly','contra','linear','loom','notion','webflow');
