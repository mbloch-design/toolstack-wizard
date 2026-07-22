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

### Migration du catalogue outils

Le catalogue est actuellement hybride : Supabase est prioritaire, avec des JSON locaux utilisés par le build, certains hooks, le diagnostic et les tests. La cible « Supabase source éditoriale unique + snapshot de build généré » et ses gates SEO sont documentées dans `docs/SUPABASE_TOOL_CATALOG_MIGRATION.md`.

Ne pas supprimer `tools_v4.json` ou `tools_index.json` avant d’avoir migré le prerender, les listings, le diagnostic et les tests selon ce plan.

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
| `tcr-*` | ToolRowEditorial (liste catégorie) |
| `gi-*` | GuidesPage (index éditorial) |
| `ga-*` | GuideDetailPage (article éditorial) |
| `eh-*` | EditorialHero (composant réutilisable) |
| `es-*` | EditorialSection |
| `ec-*` | EditorialCard |
| `nav-*` | Navbar + mega-panel |
| `sk-*` | StacksPage (index stacks) |
| `sd-*` | StackDetailPage (détail stack) |
| `cp-*` | ComparePage (page comparatif) |

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
- `useToolSummaries()` — index léger pour listings, recherche, catégories, guides, Explorer et Ma Stack. Les routes de découverte ne doivent pas importer `tools_v4.json`.
- `useTools()` — fiches complètes, réservé aux calculs et écrans qui consomment réellement les champs éditoriaux riches.
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

## ComparePage — template éditorial

### Pattern : registre + fallback

```typescript
// Contenu éditorial hardcodé pour une paire spécifique
const NOTION_VS_AIRTABLE: CompareEditorialContent = { ... }

// Registre : slugPair → contenu éditorial
const EDITORIAL_CONTENT: Record<string, CompareEditorialContent> = {
  "notion-vs-airtable": NOTION_VS_AIRTABLE,
}

// Fallback générique généré depuis les données outil (pros/cons/pricing)
function buildFallbackContent(toolA: Tool, toolB: Tool, lang: string): CompareEditorialContent { ... }
```

**Résolution au rendu** :
1. Construire `slugPair = [slugA, slugB].sort().join("-vs-")` (canonique)
2. Chercher dans `EDITORIAL_CONTENT[slugPair]`
3. Si absent → `buildFallbackContent(toolA, toolB, lang)`

### Interface `CompareEditorialContent`

```typescript
interface CompareEditorialContent {
  framingPhrase: string;         // 21px, sous le H1
  verdictCourt: string;          // 18px, résumé 1 phrase
  verdictCols: { label, items }[3]; // 3 colonnes verdict rapide
  tableRows: CompareTableRow[];  // 10 lignes tableau
  profiles: CompareProfile[];    // 6 cartes profil
  pricingNotes: { toolA, toolB } // notes prix avec **bold**
  recommendation: string;        // bloc recommandation ToolTrim
  limitsA: string[];             // limites outil A
  limitsB: string[];             // limites outil B
  alternatives: CompareAlt[];    // 5 alternatives
  faq: CompareFaqItem[];         // 5 questions FAQ
}
```

### Composants internes

| Composant | Rôle |
|---|---|
| `PricingNote` | Rend `**texte**` en `<strong>` via regex split |
| `FaqItem` | `<details>/<summary>` avec `useState` pour chevron rotatif |

### Règle alternatives

Si l'outil alternatif est trouvé dans la DB (`tools.find(t => t.slug === alt.slug)`) → `<Link to="/fr/tool/...">` cliquable.
Sinon → `<div>` statique avec initiales en fallback logo.

---

## StacksPage / StackDetailPage

### Données stacks

- Source : `src/data/stacks.ts`
- Type : `StackGuide` avec `persona`, `slug`, `monthlyBudget`, `riskSnippet`, `tools[]`
- `STACK_PERSONAS`, `PROFILE_RECOMMENDED_STACKS` — mapping profil → stack recommandée
- `getStackDerivedFields(stack)` expose la couche de sélection de l'index : `budgetRange`, `level`, `complexity`, `stackType`, `toolCount`, `verdict`, `toolsToKeep`, `toolsToChallenge`.

### StacksPage — sélection contextuelle

`StacksPage` porte la logique de facettes de `/fr/stacks` : profil, spécialités dépendantes, objectifs, budget, niveau, complexité, type de stack, nombre d'outils, recherche et tri.

- Les filtres sont persistés en query params (`profile`, `specialty`, `objective`, `budget`, `level`, `complexity`, `type`, `toolCount`, `sort`, `q`). L'ancien `subProfile` est encore lu en fallback.
- `Profil`, `Budget`, `Niveau`, `Complexité` et `Nombre d'outils` sont single-select.
- `Spécialité`, `Objectif` et `Type de stack` sont multi-select : `OR` dans la facette, `AND` entre facettes.
- Les spécialités sont masquées tant que le profil est `Tous` et se réinitialisent à chaque changement de profil.
- Les valeurs sans résultat sont désactivées ; les compteurs globaux ne sont pas affichés.
- Les cards stack sont rendues directement par `StackSelectionCard` dans `StacksPage` pour éviter deux systèmes concurrents.
- L'ancien composant `StackCardEditorial` a été retiré.

### StackDetailPage — ToolPanel (Sheet)

Le composant `ToolPanel` (side sheet) est **intégralement conservé** dans `StackDetailPage`.
Il utilise `Sheet` / `SheetContent` / `SheetClose` de shadcn/ui.
Ne pas modifier ce composant lors de futures refontes éditoriales.

### StackDetailPage — template décisionnel

Le détail stack utilise maintenant les données existantes comme base de décision :

- Hero : `persona`, premier `subProfiles[]`, `monthlyBudget`, `stage`, `getStackDerivedFields(stack).complexity`, `bestFor`, `avoidIf`.
- Résumé : `tools[]` + `decision` pour extraire les outils à garder, optionnels et à challenger. Quand la donnée manque, fallback sur `editorial.priority`.
- Outils : regroupement par rôle métier via `PERSONA_LAYERS`, row avec logo, rôle, raison, prix/plan indicatif, statut décisionnel et lien fiche outil.
- Budget : cible de calibration, pas promesse d'économie.
- Calibrage : section `Trop légère si` / `Trop lourde si` pour éviter les recommandations hors contexte.

Le contenu spécifique peut être ajouté dans `EDITORIAL_REGISTRY[stack.slug]`. Sinon `buildFallbackEditorial(stack)` continue d'assurer une page complète sans casser les fiches existantes.

### Fix hooks React (règle)

Les `useMemo` doivent être déclarés **avant** tout `return` conditionnel (`if (!data) return ...`).
Utiliser un guard `if (!data) return []` **à l'intérieur** du callback `useMemo` si la donnée peut être absente.

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
