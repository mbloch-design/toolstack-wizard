-- Création des outils « Recently Added » absents du catalogue.
-- Insertion en content_status='draft' : la publication se fait APRÈS que la fiche
-- éditoriale niveau A a été appliquée, pour ne jamais exposer de page vide
-- (cf. google-chat, publiée avec un stub facts:[]).
--
-- Chaque website_url a été vérifiée : statut HTTP 200 ET titre de page correspondant
-- au produit revendiqué. Quatre entrées de la liste initiale sont écartées :
--   trendhopper — trendhopper.com redirige vers trendhopper.nl, un vendeur de meubles
--                 néerlandais. Aucune URL officielle vérifiable pour l'outil SEO.
--   notable     — domaine expiré.
--   mykeep      — page abandonnée, produit inactif.
--   macaw-hq    — macawhq.com en DNS mort ; macaw.app est en pré-lancement, identité
--                 non confirmée.
INSERT INTO public.tools (id, slug, name, category, website_url, content_status, research_status, data_contract)
VALUES
  ('essaytone',   'essaytone',   'EssayTone',       'ai-general',    'https://www.essaytone.com/en', 'draft', 'todo', 'legacy'),
  ('rezi',        'rezi',        'Rezi',            'organization',  'https://rezi.ai',              'draft', 'todo', 'legacy'),
  ('hejour',      'hejour',      'Hejour',          'organization',  'https://hejour.com',           'draft', 'todo', 'legacy'),
  ('uncovr',      'uncovr',      'uncovr',          'communication', 'https://uncovr.com',           'draft', 'todo', 'legacy'),
  ('cudekai',     'cudekai',     'Cudekai',         'ai-general',    'https://cudekai.com',          'draft', 'todo', 'legacy'),
  ('grokipedia',  'grokipedia',  'Grokipedia',      'ai-general',    'https://grokipedia.com',       'draft', 'todo', 'legacy'),
  ('craft',       'craft',       'Craft',           'organization',  'https://craft.do',             'draft', 'todo', 'legacy'),
  ('octarine',    'octarine',    'Octarine',        'organization',  'https://octarine.app',         'draft', 'todo', 'legacy'),
  ('wispr-flow',  'wispr-flow',  'Wispr Flow',      'ai-general',    'https://wisprflow.ai',         'draft', 'todo', 'legacy'),
  ('quillbot',    'quillbot',    'QuillBot',        'ai-general',    'https://quillbot.com',         'draft', 'todo', 'legacy'),
  ('bear',        'bear',        'Bear',            'organization',  'https://bear.app',             'draft', 'todo', 'legacy'),
  ('lunatask',    'lunatask',    'Lunatask',        'organization',  'https://lunatask.app',         'draft', 'todo', 'legacy'),
  ('outrank',     'outrank',     'Outrank',         'analytics',     'https://outrank.so',           'draft', 'todo', 'legacy'),
  ('notebook-lm', 'notebook-lm', 'Gemini Notebook', 'ai-general',    'https://notebook.google/',     'draft', 'todo', 'legacy')
ON CONFLICT (id) DO NOTHING;
