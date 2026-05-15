# ToolTrim — AI Handoff

Résumé opérationnel pour reprendre une session Claude en cours.
Lire ce fichier + CHANGELOG_AI.md + ROADMAP.md avant de coder.

---

## État actuel du projet (mis à jour : 2026-05-15)

### Refonte en cours — Phase 2 : Stabilisation

La refonte visuelle éditoriale a commencé. Les pages principales ont été redessinées.
Le sprint actuel stabilise les fondations techniques avant de continuer.

### Pages refaites ✅
- `/fr/tool/:slug` — ToolDetailPage (hero simplifié, décision rapide, onglets, footer CTA)
- `/fr/guides` — GuidesPage (layout éditorial Awwwards)
- `/fr/guide/:slug` — GuideDetailPage (article éditorial 2-col)
- `StickyDecisionCard` — redessinée (score 64px, ordre logique, pas de listes)

### Bugs connus / en cours
- Mobile menu : panel 560px clippé sur petits écrans → fix en Sprint 1
- `ToolCardEditorial` : composant créé mais non connecté aux listings → Phase 6
- Dark mode `gi-*` / `ga-*` : aucun dark variant → dette technique documentée

---

## Fichiers les plus touchés

| Fichier | Dernière modification | Raison |
|---|---|---|
| `src/pages/ToolDetailPage.tsx` | Session 3 | Hero simplifié, décision rapide, footer CTA |
| `src/pages/GuidesPage.tsx` | Session 2 | Réécriture éditoriale |
| `src/pages/GuideDetailPage.tsx` | Session 2 | Réécriture éditoriale |
| `src/index.css` | Session 3 | Nouveau td-dr-*, td-diag-band, td-footer-cta |
| `src/components/Navbar.tsx` | Sprint 1 | Mobile menu fix |
| `src/components/tool/StickyDecisionCard.tsx` | Session 1 | Redesign complet |
| `src/components/tool/ToolDiagCta.tsx` | Session 3 | Réécriture style éditorial |

---

## Conventions à respecter

1. **CSS** : `@layer components` dans `index.css`, classes préfixées (`td-*`, `gi-*`, `ga-*`, etc.)
2. **Sticky** : toujours sur le grid item, jamais sur un enfant. Vérifier les parents.
3. **Couleur bleue** : uniquement pour les états actifs, focus ring, score label. Jamais pour les CTA primaires des pages outils.
4. **Dark mode** : ne pas corriger sauf si actif en prod. Documenter dans ROADMAP.
5. **Docs** : après chaque session, mettre à jour CHANGELOG_AI.md.

---

## Contexte données

- Data source : Supabase (primaire) + JSON local (fallback offline)
- Hooks : `useTools()`, `useToolBySlug(slug)`, `useCategories()`, `usePosts(lang)`
- Score éditorial : `computeToolTrimScore(tool)` → `{ score: 2.8–4.8, labelFr, labelEn }`
- Verdict : `tool.verdict.keepIf` / `tool.verdict.avoidIf` / `tool.verdict.threshold`
- Prix : `tool.pricing_v5.compare_price_monthly_eur` (prioritaire sur `tool.defaultMonthlyPrice`)

---

## Prochaines étapes (voir ROADMAP.md pour détails)

1. Sprint 1 : Mobile menu, --navbar-h, sticky sidebar verify
2. Phase 3 : Cards/listings (migration ToolCardEditorial)
3. Phase 4 : Homepage optimization
4. Phase 5 : Performance (bundle splitting)
5. Phase 6 : Dark mode complet
