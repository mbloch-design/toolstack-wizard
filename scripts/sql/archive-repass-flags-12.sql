-- Repasse finance :
--   quickbooks-online -> doublon de quickbooks (même URL quickbooks.intuit.com) → 301
--   lemonsqueezy      -> doublon de lemon-squeezy (même produit)                → 301
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('quickbooks-online','lemonsqueezy') AND content_status='published';

-- URLs manquantes en base : les produits existent, seule l'URL était vide (vérifié HTTP 200).
UPDATE public.tools SET website_url='https://www.kelio.com'    WHERE slug='kelio'    AND coalesce(website_url,'')='';
UPDATE public.tools SET website_url='https://www.getmoss.com'  WHERE slug='moss'     AND coalesce(website_url,'')='';
