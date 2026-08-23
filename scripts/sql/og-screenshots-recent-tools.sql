-- Captures d'écran de secours pour les fiches sans balise og:image.
-- uncovr et cudekai : capture de la page d'accueil réelle, vérifiée visuellement.
-- quillbot : remis à NULL. La capture obtenue était la page de vérification
-- anti-bot Cloudflare (« Performing security verification »), pas le produit.
-- Le contrôle de taille du script la laissait passer ; un garde-fou sur le HTML
-- a été ajouté dans scripts/screenshot-fallback-images.mjs.
UPDATE public.tools AS t SET og_image_url = v.url
FROM (VALUES
  ('uncovr',  'https://tooltrim.com/og-screenshots/uncovr.png'),
  ('cudekai', 'https://tooltrim.com/og-screenshots/cudekai.png')
) AS v(slug, url)
WHERE t.slug = v.slug;

UPDATE public.tools SET og_image_url = NULL
WHERE slug = 'quillbot'
  AND og_image_url LIKE '%og-screenshots/quillbot%';
