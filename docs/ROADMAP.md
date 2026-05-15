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

## Sprint 3 — Guides + Articles ✅

| Item | Statut | Notes |
|---|---|---|
| Hero metadata tags → dot-séparés | ✅ Fait | CSS `::before` |
| Titres lignes articles (30px→42px) | ✅ Fait | `gi-row-title` |
| Bloc featured agrandi | ✅ Fait | `gi-featured-title` |
| H2 articles (42px→56px) | ✅ Fait | `ga-content h2` |
| H3 articles (28px→34px) | ✅ Fait | `ga-content h3` |
| TOC sticky offset → var(--navbar-h) | ✅ Fait | `ga-toc-col` |
| TOC links couleur (#6F6F68) | ✅ Fait | `ga-toc-link` |
| Encadrés "À retenir" | ✅ Fait | parser Markdown → ga-takeaway |
| Module outils — badge prix | ✅ Fait | `ToolRow` amélioré |
| Correction CTA /diagnostic → /selector | ✅ Fait | GuidesPage + GuideDetailPage |
| eh-description standardisée | ✅ Fait | 19px, #6F6F68, 680px |

---

## Sprint Guides v2 — Filtres, logos, section Commencer ici ✅

| Item | Statut | Notes |
|---|---|---|
| Barre de filtres éditoriaux | ✅ Fait | 7 filtres, pills noirs, zéro bleu |
| Tri discret | ✅ Fait | Récents / Sélection / Lecture courte |
| Logos outils cités (pastilles) | ✅ Fait | `tool-logo-stack`, max 5, +N overflow |
| Rows guides améliorées | ✅ Fait | type + intent + logos dans chaque row |
| Section "Commencer ici" | ✅ Fait | 3 angles, `gi-start-here-grid` |
| Load more (12 par défaut) | ✅ Fait | `gi-load-more`, reset sur filtre/tri |
| Hero right module synchro | ✅ Fait | Partage le même `activeFilter` |
| Responsive filtres scroll horizontal | ✅ Fait | `≤700px` |

---

## Sprint Grid — Système de grille global ✅

| Item | Statut | Notes |
|---|---|---|
| Tokens `--layout-*` dans `:root` | ✅ Fait | max, content, article, sidebar, gutter |
| Overrides responsive `--layout-gutter` | ✅ Fait | 48px → 32px (≤1023) → 20px (≤767) |
| Classes utilitaires `.layout-*` | ✅ Fait | shell, content, article-grid, tool-grid |
| `eh-container` 1440px → 1280px | ✅ Corrigé | Aligne hero vs body sur GuidesPage |
| `ga-body-grid` 1120px → 1280px | ✅ Corrigé | Aligne body article vs hero |
| `ga-cta-inner` 1120px → 1280px | ✅ Corrigé | Aligne CTA band vs body |
| Containers tokenisés (`gi-*`, `ga-*`, `td-*`) | ✅ Fait | Utilisent `var(--layout-*)` |

---

## Phase 3 — Cards / Listings ✅ Sprint 4

| Item | Statut | Notes |
|---|---|---|
| Migration ToolCardEditorial → remplace ToolCard default | ✅ Fait | ToolsPage grille principale |
| Score ToolTrim visible sur card grid | ✅ Fait | prescription_quality → score numérique |
| ToolRowEditorial (list row éditorial) | ✅ Fait | Remplace list-row dans CategoryPage |
| StackCardEditorial (variants row + compact) | ✅ Fait | Extrait de StacksPage |
| ResultsPage : intégrer editorial card | 📋 Backlog | Après validation sur ToolsPage |

**Système de cards stabilisé :**
- `ToolCardEditorial` — grille outils (ToolsPage) — **actif**
- `ToolRowEditorial` — liste catégorie (CategoryPage) — **actif**  
- `StackCardEditorial` — stacks liste + compact (StacksPage) — **actif**
- `ToolCard variant="featured"` — sélection éditoriale (ToolsPage) — conservé
- `ToolCard variant="list-row"` — déprécié (remplacé par ToolRowEditorial)
- `ToolCard variant="default"` — déprécié (remplacé par ToolCardEditorial)

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
