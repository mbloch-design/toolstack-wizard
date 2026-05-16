# ToolTrim — AI Changelog

---

## 2026-05-16 — Sprint 6 : Ticker Awwwards — typographie pure, animation lente

### Objectif
Transformer la barre ticker en signature éditoriale fine et rythmée, style Awwwards.
Supprimer les logos. Textes courts. Séparateur sobre. Animation lente.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — réécriture complète (sans logos)
- `src/index.css` — override hp-ticker height 40px + nouvelles classes hpt-*
- `tailwind.config.ts` — durée animation 28s → 45s
- `docs/CHANGELOG_AI.md` — ce fichier

### TickerBar.tsx

**Modèle de données simplifié :**
```ts
interface TickerItem {
  tools: string;       // nom(s) propres, identiques FR/EN
  decisionFr: string;  // décision courte en français
  decisionEn: string;  // décision courte en anglais
}
```

**9 items :** Notion+Trello / Slack Pro / Zoom+Teams / Zapier / HubSpot / Figma+Sketch / Loom / Harvest / Coda+Notion

**Structure d'un item rendu :**
```
<span class="hpt-item-group">
  <span class="hpt-tools">Notion + Trello</span>      ← 400 / #6F6F68
  <span class="hpt-decision">Doublon possible</span>  ← 600 / #222222
  <span class="hpt-sep">◌</span>                     ← opacity 0.35
</span>
```

**Pas de `useState`, pas de logos, pas d'imports inutiles.** `aria-hidden="true"` (décoratif).

### CSS — classes Sprint 6

**`.hp-ticker` :** `height:40px` (était 44px), `display:flex; align-items:center`

**`.hpt-track` :** `display:inline-flex; align-items:center; white-space:nowrap; height:40px`

**`.hpt-item-group` :** `display:inline-flex; align-items:center; gap:10px`

**`.hpt-tools` :** `font-size:14px; font-weight:400; color:#6F6F68`

**`.hpt-decision` :** `font-size:14px; font-weight:600; color:#222222`

**`.hpt-sep` :** `font-size:14px; color:#222222; opacity:0.35; margin:0 22px`

**`prefers-reduced-motion` :** `animation: none !important` sur `.animate-ticker`

### tailwind.config.ts

`ticker: "ticker 45s linear infinite"` (était 28s)

---

## 2026-05-16 — Sprint 5 : Ticker logos · Titre section · Design tokens espacement

### Objectif
Rendre le ticker visuellement concret (logos d'outils), introduire les 3 cards avec un vrai titre éditorial, et ancrer tous les espacements dans des tokens de design system.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — réécriture complète avec logos
- `src/pages/HomePage.tsx` — `EntryCardsSection` : ajout header éditorial + renommage classes
- `src/index.css` — tokens `--space-*`, classes `hpt-*` (ticker), classes `home-actions-*`
- `docs/CHANGELOG_AI.md` — ce fichier

### TickerBar.tsx — réécriture avec logos

**Structure item :**
```
[logo] Outil A  +  [logo] Outil B  →  Décision
```

**Nouveau data model :**
```ts
interface TickerItem {
  tools: Array<{ name: string; domain: string }>;
  decisionFr: string;
  decisionEn: string;
}
```

**Composant `TickerLogo` :** favicon CDN (`t3.gstatic.com/faviconV2`) + lettre initiale en fallback via `useState`.

**8 items :** Notion+Coda / Slack / Zoom+Teams / HubSpot / Zapier / Harvest+Pennylane / Figma+Sketch / Loom

**Nouvelles classes CSS `hpt-*` :**
- `.hpt-item` : `display:inline-flex; height:44px; padding:0 22px; border-right:1px solid #DADAD4`
- `.hpt-logo` : pill 24×24px, border #DADAD4, bg white
- `.hpt-logo img` : max 15×15px
- `.hpt-name` : 13px #6F6F68
- `.hpt-plus` : 11px #9A9A92
- `.hpt-arrow` : 13px #9A9A92
- `.hpt-decision` : 13px 600 #222222

**`.hp-ticker` override :** `height:44px; max-height:none`

### HomePage.tsx — EntryCardsSection

**Section wrapper :** `hac-section` → `home-actions-section`
**Grid :** `hac-grid` → `home-actions-grid`

**Header éditorial ajouté au-dessus de la grille :**
- Eyebrow : "TROIS FAÇONS DE DÉCIDER"
- Titre : "Commence par la bonne question." — `clamp(2.25rem, 4vw, 3.5rem)` / `ls -0.05em`
- Description : 17px / `max-width: 680px`

### index.css — tokens et classes

**Tokens d'espacement** ajoutés dans `:root` (remplace le commentaire placeholder) :
```css
--space-2xs: 4px;   --space-xs: 8px;    --space-sm: 12px;
--space-md: 16px;   --space-lg: 24px;   --space-xl: 32px;
--space-2xl: 48px;  --space-3xl: 64px;  --space-4xl: 96px;
```

**`.home-actions-section` :** `padding: var(--space-3xl) 0 72px` (mobile: `var(--space-2xl) 0 56px`)
**`.home-actions-header` :** `max-width:760px; margin-bottom: var(--space-2xl)`
**`.home-actions-grid` :** 3 colonnes, gap 16px (mobile: 1 colonne, gap 14px)

---

## 2026-05-16 — Sprint 4d — HomeActionCards (contours noirs, header tableau, logos, scénario)

### Objectif
Remplacer les colonnes textuelles par 3 vraies cards avec contour noir, header interne façon tableau, logos d'outils dans pills, scénario concret, capsule verdict, CTA.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — `EntryCardsSection` réécrite + `HacLogo` component
- `src/index.css` — bloc `hac-*` (~130 lignes)

### Détails
- `hac-card` : `border:1.5px solid #222222; border-radius:12px`
- `hac-header` : grid 2 colonnes (label / numéro), `border-bottom:1.5px solid #222222`
- `hac-logo` : pill 30×30px, bg white, `border:1px solid #DADAD4`
- `hac-capsule` : pill 26px, `border:1px solid #222222`
- Mobile : 1 colonne, gap 14px

---

## 2026-05-16 — Sprint Home : Identité et vie (Hero 2-col + modules produit)

### Objectif
Rendre la home plus vivante, concrète et produit-focused. Montrer le geste ToolTrim dès le hero : auditer, trier, garder, couper, remplacer. Ajouter des modules visuels qui donnent une identité produit immédiate.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — réécriture complète (2-col + StackAuditPreview)
- `src/pages/HomePage.tsx` — enrichissement de 3 sections + 2 nouvelles sections
- `src/index.css` — ajout classes `hp-*` Sprint 4 (~350 lignes)
- `docs/CHANGELOG_AI.md` — ce fichier

### HeroSection.tsx — réécriture 2-colonnes

**Supprimé :**
- `eh-root--centered` (hero centré, colonne unique)
- `justifyContent: center` sur tous les éléments

**Ajouté :**
- Layout `hp-hero-2col` : `1fr 420px` sur desktop, colonne unique sous 1100px
- `hp-hero-left` : eyebrow + H1 alignés à gauche + description + CTAs
- `hp-hero-right` : `StackAuditPreview` inline component
- **`AuditToolLogo`** : favicon CDN (`t3.gstatic.com/faviconV2`) + lettre fallback via `useState`
- **`AuditBadge`** : 4 variants CSS (`--keep` vert / `--challenge` ambre / `--duplicate` rouge / `--soon` gris)
- **`StackAuditPreview`** : 5 outils (Notion/Canva/Loom/Trello/Zapier), header budget actuel 85€, footer budget cible 48€ + saving −37€/mois, hover "Pourquoi?" reveal (CSS pur, no JS), mini-CTA "Auditer ma vraie stack", disclaimer italique

### HomePage.tsx — enrichissements et nouvelles sections

**EntryCardsSection enrichie :**
- Ajout `exampleFr`/`exampleEn` par carte (italic sous la description)
- CTA spécifique par carte : "Lancer l'audit" / "Voir les stacks" / "Comparer maintenant" (au lieu de "Commencer" générique)

**ManifestoSection enrichie :**
- Ajout bloc `hp-decisions` après les 3 paragraphes
- 3 lignes : Garder / Couper / Remplacer — chacune avec clé uppercase + description en gras ciblé

**WhatWeCutSection réécrite (liste → decision rows) :**
- Passage de `hp-cuts-item` (dash + texte) → `hp-cut-row` (point + titre + exemple italique)
- Chaque item a maintenant un exemple concret (ex : "Loom ouvert 2 fois ce mois. Slack video suffit.")

**AvantAprèsSection — NOUVELLE :**
- Heading : "9 outils, 123 €/mois → 5 outils, 48 €/mois."
- 2 panels côte à côte (`hp-aa-panel` / `hp-aa-panel--after`)
- Panel Avant : header cream, 9 outils listés avec prix
- Panel Après : header noir, items kept (vert) vs cut (barré gris) avec label doublon/dormant/trop tôt
- Saving summary : "−75 € / soit −900 €/an"
- CTA : "Calculer mon économie →"

**MethodeSection — NOUVELLE :**
- Heading : "3 étapes. Pas de jargon." + CTA inline "Commencer l'audit"
- Grille 3 colonnes (`hp-methode-grid`) : 01 usage / 02 doublons / 03 décision
- Chaque step : grand numéro décoratif (couleur cream), titre, description, exemple en box italique

**Ordre des sections mis à jour :**
1. Hero → 2. TickerBar → 3. EntryCards → 4. Manifesto → 5. WhatWeCut → **6. AvantAprès (NOUVEAU)** → **7. Méthode (NOUVEAU)** → 8. BusinessObjectives → 9-16. sections existantes

### index.css — nouvelles classes Sprint 4 (`@layer components`)

| Famille | Classes |
|---------|---------|
| Hero 2-col | `hp-hero-2col`, `hp-hero-left`, `hp-hero-right` |
| Audit preview | `hp-audit`, `hp-audit-header`, `hp-audit-row`, `hp-audit-logo`, `hp-audit-badge` (4 variants), `hp-audit-price`, `hp-audit-why`, `hp-audit-footer`, `hp-audit-mini-cta`, `hp-audit-disclaimer` |
| Entry enriched | `hp-entry-example`, `hp-entry-example-label` |
| Decisions | `hp-decisions`, `hp-decision`, `hp-decision-key`, `hp-decision-desc` |
| Cut rows | `hp-cut-rows`, `hp-cut-row`, `hp-cut-row-header`, `hp-cut-row-indicator`, `hp-cut-row-title`, `hp-cut-row-example` |
| Avant/Après | `hp-aa`, `hp-aa-inner`, `hp-aa-panel`, `hp-aa-panel--after`, `hp-aa-panel-header`, `hp-aa-list`, `hp-aa-item`, `hp-aa-item--kept`, `hp-aa-item--cut`, `hp-aa-saving` |
| Méthode | `hp-methode`, `hp-methode-grid`, `hp-methode-step`, `hp-methode-num`, `hp-methode-title`, `hp-methode-desc`, `hp-methode-example` |

### Décisions techniques

- `AuditToolLogo` : `useState(false)` pour détecter l'erreur de chargement favicon → fallback lettre
- Hover "Pourquoi?" : `opacity: 0` → `opacity: 1` sur `.hp-audit-row:hover .hp-audit-why` (pur CSS, 0 JS)
- Badges colorés (vert/ambre/rouge/gris) : seul usage de couleur fonctionnelle sur la home, justifié par la valeur sémiologique (status = décision)
- Pas de gradient, pas de bleu, palette 100% dans le design system existant
- Breakpoint 1100px pour le hero (pas 900px) : la preview audit a besoin d'espace à 420px

---

## 2026-05-16 — Sprint Home : Repositionnement autour de l'audit de stack

### Objectif
Repositionner la home de ToolTrim : sortir du positionnement "comparateur SaaS / annuaire d'outils" pour affirmer le territoire "audit de stack pour freelances et solopreneurs". Le catalogue n'est plus le centre de la home. L'audit de stack devient le CTA principal.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — réécriture complète
- `src/pages/HomePage.tsx` — restructuration + 3 nouvelles sections
- `src/index.css` — ajout classes `hp-*` (~130 lignes)
- `docs/CHANGELOG_AI.md` — ce fichier

### HeroSection.tsx — réécriture

**Supprimé :**
- Barre de recherche d'outils (input + chips = comportement annuaire)
- Grille de 12 outils "featured" (Figma, Notion, Slack...)
- Ligne de stat "X outils couverts · prix vérifiés · recommandations indépendantes"
- CTA "Explorer les outils" → /tools
- Import `Search`, `ToolLogo`, `useToolSummaries`, `useNavigate`

**Ajouté :**
- Eyebrow : "pour les freelances et solopreneurs"
- H1 : "Arrête d'empiler les outils. / Construis une stack qui travaille / vraiment pour toi."
- Sous-titre : "ToolTrim aide les freelances et solopreneurs à auditer leurs abonnements, repérer les doublons et choisir les outils qui valent vraiment le coût."
- CTA primaire : "Auditer ma stack →" → `/fr/selector` (noir, `eh-cta-primary` sans `--accent`)
- CTA secondaire : "Explorer les stacks types" → `/fr/stacks` (outline)

### HomePage.tsx — restructuration

**Nouvelle structure des sections :**
1. HeroSection (rewriten)
2. TickerBar (inchangé)
3. **EntryCardsSection** — NOUVELLE
4. **ManifestoSection** — NOUVELLE
5. **WhatWeCutSection** — NOUVELLE
6. BusinessObjectivesSection (titre mis à jour : "Des setups concrets, par métier.")
7. StatsSection (inchangé)
8. PersonasSection (inchangé)
9. HowItWorks (lazy, inchangé)
10. DiffTable (lazy, inchangé)
11. TestimonialsSection (lazy, inchangé)
12. Guides (inchangé)
13. FAQ (stats mises à jour : "< 3 min" + "100% indépendant")
14. FinalCTA (lazy, inchangé)

**Supprimé :**
- Section Categories (grille 4 colonnes de catégories = catalog pur)
- Import `getCategoryIcon`, `stripLeadingEmoji`

**SEO tags mis à jour :**
- Title FR : "ToolTrim — Audite ta stack, coupe ce qui ne sert pas"
- Description FR : centrée sur l'audit, pas sur le nombre d'outils
- JSON-LD `WebSite` : suppression `potentialAction SearchAction` (comportement annuaire)
- JSON-LD `Organization` : description mise à jour

### Nouvelles sections (composants inline)

**EntryCardsSection** — 3 chemins d'entrée
- Grille 3 colonnes desktop (`hp-entries-grid`), 1 colonne mobile (border-top séparateurs)
- 01 "Auditer ma stack" → /selector
- 02 "Trouver ma stack" → /stacks
- 03 "Comparer deux outils" → /comparatifs
- Chaque card : numéro en small caps + titre + description + lien "Commencer →"
- Hover : background #F8F8F4, gap sur la flèche

**ManifestoSection** — "Pas un annuaire de plus"
- Fond `#EDEDE8` (medium cream), border-top `#DADAD4`
- Layout 2 colonnes : heading gauche + 3 paragraphes droite
- Heading : "Pas un annuaire de plus."
- Copy : "ToolTrim ne cherche pas à lister tous les outils du marché. L'objectif est plus simple : t'aider à décider. / Quel outil garder. Quel outil couper. Quel outil remplacer. / Un bon outil doit avoir un rôle clair dans ta stack."
- Mobile : 1 colonne, gap 40px

**WhatWeCutSection** — "Ce que ToolTrim coupe"
- Fond blanc, border-top `#DADAD4`
- Layout 2 colonnes : heading gauche + liste + CTA droite
- Heading : "Tout ce qui alourdit ta stack sans raison."
- Liste 5 items avec dash `hp-cuts-item-dash` + border-bottom `#EDEDE8`
  1. Les doublons fonctionnels
  2. Les outils dormants
  3. Les abonnements trop tôt
  4. Les alternatives trop lourdes
  5. Les stacks qui coûtent plus qu'elles ne rapportent
- CTA "Auditer ma stack →" noir, 48px, radius 8px
- Mobile : 1 colonne, heading puis liste

### Classes CSS ajoutées (hp-* dans index.css)

```
hp-entries, hp-entries-grid, hp-entry, hp-entry + hp-entry
hp-entry-number, hp-entry-title, hp-entry-desc, hp-entry-link
hp-manifesto, hp-manifesto-inner, hp-manifesto-label
hp-manifesto-heading, hp-manifesto-body, hp-manifesto-para
hp-cuts, hp-cuts-inner, hp-cuts-heading, hp-cuts-label
hp-cuts-list, hp-cuts-item, hp-cuts-item-dash, hp-cuts-cta
```

Mobile breakpoints : `hp-entries-grid` → 1 colonne (< 768px), `hp-manifesto-inner` + `hp-cuts-inner` → 1 colonne (< 900px).

---

## 2026-05-15 — Sprint Stacks Facettes : sidebar de facettes /fr/stacks

### Sprint Stacks Facettes — sidebar combinatoire

**Fichiers modifiés** : `src/pages/StacksPage.tsx` (réécriture complète) + `src/index.css` (+280 lignes sk-*)

**Layout**
- `sk-listing-layout` : `grid-template-columns: 256px minmax(0, 1fr)` + gap 48px
- Sidebar sticky : `top: calc(var(--navbar-h, 68px) + 24px)` + `max-height: calc(100vh - navbar - 48px)` + `overflow-y: auto` (scrollable quand contenu > viewport)
- Mobile < 1024px : sidebar masquée, `sk-listing-layout` → 1 colonne

**Sidebar de facettes (desktop)**
- Header : eyebrow "AFFINER", titre 20px, description 14px #6F6F68
- 4 groupes de facettes : PROFIL / OBJECTIF / BUDGET / COMPLEXITÉ
- `sk-facet-group` : border-top + padding 20px 0
- `sk-facet-option` : button pleine largeur 34px, hover #EDEDE8, active #222222
- `sk-facet-count` : count à droite (opacity 0.6), masqué sur option "Tous"
- `sk-sidebar-reset` : bouton discret, désactivé si aucun filtre actif

**Facettes et types**
- `StackFacetProfile` : `"all" | StackPersona` (6 personas)
- `StackFacetObjective` : `"all" | "content" | "sell" | "clients" | "automate" | "produce" | "organize"` (dérivé depuis `subProfiles`)
- `StackFacetBudget` : `"all" | "light" | "standard" | "premium"` (≤50 / 51-150 / >150€)
- `StackFacetComplexity` : `"all" | StackStage` (starter/lean/scale)
- Mapping `OBJECTIVE_SUBPROFILES` : chaque objectif → liste de subProfiles correspondants
- `getStackObjectives(stack)` : dérive les objectifs depuis `stack.subProfiles`
- Filtrage combinatoire : toutes les facettes s'appliquent ensemble

**Compteurs dans la sidebar**
- Calculés dynamiquement sur l'ensemble STACKS (pas sur la sélection courante)
- `countForProfile / countForObjective / countForBudget / countForComplexity`
- Total 212 stacks : Créateur 40, Consultant 47, Designer 36, Développeur 37, Ops 28, Solo 24

**Panneau mobile**
- `sk-mobile-trigger-row` : visible < 1024px, masqué >= 1024px
- Bouton "Filtres" + badge count actif (ex: "Filtres (2)")
- `sk-mobile-panel` : fixed full-screen, fond #F8F8F4
- Header blanc + titre + bouton fermer (×)
- Corps scrollable avec `SidebarContent` (mêmes facettes)
- Footer blanc : CTA "Voir les N stacks" noir + "Réinitialiser" secondaire
- Fermeture via bouton ×, via Escape (event listener), body overflow:hidden pendant ouverture

**Composant partagé `SidebarContent`**
- Utilisé à la fois par `sk-sidebar` (desktop) et `sk-mobile-panel` (mobile)
- Reçoit tous les états facettes en props + callbacks
- `FacetGroup<T>` générique : label + options + active + onChange + counts

**Barre résultats**
- `sk-results-header` : "N stacks trouvées" (gauche) + tri select (droite)
- `sk-results-search` : champ recherche desktop (masqué mobile)
- Le champ recherche mobile est dans `sk-mobile-trigger-row`

**Cards améliorées**
- Tags `sk-card-tags-row` : budget tier + complexité (stage label) + nombre d'outils
- STAGE_LABELS : starter → Débutant / lean → Intermédiaire / scale → Avancé
- `budgetDisplayLabel()` : Budget léger / Standard / Premium

**Empty state**
- `sk-empty-state` : card avec titre brand + description + CTA "Réinitialiser les filtres"
- Reset : remet toutes les facettes à "all", query = "", sort = "recommended"

**Supprimé**
- `StackFilterId` et `FILTER_PILLS` (pills horizontales) — remplacés par sidebar
- `stackMatchesFilter` — remplacé par `stackMatchesFacets`

---

## 2026-05-15 — Sprint Stacks : tri sur /fr/stacks + Sprint Comparatifs Index : refonte /fr/comparatifs

### Sprint Stacks — ajout tri discret

**Fichier modifié** : `src/pages/StacksPage.tsx` + `src/index.css`

**Ajouts**
- `StackSortId` type : `"recommended" | "budget" | "tools"`
- `sortBy` state + sort logic dans `filteredStacks` useMemo
- Sort select (`gi-sort-select`) intégré dans `sk-filter-row` aux côtés des filter pills
- `.sk-filter-row` CSS : flex row, pills flex-1, sort à droite, wraps sur mobile
- Empty state amélioré : message explicit + bouton "Voir toutes les stacks" (reset filter + query + sort)

### Sprint Comparatifs Index — refonte /fr/comparatifs

**Fichier modifié** : `src/pages/ComparesIndexPage.tsx` + `src/index.css` (+280 lignes cix-*)

**Hero** : réécriture inline — suppression `EditorialHero` et méta ANNÉE/PRIX VÉRIFIÉS/VERDICTS.
Structure : eyebrow + H1 `clamp(3.5rem→6rem)` + description 19px + fond `#F8F8F4` border-bottom uniquement.

**Recherche** : input `cix-search-input` (height 56px, border-radius 10px) dans le hero, placeholder éditorial, icône `Search` droite, focus → border #222222.

**Suggestions** : 5 chips `cix-suggestion-chip` (Notion vs Airtable / ChatGPT vs Claude / Zapier vs Make / Figma vs Canva / Linear vs Jira) — navigate vers page comparatif.

**Filtres catégories** : `cix-filter-row` avec 5 `gi-filter-pill` (Tous / IA / Productivité / Design / Automatisation / CRM). Détection catégorie par pattern slugPair via `getSlugCategory()`.

**Grid** : `cix-grid` 2 colonnes desktop / 1 colonne mobile, gap 20px.

**Card** `cix-card` (border `#CFCFC8`, hover `#222222` + translateY(-1px)) :
- Label catégorie uppercase
- VS block : logos ronds 32px + noms tools
- Titre `font-brand clamp(1.375rem→1.75rem)`
- Description dérivée de `verdict.keepIf` ou `shortDescription`
- Ligne prix
- CTA "Lire le comparatif →" avec arrow transition

**Comparateur custom** conservé, restyled avec classes `cix-comparator-*` (sans Tailwind).

**Empty states** : sur search vide + filtres vides → bouton reset.

---

## 2026-05-15 — Sprint Comparatif v2 : renforcement affordance de comparaison

**Fichiers modifiés**
- `src/pages/ComparePage.tsx` — extension interface + 3 nouvelles sections + subnav mis à jour
- `src/index.css` — ajout `cp-overview-*`, `cp-pros-cons-*`, `cp-decision-*` (~130 lignes)

**Nouvelles sections**
1. **"Ce que fait chaque outil"** (`id="outils"`) — 2 cards symétriques (`cp-overview-grid`) : description courte + liste de cas d'usage pour chaque outil, avant le tableau comparatif
2. **"Avantages et limites"** (`id="avantages"`) — remplace l'ancienne section "Limites" isolée ; chaque outil affiche maintenant Avantages (`+` vert) + Limites (`—` gris) en 2 colonnes
3. **"Ce qui doit te faire choisir"** — liste de `CompareDecisionRow` (contexte → outil recommandé)

**Interface `CompareEditorialContent` étendue**
```typescript
toolADesc / toolADescEn
toolAUseCases[] / toolAUseCasesEn[]
toolBDesc / toolBDescEn
toolBUseCases[] / toolBUseCasesEn[]
prosA[] / prosAEn[]     // avantages outil A
prosB[] / prosBEn[]     // avantages outil B
decisionRows: CompareDecisionRow[]   // context + choice
```

**Subnav** : 7 ancres (Verdict / Ce que font les outils / Comparaison / Avantages / Profils / Prix / FAQ)

**Labels verdict** : "Prends {toolA} si…" / "Prends {toolB} si…" / "Évite les deux si…" (plus explicites)

**`buildFallbackContent`** mis à jour avec les nouveaux champs (dérivés des données outil)

---

## 2026-05-15 — Sprint Stack Detail : refonte StackDetailPage en page de décision éditoriale

**Fichiers modifiés**
- `src/pages/StackDetailPage.tsx` — réécriture complète (~1230 lignes)
- `src/index.css` — ajout du système `sd-*` étendu (~297 lignes)

**Architecture**
- Supprimé : bande métriques `sd-summary`, section Avis standalone, ancienne section Pièges
- Ajouté : `StackEditorialContent` interface + `EDITORIAL_REGISTRY` + `buildFallbackEditorial()`
- Ajouté : `PERSONA_LAYERS` — couches thématiques spécifiques par persona (contenu : IA / Idées / Visuels / Vidéo / Publication / Stockage)
- Conservé intact : `ToolPanel` + `Sheet`/`SheetContent`/`SheetClose` (shadcn/ui)

**Interfaces TypeScript**
```typescript
interface StackEditorialContent {
  verdictShort / verdictShortEn
  overviewIntro / overviewIntroEn
  overviewLabels[3] / overviewTexts[3] + EN
  priority: { essential[3], optional[3], challenge[3] } + EN
  budgetRows: StackBudgetRow[3]         // tier / amount / desc
  risks: StackRiskEnhanced[5]           // problem / consequence / reco
  altVariants: StackAltVariant[3]       // label / title / budget / tools / compromise
  faq: StackFaqItem[5]                  // q / a + EN
  expertNote / expertNoteEn
}
```

**Structure de la page (7 nouvelles sections + hero 2-col)**
1. **Hero 2 colonnes** — breadcrumb, eyebrow STACK, H1 `font-brand clamp(3.25rem,6vw,5.5rem)` ls -0.06em, desc 18px / module `sd-snapshot` sticky (logos pastilles 28px, métriques, verdict court)
2. **Subnav sticky** — 6 ancres (Vue d'ensemble / Outils / Budget / Risques / Alternatives / FAQ), underline noir
3. **Vue d'ensemble** — intro 17px + grille 3 colonnes (Elle sert à / Elle évite / Elle n'est pas faite pour) + note expert fond #EDEDE8
4. **Outils** — sections par couche (PERSONA_LAYERS ou STACK_LAYERS), bouton "Voir le détail" → ToolPanel
5. **Priorités** — `sd-priority-grid` 3 colonnes, border-top colorée (vert/gris/rouge), items avec dashes
6. **Budget** — `sd-budget-list` 3 lignes (Minimal / Recommandé / À surveiller), grille 180px + 110px + 1fr
7. **Risques** — `sd-risk-enhanced-row` 3 colonnes (Problème / Conséquence / Recommandation)
8. **Alternatives** — `sd-alt-grid` 3 cards (Minimale / Recommandée / Intensive)
9. **CTA band** — fond `#EDEDE8`, `sd-cta-inner` wrapper (max 1280px)
10. **FAQ** — `sd-faq-list` avec `<details>/<summary>` natif + ChevronDown rotatif

**Contenu éditorial createur-contenu-operateur**
Stack `createur-contenu-operateur` : 8 outils (ChatGPT/Notion/Canva/Tally/Beehiiv/Buffer/Descript/Google Drive), 5 risques, 3 variantes alternatives, 5 FAQ.

---

## 2026-05-15 — Sprint Comparatif : refonte /fr/comparatif/:pair en page de décision éditoriale

**Fichiers modifiés**
- `src/pages/ComparePage.tsx` — réécriture complète
- `src/index.css` — ajout du système `cp-*` (~300 lignes)

**Architecture**
- Supprimé : `PageHero`, `CompareSidebar`, `CompareVerdictCards`, `CompareStrengthBars`, `FeatureDiff`, `ProsConsSection`, `QuickVerdict`, `ToolFaceCard`, `PricingSection` (tous à fond bleu)
- Ajouté : contenu éditorial hardcodé `NOTION_VS_AIRTABLE` + registre `EDITORIAL_CONTENT` + fallback générique `buildFallbackContent()`

**Structure de la page (13 sections)**
1. **Hero 2 colonnes** — breadcrumb, eyebrow COMPARATIF, H1 `font-brand clamp(4rem,7vw,7rem)` ls -0.06em, phrase de cadrage 21px, verdict court 18px / module `cp-vs-module` sticky (logos, séparateur VS, verdict rapide)
2. **Subnav sticky** — 6 ancres (Verdict / Comparaison / Profils / Prix / Alternatives / FAQ), underline noir, zéro bleu
3. **Verdict rapide** — `cp-verdict-grid` 3 colonnes (Notion gagne si / Airtable gagne si / À éviter si)
4. **Tableau comparatif** — `cp-table` 10 lignes × 4 colonnes (Critère / Notion / Airtable / Verdict), responsive `data-label`
5. **Profils** — `cp-profile-grid` 6 cartes (persona + recommendation + cas d'usage)
6. **Prix** — 2 `cp-price-row` + bloc recommandation ToolTrim
7. **Limites** — `cp-limits-grid` 2 colonnes avec dashes `::before "—"`
8. **Alternatives** — 5 `cp-alt-row` (lien `/tool/` si outil en DB, sinon `<div>`)
9. **CTA band** — fond `#EDEDE8`, bouton noir `<Link>`
10. **FAQ** — 5 `FaqItem` avec `<details>/<summary>` + chevron rotatif

**Composants internes**
- `PricingNote` — rend le `**texte**` en `<strong>` via regex
- `FaqItem` — `<details>/<summary>` avec `useState` pour la rotation du chevron

**Règle éditoriale**
- Zéro couleur bleue (`hsl(var(--primary))`)
- Fond du module VS : `#FFFFFF`, bordure `#DADAD4`
- CTA band : `#EDEDE8` (pas `#F8F8F4`)

---

## 2026-05-15 — Sprint 5b : refonte StacksPage + StackDetailPage

**Fichiers modifiés**
- `src/pages/StacksPage.tsx` — réécriture complète
- `src/pages/StackDetailPage.tsx` — réécriture complète
- `src/index.css` — ajout des systèmes `sk-*` et `sd-*`

### StacksPage — système `sk-*`

**Supprimé** : `EditorialHero`, filtres à checkboxes avec `facetCounts`, `STACK_FILTER_GROUPS`, `STACK_BUDGET_FILTERS`, `selectedFilters` complexe

**Ajouté**
- Hero inline `eh-*` — H1 `clamp(3.5rem, 6vw, 6rem)` ls -0.055em lh 0.98
- Section "Commencer par ton profil" — `sk-profiles-grid` avec 6 `Link` cards (persona → stack recommandée)
- Filtres 7 pills (`gi-filter-pill` / `gi-filter-pill--active`) : Tous / Création / Business / Tech / Ops / Budget léger / IA
- Cards inline `sk-card` : tool logo pastilles (cercles 28px, stack -6px) + risk snippet + budget + badge persona
- `stackMatchesFilter()` — filtre par persona et critères (budget ≤ 50€, slugs IA)

### StackDetailPage — système `sd-*`

**Supprimé** : `Button` import, `ArrowRight` icon, sticky nav en onglets bleus

**Conservé intégralement** : `Sheet` / `SheetContent` / `SheetClose` / `ToolPanel` (inchangé)

**Ajouté**
- Hero `sd-container` — tags persona/stage, H1 `clamp(3.5rem, 7vw, 7rem)` ls -0.06em lh 0.94, bouton noir `<Link>` inline
- `sd-nav` sticky `top: var(--navbar-h, 68px)` — liens `sd-nav-link` (hover noir, zéro bleu)
- `sd-summary` — 4 `sd-metric` : budget / nb outils / étape / risque
- `sd-decision-grid` — verdict 3 colonnes (À copier si / Risque principal / À éviter si)
- `sd-tool-row` — 5 colonnes : logo | nom+rôle | raison | badge statut | flèche
- Badges statut : couleurs inline (vert core / gris conditional / rouge challenge)
- `sd-risk-row` — liste des pièges par outil (section conditionnelle `hasTraps`)
- `sd-cta-band` — titre `font-brand` + bouton noir
- `sd-related-grid` — 3 stacks liées (`sd-related-card`)

**Fix React hooks** : `relatedStacks = useMemo(...)` déplacé avant le `if (!stack) return <Navigate/>` (violations de règles des hooks)

---

## 2026-05-15 — Sprint 4 : Cards / Listings — unification du système de cards

**Fichiers modifiés**
- `src/pages/ToolsPage.tsx` — grille principale migrée vers ToolCardEditorial
- `src/pages/CategoryPage.tsx` — liste migrée vers ToolRowEditorial
- `src/pages/StacksPage.tsx` — cartes migrées vers StackCardEditorial
- `src/index.css` — ajout du système `tcr-*` (ToolRowEditorial)

**Nouveaux composants**
- `src/components/ToolRowEditorial.tsx` — ligne éditoriale horizontale (rank + logo + contenu + score + prix + CTA)
- `src/components/StackCardEditorial.tsx` — carte stack éditoriale (variants `row` + `compact`)

### ToolCardEditorial activé (anciennement orphelin)
`ToolCardEditorial` remplace `ToolCard variant="default"` dans la grille principale de `ToolsPage`.
Score ToolTrim visible sur chaque carte (`prescription_quality` → score numérique affiché).
`ToolCard variant="featured"` conservé pour la section Sélection éditoriale.

### ToolRowEditorial — nouveau système `tcr-*`
Remplace `ToolCard variant="list-row"` dans `CategoryPage`.
Layout horizontal : rang · logo · nom/catégorie/extrait · score /5 · prix · flèche CTA.
Score masqué sur mobile (≤640px) pour économiser la place.
Badge `tcr-pick` inline si `prescription_quality === "ferme"`.

### StackCardEditorial — extraction des cards StacksPage
Deux variants :
- `row` — carte principale de la liste (image 140px + corps + panneau data logo/coût/outils)
- `compact` — carte recommandée par profil (label persona + titre + bestFor)
`StacksPage` conserve toute la logique data (filtres, facettes, query) ; `StackCardEditorial` gère uniquement le rendu.
Import `ArrowRight` et `ToolLogo` supprimés de `StacksPage` (devenus redondants).

---

## 2026-05-15 — Sprint Guides v2 : filtres, tri, logos, section Commencer ici

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx`
- `src/index.css`
- `docs/DESIGN_SYSTEM.md`

### GuidesPage — nouvelles fonctionnalités

**Barre de filtres éditoriaux** (`gi-filter-bar`, `gi-filter-pill`)
7 filtres : Tous · Comparer · Remplacer · Réduire les coûts · Construire une stack · IA · Freelance.
Pills `height: 34px`, `border-radius: 999px`, fond transparent, filtre actif `background: #222222`. Zéro bleu.
Filtre détecté via keywords dans `title + excerpt + tags + category` (fonction `matchesFilter`).

**Tri discret** (`gi-sort-wrapper`, `gi-sort-select`)
3 options : Récents (date desc) · Sélection ToolTrim (ordre data source) · Lecture courte (readTime asc).
Label uppercase `TRIER PAR`, `<select>` sobre, height 34px, flèche custom SVG inline.

**Logos outils cités — pastilles rondes** (`tool-logo-stack`, `tool-logo-pill`)
Utilise `useArticleTools` (hook existant) pour matcher les outils mentionnés dans chaque guide.
Pastilles 32px, chevauchement `margin-left: -6px`, hover `translateY(-1px)`.
Overflow → pastille `+N` (`tool-logo-more`, fond #F8F8F4).
Label `OUTILS CITÉS` 11px uppercase #9A9A92 au-dessus.
Maximum 5 logos par row.

**Rows guides améliorées** — colonne gauche 150px (était 140px), padding 32px (était 28px)
Left meta : type (GUIDE / COMPARATIF / ALTERNATIVE / STACK) + intent (COMPARER / REMPLACER / RÉDUIRE LES COÛTS / STACK) + read time.
Fonctions `getPostType()` + `getPostIntent()` dérivées des tags/category/slug.

**Section "Commencer ici"** (`gi-start-here-grid`, `gi-start-here-item`)
3 colonnes, placée après le featured block.
Chaque item clique sur un filtre et scroll vers #guides.
Angles : Choisir un outil (comparer) · Remplacer (remplacer) · Stack (stack).
Pas de card lourde : `border-top` uniquement, fond transparent.

**Load more** (`gi-load-more`)
Affiche 12 guides max (1 featured + 11 rows). Bouton secondaire sobre.
Reset automatique de la pagination sur changement de filtre ou de tri.

**Hero right module** — synchro avec `activeFilter`.
Les items (Comparatifs, Alternatives, IA, Stacks, Freelance) utilisent désormais les mêmes IDs que la barre de filtres.

### Responsive

- Filtres : scroll horizontal `overflow-x: auto`, `flex-wrap: nowrap`, `≤700px`
- Tri : sous les filtres sur mobile
- "Commencer ici" : 1 colonne `≤768px`
- Rows : 1 colonne `≤700px`

---

## 2026-05-15 — Sprint Grid : Système de grille global

**Fichiers modifiés**
- `src/index.css`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`

### Tokens de layout ajoutés dans `:root`

```css
--layout-max:            1440px;   /* full-width shell */
--layout-content:        1280px;   /* contenu éditorial */
--layout-article:        760px;    /* colonne texte article */
--layout-sidebar:        260px;    /* sidebar TOC article */
--layout-tool-sidebar:   360px;    /* sidebar sticky outil */
--layout-gutter:         48px;     /* desktop */
--layout-gutter-tablet:  32px;
--layout-gutter-mobile:  20px;
```

Overrides responsive dans `@layer base` :
- `@media (max-width: 1023px)` → `--layout-gutter: var(--layout-gutter-tablet)`
- `@media (max-width: 767px)` → `--layout-gutter: var(--layout-gutter-mobile)`

### Classes utilitaires créées dans `@layer components`

| Classe | Usage |
|---|---|
| `.layout-shell` | Conteneur 1440px (hero backgrounds, CTA bands) |
| `.layout-content` | Conteneur 1280px (guides, articles) |
| `.layout-article-grid` | Grille 2-col article (760px + 260px TOC) |
| `.layout-tool-grid` | Grille 2-col outil (1fr + 360px sidebar) |

### Corrections d'alignement

**GuideDetailPage** (problème critique — 80px de décalage à 1300px viewport) :
- `ga-body-grid` : `max-width: 1120px` → `max-width: var(--layout-content)` (1280px)
- `ga-cta-inner` : `max-width: 1120px` → `max-width: var(--layout-content)` (1280px)
- `ga-container` : hardcodé 1280px/48px → `var(--layout-content)` / `var(--layout-gutter)`

**GuidesPage** (décalage hero vs body) :
- `eh-container` : `max-width: 1440px` → `max-width: var(--layout-content)` (1280px)
- `gi-container` : hardcodé 1280px/48px → `var(--layout-content)` / `var(--layout-gutter)`

**ToolDetailPage** :
- `td-container` : hardcodé 1440px/48px/20px → `var(--layout-max)` / `var(--layout-gutter)` / `var(--layout-gutter-mobile)`

### Principe après fix

| Zone | max-width | Source |
|---|---|---|
| Hero fonds (CTA bands, diag) | 1440px | `var(--layout-max)` |
| Contenu éditorial (guides, articles, outils) | 1280px | `var(--layout-content)` |
| Colonnes gauches des articles | 760px | `var(--layout-article)` |
| Sidebar TOC | 260px | `var(--layout-sidebar)` |

---

## 2026-05-15 — Sprint 3 : Refonte éditoriale Guides + Articles

**Fichiers modifiés**
- `src/pages/GuidesPage.tsx`
- `src/pages/GuideDetailPage.tsx`
- `src/index.css`
- `src/data/posts-fr.json`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`

### GuidesPage — améliorations éditoriales

**Hero metadata** : les tags `gi-hero-tag` sont passés de badges avec bordure (`border: 1px solid #DADAD4`, `background: #FFFFFF`) à une rangée de texte brut dot-séparée (`·` en `::before`). Plus léger, plus éditorial.

**Bloc featured** : titre agrandi `clamp(1.75rem, 3vw, 2.75rem)` → `clamp(2rem, 3.5vw, 3rem)`.

**Lignes articles** :
- `gi-row-title` : `clamp(1.5rem, 2.5vw, 2rem)` → `clamp(1.875rem, 3.2vw, 2.625rem)` (30px→42px)
- `gi-row-excerpt` : 15px → 16px, `line-height` 1.5 → 1.45, `max-width` 680→720px, ajout `margin-top: 10px`
- `gi-row-cta` : 14px → 15px, couleur `#9A9A92` → `#222222` (toujours visible, hover opacity)
- `gi-row` padding : 32px → 28px, colonnes `130px` → `140px`

**Correction** : CTA band liait vers `/fr/diagnostic` (route inexistante) → corrigé en `/fr/selector`.

### GuideDetailPage — améliorations éditoriales

**Typographie article** :
- H2 : `clamp(1.875rem, 3vw, 2.625rem)` → `clamp(2.625rem, 4vw, 3.5rem)` (42px→56px)
- H3 : `clamp(1.375rem, 2.2vw, 1.875rem)` → `clamp(1.75rem, 2.5vw, 2.125rem)` (28px→34px), `margin-bottom` 16→18px

**TOC** :
- `ga-toc-col top` : `96px` → `calc(var(--navbar-h, 68px) + 24px)` (utilise la variable canonique)
- `ga-toc-link` : couleur `#9A9A92` → `#6F6F68` (plus visible), taille 13→14px, `margin-bottom` 11→12px
- `ga-toc-nav padding-left` : 18px → 20px

**Encadrés "À retenir"** : le renderer Markdown (`markdownToHtml`) détecte maintenant les blockquotes commençant par `À retenir`, `Key takeaway`, `À noter` ou `Note :` et les transforme en `<div class="ga-takeaway">`. Deux exemples ajoutés dans `posts-fr.json` pour l'article `top-5-competences-ia-freelance-2026`.

**Module outils** : `ToolRow` amélioré — prix v5 utilisé en priorité, badge prix sobre (`border: 1px solid #DADAD4`, `background: #F8F8F4`), usage simplifié.

**Correction** : CTA band liait vers `/fr/diagnostic` → corrigé en `/fr/selector`.

### Hero global (EditorialHero / eh-description)

`eh-description` standardisé : `font-size` 19px fixe (était clamp 17→19px), `line-height` 1.55→1.45, `color` `#4A4A44`→`#6F6F68`, `max-width` 640→680px.

---

## 2026-05-15 — Fix React error #310 — Rules of Hooks violation

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`

### Problème
Trois hooks (`useEffect` redirect + `useRef` × 2 + `useEffect` scroll) étaient déclarés **après** le `if (loading) return` (ligne 170). En React 18 concurrent mode, le nombre de hooks appelés variait selon `loading`, ce qui déclenche l'erreur #310 ("Cannot update a component while rendering a different component").

### Fix
Tous les hooks déplacés avant le premier `return` conditionnel. Les `useRef` et `useEffect` sont maintenant dans le bon ordre : SEO effect → redirect effect → prevSubPageRef → prevSlugRef → scroll effect → puis les `if (loading) return` et `if (!tool) return null`.

---

## 2026-05-15 — Correction footer : suppression bloc marketing global

**Fichiers modifiés**
- `src/components/Footer.tsx`

### Supprimé
Bloc marketing "brand statement" du footer global :
- grand logo picto ToolTrim
- wordmark ToolTrim (clamp 2.8rem → 5rem)
- texte "Votre stack coûte trop cher. On le prouve en 3 minutes."
- bouton bleu "Lancer mon analyse"
- mention "Gratuit · Sans inscription"
- radial glow background

### Conservé
- Colonnes de navigation (Produit / Catégories / Outils / Entreprise / Légal)
- Barre de copyright et liens légaux

### Nettoyage imports
Supprimés de `Footer.tsx` car inutilisés : `useLocation`, `ArrowRight`, `pictoLogo`.
La logique conditionnelle `isToolPage` a également été retirée (plus nécessaire).

---

## 2026-05-15 — Sprint 2 suite : stabilisation tabs page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`

### Problème
Le commit précédent (`0e8c66d`) utilisait `useNavigate` + `preventScrollReset: true` pour
gérer le scroll des tabs. Cette approche causait une React error #310
("Cannot update a component while rendering a different component") en production,
spécifique à l'environnement `BrowserRouter` (non-data router).

### Fix — approche useRef + useEffect
Remplacement complet de `handleTabClick` / `useNavigate` / `useCallback` par :

```tsx
const prevSubPageRef = useRef<string | null>(null);
const prevSlugRef    = useRef<string | null>(null);

useEffect(() => {
  // Skip premier rendu et changement d'outil
  if (prevSubPageRef.current === null || prevSlugRef.current !== slug) {
    prevSubPageRef.current = subPage;
    prevSlugRef.current    = slug ?? null;
    return;
  }
  if (prevSubPageRef.current === subPage) return;
  prevSubPageRef.current = subPage;

  const id = subPage === "presentation" ? "analyse" : subPage;
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 92, behavior: "smooth" });
}, [subPage, slug]);
```

- `<Link>` gère la navigation normalement (URL + SEO préservés)
- L'`useEffect` détecte le changement de `subPage` et scrolle
- L'offset `92px` = navbar 68px + marge de confort
- Les sections ont `id="analyse|prix|alternatives|avis|faq"` + `scroll-margin-top` CSS

### Nettoyage imports
Supprimés : `useNavigate`, `useCallback`, `ToolVerdictBlock` (orphelin), `TrendingDown`, `Sparkles`, `ShieldCheck`.

---

## 2026-05-15 — Sprint 2 correction : Suppression CTA dupliqués

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/Footer.tsx`
- `docs/DESIGN_SYSTEM.md`

### Problème
Sur les pages outils, 3 blocs CTA s'empilaient en bas de page :
1. `td-diag-band` — "[outil] fait partie de ta stack ?" (contextuel)
2. `td-footer-cta` — "Une stack plus claire. Moins d'abonnements inutiles." (global)
3. Footer brand statement — logo picto + "Votre stack coûte trop cher. On le prouve en 3 minutes." + bouton bleu

### Fix

**`ToolDetailPage.tsx`** — suppression complète de la section `td-footer-cta` (CTA global inline). Ne reste que `td-diag-band` (CTA contextuel outil).

**`Footer.tsx`** — ajout de `useLocation()` et de la variable `isToolPage` (regex `/\/tool\/[^/]+/`). Le bloc brand statement est conditionnel : `{!isToolPage && (...)}`. Il reste visible sur toutes les autres pages (home, tools, guides, catégories, comparatifs…).

**`DESIGN_SYSTEM.md`** — ajout de la règle "Une seule conversion par page outil" avec table de référence et justification.

---

## 2026-05-15 — Sprint 2 : Refonte template page outil

**Fichiers modifiés**
- `src/pages/ToolDetailPage.tsx`
- `src/components/tool/StickyDecisionCard.tsx`
- `src/index.css`

### 1. H1 conditionnel — noms courts (≤ 5 caractères)

**Problème :** Pour les outils à noms courts (Box, Slack, Zoom…), le H1 en `clamp(4.5rem, 8vw, 7.75rem)` atteignait 124px — disproportionné visuellement.

**Fix :** Condition inline dans `ToolDetailPage.tsx` :
- `tool.name.length <= 5` → `clamp(4.5rem, 8vw, 6.5rem)` (max 104px)
- Sinon → `clamp(4.5rem, 8vw, 7.75rem)` (max 124px, inchangé)

Pages prioritaires vérifiées : `/fr/tool/box` (3 chars ✓) · `/fr/tool/framer` (6 chars → max normal ✓)

### 2. Sidebar sticky top — ajustement offset

**Avant :** `top: calc(var(--header-height) + 24px)` (92px total)
**Après :** `top: calc(var(--navbar-h, 68px) + 20px)` (88px total)

- Utilise la variable canonique `--navbar-h` avec fallback `68px`
- Réduit l'offset de 24px → 20px conformément au spec Sprint 2
- Modifié dans `.td-sidebar-desktop` (index.css)

### 3. Label "Prix à partir de" dans StickyDecisionCard

**Avant :** La ligne de fait affichait toujours `Prix` comme label.
**Après :** Si `displayPrice > 0`, le label devient `Prix à partir de` / `From`. Sinon reste `Prix` / `Price`.

Logique dans `metaRows` de `StickyDecisionCard.tsx`.

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

---

## 2026-05-16 — Sprint 8 : Ticker logos obligatoire + header actions clarifié

### Objectif
Réconcilier le ticker Awwwards avec la valeur produit ToolTrim : chaque décision doit rester fine, mais toujours montrer les logos des outils concernés.

### Fichiers modifiés
- `src/components/home/TickerBar.tsx` — ticker court avec logos obligatoires et fallback lettre.
- `src/components/home/StatsSection.tsx` — header de section remplacé par “Trois façons de décider”.
- `src/index.css` — classes `home-decision-ticker*` et `ticker-*`, hauteur 44px, séparateurs visibles.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Détails
- Items courts : Loom, Slack Pro, Zoom + Teams, Zapier, HubSpot → Brevo, Figma + Sketch, Harvest + Pennylane, Coda + Notion.
- Logos en pills 26px, image max 17px, fallback initiale.
- Séparation principale via `border-right: 1px solid #DADAD4`.
- Motion respectueuse de `prefers-reduced-motion`.

---

## 2026-05-16 — Sprint 9 : Section position et tri

### Objectif
Renforcer la section "Pas un annuaire" pour en faire un vrai bloc de positionnement et de décision ToolTrim.

### Fichiers modifiés
- `src/components/home/DiffTable.tsx` — remplacement de la table comparative par un module Garder / Couper / Remplacer.
- `src/index.css` — styles `home-position-*` et `home-decision-*`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Détails
- Nouveau titre : "Pas un annuaire. Un outil de tri."
- Layout desktop 2 colonnes : position à gauche, intro + module de décision à droite.
- Fond #EDEDE8, bordures simples, aucune carte blanche, icône ou gradient.

---

## 2026-05-16 — Sprint 9b : ManifestoSection réellement rendu

### Correction
Le rendu visible de la home utilisait encore un `ManifestoSection` hardcodé dans `src/pages/HomePage.tsx`, placé avant `DiffTable`. La tentative précédente avait modernisé `DiffTable`, mais pas ce bloc rendu en priorité.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — remplacement du JSX `ManifestoSection` par le nouveau module de tri.
- `src/index.css` — styles appliqués aux classes réellement rendues.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Ancien titre supprimé du composant rendu.
- Anciennes lignes "Quel outil garder / couper / remplacer" supprimées.
- Nouveau module `+ GARDER / – COUPER / → REMPLACER` rendu dans la section.

---

## 2026-05-16 — Sprint 10 : Diagramme de décision home

### Objectif
Ajouter du rythme visuel dans la section de positionnement sans illustration générique : montrer comment ToolTrim transforme une stack brute en décisions concrètes.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout du module `EXEMPLE DE TRI` dans `ManifestoSection`, avec logos et fallback initiale.
- `src/index.css` — styles du module `home-stack-*`, connecteur et lignes de décision responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Une stack brute Notion / Trello / ClickUp / Zapier / Loom / Canva est triée visuellement.
- Les décisions affichées sont `À garder`, `À couper`, `À remplacer` et `À challenger`.
- Les logos gardent leurs couleurs natives ; aucune image statique ou décoration gratuite ajoutée.

---

## 2026-05-16 — Sprint 11 : Section éditoriale + cloud de logos

### Objectif
Remplacer le bloc de positionnement trop explicatif par une section plus premium : moins de texte, une idée plus nette, et un cloud de logos animé qui montre le bruit créé par l'accumulation d'outils.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — reconstruction de `ManifestoSection` avec copy courte et cloud animé.
- `src/index.css` — styles `home-noise-*` et `home-logo-cloud-*`, animation douce et reduced motion.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Anciennes rows `Garder / Couper / Remplacer` supprimées de la section.
- Nouveau titre : `Trop d'outils. Pas assez de décisions.`
- Cloud de 16 logos colorés avec labels discrets `À garder`, `À couper`, `À remplacer`.
