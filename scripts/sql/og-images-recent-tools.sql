-- og:image des outils « Recently Added ». Le script scripts/fetch-og-images.mjs
-- lit src/data/tools_v4.json (bundle statique) où ces fiches n'existent pas :
-- il retournait « 0 outil à traiter ». Les URL ci-dessous ont été récupérées
-- depuis la balise og:image de chaque site officiel, puis vérifiées une par une
-- (HTTP 200 ET content-type image/*).
--
-- Absents volontairement : uncovr et cudekai ne déclarent pas d'og:image ;
-- quillbot.com bloque la récupération (403 anti-bot). On ne comble pas au hasard.
UPDATE public.tools AS t SET og_image_url = v.url
FROM (VALUES
  ('essaytone',   'https://www.essaytone.com/common/OG.webp'),
  ('rezi',        'https://cdn.prod.website-files.com/69df9fb48ec66b133dcc708f/6a0b6e3712fa84630e62502c_rezi_share.png'),
  ('hejour',      'https://hejour.com/og.jpg'),
  ('grokipedia',  'https://grokipedia.com/icon-512x512.png'),
  ('craft',       'https://www.craft.do/craft_og.png'),
  ('octarine',    'https://octarine.app/img/og/base.png'),
  ('wispr-flow',  'https://cdn.prod.website-files.com/682f84b3838c89f8ff7667db/6a724a4fff322698a57a7d97_dictation-og%20(1).jpg'),
  ('bear',        'https://bear.app/images/website-icons/card.jpg'),
  ('lunatask',    'https://lunatask.app/og-image.png'),
  ('outrank',     'https://www.outrank.so/opengraph-image.png?31d914fdfd6b5383'),
  ('notebook-lm', 'https://notebooklm.google/_/static/branding/v6/og/notebook_lm_share.png')
) AS v(slug, url)
WHERE t.slug = v.slug AND t.og_image_url IS NULL;
