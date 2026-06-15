# GO12 - Functional diagnostic engine

Date: 2026-05-28  
Scope: scoring fonctionnel, réponses tunnel, confiance diagnostic, actions métier.

---

## Delivered

### Discovery answers branchées au scoring

Les réponses aux questions complémentaires ne sont plus seulement stockées. Elles influencent maintenant les prescriptions:

- `keep` protège un outil contre une suppression automatique
- `review` ajoute une vérification fonctionnelle quand aucun signal plus fort n'existe
- `cancel` transforme un usage explicitement faible en candidat à suppression

Updated:

- `src/utils/scoring.ts`
- `src/components/DiagnosticRouter.tsx`

### Signaux de closing exploités

Les réponses finales génèrent des signaux métier:

- angle mort de facturation
- renouvellement annuel à surveiller
- socle sécurité / mots de passe à clarifier

Ces signaux nourrissent:

- les risk flags
- les focus areas
- le plan d'action
- la restitution persistée dans `diagnostic_insights`

Updated:

- `src/utils/scoring.ts`
- `src/utils/diagnosticInsights.ts`
- `src/components/dashboard/DashActions.tsx`

### Qualité diagnostic

Ajout d'un score de confiance du diagnostic, calculé à partir de:

- nombre d'outils sélectionnés
- questions discovery actives/répondues
- réponses closing
- outils explicitement protégés ou challengés

Visible dans l'overview dashboard.

Updated:

- `src/types/diagnostic.ts`
- `src/components/dashboard/DashOverview.tsx`

---

## Notes

Pas de nouvelle migration: les nouveaux champs vivent dans `diagnostic_insights`, déjà capturé en base et réutilisé par le back-office, les emails et le PDF.
Le process de déploiement reste volontairement de côté.
