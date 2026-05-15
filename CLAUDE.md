# ToolTrim — Guide Claude

Ce fichier aide Claude à naviguer le projet ToolTrim efficacement.

## Projet

ToolTrim est un site éditorial de comparaison d'outils SaaS pour freelances et petites équipes.
Stack : React 18 + React Router v6 + Vite + TypeScript + Tailwind CSS v3.

## Fichiers importants

| Fichier | Rôle |
|---|---|
| `src/pages/ToolDetailPage.tsx` | Page outil — template principal |
| `src/pages/GuidesPage.tsx` | Index guides éditorial |
| `src/pages/GuideDetailPage.tsx` | Article guide éditorial |
| `src/components/Navbar.tsx` | Header fixe + mega-panel Explorer |
| `src/components/tool/StickyDecisionCard.tsx` | Sidebar sticky décision |
| `src/index.css` | Système de design complet (@layer components) |
| `docs/DESIGN_SYSTEM.md` | Référence palette, typographie, composants |
| `docs/ARCHITECTURE.md` | Structure des pages et conventions techniques |
| `docs/CHANGELOG_AI.md` | Historique des sessions Claude |
| `docs/ROADMAP.md` | Phases de développement et dette technique |

## Conventions CSS

Toutes les classes de design utilisent `@layer components` dans `src/index.css`.
Préfixes : `td-*` (tool detail), `gi-*` (guides index), `ga-*` (guide article),
`tc-*` (tool card), `tce-*` (tool card editorial), `nav-*` (navbar), `panel-*` (mega-panel).

**Ne pas** utiliser Tailwind inline dans les nouveaux composants éditoriaux.
**Ne pas** mettre `position: sticky` sur un enfant d'un grid item — toujours sur le grid item lui-même.

## Variables CSS globales

```css
--navbar-h: 68px        /* hauteur navbar fixe */
--header-height: var(--navbar-h)   /* alias */
--font-brand: "Uncut Sans Variable"
--font-ui: "Inter Tight"
--primary: 224 76% 50%  /* ToolTrim blue — usage très limité */
```

## Palette

`#222222` texte/CTA · `#F8F8F4` backgrounds · `#EDEDE8` surfaces secondaires ·
`#FFFFFF` cards · `#DADAD4` borders · `#6F6F68` métadonnées · `#9A9A92` placeholders

## Règles à respecter

- Pas de bouton bleu sur les pages outils
- Pas de gradient background
- Pas de grands logos décoratifs
- Pas d'emojis comme icônes (utiliser Lucide)
- Pas de métadonnées répétées (hero ET sidebar)
- Dark mode : non prioritaire, documenter la dette dans ROADMAP.md

## Commandes utiles

```bash
npm run dev       # dev server
npm run build     # build + prerender
git log --oneline -10  # derniers commits
```

## Workflow typique

1. Lire les docs concernées avant de coder
2. Modifier CSS dans index.css (classes préfixées)
3. Modifier le composant / la page
4. `npm run build` pour valider
5. Commit avec message conventionnel
6. Mettre à jour CHANGELOG_AI.md
