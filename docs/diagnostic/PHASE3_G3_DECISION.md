# Tooltrim — Décision G3 Phase 3, diagnostic et restitution de confiance

> Date : 30 juin 2026
> Périmètre : Créatif uniquement
> Type de décision : validation autonome interne
> Protocole source : `docs/diagnostic/PHASE3_TRUSTED_RESTITUTION_PROTOCOL.md`

## Décision

**G3 autonome : accepté avec réserves.**

Tooltrim possède maintenant un contrat de restitution plus fiable : les décisions principales sont limitées, prouvées, dédupliquées et cohérentes entre l’overview, le plan d’action et l’export.

Cette décision ne remplace pas une revue experte métier ni une validation terrain.

## Ce qui est validé

- Le rapport principal est limité à trois décisions maximum.
- Les recommandations outil affichées doivent posséder une preuve lisible.
- Les pistes optionnelles sans preuve sont retirées de l’affichage.
- Une friction sur un usage existant produit d’abord une décision de test/amélioration, pas une recommandation automatique d’outil.
- L’overview et l’onglet actions utilisent la même source de vérité.
- Le PDF reçoit les mêmes décisions principales.
- La calibration signale les recommandations sans preuve comme conflit de confiance.

## Changements appliqués

### Moteur de restitution

- ajout de `src/utils/diagnosticDecisionPlan.ts` ;
- centralisation des décisions principales via `buildDiagnosticDecisionPlan` ;
- filtrage des recommandations via `getProvenRecommendations` ;
- déduplication par problème et par copie ;
- priorité donnée aux prescriptions, risques et frictions avant les pistes outil.

### Interface

- `DashOverview` lit les mêmes décisions que le plan d’action ;
- `DashActions` affiche trois décisions utiles au lieu d’une checklist ouverte ;
- `DashOptimisations` n’affiche plus de recommandation sans preuve ;
- `DashPdfExport` exporte `primaryDecisions` et seulement les recommandations prouvées.

### Calibration et tests

- `diagnosticInsights` ajoute un drapeau `recommendation_without_evidence` ;
- les tests vérifient trois décisions prouvées maximum ;
- les tests vérifient qu’un workflow atypique avec friction est traité comme amélioration à tester avant recommandation primaire.

## Réserves

- La revue experte métier prévue par la roadmap G3 reste à organiser.
- Les scénarios Social/Audio et mobile non prouvés en Phase 1 restent hors validation terrain.
- La qualité des preuves dépend encore de la richesse des mappings catalogue et workflow.
- La restitution PDF côté fonction Supabase devra être relue visuellement après branchement complet.

## Validation attendue

Avant livraison :

- `npm run validate:phase3` ;
- `npm run validate:diagnostic` ;
- `npm run validate:g0` ;
- `git diff --check`.

Validation observée le 30 juin 2026 :

- `npm run validate:phase3` : PASS, 11 checks ;
- `npm run validate:diagnostic` : PASS, 131 tests métier ciblés + garde-fous ;
- `npm run validate:g0` : PASS, build production inclus ;
- `git diff --check` : PASS.

## Décision finale

La Phase 3 peut être considérée comme **G3 autonome accepté avec réserves**.

La prochaine phase interne autorisée est la Phase 4 — bêta privée Créatif — uniquement si les validations restent vertes et si les réserves terrain sont bien séparées de cette validation autonome.
