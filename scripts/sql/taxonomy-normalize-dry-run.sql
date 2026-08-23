-- Apercu en lecture seule de taxonomy-normalize.sql.
-- Retourne le nombre de fiches qui changeraient et un echantillon des valeurs.
WITH normalized AS (
  SELECT
    t.slug,
    t.covers,
    t.functional_needs,
    (
      SELECT jsonb_agg(DISTINCT n ORDER BY n)
      FROM (
        SELECT trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g')) AS n
        FROM jsonb_array_elements_text(t.covers) AS v
      ) AS values_normalized
      WHERE n <> ''
    ) AS covers_normalized,
    (
      SELECT jsonb_agg(DISTINCT n ORDER BY n)
      FROM (
        SELECT trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g')) AS n
        FROM jsonb_array_elements_text(t.functional_needs) AS v
      ) AS values_normalized
      WHERE n <> ''
    ) AS needs_normalized
  FROM public.tools AS t
)
SELECT
  count(*) FILTER (WHERE covers IS DISTINCT FROM covers_normalized) AS covers_rows_changed,
  count(*) FILTER (WHERE functional_needs IS DISTINCT FROM needs_normalized) AS needs_rows_changed
FROM normalized;

WITH terms AS (
  SELECT 'covers' AS field, v AS original,
         trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g')) AS normalized
  FROM public.tools, jsonb_array_elements_text(covers) AS v
  UNION ALL
  SELECT 'functional_needs', v,
         trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(v), '[\s_]+', '-', 'g'), '-+', '-', 'g'))
  FROM public.tools, jsonb_array_elements_text(functional_needs) AS v
)
SELECT field, original, normalized, count(*) AS occurrences
FROM terms
WHERE original IS DISTINCT FROM normalized
GROUP BY field, original, normalized
ORDER BY occurrences DESC, field, original
LIMIT 100;
