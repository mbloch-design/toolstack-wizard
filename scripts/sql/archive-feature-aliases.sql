-- Consolidation des alias / features / combos vers la fiche canonique du produit.
-- Ces slugs redirigent (301) vers leur parent dans vercel.json ; on les archive
-- pour les sortir de catalog_api.published_tool_projection (SSR/prérender/sitemap).
-- 'archived' est une valeur autorisée par tools_content_status_check.
--
--   capcut-ai              -> capcut
--   clickup-ai             -> clickup
--   excel-copilot          -> excel
--   streamelements-widgets -> streamelements
--   gsc                    -> google-search-console
--   gorgias-helpscout      -> gorgias
--   youtube-live           -> (aucun parent : feature retirée de l'index, sans 301)
--
-- Réversible : remettre 'published'.

UPDATE public.tools
SET content_status = 'archived'
WHERE slug IN (
  'capcut-ai',
  'clickup-ai',
  'excel-copilot',
  'streamelements-widgets',
  'gsc',
  'gorgias-helpscout',
  'youtube-live'
)
AND content_status = 'published';

-- Vérification :
-- SELECT slug, content_status FROM public.tools
-- WHERE slug IN ('capcut-ai','clickup-ai','excel-copilot','streamelements-widgets','gsc','gorgias-helpscout','youtube-live')
-- ORDER BY slug;
