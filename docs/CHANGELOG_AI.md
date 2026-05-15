# ToolTrim — AI Changelog

---

## 2026-05-15 — Sprint 1 : Stabilisation structurelle

**Fichiers modifiés**
- `src/components/Navbar.tsx`
- `src/index.css`

**Fichiers créés**
- `CLAUDE.md`
- `docs/AI_HANDOFF.md`
- `docs/ROADMAP.md`

### 1. Mobile menu — fix complet

**Problème :** Le panel Explorer (`EditoralPanel`) utilisait des styles inline fixes (`left: 24px`, `right: 24px`, `height: 560px`) quel que soit l'écran. La media query existante (`max-width: 767px`) ne couvrait pas les tablettes (768–1023px).

**Fix :**
- Ajout d'un état `isMobile` dans `Navbar` (detecté via `window.innerWidth < 1024`, mis à jour au resize)
- Passage de `isMobile` à `EditoralPanel` comme prop
- `EditoralPanel` utilise des styles inline conditionnels :
  - **Mobile (< 1024px)** : `top: 68px, left: 0, right: 0, bottom: 0, height: auto` → full-screen sous le header
  - **Desktop (≥ 1024px)** : comportement inchangé (`left: 24px, right: 24px, height: 560px`)
- Classe `panel-rail-footer` ajoutée au div footer du rail (caché sur mobile via CSS)
- Media query CSS étendue de `max-width: 767px` → `max-width: 1023px` avec layout corrigé :
  - `panel-body` : `height: auto; flex: 1; min-height: 0` (fix du bug height: 100% sur parent auto)
  - `panel-rail` : scrollable horizontalement, `border-right: none; border-bottom: 1px solid #DADAD4`
  - `panel-content` : `flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden`
  - `panel-columns` : `flex-wrap: wrap; gap: 32px 40px`
  - `panel-link` : `white-space: normal` (wrapping sur écrans étroits)
- Fermeture Escape : déjà implémentée
- Fermeture au clic extérieur : déjà implémentée (click-catcher `z-[45]`)

### 2. Variable --navbar-h

Ajout de `--navbar-h: 68px` dans `:root` comme variable canonique.
`--header-height: var(--navbar-h)` est maintenant un alias.

Utilisations :
- `.td-sidebar-desktop` : `top: calc(var(--header-height) + 24px)`
- `.td-tab-nav` : `top: var(--header-height)`
- Plus de valeurs hardcodées (`88px`) dans le CSS.

### 3. Sticky sidebar — vérification

La sticky sidebar fonctionne correctement depuis Session 1. Pattern vérifié :
- `position: sticky` est sur `.td-sidebar-desktop` (grid item direct)
- `align-self: start` + `height: fit-content` sont présents
- Parents `td-container` et `td-body-grid` n'ont pas `overflow: hidden`, `transform`, `filter`
- `top: calc(var(--navbar-h) + 24px)` = 92px — suffisant pour passer sous le header

### 4. ToolCardEditorial — documenté (non migré)

`ToolCardEditorial` (src/components/ToolCardEditorial.tsx) existe mais n'est importé nulle part.
Migration vers ToolsPage + CategoryPage documentée en Phase 3 du ROADMAP.

### 5. Dark mode — dette technique documentée

`gi-*` et `ga-*` (guides) n'ont aucun dark variant.
Documenté comme dette technique dans ROADMAP.md (Phase 6).
Non traité dans ce sprint.

### 6. Docs créés

- `CLAUDE.md` — guide pour Claude (conventions, variables, règles)
- `docs/AI_HANDOFF.md` — handoff opérationnel pour reprendre une session
- `docs/ROADMAP.md` — phases + dette technique

---

Suivi des modifications appliquées par sessions Claude. Format : date · session · fichiers · résumé.

---

## 2026-05-15 — Session 3 : Refonte page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/tool/ToolDiagCta.tsx`
- `src/index.css`

**Résumé**

### Hero simplifié
Le hero était en 2 colonnes (identité gauche + `HeroDecisionSummary` droite) avec une barre de métadonnées (Catégorie / Modèle / Plan gratuit / Mis à jour). Trop chargé, trop répétitif avec la sidebar.

Nouveau hero : colonne unique, max-width 860px. Breadcrumb → logo + badge catégorie → H1 `clamp(4.5rem, 8vw, 7.75rem)` → description 22px → contexte court 17px/#6F6F68. Aucune métadonnée, aucune grille décisionnelle.

Supprimé : `HeroDecisionSummary` (composant + call JSX), `.td-hero-meta` (row de métadonnées), la classe `.td-hero-layout` reconvertie en simple padding block.

### Section Décision rapide (nouveau)
Remplace la section "Verdict ToolTrim + ToolVerdictBlock" qui était la première section du tab Analyse.

Nouvelle structure : eyebrow `DÉCISION RAPIDE` → H2 `{outil} — quand ça a du sens.` → phrase verdict → grille 3 colonnes `.td-dr-grid` (`.td-dr-block` avec label 11px uppercase + texte 17px).

Données : `verdict.keepIf` → "À garder si" · `verdict.avoidIf` → "À challenger si" · `tool.cons[0]` → "Limite principale".

### Onglets renforcés
- Hauteur : 64px → **72px**
- Font-size : 15px → **16px**
- Letter-spacing : -0.015em → **-0.02em**
- Gap entre items : 0 → **40px**
- Underline actif : 1px → **2px**
- Sticky offset : `top: 0` → `top: var(--header-height)` (68px)

### Bande Audit de stack (full-width)
`ToolDiagCta` sorti du body-grid. Placé juste après `</div.td-container>`, toujours visible (pas conditionnel au subPage). Inliné directement dans `ToolDetailPage.tsx`.

Style : `border-top/border-bottom 1px solid #DADAD4`, `background #F8F8F4`, grille `1fr auto`. Titre clamp(2rem → 2.75rem), CTA black button, pas de bleu, pas de card arrondie.

`ToolDiagCta.tsx` mis à jour au même style pour cohérence (si réutilisé ailleurs).

### Footer CTA ToolTrim (full-width)
Nouveau section après la bande audit. Remplace l'ancien bloc avec grand logo décoratif.

Style : `background #F8F8F4`, `border-top 1px solid #DADAD4`, `padding 72px 0`. Grille `1fr auto`, `align-items: end`. Titre `.td-footer-title` clamp(3rem → 5.125rem), lh 0.95, ls -0.055em.

Eyebrow "TOOLTRIM" en 11px uppercase → titre sobre → texte explicatif → CTA "Lancer mon analyse →" + "Gratuit · Sans inscription".

### Variables CSS
Ajout `--header-height: 68px` dans `:root`. Utilisé dans :
- `.td-sidebar-desktop` : `top: calc(var(--header-height) + 24px)`
- `.td-tab-nav` : `top: var(--header-height)`

### Nouvelles classes CSS (index.css)
- `td-dr-grid` / `td-dr-block` / `td-dr-label` / `td-dr-text` — Décision rapide 3 colonnes
- `td-diag-band` / `td-diag-inner` — Bande audit de stack
- `td-footer-cta` / `td-footer-inner` / `td-footer-title` — Footer CTA ToolTrim

---

## 2026-05-14 — Session 2 : Guides index + Guide article

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx` (réécriture)
- `src/pages/GuideDetailPage.tsx` (réécriture)
- `src/index.css` (ajout systèmes `gi-*` et `ga-*`)

**Résumé**
GuidesPage : layout éditorial Awwwards. FeaturedBlock horizontal + ArticleRow 3 colonnes (130px date/cat | titre | lire →) + thème columns + CTA band. Suppression PersonaGuidesSection (photos Unsplash).

GuideDetailPage : header `ga-header` avec eyebrow + `ga-title` clamp + standfirst. Body grid 2 colonnes `ga-body-grid` (760px + 260px TOC). Système `ga-content` avec sélecteurs explicites H2/H3/blockquote. TOC sticky + barre de progression 2px noire.

---

## 2026-05-14 — Session 1 : StickyDecisionCard + Hero tool

**Fichiers modifiés**
- `src/components/tool/StickyDecisionCard.tsx` (réécriture)
- `src/pages/ToolDetailPage.tsx` (hero 2-col + sticky fix)
- `src/index.css` (système `td-*` initial)

**Résumé**
StickyDecisionCard : score 64px, verdict 16px, ordre header→score→verdict→CTAs→4 facts→alternative. Suppression "Best for / Not ideal if" inline dans la sidebar.

Hero 2-col (déprécié en session 3). Sticky sidebar : bug corrigé — `position: sticky` mis sur `.td-sidebar-desktop` (grid item direct) et non sur un enfant.
