# Projection du bootstrap outil — plan et suivi

Spécification approuvée : sept champs historiques retirés uniquement de __SSR_TOOL__, sources intactes, parité FR/EN et SEO conservées, recette avant publication. Référence : AUDIT_HYDRATATION_2026-10-08.md.

1. Projection ciblée dans les deux points d'injection JSON, test du payload conservé et de la source immuable. RED observé : sept champs excédentaires dans le JSON ; GREEN à vérifier.
2. Build isolé sur snapshot de main : comparer tous les HTML hors différence autorisée du bootstrap, sitemap et sources ; tests complets, types, 56 parcours FR/EN puis revue indépendante.
3. Rapports, commit/push ciblés, attente du déploiement et recette publique.

Ruling : conserver le workflow de snapshot isolé déjà utilisé dans cette session, sans créer de worktree ni inclure les catégories locales. Les mécanismes de réduction de langue sont inchangés. Aucune suppression sur les bootstraps comparaison, stack ou guide.

Suivi : étapes 1 et 2 terminées. 249 tests applicatifs, 23 contrats SEO, types et build PASS. 13 162 HTML équivalents hors projection autorisée, sitemap et sources inchangés ; gain 5,5904 MiB. Recette 56/56 avec onglets secondaires PASS, revue indépendante sans anomalie. Étape 3 : publication puis contrôle public.
