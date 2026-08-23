-- Retour arriere de taxonomy-normalize.sql, lot 2026-08-23-form-v1.
-- La sauvegarde est conservee apres restauration pour audit.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM catalog_private.taxonomy_backup_v1
    WHERE migration_id = '2026-08-23-form-v1'
  ) THEN
    RAISE EXCEPTION 'Sauvegarde taxonomie 2026-08-23-form-v1 absente';
  END IF;
END $$;

UPDATE public.tools AS t
SET covers = b.covers,
    functional_needs = b.functional_needs
FROM catalog_private.taxonomy_backup_v1 AS b
WHERE b.migration_id = '2026-08-23-form-v1'
  AND b.slug = t.slug;

COMMIT;
