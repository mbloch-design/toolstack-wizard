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

-- Rattrapage : la publication initiale a laissé published_at à NULL sur ces
-- fiches. Sans cette date elles sont invisibles à tout tri par récence, donc
-- absentes de la section Nouveautés de la page d'accueil.
UPDATE public.tools
SET published_at = COALESCE(updated_at, now())
WHERE slug IN ('essaytone','rezi','hejour','uncovr','cudekai','grokipedia','craft',
               'octarine','wispr-flow','quillbot','bear','lunatask','outrank','notebook-lm')
  AND content_status = 'published'
  AND published_at IS NULL;
