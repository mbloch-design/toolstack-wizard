-- Shield (shieldapp.ai) est fermé : la page officielle affiche « Shield is
-- winding down » (Google/LinkedIn n'ont pas permis de continuer). L'outil ne
-- doit plus avoir de fiche active. Archivage (réversible).
UPDATE public.tools
SET content_status = 'archived'
WHERE slug = 'shield' AND content_status = 'published';
