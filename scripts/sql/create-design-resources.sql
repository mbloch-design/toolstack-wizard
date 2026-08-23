-- Ressources de design generales : mockups, avatars, echelles typographiques.
--
-- Lot distinct des vagues Framer precedentes : ces produits ne sont pas lies a
-- une plateforme de site unique.
--
-- NON AJOUTE : icons8 figure deja au catalogue, publie et source. Le reajouter
-- aurait cree un doublon — verifie avant insertion.
--
-- FORMES retenues :
--   mockuuups-studio  app    application web autonome, aucun hote
--   rotato            app    application macOS autonome (version web en beta)
--   avaaatars         asset  bibliotheque d'avatars a inserer dans un projet
--   typescale         plugin PLUGIN MULTI-HOTE : Figma, Adobe XD et Penpot.
--                            host_app reste NUL — mono-value, il ne sait pas
--                            porter trois cibles. works_with porte les trois,
--                            et le garde-fou controle desormais works_with
--                            plutot que host_app pour cette raison.
--
-- L'annuaire d'origine presentait Typescale comme un outil web : c'est un
-- plugin. Verifie sur la page officielle, editee par Sam Smith.
INSERT INTO public.tools (id, slug, name, category, website_url, content_status, research_status, data_contract)
VALUES
  ('mockuuups-studio', 'mockuuups-studio', 'Mockuuups Studio', 'design-tools', 'https://mockuuups.studio/',  'draft', 'todo', 'legacy'),
  ('rotato',           'rotato',           'Rotato',           'design-tools', 'https://rotato.app/',        'draft', 'todo', 'legacy'),
  ('avaaatars',        'avaaatars',        'Avaaatars',        'design-tools', 'https://www.avaaatars.com/', 'draft', 'todo', 'legacy'),
  ('typescale',        'typescale',        'Typescale',        'design-tools', 'https://typescale.io/',      'draft', 'todo', 'legacy')
ON CONFLICT (id) DO NOTHING;

UPDATE public.tools SET form_factor = 'app', host_app = NULL, works_with = '[]'::jsonb
WHERE slug IN ('mockuuups-studio', 'rotato');

UPDATE public.tools SET form_factor = 'asset', host_app = NULL, works_with = '[]'::jsonb
WHERE slug = 'avaaatars';

UPDATE public.tools SET form_factor = 'plugin', host_app = NULL,
       works_with = '["figma", "adobe-xd", "penpot"]'::jsonb
WHERE slug = 'typescale'
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'figma')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-xd')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'penpot');

UPDATE public.tools SET covers = '["creative-assets","design-resources"]'::jsonb,
       functional_needs = '["creative-assets","design-resources"]'::jsonb
WHERE slug IN ('mockuuups-studio', 'rotato', 'avaaatars');

UPDATE public.tools SET covers = '["typography","design-system"]'::jsonb,
       functional_needs = '["typography","design-system"]'::jsonb
WHERE slug = 'typescale';

-- Publication conditionnee a la presence reelle du contenu editorial.
UPDATE public.tools SET content_status = 'published', published_at = now()
WHERE slug IN ('mockuuups-studio', 'rotato', 'avaaatars', 'typescale')
  AND content_status = 'draft'
  AND verdict IS NOT NULL
  AND short_description IS NOT NULL AND short_description <> '';
