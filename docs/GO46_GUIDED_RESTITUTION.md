# GO46 - Restitution guidee et devises fiables

Objectif : transformer la fin du diagnostic en rapport guide, pas en dashboard a explorer au hasard.

## Decision UX

La restitution principale doit repondre dans l'ordre :

1. Ce que ToolTrim a compris.
2. Le verdict en langage clair.
3. La premiere decision a prendre.
4. Les preuves et annexes si l'utilisateur veut creuser.

Les onglets secondaires deviennent des annexes de verification :

- plan d'action ;
- preuves stack ;
- points a revoir ;
- options prudentes.

## Changements GO46

- L'onglet `Synthese` devient `Rapport`.
- Le hero final commence par le contexte capte : profil, priorite, stack, budget declare.
- Le score devient un indice d'appui, pas le centre de l'ecran.
- La premiere action prioritaire est mise en avant comme decision naturelle.
- La navigation indique clairement que les autres vues servent de preuves.
- Les affichages budgetaires du dashboard respectent les devises captees.
- Les montants globaux melanges ne sont plus presentes comme des euros certains.
- L'export PDF recupere aussi les devises des outils et evite les conversions arbitraires.

## Regles UX a conserver

- Ne jamais faire sentir a l'utilisateur qu'il doit tout lire.
- Ne pas afficher un montant financier precis quand la devise ou le plan n'est pas fiable.
- Toujours distinguer une preuve d'une decision.
- Garder la restitution courte en haut, puis ouvrir les details plus bas.

## Fichiers touches

- `src/components/dashboard/DashOverview.tsx`
- `src/components/dashboard/DiagDashboard.tsx`
- `src/components/dashboard/DashActions.tsx`
- `src/components/dashboard/DashGaspillage.tsx`
- `src/components/dashboard/DashOptimisations.tsx`
- `src/components/dashboard/DashPdfExport.tsx`
- `src/components/dashboard/DashStackUtile.tsx`
- `supabase/functions/generate-report/index.ts`
