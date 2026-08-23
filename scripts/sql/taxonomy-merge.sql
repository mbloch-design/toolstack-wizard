-- Fusion des synonymes du vocabulaire covers / functional_needs.
--
-- Suite de taxonomy-normalize.sql, qui n'avait traite que la forme (casse,
-- separateurs). Ici on fusionne des termes de SENS identique exprimes dans deux
-- langues : « gestion-projet » et « project-management » designaient la meme
-- chose et comptaient comme deux besoins distincts dans l'exploration.
--
-- DIRECTION : on conserve systematiquement la variante MAJORITAIRE dans le
-- catalogue, quelle que soit sa langue. « facturation » l'emporte sur
-- « invoicing » (12 fiches contre 1), « project-management » sur
-- « gestion-projet » (24 contre 3). Cela minimise le nombre de fiches touchees.
-- La langue du terme n'a pas d'incidence sur l'affichage : les libelles FR/EN
-- viennent de LABEL_OVERRIDES dans ToolFeaturesBlock.
--
-- NON FUSIONNE volontairement : « veille » et « monitoring ». La veille est
-- informationnelle, le monitoring est technique (supervision d'infrastructure).
-- Les confondre creerait de faux rapprochements entre outils.
--
-- Le code consommateur tolere deja les deux formes : SIGNAL_NEEDS dans
-- stackAutoClassification.ts et needKeys dans creativeAdaptiveEngine.ts
-- enumerent les synonymes cote a cote. La fusion ne casse donc pas
-- l'appariement ; elle le rend simplement coherent.
--
-- L'instantane d'origine reste dans catalog_private.taxonomy_backup.

CREATE TEMP TABLE synonymes(source text PRIMARY KEY, cible text) ON COMMIT DROP;
INSERT INTO synonymes(source, cible) VALUES
  ('gestion-taches',         'task-management'),
  ('gestion-projet',         'project-management'),
  ('visualisation-donnees',  'data-visualization'),
  ('marketing-email',        'email-marketing'),
  ('e-commerce-platform',    'ecommerce'),
  ('accounting',             'comptabilite'),
  ('accounting-automation',  'comptabilite'),
  ('payments',               'paiements'),
  ('automation',             'automatisation'),
  ('prototypage',            'prototyping'),
  ('prototypage-interactif', 'prototyping'),
  ('typographie',            'typography'),
  ('invoicing',              'facturation'),
  ('scheduling',             'planification'),
  ('database',               'base-de-donnees');

UPDATE public.tools t SET covers = (
  SELECT jsonb_agg(DISTINCT COALESCE(s.cible, v))
  FROM jsonb_array_elements_text(t.covers) v
  LEFT JOIN synonymes s ON s.source = v
)
WHERE t.covers IS NOT NULL AND jsonb_array_length(t.covers) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.covers) v
    JOIN synonymes s ON s.source = v
  );

UPDATE public.tools t SET functional_needs = (
  SELECT jsonb_agg(DISTINCT COALESCE(s.cible, v))
  FROM jsonb_array_elements_text(t.functional_needs) v
  LEFT JOIN synonymes s ON s.source = v
)
WHERE t.functional_needs IS NOT NULL AND jsonb_array_length(t.functional_needs) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.functional_needs) v
    JOIN synonymes s ON s.source = v
  );
