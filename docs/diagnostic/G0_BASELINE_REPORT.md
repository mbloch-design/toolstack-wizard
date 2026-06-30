# Tooltrim — Rapport de baseline G0

> Date : 28 juin 2026
> Phase : 0 — Reprise de contrôle
> Périmètre : diagnostic Créatif
> Statut : baseline technique validée, décision produit G0 encore à confirmer.

## 1. Résultat court

La commande de porte technique passe :

```bash
npm run validate:g0
```

Résultat observé :

- TypeScript : PASS ;
- tests métier ciblés Créatif : PASS ;
- garde-fou parcours Créatif : PASS ;
- garde-fou restitution Créatif : PASS ;
- garde-fou catalogue Créatif : PASS ;
- garde-fou modèles commerciaux : PASS ;
- build production : PASS.

## 2. Couverture automatique validée

| Élément | Résultat |
|---|---|
| Tests métier ciblés | 110 tests passés |
| Fichiers de tests exécutés | 5 |
| GO58 parcours Créatif | PASS |
| GO59 restitution Créatif | PASS |
| GO60 catalogue Créatif | PASS |
| GO61 modèles commerciaux | PASS |
| Build SSR | PASS |
| Build client | PASS |
| Prerender / sitemap | PASS |

## 3. Corrections Phase 0 appliquées

- Ajout de `scripts/validate-creative-diagnostic.mjs`.
- Ajout de `npm run validate:diagnostic`.
- Ajout de `npm run validate:g0`.
- Ajout de `npm run validate:diagnostic:ui`.
- Ajout de `scripts/build-production.mjs`.
- Remplacement du build implicite par un build reproductible.
- Ajout du protocole `docs/diagnostic/PHASE0_G0_PROTOCOL.md`.
- Ajout de la matrice `docs/diagnostic/CREATIVE_REFERENCE_SCENARIOS.md`.
- Ajout de la recette produit `docs/diagnostic/G0_PRODUCT_RECIPE.md`.
- Ajout de la décision produit `docs/diagnostic/G0_PRODUCT_DECISION.md`.
- Ajout du garde-fou documentaire `scripts/validate-g0-product-readiness.mjs`.
- Alignement du garde-fou GO59 avec la restitution actuelle.
- Alignement du garde-fou GO61 avec la revue commerciale groupée.
- Ajout des options commerciales Adobe manquantes pour After Effects.

## 4. Points observés pendant G0

### Résolu

Le build échouait avec :

```text
ENOTEMPTY, Directory not empty: dist/fr
```

Cause probable : nettoyage implicite du dossier de sortie fragile sur l’environnement local.
Correction : nettoyage explicite de `dist` et `dist-ssr` avant build via `scripts/build-production.mjs`.

### À surveiller

- Le build signale des chunks lourds, notamment catalogue et index principal.
- Browserslist est ancien.
- Certains comparatifs SEO sont ignorés car les outils associés sont introuvables.
- Les tests UI jsdom `profileGoalUx` et `topBarPricingUx` bloquent le runner local ; ils sont isolés dans `validate:diagnostic:ui`.

## 5. Événements de mesure identifiés

| Besoin | Signal disponible |
|---|---|
| Début | création de session diagnostic |
| Progression | `step_viewed`, `step_completed`, `completion_pct`, `last_step_id` |
| Retour arrière | `step_back` |
| Reprise | `session_resumed`, `resumed_at` |
| Abandon | `abandoned_at`, `visibility_hidden`, `page_hide` |
| Fin | `session_completed`, `completed_at`, snapshot final |
| Rapport | `report_requested` |
| Restitution | `restitution_tab_viewed` |
| Partage | `restitution_share_opened` |
| PDF | `restitution_pdf_export_clicked` |

## 6. Décision G0

La baseline technique est prête.

La décision produit G0 est actuellement marquée **non jouée** dans `docs/diagnostic/G0_PRODUCT_DECISION.md`.

Elle ne doit pas être déclarée complète tant que les scénarios de référence n’ont pas été rejoués au moins une fois en recette métier :

- CR-01 UI avec Figma ;
- CR-02 UI avec Sketch ;
- CR-06 / CR-17 Adobe et suites ;
- CR-10 / CR-11 3D Blender / Cinema 4D ;
- CR-14 Social Canva / CapCut ;
- CR-15 IA hybride ;
- CR-16 outil inconnu ;
- CR-18 reprise.

## 7. Prochaine action recommandée

Ne pas démarrer la Phase 1 par du code.

Prochaine action : jouer `docs/diagnostic/G0_PRODUCT_RECIPE.md`, noter les incompréhensions et mettre à jour `docs/diagnostic/G0_PRODUCT_DECISION.md`.
