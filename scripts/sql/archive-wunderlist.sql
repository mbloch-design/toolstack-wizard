-- Wunderlist : service arrêté en mai 2020, remplacé par Microsoft To Do → archive
UPDATE public.tools SET content_status='archived'
WHERE slug='wunderlist' AND content_status='published';
-- Táve : racheté par VSCO (mai 2025), relancé sous VSCO Workspace. La fiche est
-- conservée et documente le successeur (utile pour les recherches « Tave »).
UPDATE public.tools SET website_url='https://www.vsco.co/workspace' WHERE slug='tave';
