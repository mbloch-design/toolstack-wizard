-- URLs erronées en base : les produits sont actifs, seul le domaine stocké était faux
-- (vérifié : les URLs ci-dessous répondent en HTTP 200).
UPDATE public.tools SET website_url='https://clockify.me'            WHERE slug='clockify';
UPDATE public.tools SET website_url='https://www.apollo.io'          WHERE slug='apollo';
UPDATE public.tools SET website_url='https://www.condecosoftware.com' WHERE slug='condeco';
