-- Deuxieme vague de ressources Framer : catalogues de templates et de composants.
--
-- Toutes sont form_factor='asset' : on insere leur contenu dans un projet, elles
-- ne s'executent pas dans l'hote. Aucun host_app, la compatibilite passe par
-- works_with — Flowcub couvre trois plateformes.
--
-- Les URL ont ete verifiees a la main : HTTP 200 et titre de page concordant
-- avec le produit revendique.
--
-- ECARTES faute de source officielle verifiable :
--   uncode-framer  unkern.com/uncode ne repond pas ; la page createur Framer
--                  renvoie un titre generique qui ne prouve aucune identite.
--   selected       aucun site officiel identifiable, le nom est trop commun
--                  pour etre cherche.
--
-- RAPPEL : la liste d'origine provient d'un annuaire tiers dont les tarifs se
-- sont reveles faux (Waida Studio y etait annonce « 99-125 $/an » contre 49 $
-- et 125 $ en achat unique sur la page officielle). Chaque grille a ete relue
-- a la source ; les montants incertains restent « montants sur la page
-- officielle » plutot que d'etre repris de seconde main.
INSERT INTO public.tools (id, slug, name, category, website_url, content_status, research_status, data_contract)
VALUES
  ('pixco',            'pixco',            'Pixco',            'design-tools', 'https://pixcodrops.com/',      'draft', 'todo', 'legacy'),
  ('izabysof',         'izabysof',         'Izabysof',         'design-tools', 'https://www.izabysof.com/',    'draft', 'todo', 'legacy'),
  ('elements-library', 'elements-library', 'Elements Library', 'design-tools', 'https://elements-library.com/', 'draft', 'todo', 'legacy'),
  ('flowcub',          'flowcub',          'Flowcub',          'design-tools', 'https://flowcub.com/',         'draft', 'todo', 'legacy'),
  ('cosmaha',          'cosmaha',          'Cosmaha',          'design-tools', 'https://cosmaha.com/',         'draft', 'todo', 'legacy'),
  ('launchnow',        'launchnow',        'LaunchNow',        'design-tools', 'https://launchnow.design/',    'draft', 'todo', 'legacy')
ON CONFLICT (id) DO NOTHING;

UPDATE public.tools SET form_factor = 'asset', host_app = NULL,
       works_with = '["framer"]'::jsonb
WHERE slug IN ('pixco', 'izabysof', 'elements-library', 'cosmaha', 'launchnow')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'framer');

UPDATE public.tools SET form_factor = 'asset', host_app = NULL,
       works_with = '["framer", "webflow", "figma"]'::jsonb
WHERE slug = 'flowcub'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'framer')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'webflow')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'figma');

UPDATE public.tools SET covers = '["templates","ui-components","design-system"]'::jsonb,
       functional_needs = '["templates","ui-components","design-system"]'::jsonb
WHERE slug IN ('pixco', 'izabysof', 'elements-library', 'flowcub', 'cosmaha', 'launchnow');

-- Publication conditionnee a la presence reelle du contenu editorial.
UPDATE public.tools SET content_status = 'published', published_at = now()
WHERE slug IN ('pixco', 'izabysof', 'elements-library', 'flowcub', 'cosmaha', 'launchnow')
  AND content_status = 'draft'
  AND verdict IS NOT NULL
  AND short_description IS NOT NULL AND short_description <> '';
