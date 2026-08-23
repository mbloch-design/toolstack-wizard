-- Normalisation de forme des vocabulaires covers / functional_needs.
--
-- Constat : 590 termes distincts pour covers, 653 pour functional_needs, dont
-- environ 60 % n'apparaissent qu'une seule fois. Une partie du desordre est
-- purement typographique : « CRM » et « crm », « project management » et
-- « project-management », « SEO » et « seo » cohabitent et comptent comme des
-- termes distincts dans l'exploration et l'appariement.
--
-- Cette migration ne fait QUE de la normalisation de forme : minuscules,
-- espaces et underscores convertis en tirets, tirets multiples reduits.
-- Aucune fusion de sens (francais vers anglais) n'est faite ici : ces termes
-- sont codes en dur dans stackAutoClassification, toolExploration et
-- creativeAdaptiveEngine, une fusion semantique impose de toucher au code en
-- meme temps sous peine de casser la classification en silence.
--
-- Un instantane versionne des valeurs d'origine est conserve dans
-- catalog_private.taxonomy_backup_v1 pour permettre le retour arriere avec
-- scripts/sql/taxonomy-normalize-rollback.sql.
--
-- IMPORTANT : ce fichier est volontairement absent du runner d'archivage.
-- Il doit etre applique seul, apres revue du dry-run correspondant.
BEGIN;

CREATE TABLE IF NOT EXISTS catalog_private.taxonomy_backup_v1 (
  migration_id text NOT NULL,
  slug text NOT NULL,
  covers jsonb,
  functional_needs jsonb,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (migration_id, slug)
);

INSERT INTO catalog_private.taxonomy_backup_v1 (migration_id, slug, covers, functional_needs)
SELECT '2026-08-23-form-v1', slug, covers, functional_needs
FROM public.tools
ON CONFLICT (migration_id, slug) DO NOTHING;

WITH normalized AS (
  SELECT t.slug, (
    SELECT jsonb_agg(DISTINCT n ORDER BY n) FROM (
      SELECT trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g')) AS n
      FROM jsonb_array_elements_text(t.covers) v
    ) s WHERE n <> ''
  ) AS value
  FROM public.tools AS t
  WHERE t.covers IS NOT NULL AND jsonb_array_length(t.covers) > 0
)
UPDATE public.tools AS t
SET covers = n.value
FROM normalized AS n
WHERE t.slug = n.slug
  AND t.covers IS DISTINCT FROM n.value;

WITH normalized AS (
  SELECT t.slug, (
    SELECT jsonb_agg(DISTINCT n ORDER BY n) FROM (
      SELECT trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g')) AS n
      FROM jsonb_array_elements_text(t.functional_needs) v
    ) s WHERE n <> ''
  ) AS value
  FROM public.tools AS t
  WHERE t.functional_needs IS NOT NULL AND jsonb_array_length(t.functional_needs) > 0
)
UPDATE public.tools AS t
SET functional_needs = n.value
FROM normalized AS n
WHERE t.slug = n.slug
  AND t.functional_needs IS DISTINCT FROM n.value;

COMMIT;
