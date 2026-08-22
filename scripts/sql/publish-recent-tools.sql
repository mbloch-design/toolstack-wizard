-- Publication des outils « Recently Added » créés en draft par create-recent-tools.sql.
-- À n'exécuter QU'APRÈS que la fiche éditoriale niveau A a été appliquée pour chacun :
-- la condition sur verdict garantit qu'aucune page vide ne passe en published
-- (cf. google-chat, publiée avec un stub facts:[] et restée générique en ligne).
UPDATE public.tools SET content_status = 'published', published_at = now()
WHERE slug IN ('essaytone','rezi','hejour','uncovr','cudekai','grokipedia','craft',
               'octarine','wispr-flow','quillbot','bear','lunatask','outrank','notebook-lm')
  AND content_status = 'draft'
  AND verdict IS NOT NULL
  AND short_description IS NOT NULL
  AND short_description <> '';
