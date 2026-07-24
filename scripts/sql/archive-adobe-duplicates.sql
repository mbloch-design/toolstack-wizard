-- Consolidation des doublons Adobe : une seule fiche canonique.
-- Canonique conservée : adobe-creative-cloud (bundle parent, 22 membres, éditorial sourcé).
-- adobe + adobe-cc redirigent (301) vers le canonique dans vercel.json.
--
-- Archiver les doublons les retire de catalog_api.published_tool_projection
-- (la vue filtre WHERE content_status = 'published'), donc du SSR/prérender/sitemap.
-- 'archived' est une valeur autorisée par tools_content_status_check.
--
-- À lancer sur la base preprod (partagée prod+preprod). Réversible : remettre 'published'.

UPDATE public.tools
SET content_status = 'archived'
WHERE slug IN ('adobe', 'adobe-cc')
  AND content_status = 'published';

-- Vérification :
-- SELECT slug, content_status FROM public.tools WHERE slug LIKE 'adobe%' ORDER BY slug;
