# ToolTrim — Architecture

React SPA · Vite + TypeScript · Tailwind CSS v3

---

## Stack technique

| Couche | Choix |
|---|---|
| Framework | React 18 + React Router v6 |
| Build | Vite |
| Styles | Tailwind CSS v3 + `@layer components` (classes préfixées) |
| Data | Supabase (primaire) + JSON local (fallback) |
| Fonts | Uncut Sans Variable (`--font-brand`) + Inter Tight (`--font-ui`) |
| Déploiement | Prerender statique via vite-plugin-prerender |

---

## Structure des pages

```
/                      → HomePage
/fr/tools              → ToolsPage (grille + diagnostic)
/fr/category/:slug     → CategoryPage (filtres + tri)
/fr/tool/:slug         → ToolDetailPage ← page principale
/fr/tool/:slug/prix    → ToolDetailPage (subPage=prix)
/fr/tool/:slug/alternatives → ToolDetailPage (subPage=alternatives)
/fr/tool/:slug/avis    → ToolDetailPage (subPage=avis)
/fr/tool/:slug/faq     → ToolDetailPage (subPage=faq)
/fr/guides             → GuidesPage
/fr/guide/:slug        → GuideDetailPage
/fr/comparatif/:pair   → ComparePage
/fr/selector           → SelectorPage (diagnostic)
```

---

## ToolDetailPage — structure (après refonte session 3)

```
<article>
  ├── <header.hero>                         ← identité + positionnement
  │   ├── Breadcrumb
  │   ├── Logo + badge catégorie
  │   ├── H1  clamp(4.5rem → 7.75rem)
  │   ├── shortDescription  22px
  │   └── contexte court (prix + threshold)  17px/#6F6F68
  │
  ├── <div.td-container>
  │   └── <div.td-body-grid>               ← 2 colonnes: 1fr | 360px
  │       ├── <div> main content
  │       │   ├── StickyDecisionCard (mobile)
  │       │   ├── <nav.td-tab-nav>         ← 5 tabs, sticky top:var(--header-height)
  │       │   │   Analyse / Prix / Alternatives / Avis / FAQ
  │       │   │
  │       │   └── [subPage === "presentation"]
  │       │       ├── DÉCISION RAPIDE      ← nouveau (td-dr-grid, 3 blocs)
  │       │       ├── Pour qui             ← ToolAudienceBlock
  │       │       ├── Points forts         ← pros list
  │       │       ├── Limites              ← cons list
  │       │       ├── Fonctionnalités      ← ToolFeaturesBlock
  │       │       ├── Cas d'usage
  │       │       ├── Analyse ToolTrim     ← longDescription
  │       │       ├── Intégrations         ← ToolPluginsBlock
  │       │       └── ToolSummaryBlock     ← SEO/LLM, visually quiet
  │       │
  │       └── <aside.td-sidebar-desktop>   ← sticky, top:calc(--header-height + 24px)
  │           ├── StickyDecisionCard
  │           └── Related posts
  │
  ├── <div.td-diag-band>                   ← full-width, toujours visible
  │   Audit de stack : "{outil} fait partie de ta stack ?"
  │
  └── <section.td-footer-cta>              ← full-width
      "Une stack plus claire. Moins d'abonnements inutiles."
```

### Règle tabs — scroll ancre

Les tabs pointent vers des routes séparées (`/fr/tool/:slug/prix` etc.) pour le SEO et le prerender.
La navigation est gérée par `<Link>` normalement. Un `useEffect` surveille `[subPage, slug]` :
- Premier rendu ou changement d'outil → reset des refs, pas de scroll
- Changement de `subPage` → `window.scrollTo({ behavior: "smooth" })` avec offset `92px`

**Ne pas utiliser** `useNavigate` + `preventScrollReset` dans un contexte `BrowserRouter` — cela provoque React error #310 en production.

Les sections ont `id="analyse|prix|alternatives|avis|faq"` + `.td-subpage-content { scroll-margin-top: 152px }`.

### Règle sticky sidebar
`position: sticky` doit être sur l'élément grid item directement (`.td-sidebar-desktop`), pas sur un enfant.
La hauteur du grid item = hauteur du contenu (via `height: fit-content`).
Les parents ne doivent pas avoir : `overflow: hidden`, `overflow: auto`, `transform`, `filter`, `perspective`.
`top: calc(var(--navbar-h, 68px) + 20px)` — utilise la variable canonique avec fallback.

### Règle H1 — noms courts
Si `tool.name.length <= 5` (Box, Slack, Zoom…) : `fontSize: clamp(4.5rem, 8vw, 6.5rem)` (max 104px desktop).
Sinon : `clamp(4.5rem, 8vw, 7.75rem)` (max 124px). Condition inline dans `ToolDetailPage.tsx`.

---

## Système CSS — classes préfixées

Toutes les nouvelles classes utilisent `@layer components` dans `index.css`.

| Préfixe | Scope |
|---|---|
| `td-*` | ToolDetailPage (hero, tabs, body, sidebar, sections, footer) |
| `tc-*` | ToolCard (3 variants : default, featured, list-row) |
| `tce-*` | ToolCardEditorial (benchmark, non encore migré) |
| `gi-*` | GuidesPage (index éditorial) |
| `ga-*` | GuideDetailPage (article éditorial) |
| `eh-*` | EditorialHero (composant réutilisable) |
| `es-*` | EditorialSection |
| `ec-*` | EditorialCard |
| `nav-*` | Navbar + mega-panel |

---

## Navbar — mobile menu

`EditoralPanel` gère les deux modes via prop `isMobile` (détecté avec `window.innerWidth < 1024` + resize listener dans `Navbar`).

| Mode | Comportement |
|---|---|
| Desktop (≥ 1024px) | Floating card : `left: 24px, right: 24px, height: 560px, top: 76px` |
| Mobile (< 1024px) | Full-screen : `left: 0, right: 0, bottom: 0, top: 68px, height: auto` |

Layout interne :
- Desktop : 2 colonnes — `.panel-rail` (260px) + `.panel-content` (flex-1)
- Mobile : 2 lignes — `.panel-rail` (horizontal, scrollable) + `.panel-content` (scrollable vertical)

Fermetures : Escape (global keydown listener) + clic extérieur (click-catcher `z-[45]`, `fixed inset-0`) + route change.

## Variables CSS globales (`:root`)

```css
--header-height: 68px;    /* hauteur navbar fixe */
--font-brand: "Uncut Sans Variable";
--font-ui: "Inter Tight";
--primary: 224 76% 50%;   /* ToolTrim blue — usage sparingly */
```

### Tokens de layout grid

```css
--layout-max:            1440px;   /* full-width shell */
--layout-content:        1280px;   /* contenu éditorial */
--layout-article:        760px;    /* colonne texte article */
--layout-sidebar:        260px;    /* sidebar TOC article */
--layout-tool-sidebar:   360px;    /* sidebar sticky outil */
--layout-gutter:         48px;     /* desktop (overridé à 32px ≤1023px, 20px ≤767px) */
```

#### Conteneurs par page

| Page | Conteneur | max-width |
|---|---|---|
| ToolDetailPage hero + body | `td-container` | `var(--layout-max)` = 1440px |
| GuidesPage hero | `eh-container` | `var(--layout-content)` = 1280px |
| GuidesPage body | `gi-container` | `var(--layout-content)` = 1280px |
| GuideDetailPage hero | `ga-container` | `var(--layout-content)` = 1280px |
| GuideDetailPage body | `ga-body-grid` | `var(--layout-content)` = 1280px |
| GuideDetailPage CTA band | `ga-cta-inner` | `var(--layout-content)` = 1280px |
| Autres pages (home, tools…) | `max-w-7xl` (Tailwind) | 1280px |

#### Classes utilitaires (migration progressive)

```css
.layout-shell         /* max 1440px */
.layout-content       /* max 1280px */
.layout-article-grid  /* 2-col : 760px + 260px TOC */
.layout-tool-grid     /* 2-col : 1fr + 360px card */
```

---

## Données

### Hooks
- `useTools()` — tous les outils
- `useToolBySlug(slug)` — outil unique + loading state
- `useCategories()` — toutes les catégories
- `usePosts(lang)` — guides/articles

### Score éditorial
`computeToolTrimScore(tool)` → `{ score: number, labelFr: string, labelEn: string }`
Plage : 2.8 → 4.8. Utilisé dans StickyDecisionCard et section Avis.

---

## GuideDetailPage — composants et conventions (après Sprint 3)

### Encadrés "À retenir" (ga-takeaway)

Le renderer Markdown (`markdownToHtml` dans `GuideDetailPage.tsx`) détecte les blockquotes commençant par un des préfixes suivants et les transforme en encadrés sobres :
- `> À retenir : texte…` → label "À retenir" + texte
- `> Key takeaway : texte…` → label "Key takeaway" + texte
- `> À noter : texte…` → label "À noter" + texte
- `> Note : texte…` → label "Note" + texte

Rendu : `<div class="ga-takeaway"><p class="ga-takeaway-label">…</p><p>…</p></div>` — fond `#EDEDE8`, bordure `#DADAD4`, `border-radius: 10px`.

### TOC sticky

`.ga-toc-col` utilise `top: calc(var(--navbar-h, 68px) + 24px)` (92px total). L'IntersectionObserver surveille les H2 uniquement. Masqué sous 1100px (mobile TOC affiché à la place).

### Typographie article

| Élément | Font-size | Notes |
|---|---|---|
| H2 | `clamp(2.625rem, 4vw, 3.5rem)` | 42px → 56px |
| H3 | `clamp(1.75rem, 2.5vw, 2.125rem)` | 28px → 34px |
| Body p | 19px | line-height 1.65 |
| Body li | 18px | line-height 1.6 |
| Blockquote | 22px | border-left 2px #222222 |

---

## Composants clés (tool detail)

| Composant | Rôle |
|---|---|
| `StickyDecisionCard` | Sidebar sticky : score + verdict + CTAs + 4 facts + alternative |
| `ToolVerdictBlock` | Détail keepIf/avoidIf/prescription (section Analyse) |
| `ToolPricingSection` | Grille de prix v5 (section Prix) |
| `ToolAlternativesSection` | Comparatif + table (section Alternatives) |
| `ToolFAQSection` | FAQ structurée (section FAQ) |
| `ToolAudienceBlock` | Profils relevantFor + solo/team relevance |
| `ToolFeaturesBlock` | covers + functional_needs |
| `ToolPluginsBlock` | Intégrations et plugins |
| `ToolSummaryBlock` | SEO/LLM summary (visually quiet) |
| `ToolJsonLd` | Schema.org JSON-LD |
| `ToolDiagCta` | Bande audit de stack (réécrit : éditorial, sans bleu) |
