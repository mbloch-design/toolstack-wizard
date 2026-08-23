-- Creation des fiches Kompa, Waida Studio et The Design Futurist.
--
-- Insertion en draft : la publication suit l'application de la fiche
-- editoriale, jamais l'inverse (cf. google-chat, publiee avec un stub vide).
--
-- INTERPRETATIONS, appuyees sur les pages officielles et non sur l'annuaire
-- tiers d'ou provient la liste, dont les tarifs se sont reveles faux :
--
--   kompa               form_factor=plugin. Le site officiel et le Marketplace
--                       Framer le classent en plugin (framer.com/marketplace/
--                       plugins/kompa) : il s'execute dans Framer, via le menu
--                       d'actions rapides. Ce n'est PAS un template.
--                       Achat unique + version gratuite allegee.
--
--   waida-studio        form_factor=asset, aucun host_app. C'est un catalogue de
--                       templates decline sur TROIS plateformes : works_with
--                       porte les trois, ce que host_app seul ne pouvait pas
--                       exprimer. L'annuaire annoncait « 99-125 $/an » ; la page
--                       officielle affiche 49 $ et 125 $ en ACHAT UNIQUE, sans
--                       abonnement. Le tarif du collage etait faux.
--
--   the-design-futurist form_factor=asset, works_with=[framer]. Composants
--                       inseres dans un projet, pas un plugin qui s'execute.
--                       Montants non affiches sur la page de presentation :
--                       la fiche ecrit « montants sur la page officielle »
--                       plutot que de reprendre les 49 $ de l'annuaire.
INSERT INTO public.tools (id, slug, name, category, website_url, content_status, research_status, data_contract)
VALUES
  ('kompa',               'kompa',               'Kompa',               'design-tools', 'https://www.kompa.design/',                     'draft', 'todo', 'legacy'),
  ('waida-studio',        'waida-studio',        'Waida Studio',        'design-tools', 'https://waidastudio.com/',                      'draft', 'todo', 'legacy'),
  ('the-design-futurist', 'the-design-futurist', 'The Design Futurist', 'design-tools', 'https://thedesignfuturist.zip/framer-components', 'draft', 'todo', 'legacy')
ON CONFLICT (id) DO NOTHING;

UPDATE public.tools SET form_factor = 'plugin', host_app = 'framer',
       works_with = '["framer"]'::jsonb
WHERE slug = 'kompa'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'framer');

UPDATE public.tools SET form_factor = 'asset', host_app = NULL,
       works_with = '["webflow", "framer", "figma"]'::jsonb
WHERE slug = 'waida-studio'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'webflow')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'framer')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'figma');

UPDATE public.tools SET form_factor = 'asset', host_app = NULL,
       works_with = '["framer"]'::jsonb
WHERE slug = 'the-design-futurist'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'framer');

UPDATE public.tools SET covers = '["ui-components","design-system","templates"]'::jsonb,
       functional_needs = '["ui-components","design-system","templates"]'::jsonb
WHERE slug IN ('kompa', 'waida-studio', 'the-design-futurist');

-- Publication conditionnee a la presence reelle du contenu editorial.
UPDATE public.tools SET content_status = 'published', published_at = now()
WHERE slug IN ('kompa', 'waida-studio', 'the-design-futurist')
  AND content_status = 'draft'
  AND verdict IS NOT NULL
  AND short_description IS NOT NULL AND short_description <> '';
