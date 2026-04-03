UPDATE public.tools
SET seo = jsonb_set(
  jsonb_set(
    COALESCE(seo, '{}'::jsonb),
    '{metaTitle}',
    '"Loom : prix, abonnement et alternatives en 2026 — Vaut-il le coup ?"'::jsonb
  ),
  '{metaDescription}',
  '"Loom coûte 12,50$/mois en Starter. On a comparé gratuit vs payant pour les freelances — verdict clair et 3 alternatives moins chères."'::jsonb
)
WHERE id = 'loom';