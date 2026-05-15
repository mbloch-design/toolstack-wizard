# ToolTrim — Roadmap

État d'avancement et prochaines phases.

---

## Phase 1 — Composants éditoriaux ✅ (Sessions 1–3)

| Item | Statut |
|---|---|
| StickyDecisionCard redesign | ✅ Fait |
| ToolDetailPage hero simplifié | ✅ Fait |
| Section Décision rapide (3 blocs) | ✅ Fait |
| Onglets renforcés (72px, 16px, 2px underline) | ✅ Fait |
| Bande Audit de stack (full-width) | ✅ Fait |
| Footer CTA ToolTrim (full-width) | ✅ Fait |
| GuidesPage éditorial (gi-*) | ✅ Fait |
| GuideDetailPage article éditorial (ga-*) | ✅ Fait |
| Variable --header-height dans :root | ✅ Fait |

---

## Phase 2 — Stabilisation structurelle (Sprint 1) ✅

| Item | Statut | Notes |
|---|---|---|
| Mobile menu full-screen | ✅ Corrigé | Panel 1023px → full-width, scrollable |
| Variable --navbar-h | ✅ Corrigé | Alias de --header-height |
| Sticky sidebar vérifié | ✅ Vérifié | Pattern correct depuis Session 1 |
| CLAUDE.md créé | ✅ Fait | Guide pour Claude |
| docs/AI_HANDOFF.md créé | ✅ Fait | Handoff opérationnel |
| docs/ROADMAP.md créé | ✅ Fait | Ce fichier |
| ToolCardEditorial (orphelin) | 📋 Documenté | Migration Phase 3 |
| Dark mode gi-*/ga-* | 📋 Dette technique | Phase 6 |

---

## Sprint 2 — Refonte template page outil ✅

| Item | Statut | Notes |
|---|---|---|
| H1 conditionnel noms courts (≤5 chars → max 104px) | ✅ Fait | `clamp(4.5rem, 8vw, 6.5rem)` |
| Sidebar sticky top offset | ✅ Fait | `calc(var(--navbar-h, 68px) + 20px)` |
| Label "Prix à partir de" sidebar | ✅ Fait | Conditionnel si displayPrice > 0 |
| Responsive td-dr-grid, td-diag-inner, td-footer-inner | ✅ Vérifié | Breakpoints 768px/900px existants OK |

---

## Phase 3 — Cards / Listings

| Item | Priorité | Notes |
|---|---|---|
| Migration ToolCardEditorial → remplace ToolCard default | HAUTE | Connecter à ToolsPage + CategoryPage |
| Score ToolTrim visible sur card grid | HAUTE | Actuellement absent sur tc-card default |
| ToolCard list-row : afficher verdict court | MOYENNE | Améliore les pages catégorie |
| ResultsPage : intégrer editorial card | MOYENNE | Après validation sur ToolsPage |

**Note :** `ToolCardEditorial` (src/components/ToolCardEditorial.tsx) est un composant complet avec
score block, verdict court, 3 metadata rows (Plan / Modèle / IA). Il n'est importé nulle part.
La migration vers les pages de listing est la prochaine étape logique après Sprint 1.

---

## Phase 4 — Homepage

| Item | Priorité |
|---|---|
| Vérifier cohérence typographique eh-hero-title vs td-hero | HAUTE |
| Standardiser H1 hero home avec --font-brand, ls -0.07em | MOYENNE |
| Améliorer section "Stacks en vedette" | BASSE |

---

## Phase 5 — Performance

| Item | Priorité | Notes |
|---|---|---|
| Bundle splitting (data-tools 3.3MB non splitté) | HAUTE | Actuellement 1 chunk |
| Lazy loading des sections ToolDetail | MOYENNE | ToolVerdictBlock, ToolAlternativesSection |
| Images WebP + srcset | MOYENNE | Logos outils |

---

## Phase 6 — Dark mode ← DETTE TECHNIQUE

**Problème :** Les systèmes de classes `gi-*` (GuidesPage) et `ga-*` (GuideDetailPage)
n'ont aucun dark variant dans `index.css`. Les guides seront visuellement cassés en dark mode.

**Scope :** Ajouter `.dark .gi-*` et `.dark .ga-*` pour toutes les classes déclarées en Session 2.

**Priorité :** Non bloquant si dark mode n'est pas actif en prod. Ne pas traiter avant Phase 4.

**Fichiers concernés :**
- `src/index.css` — sections gi-* et ga-*
- Environ 50–70 sélecteurs à créer

---

## Backlog

- Colonnes thèmes GuidesPage dynamiques (actuellement statiques/hardcodées)
- TOC de GuideDetailPage : tester avec accents dans les titres H2
- Mobile menu : skeleton ou état de chargement dans panel-content (données Supabase tardives)
- Submit tool flow : vérifier le flux complet
- Ajouter `llms.txt` pour GEO readiness
