-- Reliquats de la repasse niveau A : produits non identifiables ou domaines morts.
-- desktopready / pterocos : domaine non résolu (NXDOMAIN vérifié).
-- material-swift : aucun projet officiel de ce nom ; Material Design iOS abandonné par Google.
-- allstate : compagnie d'assurance, pas un outil logiciel — entrée de catalogue erronée.
UPDATE public.tools SET content_status='archived'
WHERE slug IN ('desktopready', 'pterocos', 'material-swift', 'allstate')
  AND content_status='published';
