-- Categories cleanup — 2026-08-24
-- Three independent fixes found while auditing the catalog against the repo:
-- - two categories exist only in categories_index.json, orphaning 43 tools
-- - 14 category names carry a decorative emoji prefix
-- - Adobe Acrobat and two e-signature tools sit in the wrong category

-- 1) Categories present in the JSON but missing from Supabase.
--    sync-supabase-to-json.mjs rebuilds the list from the remote, so every
--    `npm run sync:data` used to drop these two and orphan the 43 tools
--    attached to them (8 + 35). The script now preserves them and warns, but
--    the rows still have to exist here for both sides to agree.
INSERT INTO public.categories (id, name, slug, description) VALUES
  ('prototyping',   'Prototyping',   'prototyping',   'Outils pour créer des maquettes, wireframes et prototypes interactifs.'),
  ('ui-components', 'UI Components', 'ui-components', 'Bibliothèques et frameworks pour construire des interfaces utilisateur web.')
ON CONFLICT (id) DO NOTHING;

-- 2) Drop the emoji prefix from category names.
--    They are already hidden at render time by stripLeadingEmoji(), and
--    CLAUDE.md rules out emoji used as icons. This cleans the source instead
--    of masking it downstream.
UPDATE public.categories SET name = 'IA Généraliste'        WHERE id = 'ai-general';
UPDATE public.categories SET name = 'Analytics'             WHERE id = 'analytics';
UPDATE public.categories SET name = 'Communication'         WHERE id = 'communication';
UPDATE public.categories SET name = 'Communication Équipe'  WHERE id = 'communication-team';
UPDATE public.categories SET name = 'Création de contenu'   WHERE id = 'creation';
UPDATE public.categories SET name = 'Design & Prototypage'  WHERE id = 'design-tools';
UPDATE public.categories SET name = 'Email & Marketing'     WHERE id = 'email-productivity';
UPDATE public.categories SET name = 'Finance & Facturation' WHERE id = 'finance';
UPDATE public.categories SET name = 'Formation & Éducation' WHERE id = 'formation-education';
UPDATE public.categories SET name = 'No-Code & Web'         WHERE id = 'nocode-web';
UPDATE public.categories SET name = 'Organisation'          WHERE id = 'organization';
UPDATE public.categories SET name = 'Suivi du Temps'        WHERE id = 'productivity-tracking';
UPDATE public.categories SET name = 'Gestion de Projet'     WHERE id = 'project-management';
UPDATE public.categories SET name = 'Sécurité'              WHERE id = 'security';

-- 3) Reclassification of PDF / e-signature tools: nothing to do.
--    Adobe Acrobat, Skribble and SignRequest were already sitting in
--    legal-contracts in Supabase — the stale local JSON was the only thing
--    still showing them under "Suivi du Temps" and "Organisation". The sync
--    of 2026-08-24 confirmed it. Statements dropped rather than kept as no-ops.

-- 4) Dangling category references.
--    20 tools point at nine category ids that have no row in `categories` and
--    no entry in categories_index.json: photo, marketing, illustration,
--    design, publishing, assets, video, 3d, audio. Four of them carry a single
--    tool, so they are folded into the closest existing category rather than
--    turned into nine near-empty entries in the navigation.

-- Every creative-software id -> Design & Prototypage (16 tools).
-- Photo editors, illustration apps, layout/publishing, stock, video, 3d and
-- audio all belong to the same family of creative tooling; splitting them
-- across "Création de contenu" would scatter a coherent group.
UPDATE public.tools SET category = 'design-tools'
 WHERE category IN ('design', 'photo', 'illustration', 'publishing', 'assets', 'video', '3d', 'audio');

-- marketing -> Email & Marketing (4 tools: Cision, Klaviyo, Meltwater, Prowly)
-- Note: Cision, Meltwater and Prowly are PR / media-monitoring tools rather
-- than email tools. This is the closest existing category, not a perfect fit.
UPDATE public.tools SET category = 'email-productivity' WHERE category = 'marketing';
