-- Axe de compatibilite multi-valuee, pour le filtre « Works with ».
--
-- POURQUOI UN SECOND CHAMP : host_app est mono-value et exclusif — un plugin
-- s'execute dans UN logiciel. Un filtre multi-selection suppose qu'un outil
-- puisse etre lie a plusieurs produits (Luminar Neo fonctionne dans Photoshop
-- ET Lightroom, tout en existant seul). Les deux notions ne se superposent pas.
--
-- host_app n'est PAS supprime : il est consomme par scoring.ts (similarite),
-- toolExploration.ts (grappes) et ToolPluginsBlock.tsx. Le retirer casserait
-- ces trois usages sans rien apporter.
--
--   host_app    « s'execute dans »  — exclusif, 0 ou 1. Le plugin n'existe pas sans.
--   works_with  « compatible avec » — 0 a n. Ce que le filtre interroge.
--
-- INVARIANT : works_with contient TOUJOURS host_app quand il est renseigne.
-- Une seule source de verite pour l'interface, verifie par guard-plugins.mjs.
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS works_with jsonb;

-- Amorcage : tout rattachement existant devient une compatibilite.
UPDATE public.tools
SET works_with = jsonb_build_array(host_app)
WHERE host_app IS NOT NULL
  AND (works_with IS NULL OR jsonb_array_length(works_with) = 0);

-- Produits autonomes compatibles avec plusieurs hotes : le cas que host_app
-- ne savait pas exprimer et qui les faisait passer pour des plugins Photoshop.
UPDATE public.tools SET works_with = '["adobe-photoshop", "adobe-lightroom"]'::jsonb
WHERE slug IN ('luminar-neo', 'nik-collection')
  AND EXISTS (SELECT 1 FROM public.tools h WHERE h.slug = 'adobe-lightroom');

UPDATE public.tools SET works_with = '["adobe-photoshop"]'::jsonb
WHERE slug = 'topaz-gigapixel';

-- Defaut explicite : tableau vide plutot que NULL, pour que les requetes de
-- filtre n'aient pas a gerer deux cas d'absence.
UPDATE public.tools SET works_with = '[]'::jsonb WHERE works_with IS NULL;
