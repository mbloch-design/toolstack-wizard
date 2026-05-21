# ToolTrim — Design System

Référence du système de design éditorial. Mis à jour au fil des sessions.

---

## ToolLogo — composant unique pour les logos outils

**Règle absolue** : tout affichage d'un logo outil doit passer par `<ToolLogo tool={...} size={N} />`.
Aucun `<img>` direct, aucun composant local, aucun carré vide sans fallback.

### Ordre de résolution
1. `tool.logo` si URL HTTP présente
2. SimpleIcons (map manuelle `SIMPLE_ICON_SLUGS` → CDN `cdn.simpleicons.org`)
3. Probe automatique SimpleIcons via slug normalisé
4. Google Favicon V2 (`t3.gstatic.com/faviconV2`)
5. DuckDuckGo favicon (`icons.duckduckgo.com`)
6. **Fallback initial** — première lettre du nom en majuscule, fond `bg-secondary`

### Tailles standard

| Classe CSS | `size` prop | Usage |
|---|---|---|
| `.tt-tool-logo-sm` | `size={28}` | Ticker, mentions inline, recap strip |
| `.tt-tool-logo-md` | `size={40}` | Cards, tables, sidebar |
| `.tt-tool-logo-lg` | `size={52}` | Hero sections, stack tool cards |
| `.tt-tool-logo-xl` | `size={64}` | Compare duel, tool detail hero |

### Usage
```tsx
<ToolLogo tool={tool} size={40} />
// Pour un outil sans objet complet (nom + slug uniquement) :
<ToolLogo tool={{ name: "Slack", slug: "slack" }} size={28} />
```

### Interdit
- `<img src={logoUrl} />` sans gestion d'erreur complète
- `onError={(e) => { e.target.style.display = "none" }}` → crée un carré vide
- Composant local qui duplique la logique de ToolLogo
- Carré placeholder sans initiale de fallback

### Exceptions homepage (ne pas modifier)
- `HeroSection.tsx` → `AuditToolLogo` (données pré-hardcodées, domaine uniquement)
- `TickerBar.tsx` → override `logoOverride` pour effet visuel animé
- `HomePage.tsx` → inline `getToolLogoSources` pour animations personnalisées

---

## Palette

| Token | Valeur | Usage |
|---|---|---|
| `#222222` | Noir principal | Texte, titres, CTA primaire, borders actives |
| `#F8F8F4` | Crème clair | Backgrounds hero, sidebar, sections |
| `#EDEDE8` | Crème medium | Mega-panel, bandes secondaires |
| `#FFFFFF` | Blanc | Cards, inputs |
| `#DADAD4` | Bordure standard | Séparateurs, borders par défaut |
| `#E7E7E0` | Bordure douce | Séparateurs internes (sidebar) |
| `#6F6F68` | Gris métadonnée | Labels, contexte, texte secondaire |
| `#9A9A92` | Gris doux | Placeholders, texte quaternaire |
| `hsl(var(--primary))` | Bleu ToolTrim | **Usage très limité** — liens actifs, focus ring, rare accent |

**Règle bleue :** Le bleu ToolTrim ne doit pas apparaître sur des boutons CTA principaux de pages outils. Il est réservé aux états actifs (tab active, lien actif), au focus ring, et aux labels de score dans la StickyDecisionCard.

---

## Espacement — tokens globaux

Définis dans `:root` (`src/index.css`). **Utiliser uniquement ces valeurs** — jamais de pixel arbitraire.

| Token | Valeur | Usage typique |
|---|---|---|
| `--space-2xs` | `4px` | Micro-gap, icône + texte |
| `--space-xs` | `8px` | Gap interne d'un item, padding compact |
| `--space-sm` | `12px` | Padding dense, gap row |
| `--space-md` | `16px` | Gap entre éléments de même groupe |
| `--space-lg` | `24px` | Séparation entre groupes dans une card |
| `--space-xl` | `32px` | Padding section compact |
| `--space-2xl` | `48px` | Header section → contenu, séparation standard |
| `--space-3xl` | `64px` | Padding section principal (desktop) |
| `--space-4xl` | `96px` | Grandes séparations entre blocs majeurs |

**Règle d'usage :**
- Éléments internes d'un composant : `xs` / `sm` / `md`
- Groupes dans une card : `md` / `lg`
- Header de section → contenu : `2xl`
- Padding de section (desktop) : `3xl`
- Séparation entre sections majeures : `3xl` / `4xl`

---

## Typographie

### Fonts
```css
--font-brand: "Uncut Sans Variable"  /* titres éditoriaux */
--font-ui:    "Inter Tight"           /* UI, corps, labels */
```

### Variables CSS de taille (`--tt-size-*`)

Définis dans `:root` (`src/index.css`). **Source unique de vérité.** Toutes les classes `tt-*`, `cp-*`, `sd-*` doivent référencer ces vars — jamais coder `clamp()` en dur sur une page.

| Variable | Valeur | Niveau |
|---|---|---|
| `--tt-size-hero` | `clamp(64px, 8vw, 124px)` | H1 principal (Compare, ToolDetail) |
| `--tt-size-hero-sub` | `clamp(22px, 2vw, 30px)` | Phrase sous H1 |
| `--tt-size-section-h` | `clamp(44px, 5vw, 76px)` | Titre de section — éditorial large |
| `--tt-size-section-intro` | `clamp(20px, 1.8vw, 26px)` | Intro de section |
| `--tt-size-body-large` | `clamp(18px, 1.5vw, 22px)` | Grand corps / framing |
| `--tt-size-body` | `16px` | Corps standard |
| `--tt-size-kicker` | `11px` | TOUS les kickers / eyebrows |
| `--tt-size-fact` | `clamp(18px, 1.2vw, 22px)` | Valeur données |
| `--tt-size-fact-compact` | `14px` | Valeur cellule compacte |
| `--tt-size-card-title` | `15px` | Titre card / row |
| `--tt-size-card-body` | `14px` | Corps card / note secondaire |
| `--tt-size-metric` | `clamp(24px, 1.8vw, 32px)` | KPI numérique |
| `--tt-size-cta-h` | `clamp(28px, 4vw, 56px)` | Titre de bande CTA |

**Variables de spacing :**

| Variable | Valeur | Usage |
|---|---|---|
| `--tt-section-y` | `clamp(80px, 9vw, 140px)` | Padding vertical de section |
| `--tt-hero-pt` | `72px` | Padding-top du hero |
| `--tt-hero-pb` | `64px` | Padding-bottom du hero |

**Variables de radius :**

| Variable | Valeur |
|---|---|
| `--tt-radius-sm` | `12px` |
| `--tt-radius-md` | `18px` |
| `--tt-radius-lg` | `24px` |
| `--tt-radius-xl` | `32px` |

---

### Échelle canonique ToolTrim (`tt-*` classes)

**Règle anti-exception :** Toutes les classes utilisent `var(--tt-size-*)`. Changer une variable `--tt-size-*` dans `:root` propage le changement partout. Ne jamais coder une taille en dur dans une classe `tt-*`, `cp-*`, ou `sd-*` couverte par les tokens.

| Classe | Token | Weight | LS | LH | Usage |
|---|---|---|---|---|---|
| `.tt-hero-title` | `--tt-size-hero` | 700 | -0.07em | 0.92 | H1 pages principales |
| `.tt-hero-subtitle` | `--tt-size-hero-sub` | 400 | -0.035em | 1.28 | Phrase sous H1 |
| `.tt-kicker` | `--tt-size-kicker` | 700 | +0.08em | 1 | Eyebrows, kickers, labels uppercase |
| `.tt-section-title` | `--tt-size-section-h` | 700 | -0.06em | 0.95 | Titres de sections |
| `.tt-section-intro` | `--tt-size-section-intro` | 400 | -0.035em | 1.32 | Intros de section |
| `.tt-body` | `--tt-size-body` | 400 | — | 1.5 | Corps standard |
| `.tt-body-large` | `--tt-size-body-large` | 400 | -0.02em | 1.42 | Grand corps, framing |
| `.tt-fact-label` | `10px` (fixe) | 700 | +0.08em | 1 | Micro-label uppercase (10px) |
| `.tt-fact-value` | `--tt-size-fact` | 600 | -0.03em | 1.18 | Valeur bloc de données |
| `.tt-fact-value-compact` | `--tt-size-fact-compact` | 600 | -0.015em | 1.38 | Valeur cellule compacte |
| `.tt-card-title` | `--tt-size-card-title` | 600 | -0.02em | 1.3 | Titre card |
| `.tt-card-body` | `--tt-size-card-body` | 400 | -0.01em | 1.45 | Corps card |
| `.tt-metric-value` | `--tt-size-metric` | 700 | -0.045em | 1 | KPI / métrique |
| `.tt-cta-title` | `--tt-size-cta-h` | 600 | -0.055em | 0.98 | Titre de bande CTA |

**Nouvelles classes — table et statement :**

| Classe | Token | Usage |
|---|---|---|
| `.tt-table-head-cell` | `10px` | Header colonne de table |
| `.tt-table-criterion` | `--tt-size-fact-compact` | Colonne critère |
| `.tt-table-value` | `17px` | Valeur principale (outil) dans table |
| `.tt-table-note` | `--tt-size-card-body` | Note secondaire dans cellule |
| `.tt-table-decision` | `16px` | Colonne décision ToolTrim |
| `.tt-statement-label` | `10px` | Label du bloc statement |
| `.tt-statement-text` | `--tt-size-body-large` | Texte du bloc statement |

**Classes de layout :**

| Classe | Équivalent | Usage |
|---|---|---|
| `.tt-container` | `.cp-container` | Conteneur éditorial max-width 1280px |
| `.tt-hero` | `.cp-hero` structure | Bande hero avec bg et border-bottom |
| `.tt-section` | `.cp-section` | Section avec padding `--tt-section-y` |
| `.tt-section--last` | — | Supprime border-bottom |
| `.tt-section-header` | — | Bloc kicker + titre + intro |
| `.tt-section-grid` | `.cp-section-grid` | Grille 2 colonnes heading/content |
| `.tt-content-narrow` | — | Contrainte de largeur 760px |
| `.tt-content-wide` | — | Contrainte de largeur 980px |

**Interdiction :** définir un `font-size` custom sur une page si `tt-*` ou `--tt-size-*` couvre déjà ce cas d'usage.

### Ajustement comparatif — hiérarchie compacte

Les pages Comparatif utilisent `.cp-title` comme titre de section, mais ce niveau doit rester nettement inférieur au H1 hero.

- H1 comparatif : `--tt-size-hero`, conservé comme signal principal.
- H2 comparatif `.cp-title` : `clamp(32px, 3vw, 36px)`, weight 700.
- Titres de critères / cartes : `18–20px`.
- Corps de cards et cellules : `14px`.

Ne pas remonter les H2 comparatif au niveau `--tt-size-section-h` sans revoir toute la hiérarchie hero.

### Hiérarchie éditoriale (référence pages Stack)

| Rôle | Font | Size | Weight | LS | LH |
|---|---|---|---|---|---|
| Hero H1 (stack) | brand | `clamp(56px, 6vw, 104px)` | 600 | -0.065em | 0.92 |
| Hero H1 (comparatif) | brand | `clamp(64px, 8vw, 124px)` | 700 | -0.07em | 0.92 |
| Hero subtitle | ui | `clamp(22px, 2vw, 30px)` | 400 | -0.03em | 1.32 |
| Section kicker | ui | `11px` | 700 | +0.08em | 1 |
| Section title | brand | `clamp(44px, 5vw, 76px)` | 700 | -0.06em | 0.95 |
| Section framing | ui | `clamp(20px, 1.8vw, 26px)` | 400 | -0.03em | 1.32 |
| Body | ui | `16px` | 400 | — | 1.5 |
| Fact label | ui | `10px` | 700 | +0.08em | 1 |
| Eyebrow | ui | `11px` | 600 | +0.08em | 1 |

---


## Pattern fiche stack — Hero premium fact sheet

Le hero est un bloc éditorial suivi d'une table signalétique. Il répond en 5 secondes. Chaque information n'apparaît qu'une seule fois.

### Structure obligatoire
1. **Bloc éditorial** (pleine largeur) — breadcrumb · eyebrow persona · H1 · promesse
2. **Table signalétique** (`.sd-hero-fact-table`) — une rangée horizontale de 6 colonnes : PROFIL · BUDGET · OUTILS · NIVEAU · WORKFLOW · POINT D'ATTENTION

### Règles absolues
- **Zéro CTA dans le hero** : pas de bouton "Analyser ma stack" ni de lien de conversion dans la zone hero. Le CTA vit dans le `sd-cta-band` après les sections.
- **Zéro panneau droit** : il ne doit pas exister de `.sd-snapshot` ou panneau "EN UN COUP D'ŒIL" — ces données sont dans la table.
- **Zéro duplication** : une info dans la table n'est jamais reformulée ailleurs dans le hero.
- **Zéro grille 2×3 administrative** (`.sd-reperes-grid` remplacée par `.sd-hero-fact-table`).
- **Non-redondance absolue** : budget → table uniquement · outils → table uniquement · niveau → table uniquement · point d'attention → table uniquement · workflow → table uniquement · promesse → sous le titre uniquement.
- H1 (`.sd-hero-h1`) : `clamp(3.25rem, 5.5vw, 4.5rem)`, font-weight `700`, line-height `0.92`, letter-spacing `-0.065em`.
- Promesse (`.sd-hero-desc`) : `clamp(1.0625rem, 1.4vw, 1.3125rem)`, line-height `1.5`, max-width `640px`, 1–2 lignes max.
- Table : fond `#FAFAF7`, bordure `#DADAD4`, radius 16px, labels `10px/600 uppercase #555550`, cell padding `22px 24px`.
- **Grille pondérée — 6 colonnes uniquement à ≥1440px** : `minmax(240px,1.2fr)` PROFIL · `minmax(150px,0.65fr)` BUDGET · `minmax(90px,0.42fr)` OUTILS · `minmax(150px,0.65fr)` NIVEAU (min 150px pour "Intermédiaire") · `minmax(300px,1.45fr)` WORKFLOW · `minmax(260px,1.2fr)` POINT D'ATTENTION.
- **`min-width: 0` obligatoire sur `.sd-fact-col`** : sans cette propriété, un contenu plus large que l'espace alloué force la colonne à s'élargir (grid blowout). C'est le correctif le plus critique pour les dépassements de contenu.
- **Zéro troncature sur les valeurs** : aucun `text-overflow: ellipsis`, `white-space: nowrap` ni `-webkit-line-clamp` sur les cellules de valeur. Toutes les surcharges doivent utiliser `!important` pour écraser les sprints précédents.
- **Échelle typographique — trois familles :**
  - **Métrique** (`.sd-fact-col--compact` — BUDGET, OUTILS) : valeur `clamp(1.375rem, 1.8vw, 2rem)` (22–32px), font-weight 700, letter-spacing -0.045em, white-space normal.
  - **Niveau** (`.sd-fact-col--level` — NIVEAU uniquement) : valeur `clamp(1.25rem, 1.35vw, 1.625rem)` (20–26px), font-weight 700, letter-spacing -0.04em, white-space normal. Modificateur propre pour éviter le `white-space: nowrap` des métriques.
  - **Descriptif** (`.sd-fact-col--long` — PROFIL, WORKFLOW, POINT D'ATTENTION) : valeur `clamp(1.0625rem, 1.05vw, 1.25rem)` (17–20px), font-weight 600, letter-spacing -0.025em, overflow-wrap anywhere.
- **Budget : composition montant + unité** — helper `splitBudget()` (propriétés `main`/`unit`) sépare "118€/mois" en :
  - `sd-budget-main` : `clamp(1.375rem, 1.8vw, 2rem)`, 700, letter-spacing -0.05em, #222222
  - `sd-budget-unit` : 14px, 500, #6F6F68
  - Wrapper `sd-budget-composition` : `inline-flex`, align-items baseline, gap 3px, white-space nowrap (les deux fragments sont courts).
  - Ne jamais rendre le budget comme string plate. Ne pas utiliser `text-overflow: ellipsis` sur la valeur budget.
- **Label RISQUE → POINT D'ATTENTION** (FR) / RISK → KEY RISK (EN). Les deux anciens labels ne doivent plus apparaître.
- **Règle éditoriale table** : max 7 mots par cellule valeur. Les colonnes longues utilisent la notation flèches (ex. `Brief → plans → chantier`). Aucune phrase complète dans la table. NIVEAU : valeurs courtes max 12 caractères (Installé, Avancé, Débutant, Intermédiaire).
- **Fallback dynamique** : les valeurs PROFIL, WORKFLOW, POINT D'ATTENTION des stacks sans données éditoriales dédiées sont tronquées à 40 caractères avec `truncate()`.
- **Responsive** : 6 col ≥1440px → 3×2 col 769–1439px → 2 col ≤768px (radius 14px) → 1 col ≤480px (radius 12px, pas de scroll horizontal).
- Hero container padding : `96px 0 20px` desktop, `80px 0 16px` tablet, `56px 0 12px` mobile.

### Section Vue d'ensemble
Supprimée. Ne pas créer de section `apercu` ou `overview` entre le hero et les outils.
La navigation d'ancre commence à `Outils`.

---


## Pattern fiche stack — Liste d'outils

La section `OUTILS RECOMMANDÉS` doit lire comme une liste de décisions, pas comme une table technique.

- Titre recommandé : “Chaque outil a un rôle.” avec sous-texte court si la page le permet.
- Légende sous forme de chips texte : `Essentiel`, `Conditionnel`, `À challenger`. Aucun point rouge/vert, pas de statut communiqué uniquement par couleur.
- Catégories : label uppercase à gauche, compteur à droite, bordure basse `1.5px #222222`.
- Ligne desktop : identité outil, raison, prix secondaire, décision + lien. Les colonnes doivent rester compactes sur grand écran.
- Ligne mobile : ordre vertical identité, rôle, raison, prix, décision + lien.
- Éviter les préfixes répétés comme “Rôle :” ou “Pourquoi :” dans chaque ligne.

---


## Marqueurs fiche stack — Rythme éditorial

Les fiches stack utilisent plusieurs marqueurs réutilisables pour éviter l'effet “box on box”.

- `.stack-dotted-divider` / `.sd-dotted-divider` : séparateur pointillé fin pour headers de catégories, matrices et modules denses.
- `.sd-usage-chip` : chip d'usage large, 44px desktop, 38px mobile, utilisée comme carte rapide des usages couverts.
- `.sd-decision-matrix` : matrice en lignes éditoriales, label à gauche, logos/outils et raison à droite.
- `.sd-decision-logo-pill` : logo rond 34px, avec fallback initiales si le logo n'existe pas.
- `.sd-tool-decision-column` : colonne décision dédiée dans les lignes outils, fond `#EDEDE8` translucide, sans code couleur rouge/vert.

Les logos servent de points de données visuels. Le texte de décision reste toujours visible.

---

## Composants CTA

### Boutons globaux — `.tt-button-primary` / `.tt-button-secondary`

**Règle absolue** : ne jamais créer de classe bouton spécifique à une page (`foo-cta-link`, `bar-button`). Utiliser uniquement les classes globales ci-dessous. Ces classes sont définies dans `src/index.css` au bloc `GLOBAL BUTTONS`.

```css
/* Bouton primaire — action principale, fond noir */
.tt-button-primary {
  display: inline-flex; align-items: center; flex-shrink: 0;
  height: 40px; padding: 0 18px;
  background: #222222; border: none; border-radius: 8px;
  font-family: var(--font-ui); font-size: 13px; font-weight: 600;
  color: #FFFFFF; text-decoration: none; white-space: nowrap;
  cursor: pointer; transition: background 0.15s ease;
}
.tt-button-primary:hover { background: #3A3A38; }

/* Bouton secondaire — action de navigation, contour fin */
.tt-button-secondary {
  display: inline-flex; align-items: center; flex-shrink: 0;
  height: 40px; padding: 0 18px;
  background: transparent; border: 1.5px solid #222222; border-radius: 8px;
  font-family: var(--font-ui); font-size: 13px; font-weight: 600;
  color: #222222; text-decoration: none; white-space: nowrap;
  cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
}
.tt-button-secondary:hover { background: #222222; color: #FFFFFF; }
```

**Règle de choix :**
| Contexte | Classe |
|---|---|
| Action qui déclenche l'audit / le sélecteur d'outils | `.tt-button-primary` |
| Lien de navigation, lecture complémentaire | `.tt-button-secondary` |
| Jamais deux boutons primaires dans la même zone | — |

**Ne pas concurrencer "Auditer ma stack"** dans la navigation globale. Un seul CTA noir par vue.

### CTA primaire legacy (black button)
```css
background: #222222;
color: #FFFFFF;
height: 48px;
padding: 0 22px;
border-radius: 8px;
font-size: 15px;
font-weight: 500;
```

Utilisé dans : `StickyDecisionCard` (Visiter le site), `td-diag-band` (Auditer ma stack). Ces composants n'ont pas encore migré vers `.tt-button-primary` (hauteur 48px vs 40px).

### CTA secondaire legacy (ghost button)
```css
background: transparent; color: #222222;
height: 44px; border: 1px solid #DADAD4; border-radius: 8px;
```

Utilisé dans : `StickyDecisionCard` (Comparer les alternatives).

**Pas de bouton bleu sur les pages outils.**

---

## Règle CTA — une seule conversion par page outil

> **Une page outil ne doit pas afficher deux CTA d'audit de stack consécutifs.**

| Contexte | CTA à afficher | CTA à ne pas afficher |
|---|---|---|
| Page outil (`/tool/:slug`) | CTA contextuel outil (`td-diag-band`) | CTA global Footer brand statement |
| Autres pages (home, tools, guides…) | Footer brand statement ("Votre stack coûte trop cher…") | — |

**Implémentation :**
- `ToolDetailPage.tsx` : contient uniquement `td-diag-band` (CTA contextuel). La `td-footer-cta` a été supprimée.
- `Footer.tsx` : le bloc brand statement est conditionnel — masqué si `useLocation()` détecte `/tool/[slug]` (regex : `/\/tool\/[^/]+/`).

**Raison :** les pages outils ont un parcours spécifique (identifier → décider → agir sur l'outil consulté). Un deuxième CTA global brise la cohérence narrative et noie le signal.

---

## Sections

### Section standard (td-section)
```css
padding: 56px 0;
border-bottom: 1px solid #DADAD4;
```
La dernière section supprime le `border-bottom`.

### Bande full-width (td-diag-band)
```css
border-top: 1px solid #DADAD4;
border-bottom: 1px solid #DADAD4;
background: #F8F8F4;
padding: 56px 0;
/* grille interne : 1fr auto, gap 48px */
```

### Footer CTA full-width (td-footer-cta) — DÉPRÉCIÉE sur pages outils

La classe `td-footer-cta` existe dans `index.css` mais n'est plus utilisée dans `ToolDetailPage.tsx`.
Elle a été supprimée pour éviter la duplication avec `td-diag-band`.
Conserver la classe pour un éventuel usage sur d'autres pages.

---

## Onglets (td-tab-nav)

```css
position: sticky;
top: var(--header-height);    /* 68px */
height: 72px;
gap: 40px;                    /* entre items */
border-bottom: 1px solid #DADAD4;
background: #F8F8F4;
```

Tab item actif : underline 2px #222222 en `::after` absolue.

---

## Décision rapide (td-dr-grid)

Grille 3 colonnes dans la section Analyse. Chaque bloc :
```css
border-top: 1px solid #DADAD4;
padding-top: 18px;

.td-dr-label → 11px, 600, uppercase, ls +0.08em, #6F6F68
.td-dr-text  → 17px, lh 1.5, #222222
```

---

## Sidebar sticky (StickyDecisionCard)

Règle : `position: sticky` sur le grid item direct `.td-sidebar-desktop`, pas sur un enfant.

```css
.td-sidebar-desktop {
  position: sticky;
  top: calc(var(--header-height) + 24px);  /* 92px */
  align-self: start;
  height: fit-content;
}
```

Contenu : score 64px → phrase verdict 16px → CTA noir → CTA ghost → 4 facts (Catégorie / Modèle / Plan gratuit / Prix / Vérifié) → alternative recommandée.

---

## Séparateurs — règle globale

- **Une ligne** entre grandes zones (hero→body, band→footer)
- **Pas de ligne** à l'intérieur du hero
- **Pas de ligne** entre chaque micro-info
- Onglets : une ligne basse uniquement
- Sections : `border-bottom` sur chaque `td-section`
- Sidebar : `border-top` entre blocs internes (score, CTAs, facts, alternative)

---

## Guides — index éditorial (gi-*)

### Hero metadata
Tags `gi-hero-tag` : texte brut uppercase 11px, dot-séparés via CSS `::before { content: "·" }`. Pas de bordure ni de fond.

### Filtres éditoriaux (gi-filter-bar)

```css
.gi-filter-pill {
  height: 34px; padding: 0 14px;
  border: 1px solid #DADAD4; border-radius: 999px;
  font-size: 13px; font-weight: 500; color: #222222;
}
.gi-filter-pill--active { background: #222222; color: #FFFFFF; }
```
**Règle :** Zéro bleu. Filtre actif = noir #222222, pas de bleu ToolTrim.

Tri (`gi-sort-select`) : `<select>` sob sobre, `height: 34px`, flèche SVG custom, label uppercase `TRIER PAR`.

### Logos outils cités (tool-logo-stack)

```css
.tool-logo-stack { display: flex; align-items: center; margin-top: 8px; }
.tool-logo-pill { width: 32px; height: 32px; border-radius: 999px; background: #FFFFFF; border: 1px solid #E7E7E0; margin-left: -6px; }
.tool-logo-pill:first-child { margin-left: 0; }
.tool-logo-pill:hover { transform: translateY(-1px); }
.tool-logo-more { background: #F8F8F4; font-size: 11px; font-weight: 600; color: #6F6F68; }
```
Maximum 5 logos, overflow en pastille `+N`. Label `OUTILS CITÉS` 11px uppercase #9A9A92.
**Règle :** Afficher uniquement si l'article mentionne réellement l'outil (via `useArticleTools`).

### Section "Commencer ici" (gi-start-here-grid)

```css
.gi-start-here-grid { grid-template-columns: repeat(3, 1fr); gap: 0; }
.gi-start-here-item { border-top: 1px solid #DADAD4; padding: 24px 28px 24px 0; }
.gi-start-here-item + .gi-start-here-item { padding-left: 28px; border-left: 1px solid #DADAD4; }
```
Fond transparent, pas de card. 3 angles : Choisir · Remplacer · Stack. Chaque item clique sur un filtre.

### Lignes articles (gi-row)
```css
grid-template-columns: 150px minmax(0, 1fr) auto;
gap: 32px;
padding: 32px 0;
border-top: 1px solid #DADAD4;
```
- `gi-row-meta` : left col 150px — type (GUIDE/COMPARATIF/ALTERNATIVE/STACK) + intent + read time
- `gi-row-cat` : 11px, 600, uppercase, `#6F6F68`
- `gi-row-intent` : 10px, 600, uppercase, `#9A9A92`
- `gi-row-title` : `clamp(1.875rem, 3.2vw, 2.625rem)`, 30px→42px
- `gi-row-excerpt` : 16px, `line-height 1.45`, `max-width 720px`
- `gi-row-cta` : 15px, `#222222`, hover opacity 0.55

---

## Articles guides (ga-*)

### Encadrés "À retenir"
```css
.ga-takeaway { background: #EDEDE8; border: 1px solid #DADAD4; border-radius: 10px; padding: 24px 28px; margin: 40px 0; }
.ga-takeaway-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6F6F68; margin-bottom: 12px; }
```
Déclenchement Markdown : `> À retenir : texte…` (ou `Key takeaway`, `À noter`, `Note`).

### TOC sidebar
```css
.ga-toc-col { position: sticky; top: calc(var(--navbar-h, 68px) + 24px); }
.ga-toc-nav { border-left: 1px solid #DADAD4; padding-left: 20px; }
.ga-toc-link { font-size: 14px; color: #6F6F68; }
.ga-toc-link--active { color: #222222; font-weight: 500; }
```

---

## Cards / Listings — système unifié

### ToolCardEditorial (tce-*) — grille outils
Carte éditoriale grid. Utilisée par `ToolsPage` (grille principale).
- `tce-card` — shell blanc, border #DADAD4, hover noir, padding 24px
- Score block (`tce-score-block`) : score numérique 48px + verdict court
- Metadata 3 colonnes : PLAN · MODÈLE · IA
- Badge `tce-pick-badge` : fond #222222, uppercase 10px

### ToolRowEditorial (tcr-*) — liste catégorie
Ligne horizontale éditoriale. Utilisée par `CategoryPage`.
```css
.tcr-list { border-top: 1px solid #DADAD4; }   /* container */
.tcr-row { padding: 18px 10px; border-bottom: 1px solid #DADAD4; }
.tcr-rank { width: 20px; color: #9A9A92; font-variant-numeric: tabular-nums; }
.tcr-logo { width: 40px; height: 40px; border-radius: 8px; }
.tcr-score { font-size: 13px; font-weight: 600; }   /* "4.6 /5" */
.tcr-price { min-width: 64px; text-align: right; }
.tcr-pick { background: #222222; color: #FFFFFF; font-size: 9px; }
```
Mobile ≤640px : rang, score, prix masqués.

### Stack selection cards (`sk-card`) — stacks
La page `/fr/stacks` utilise désormais un système dédié à la sélection contextuelle.

- Shell : `sk-card`, fond blanc, border `#DADAD4`, radius 12px, hover léger.
- Kicker : `STACK · Profil · Sous-profil` en uppercase 10px.
- Métadonnées : budget cible, nombre d'outils, niveau, complexité.
- Décision : `Idéal si` + `À éviter si`, textes courts issus de `bestFor` / `avoidIf`.
- Logos : maximum 5 pills, puis `+N`.
- CTA unique : `Voir la stack →`.

Les filtres associés utilisent `sk-facet-*` et ne doivent pas afficher de compteurs globaux si ceux-ci ne tiennent pas compte des autres facettes actives.

### Composants dépréciés
- `ToolCard variant="default"` → remplacé par `ToolCardEditorial`
- `ToolCard variant="list-row"` → remplacé par `ToolRowEditorial`
- `StackCardEditorial` → supprimé, remplacé par le système `sk-card` contextualisé de `StacksPage`
- `ToolCard variant="featured"` → conservé pour la Sélection éditoriale ToolsPage uniquement

---

## Comparatif (cp-*) — Modèle scalable inspiré G2, angle ToolTrim

### Différence ToolTrim vs G2
- **G2** : marketplace d'avis, scores numériques, comparaison exhaustive, "qui gagne".
- **ToolTrim** : aide à la décision contextuelle — "A est le bon choix dans ce contexte, B devient meilleur quand ce seuil est atteint".
- Pas de score sur 10 inventé. Qualificatifs uniquement : `Avantage`, `Suffisant`, `Dépend`.

### Architecture de sections cible (ordre obligatoire)
| # | Section | ID | Question |
|---|---|---|---|
| 01 | Hero | — | Quels outils et quelle décision rapide ? |
| 02 | En un coup d'œil | `#apercu` | En un coup d'œil, quel outil pour quel contexte ? |
| 03 | Verdict ToolTrim | `#verdict` | Quelle recommandation assume ToolTrim ? |
| 04 | Critères décisionnels | `#criteres` | Sur quels critères A ou B prend l'avantage ? |
| 05 | Coût réel | `#cout` | Quel est le prix affiché et le coût réel ? |
| 06 | Features décisives | `#features` | Quelles fonctions changent vraiment le choix ? |
| 07 | Seuil de bascule | `#seuil` | Quand passer de A à B ? |
| 08 | Points d'attention | `#vigilance` | Où peut-on se tromper ? |
| 09 | Alternatives | `#alternatives` | Conditionnel |
| 10 | FAQ | `#faq` | Conditionnel |

### Structure hero (`cp-hero`) — Sprint 62
```css
.cp-hero { background: #F8F8F4; border-bottom: 1px solid #DADAD4; padding: 72px 0 64px; }
.cp-hero-title { font-size: clamp(72px, 12vw, 170px); font-weight: 700; letter-spacing: -0.075em; line-height: 0.92; }
.cp-hero-promise { font-size: clamp(24px, 2.2vw, 36px); letter-spacing: -0.025em; max-width: 680px; }
.cp-hero-duel { display: grid; grid-template-columns: 1fr 48px 1fr; }
.cp-hero-duel-card { padding: 24px 28px; background: #FFFFFF; border: 1px solid #DADAD4; border-radius: 8px; }
.cp-hero-contract { padding: 20px 0; border-top: 1px solid #DADAD4; border-bottom: 1px solid #DADAD4; }
.cp-hero-microfact { display: grid; grid-template-columns: repeat(3, 1fr); background: #DADAD4; border-radius: 8px; overflow: hidden; }
.cp-hero-microfact-cell { padding: 18px 20px; background: #FFFFFF; }
```
- Rôle : face-à-face de décision — orientation en 5 secondes.
- Structure : breadcrumb → eyebrow → `h1` display → `heroPromise` → duel 2 cartes → Contrat ToolTrim → micro-fiche 3 cellules.
- **Duel** : 2 cartes `cp-hero-duel-card`. Chaque carte affiche `<ToolLogo size={48} />` + position label + nom outil + description. ToolLogo gère le fallback initiales — jamais de carré vide. Badge VS encadré (cercle 28px, fond `#EDEDEA`).
- **Contrat ToolTrim** (`cp-hero-contract`) : statement éditorial entre filets (margin-top 28px), placé **après** les cartes duel. Label "Contrat ToolTrim" (fr) / "ToolTrim contract" (en). Ne pas remettre "Verdict" ici — la section `#verdict` suit.
- **Micro-fiche** (`cp-hero-microfact`) : 3 cellules uniquement — PAR DÉFAUT, COÛT RÉEL, RISQUE. Remplace la fact-sheet 6 faits.
- Nouveaux champs JSON dans `tooltrimAtAGlance` : `heroPromise`, `heroPositionA`, `heroPositionB`, `heroContract`. Tous optionnels — fallback sur valeurs dérivées.
- Pas de CTA dans le hero.

### At a glance (`cp-aglance-*`)
```css
.cp-aglance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #DADAD4; border-radius: 18px; }
.cp-aglance-item { padding: 22px 24px; background: #FFFFFF; }
```
- Première section scrollée : grille signalétique compacte, même style que la fact sheet hero mais dans la page.
- Items : Par défaut, Meilleur pour A, Meilleur pour B, Budget, Niveau, Point d'attention.
- Toujours rendu : dérivé des données existantes, aucun champ optionnel nécessaire.
- Différence avec le hero : situé dans le flux de lecture, avec `verdictShort` comme intro éditorial.

### Sticky nav comparatif (`compare-sticky-nav`)
```css
.compare-sticky-nav { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); }
.compare-sticky-nav--hidden { opacity: 0; pointer-events: none; }
.compare-sticky-nav-item--active { color: #FFFFFF; border-color: rgba(255,255,255,0.80); }
```
- Items : Coup d'œil, Verdict, Critères, Coût, Features, Seuil, Attention, Alternatives, FAQ.
- Affichage conditionnel : Alternatives uniquement si des alternatives existent, FAQ uniquement si des FAQs existent.
- Cachée en haut du hero, active state via IntersectionObserver.

### Table décisionnelle (`cp-table` dans `#features`) — Sprint 64

```css
/* Grille — colonne Décision large, pas compressée */
.cp-table-head, .cp-table-row {
  grid-template-columns: minmax(140px,0.8fr) minmax(220px,1.25fr) minmax(220px,1.25fr) minmax(240px,1.3fr);
}
.cp-table-cell--criterion { font-size: 14px; font-weight: 600; padding-right: 24px; }
.cp-table-tool-title      { font-size: 17px; font-weight: 650; letter-spacing: -0.03em; }
.cp-table-tool-note       { font-size: 14px; font-weight: 400; color: #6F6F68; margin-top: 6px; }
.cp-table-verdict         { border-left: 2px solid #222222; padding-left: 24px; font-size: 16px; font-weight: 600; }
/* Mobile ≤900px : stacked card, labels via ::before, verdict avec border-top accent */
```

**Architecture cellule outil :**
```tsx
<div className="cp-table-cell">
  <p className="cp-table-tool-title">{title}</p>
  {note && <p className="cp-table-tool-note">{note}</p>}
</div>
```

**Format JSON :**
- `toolA` / `toolB` : `string` (flat, rétro-compat) **ou** `{ title: string; note?: string }` (structuré)
- `tooltrimDecision` : phrase de max 2 lignes — jamais un paragraphe
- `showInMainTable: true` pour les lignes à afficher

**Règles de contenu :**
- Max 6 lignes par table (uniquement les critères qui changent vraiment la décision)
- Pas de ligne redondante avec la section Coût
- Pas de ligne redondante avec le Verdict
- Si un critère ne tranche pas entre les deux outils → ne pas l'afficher
- Section conditionnelle : rendue uniquement si `decisionTableRows.length > 0`

### Critères décisionnels (`cp-score-*`)
- ID : `#criteres` (anciennement `#scores`).
- Rôle : montrer où chaque outil prend l'avantage — qualitatif, pas numérique.
- Labels : `Avantage`, `Suffisant`, `Dépend`.
- 4 à 6 critères maximum, uniquement si le critère change vraiment le choix.

### Architecture typographique des sections (`cp-section-grid`)

Chaque section utilise une structure à 2 colonnes sur desktop :
```
cp-container
  span.cp-eyebrow          ← 12px 700 caps, margin-bottom 28px
  div.cp-section-grid      ← grid: minmax(280px, 0.9fr) / minmax(0, 1.6fr), gap 80px
    div.cp-section-heading ← gauche : h2.cp-title (clamp 32–36px, weight 700, tracking -0.06em)
    div.cp-section-body    ← droite : contenu décisionnel
```

Exceptions full-width (Features table, Alternatives, FAQ) : h2.cp-title avec `marginBottom: 28px`.
Mobile (≤1023px) : 1 colonne, gap 32px. Titre mobile autour de `30–36px`.

### Verdict ToolTrim (`#verdict`) — layout 2 cartes + callout (Sprint 72)

**Règle** : le verdict répond à "quel outil choisir selon mon usage réel ?" — pas "quel modèle a le meilleur benchmark ?". Zéro benchmark, zéro nom de modèle technique, zéro répétition du hero.

**Anti-patterns supprimés** : `cp-final-recommendation`, `cp-verdict-grid`, `cp-verdict-statement`, `cp-decision-columns` (3 colonnes compressées), labels rouges "Évite X si…", `compare-verdict-warning` (bandeau plat remplacé par callout encadré).

Structure :
1. `compare-verdict-header` — grid 2 col (0.85fr / 1.4fr) : kicker+titre à gauche, `tt-section-intro` à droite
2. `compare-verdict-choice-grid` — grid 2 col, 1 carte par outil (fond #FFFFFF)
3. `compare-verdict-callout` — encadré pleine largeur, fond #EDEDE8, avec CTA `.tt-button-primary` intégré

Anatomie d'une carte `.compare-verdict-choice` :
- `.compare-verdict-choice-head` — flex row : `ToolLogo` (size=40) + `tt-fact-label` (nom outil)
- `tt-card-title compare-verdict-choice-title` — titre éditorial conditionnel (18px) — ex: "Le choix polyvalent"
- `tt-card-body compare-verdict-choice-body` — 1 phrase décisive (14px, couleur #444440)

Anatomie du callout `.compare-verdict-callout` :
- `tt-fact-label` — "NE PAIE PAS LES DEUX SANS RÈGLE CLAIRE"
- `tt-body-large` — texte anti-doublon (max-width 760px, couleur #444440)
- `.compare-verdict-callout-footer` — flex row : phrase question à gauche, `.tt-button-primary` "Analyser ma stack →" à droite

```css
.compare-verdict-choice-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.compare-verdict-choice { padding: 28px 32px; background: #FFFFFF; border: 1px solid #DADAD4; border-radius: 8px; }
.compare-verdict-choice-body { color: #444440; }
.compare-verdict-callout { padding: 28px 32px; background: #EDEDE8; border: 1px solid #DADAD4; border-radius: 8px; }
.compare-verdict-callout-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #DADAD4;
}
```

**Règle logos** : chaque carte affiche `<ToolLogo tool={tool} size={40} className="compare-verdict-choice-logo" />`. ToolLogo gère le fallback initiales — jamais de carré vide.

**Règle CTA** : bouton `.tt-button-primary` uniquement si le lien mène vers l'audit/sélecteur. Lien `/selector?from={slugPair}` qualifie. Ne pas utiliser `.tt-button-primary` pour un lien de lecture.

Typographie : uniquement tokens globaux. Aucun clamp local. Aucune couleur rouge/alerte dans le verdict.
Mobile ≤900px : header + choice-grid en 1 colonne. Mobile ≤640px : callout footer en colonne, CTA pleine largeur.

**Données JSON** (`tooltrimAtAGlance`) :
- `verdictCardTitleA/B` — titre de la carte (optionnel — h3 masqué si absent)
- `verdictCardTextA/B` — 1 phrase décisive ; fallback → `verdict.chooseAIf[0]`
- `verdictWarning` — texte callout anti-doublon ; fallback → `comparison.avoidBothIf[0]`

### Coût réel (`cp-cost-*`)
- ID : `#cout` — positionné avant Features pour ancrer la réalité budgétaire.
- Compare : plan gratuit, quand payer, coût caché.
- Prix inventés interdits : utiliser `à vérifier`, `selon volume`, `à auditer si`.

### Seuil de bascule (`cp-tipping-*`)
- ID : `#seuil` — positionné après Features.
- Structure : Par défaut + Passe à l'autre si + signaux concrets en liste éditoriale.
- Les signaux longs ne doivent pas être rendus en pills. Utiliser une liste simple avec tiret fin pour les phrases de plus de 5 mots.

### Points de vigilance (`cp-watchout-*`)
- ID : `#vigilance`.
- Chaque point : erreur, conséquence, recommandation ToolTrim.

### Données battle (`src/data/comparison-battles/*.json`)
- 5 comparatifs éditorialisés : chatgpt-vs-claude, figma-vs-canva, make-vs-zapier, notion-vs-airtable, webflow-vs-framer.
- Champs disponibles : `comparison.chooseAIf`, `chooseBIf`, `decisiveCriteria`, `scoreByUseCase`, `tippingPoint`, `costReality`, `pitfalls`, `comparisonRows`, `related`, `faq`.
- `buildBattleEditorialContent()` adapte ces JSON vers le modèle `CompareEditorialContent`.
- Les comparatifs sans données battle utilisent `buildFallbackContent()` depuis les données outil Supabase.

### Fallback rules (obligatoires)
- At a glance : toujours rendu (données derivées de `content`).
- Features : conditionnel si `decisionTableRows.length > 0`.
- FAQ : conditionnel si `content.faq.length > 0`.
- Alternatives : conditionnel si `altTools.length > 0`.
- Ne jamais rendre un titre de section vide. Ne jamais afficher `undefined`.

### Points de vigilance (`cp-watchout-*`)
```css
.cp-watchout-list { border-top: 1px solid #DADAD4; }
.cp-watchout-row { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 20px; }
```
- Rôle : montrer où la mauvaise décision arrive.
- Les pièges doivent être spécifiques au comparatif, pas des conseils génériques sur les SaaS.
- Chaque point riche peut contenir : erreur, conséquence, recommandation ToolTrim.

### Seuil de bascule (`cp-tipping-*`)
- Rôle : montrer quand l'outil recommandé par défaut cesse d'être le meilleur choix.
- Structure : `Par défaut`, `Passe à l'autre si`, puis signaux concrets en chips.
- Ne pas utiliser de seuil chiffré inventé si la donnée n'existe pas.

### Coût réel (`cp-cost-*`)
- Rôle : comparer coût affiché, plan gratuit, moment où payer et coût caché.
- Les prix précis viennent des données disponibles ; sinon utiliser des formules prudentes : `à vérifier`, `selon volume`, `à auditer si`.
- Le coût réel inclut temps de setup, migration, maintenance et formation.

### Lignes alternatives (`cp-alt-row`)
```css
.cp-alt-row { display: flex; align-items: center; gap: 16px;
  padding: 14px 12px; border-top: 1px solid #DADAD4; }
.cp-alt-row:hover { background: #F8F8F4; }
.cp-alt-logo { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #DADAD4; }
.cp-alt-cta  { font-size: 13px; font-weight: 500; color: #222222; }
```

### CTA band (`cp-cta-band`)
```css
.cp-cta-band {
  background: transparent;
  border: 0;
  padding: 0 0 72px;
}
```
- Le CTA Diagnostic vit en clôture de page, après la FAQ.
- Il se rend comme un encadré inline : fond blanc, bordure `#DADAD4`, radius `6px`, padding `24–32px`.
- Ne pas utiliser de bande pleine largeur colorée pour ce CTA sur les pages comparatif.

### FAQ (`cp-faq-item`)
```css
.cp-faq-item    { border-top: 1px solid #DADAD4; }
.cp-faq-summary { font-size: 17px; font-weight: 500; cursor: pointer; padding: 20px 0; }
.cp-faq-answer  { font-size: 16px; color: #6F6F68; padding-bottom: 20px; }
```
Implémentation : `<details>/<summary>` natif + `useState` pour la rotation du chevron.

### Index comparatifs (`cix-card-*`)
- Chaque carte doit donner plus qu'un lien : question centrale, différence utile, meilleur usage, catégorie et CTA.
- `cix-card-question` porte la question qui donne envie de cliquer.
- `cix-card-signal` porte le signal "Meilleur pour" avec une phrase courte.
- Éviter les descriptions longues qui répètent le titre.

### Règle éditoriale comparatif
- **Zéro bleu** sur toute la page (ni boutons, ni hover, ni underline actif)
- Sticky bottom nav : capsule sombre, onglet actif bordé clair.
- Boutons CTA : fond `#222222`, couleur `#FFFFFF`
- Hero : fact sheet premium, pas de panneau droit ni CTA.
- CTA band : fond `#EDEDE8` (crème medium, pas crème clair)
- Structure recommandée : hero décision → verdict → critères décisifs → table utile → cas d'usage → seuil de bascule → coût réel → pièges → alternatives → FAQ.
- Ne pas recréer des couches séparées `ce que fait chaque outil`, `avantages/limites`, `profils` si elles répètent verdict, table ou cas d'usage.

---

## Stacks index (sk-*)

### Hero inline
Utilise les classes `eh-*` existantes. H1 : `clamp(3.5rem, 6vw, 6rem)` ls -0.055em lh 0.98.

### Grille profils (`sk-profiles-grid`)
```css
.sk-profiles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
/* ≤767px → 2 colonnes ; ≤480px → 1 colonne */
.sk-profile-card { border: 1px solid #DADAD4; border-radius: 10px; padding: 18px 20px; }
.sk-profile-card:hover { border-color: #222222; }
```

### Cards de stack (`sk-card`)
```css
.sk-card { border-top: 1px solid #DADAD4; padding: 24px 0; }
.sk-card-persona  { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6F6F68; }
.sk-card-title    { font-size: clamp(1.5rem, 2.5vw, 2rem); font-weight: 600; }
.sk-card-for      { font-size: 15px; color: #6F6F68; }
.sk-card-risk     { font-size: 14px; color: #9A9A92; border-top: 1px solid #E7E7E0; }
```

### Pastilles logos outils
Cercles 28px, fond `#FFFFFF`, bordure `1px solid #E7E7E0`, `margin-left: -6px` (stack). Max 5, overflow `+N` en fond `#F8F8F4`.

---

## Stack detail (sd-*)

### Hero 2 colonnes (`sd-hero-grid`)
```css
.sd-hero-section { background: #F8F8F4; border-bottom: 1px solid #DADAD4; padding: 48px 0 52px; }
.sd-hero-grid { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
/* ≤900px → 1 colonne */
.sd-hero-h1 { font-family: var(--font-brand); font-size: clamp(3.25rem, 6vw, 5.5rem);
  font-weight: 600; letter-spacing: -0.06em; line-height: 0.94; color: #222222; }
.sd-hero-desc  { font-size: 18px; color: #6F6F68; line-height: 1.55; }
.sd-hero-verdict { font-size: 15px; color: #222222; line-height: 1.5; }
```

### Snapshot module sticky (`sd-snapshot`)
```css
.sd-snapshot { position: sticky; top: calc(var(--navbar-h, 68px) + 24px);
  background: #FFFFFF; border: 1px solid #DADAD4; border-radius: 10px;
  padding: 24px; height: fit-content; }
.sd-snapshot-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.sd-snapshot-item  { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0; }
.sd-snapshot-label { font-size: 13px; color: #6F6F68; }
.sd-snapshot-value { font-size: 14px; font-weight: 500; color: #222222; }
.sd-snapshot-divider { height: 1px; background: #DADAD4; margin: 12px 0; }
```

### Logo pastilles dans snapshot (`sd-logo-stack`)
```css
.sd-logo-stack { display: flex; align-items: center; }
.sd-logo-pill  { width: 28px; height: 28px; border-radius: 999px;
  background: #FFFFFF; border: 1px solid #E7E7E0; margin-left: -6px; }
.sd-logo-pill:first-child { margin-left: 0; }
.sd-logo-more  { background: #F8F8F4; font-size: 10px; font-weight: 600; color: #6F6F68; }
```

### Subnav sticky (`sd-nav`)
```css
.sd-nav { position: sticky; top: var(--navbar-h, 68px);
  border-bottom: 1px solid #DADAD4; background: #F8F8F4; height: 56px; }
.sd-nav-link { font-size: 14px; font-weight: 500; color: #6F6F68; }
.sd-nav-link:hover,
.sd-nav-link.active { color: #222222; border-bottom: 2px solid #222222; }
/* Zéro bleu */
```

### Vue d'ensemble
Le pattern `sd-overview-grid` est historique. Ne pas l'utiliser sur les fiches stack detail actuelles : la qualification vit dans le hero decision map.

### Note expert (`sd-expert-note`)
```css
.sd-expert-note { background: #EDEDE8; border: 1px solid #DADAD4; border-radius: 10px;
  padding: 20px 24px; }
.sd-expert-note-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.sd-expert-note-text { font-size: 15px; color: #222222; line-height: 1.5; }
```

### Priorités 3 colonnes (`sd-priority-grid`)
```css
.sd-priority-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.sd-priority-col  { border-top: 3px solid; padding-top: 16px; }
.sd-priority-col--essential { border-top-color: #2E7D32; }
.sd-priority-col--optional  { border-top-color: #6F6F68; }
.sd-priority-col--challenge { border-top-color: #C62828; }
.sd-priority-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; }
.sd-priority-item::before { content: "—"; margin-right: 8px; color: #9A9A92; }
.sd-priority-item { font-size: 15px; color: #222222; line-height: 1.5; }
/* ≤767px → 1 colonne */
```

### Budget (`sd-budget-list`)
```css
.sd-budget-list { list-style: none; padding: 0; }
.sd-budget-row  { display: grid; grid-template-columns: 180px 110px 1fr;
  gap: 24px; align-items: baseline; padding: 14px 0; border-top: 1px solid #DADAD4; }
.sd-budget-tier   { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.sd-budget-amount { font-size: 20px; font-weight: 600; color: #222222; }
.sd-budget-desc   { font-size: 15px; color: #6F6F68; line-height: 1.45; }
/* ≤640px → 1 colonne */
```

### Risques (`sd-risk-enhanced-row`)
```css
.sd-risk-enhanced-row { display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 0; border-top: 1px solid #DADAD4; padding: 20px 0; }
.sd-risk-enhanced-col { padding-right: 24px; }
.sd-risk-col-label    { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #9A9A92; }
.sd-risk-problem      { font-size: 15px; font-weight: 500; color: #222222; }
.sd-risk-consequence  { font-size: 15px; color: #6F6F68; }
.sd-risk-reco-text    { font-size: 14px; color: #222222; line-height: 1.45; }
/* ≤767px → 1 colonne */
```

### Alternatives — variantes de stack (`sd-alt-grid`)
```css
.sd-alt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sd-alt-card { border: 1px solid #DADAD4; border-radius: 10px;
  padding: 20px 22px; background: #FFFFFF; }
.sd-alt-label      { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.sd-alt-title      { font-size: 18px; font-weight: 600; color: #222222; }
.sd-alt-budget     { font-size: 14px; font-weight: 600; color: #6F6F68; }
.sd-alt-tools      { font-size: 14px; color: #222222; }
.sd-alt-compromise { font-size: 14px; color: #6F6F68; font-style: italic; }
/* ≤767px → 1 colonne */
```

### FAQ (`sd-faq-list`)
```css
.sd-faq-list    { list-style: none; padding: 0; }
.sd-faq-item    { border-top: 1px solid #DADAD4; }
.sd-faq-summary { display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; padding: 20px 0; font-size: 17px; font-weight: 500; color: #222222; }
.sd-faq-icon    { flex-shrink: 0; transition: transform 200ms ease; }
details[open] .sd-faq-icon { transform: rotate(180deg); }
.sd-faq-answer  { font-size: 16px; color: #6F6F68; line-height: 1.55; padding-bottom: 20px; }
```

### Lignes outils (`sd-tool-row`)
```css
/* Grille 5 colonnes : 40px | 1fr | 2fr | 90px | 24px */
.sd-tool-row { display: grid; grid-template-columns: 40px 1fr 2fr 90px 24px;
  align-items: center; gap: 16px; padding: 14px 0; border-top: 1px solid #DADAD4; }
/* Badges statut : inline styles (vert/gris/rouge), zéro bleu */
```

### CTA band (`sd-cta-band`)
```css
.sd-cta-band  { background: #EDEDE8; border-top: 1px solid #DADAD4; border-bottom: 1px solid #DADAD4; padding: 64px 0; }
.sd-cta-inner { max-width: var(--layout-content, 1280px); margin: 0 auto;
  padding: 0 var(--layout-gutter, 48px); }
```

### Règle éditoriale stack detail
- **Zéro bleu** sur toute la page
- Boutons CTA : fond `#222222`, couleur `#FFFFFF`
- Snapshot module : fond `#FFFFFF` (blanc pur, pas crème)
- CTA band : fond `#EDEDE8` (crème medium)
- Priority col essential : `#2E7D32` (vert) / optional : `#6F6F68` (gris) / challenge : `#C62828` (rouge)
- Registre éditorial : `EDITORIAL_REGISTRY[slug]` → fallback `buildFallbackEditorial(stack)`

---

## Système `sk-*` — StacksPage facettée (sidebar)

### Layout 2 colonnes (`sk-listing-layout`)
```css
.sk-listing-layout {
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}
/* ≤1023px → 1 colonne, sidebar masquée */
```

### Sidebar sticky (`sk-sidebar`)
```css
.sk-sidebar {
  position: sticky;
  top: calc(var(--navbar-h, 68px) + 24px);
  align-self: start;
  padding-right: 24px;
  border-right: 1px solid #DADAD4;
  max-height: calc(100vh - var(--navbar-h, 68px) - 48px);
  overflow-y: auto;
  scrollbar-width: thin;
}
```

**Règle :** sidebar scrollable quand contenu > viewport (4 groupes de facettes dépassent 900px de hauteur).

### Header sidebar
```css
.sk-sidebar-eyebrow  { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6F6F68; }
.sk-sidebar-title    { font-size: 20px; font-weight: 600; letter-spacing: -0.03em; color: #222222; }
.sk-sidebar-desc     { font-size: 14px; line-height: 1.4; color: #6F6F68; }
```

### Sections de facettes (`sk-facet-section`)

Les filtres de `/fr/stacks` sont organisés comme une description de situation, pas comme une sidebar e-commerce :

- `TON CONTEXTE` : Profil, Spécialité, Niveau
- `TON BESOIN` : Objectif, Budget cible
- `AFFINER` : Complexité, Type de stack, Nombre d'outils

Les labels de section utilisent 11px uppercase, `letter-spacing: 0.08em`, couleur `#9A9A92`.

### Groupes de facettes (`sk-facet-group`)
```css
.sk-facet-section     { padding: 22px 0; border-bottom: 1px solid #DADAD4; }
.sk-facet-group       { padding: 14px 0 0; border-top: none; }
.sk-facet-group-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6F6F68; margin: 0 0 10px; }
.sk-facet-option      { display: flex; justify-content: space-between; align-items: center;
  width: 100%; height: 34px; padding: 0 10px; border: none; border-radius: 6px;
  background: transparent; color: #222222; font-size: 14px; font-weight: 500; }
.sk-facet-option:hover { background: #EDEDE8; }
.sk-facet-option--active { background: #222222; color: #FFFFFF; }
.sk-facet-option:disabled { opacity: 0.36; cursor: not-allowed; }
.sk-facet-option--multi { gap: 10px; justify-content: flex-start; }
.sk-facet-check       { width: 14px; height: 14px; border: 1px solid #DADAD4; border-radius: 4px; background: #FFFFFF; }
```

Règle : ne pas afficher de compteurs globaux. Désactiver les valeurs sans résultat selon les autres facettes actives.

### Facette types et mapping
```typescript
// Profile  → StackPersona (dev / designer / consultant / content / ops / solo)
// Budget   → "light" ≤50€ / "standard" 51-150€ / "premium" >150€
// Complexity → StackStage (starter=Débutant / lean=Intermédiaire / scale=Avancé)
// Objective → dérivé depuis subProfiles via OBJECTIVE_SUBPROFILES map
```

### Reset sidebar
```css
.sk-sidebar-reset { height: 34px; border: 1px solid #DADAD4; border-radius: 6px;
  background: transparent; font-size: 13px; }
.sk-sidebar-reset:disabled { opacity: 0.35; cursor: default; }
```

### Trigger mobile (`sk-mobile-trigger-row`)
```css
.sk-mobile-trigger-row { display: none; } /* affiché via @media ≤1023px */
.sk-mobile-trigger     { height: 38px; border: 1px solid #DADAD4; border-radius: 6px;
  display: inline-flex; align-items: center; gap: 7px; font-size: 14px; }
/* Badge count : "Filtres (2)" — count calculé depuis états facettes actifs */
```

### Panneau mobile (`sk-mobile-panel`)
```css
.sk-mobile-panel         { position: fixed; inset: 0; z-index: 200; background: #F8F8F4;
  display: flex; flex-direction: column; }
.sk-mobile-panel-header  { background: #FFFFFF; border-bottom: 1px solid #DADAD4; padding: 16px 20px; }
.sk-mobile-panel-body    { flex: 1; overflow-y: auto; padding: 0 20px; }
.sk-mobile-panel-footer  { background: #FFFFFF; border-top: 1px solid #DADAD4; padding: 16px 20px; }
.sk-mobile-panel-apply   { flex: 1; height: 46px; background: #222222; color: #FFFFFF; border-radius: 8px; }
/* Fermeture : bouton × / touche Escape / body overflow masqué pendant ouverture */
```

### Composants de facettes
`SidebarContent` utilise deux variantes explicites :

- `SingleFacetGroup<T>` pour Profil, Budget cible, Niveau, Complexité, Nombre d'outils.
- `MultiFacetGroup<T>` pour Spécialité, Objectif, Type de stack.

La logique attendue est `AND` entre familles de facettes et `OR` à l'intérieur des facettes multi-sélection.
```tsx
<SingleFacetGroup<StackFacetProfile>
  label="Profil"
  options={PROFILE_OPTIONS}
  active={facetProfile}
  onChange={handleProfileChange}
  lang={lang}
/>

<MultiFacetGroup<StackSubProfile>
  label="Spécialité"
  options={subProfileOptions}
  active={facetSpecialties}
  onToggle={toggleFacetSpecialty}
  lang={lang}
/>
```

### Tags cards (`sk-card-tags-row`)
```css
.sk-card-tags-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 8px 0 0; }
.sk-card-tag      { height: 22px; padding: 0 8px; border: 1px solid #DADAD4; border-radius: 4px;
  background: #F8F8F4; font-size: 12px; font-weight: 500; color: #6F6F68; }
/* Affiche : budgetDisplayLabel() / STAGE_LABELS[stage][lang] / N outils */
```

---

## Système `sk-*` — StacksPage (filtre + tri)

### Ligne filtre + tri (`sk-filter-row`)
```css
.sk-filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* Les pills de filtre existants utilisent .gi-filter-pill (réutilisé depuis GuidesPage) */
```

### Contrôle de tri (`gi-sort-select`)
Partagé entre StacksPage et d'autres pages listant du contenu.
```css
.gi-sort-select { font: inherit; font-size: 13px; border: 1px solid #DADAD4;
  border-radius: 20px; padding: 6px 28px 6px 12px; color: #222222; background: #FFFFFF;
  appearance: none; cursor: pointer; }
.gi-sort-select:focus { outline: 2px solid #222222; outline-offset: 2px; }
```

**Valeurs de tri StacksPage :**
- `recommended` — Ordre FEATURED_STACK_SLUGS puis reste
- `budget` — Croissant sur `stack.monthlyBudget`
- `tools` — Décroissant sur `stack.tools.length`

---

## Système `cix-*` — ComparesIndexPage

### Layout général
```
cix-hero (inline, section) ← max-width 1280px
cix-search-wrap
  └── cix-search-input (56px height, 600px max-width)
cix-suggestions (chips row)
cix-filters (category pills)
cix-grid (2 colonnes, gap 24px, ≤900px → 1 colonne)
  └── cix-card (Link, flex-col)
cix-comparator-band (custom comparator, fond #F8F8F4)
```

### Hero (`cix-hero`)
```css
.cix-hero         { background: #F8F8F4; border-bottom: 1px solid #DADAD4; padding: 72px 0 56px; }
.cix-hero-inner   { max-width: 1280px; margin: 0 auto; padding: 0 48px; }
.cix-eyebrow      { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.cix-hero-title   { font-family: var(--font-brand); font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 600; letter-spacing: -0.06em; color: #222222; }
/* Title contient un <br> pour couper après le premier ". " */
```

### Recherche (`cix-search-wrap`)
```css
.cix-search-wrap  { max-width: 600px; }
.cix-search-input { height: 56px; font-size: 16px; border: 1px solid #DADAD4;
  border-radius: 28px; padding: 0 20px; background: #FFFFFF; }
.cix-search-input:focus { outline: none; border-color: #222222; }
```

### Chips de suggestion (`cix-suggestions`)
```css
.cix-suggestions      { display: flex; gap: 8px; flex-wrap: wrap; }
.cix-suggestion-chip  { font-size: 13px; border: 1px solid #DADAD4; border-radius: 16px;
  padding: 5px 14px; background: #FFFFFF; cursor: pointer; }
.cix-suggestion-chip:hover { border-color: #222222; }
```
Les chips injectent leur texte dans `setSearchQuery()` au clic.

### Filtres catégorie (`cix-filters`)
```css
.cix-filters     { display: flex; gap: 8px; flex-wrap: wrap; }
.cix-filter-pill { font-size: 13px; border: 1px solid #DADAD4; border-radius: 20px;
  padding: 6px 16px; background: #FFFFFF; cursor: pointer; }
.cix-filter-pill.active, .cix-filter-pill:hover { background: #222222; color: #FFFFFF; border-color: #222222; }
```

**Catégories disponibles :** `all` / `ia` / `productivite` / `design` / `automatisation` / `crm`

Détection automatique via `getSlugCategory(slugPair: string)` — pattern-matching sur les slugs connus sans modification de `comparisons.ts`.

### Grille de cards (`cix-grid`)
```css
.cix-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
/* ≤900px → 1 colonne */
```

### Card comparaison (`cix-card`)
```css
.cix-card         { border: 1px solid #DADAD4; border-radius: 10px; padding: 24px;
  background: #FFFFFF; display: flex; flex-direction: column; gap: 12px;
  text-decoration: none; transition: border-color 200ms, box-shadow 200ms; }
.cix-card:hover   { border-color: #222222; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.cix-card-label   { font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6F6F68; }
.cix-card-vs      { display: flex; align-items: center; gap: 16px; }
.cix-card-vs-tool { display: flex; align-items: center; gap: 10px; }
.cix-card-vs-logo { width: 36px; height: 36px; border-radius: 8px; background: #F8F8F4;
  border: 1px solid #DADAD4; }
.cix-card-vs-name { font-size: 15px; font-weight: 600; color: #222222; }
.cix-card-vs-sep  { font-size: 13px; font-weight: 700; color: #9A9A92; letter-spacing: 0.05em; }
.cix-card-title   { font-size: 18px; font-weight: 600; color: #222222; line-height: 1.3; }
.cix-card-desc    { font-size: 14px; color: #6F6F68; line-height: 1.5; }
.cix-card-pricing { font-size: 13px; color: #9A9A92; }
.cix-card-cta     { font-size: 13px; font-weight: 500; color: #222222;
  display: flex; align-items: center; gap: 4px; margin-top: auto; }
.cix-card-cta-arrow { transition: transform 200ms ease; }
.cix-card:hover .cix-card-cta-arrow { transform: translateX(4px); }
```

### Logique `deriveCardDesc()`
Tente dans l'ordre :
1. `toolA.verdict.keepIf[0]` (tronqué à 80 chars)
2. `toolA.shortDescription` (tronqué à 80 chars)
3. `"Comparatif détaillé avec tableau, verdict et recommandations."`

### Comparateur custom (`cix-comparator-band`)
```css
.cix-comparator-band  { background: #F8F8F4; border: 1px solid #DADAD4; border-radius: 12px; padding: 40px; }
.cix-comparator-inner { max-width: 600px; }
/* Selects natifs restyle avec border-radius 8px */
```

---

## Anti-patterns à éviter

- ❌ Bouton bleu sur les pages outils
- ❌ Gradient background
- ❌ Card avec `border-radius > 10px` sur les sections éditoriales
- ❌ Emojis comme icônes (utiliser Lucide)
- ❌ `position: sticky` sur un enfant d'un grid item (casse le sticky)
- ❌ `overflow: hidden` sur les parents d'éléments sticky
- ❌ Métadonnées répétées (hero ET sidebar)
- ❌ Colonnes décisionnelles dans le hero

---

## Composant Ticker (TickerBar)

Barre animée sur la homepage. Signature éditoriale, pas un dashboard.

**Fichier :** `src/components/home/TickerBar.tsx`

**Règles :**
- Hauteur fixe : `40px`
- Pas de logos dans la barre (bruyant)
- Textes courts : outil(s) + décision en 2-3 mots max
- Séparateur : `◌` (opacité 0.35)
- Animation : `45s linear infinite` (lente, seamless)
- `prefers-reduced-motion` : animation désactivée

**Classes CSS (`hpt-*`) :**

| Classe | Rôle |
|---|---|
| `.hpt-track` | Conteneur flex animé |
| `.hpt-item-group` | Groupe outil + décision + sep |
| `.hpt-tools` | Nom(s) d'outil — 400 / #6F6F68 |
| `.hpt-decision` | Décision courte — 600 / #222222 |
| `.hpt-sep` | Séparateur ◌ — opacity 0.35 |

**Anatomie d'un item :**
```
Notion + Trello   Doublon possible   ◌
[hpt-tools]       [hpt-decision]     [hpt-sep]
```

**À ne pas faire :**
- ❌ Logos dans la barre
- ❌ Phrases longues (> 4 mots par fragment)
- ❌ Couleurs rouge/bleu dans la barre
- ❌ Hauteur > 44px
- ❌ Animation < 35s (trop rapide)

## Homepage Decision Ticker — logo version

- Wrapper: `height: 44px`, `background: #F8F8F4`, borders `#DADAD4`.
- Track: flex, center aligned, slow linear animation.
- Item: 44px high, `padding: 0 22px`, visible `border-right` separator.
- Logo pill: 26px circle, white background, `#DADAD4` border.
- Logo image: max 17px, object-fit contain.
- Fallback: first letter inside the same pill.
- Text: sober grey for tool names, dark bold for decision.

## Homepage rhythm — section separators

La homepage doit garder un flux éditorial continu. Les sections se distinguent par l'espacement, la grille commune, les fonds sobres et la hiérarchie typographique, pas par des lignes pleine largeur répétées.

**Règles :**
- Pas de `border-top` / `border-bottom` pleine largeur entre la plupart des sections homepage.
- Les bordures restent autorisées à l'intérieur des composants : cartes, lignes de diagnostic, tables, panels, ticker.
- Le ticker conserve ses bordures fines, car elles font partie de son composant.
- Les autres pages peuvent continuer à utiliser `es-section` avec bordures si leur structure le demande.
- Les overrides de fluidité homepage doivent être scopés sous `.home-page`.

## Stack detail typography scale (`sd-*`)

Les pages détail stack utilisent une hiérarchie plus éditoriale que les listings : grand titre décisionnel, blocs de lecture limités, rows outils scannables.

**Shell :**
- `.sd-container`, `.sd-hero-grid`, `.sd-cta-inner` : `width: min(calc(100% - 48px), 1240px)` desktop.
- Mobile : `width: min(calc(100% - 32px), 1240px)`.
- Hero desktop : `minmax(0, 1fr) 360px`, gap `clamp(48px, 6vw, 96px)`.

**Type scale :**
- H1 stack : `clamp(56px, 6vw, 104px)`, line-height `0.92`, tracking `-0.065em`.
- Sous-titre hero : `clamp(19px, 1.4vw, 23px)`, line-height `1.42`.
- H2 section : `clamp(36px, 4vw, 64px)`, line-height `0.98`.
- Body : `16px / 1.5`.
- Verdict important : `18px / 1.45`, weight `500`.
- Metadata : `13px / 1.35`.
- CTA : `15px`, weight `600`.

**Rows outils :**
- Desktop : logo `48px`, nom `18px / 600`, rôle/raison `15px / 1.45`, prix `15px`.
- Labels décisionnels : pastille 28px, `11px` uppercase, bordure sobre `#DADAD4`, sans code couleur rouge/vert.

**Espacement :**
- Section desktop : autour de `96px` vertical.
- Section mobile : autour de `64px`.
- Header vers contenu : `40px` environ.

## Stack detail sticky bottom nav (`StackStickyNav`)

Composant flottant premium, desktop uniquement (masqué < 768px). Remplace la subnav inline sur desktop.

**Fichier :** inline dans `src/pages/StackDetailPage.tsx`, défini avant le composant principal.

**Visibilité :**
- Un sentinel `<div ref={sentinelRef} />` est placé à la fin de la `<section>` hero.
- `IntersectionObserver` surveille ce sentinel. Quand il sort du viewport, `isStickyVisible` passe à `true` et le composant apparaît.
- La classe `.stack-sticky-nav--hidden` masque le composant via `opacity: 0` + `pointer-events: none` + `translateY(12px)`.

**Active state :** partagé avec `activeSection` (le scrollspy existant de la page).

**Structure :**
```
.stack-sticky-nav (fixed bottom capsule)
  └── .stack-sticky-nav-logo (TT, lien vers /stacks)
  └── .stack-sticky-nav-items (group)
      └── .stack-sticky-nav-item (× N, --active sur item courant)
```

**Style :**
- Fond `#2A2A28`, border-radius 20px, padding 8px, box-shadow double.
- Logo : 52×52px, border-radius 14px, fond `#111111`, texte `TT` 13px/800.
- Item actif : `border-color: rgba(255,255,255,0.80)`, fond translucide `rgba(255,255,255,0.06)`.
- Animation : `opacity` + `translateY(12px)` 220ms ease.

**Responsive :**
- Desktop ≥768px : capsule visible, subnav inline (`.sd-subnav-wrapper`) masquée.
- Mobile <768px : capsule masquée (`display: none`), subnav inline visible.

**Accessibilité :**
- `<nav aria-label="Navigation de la fiche stack">`.
- `<a href="#section-id">` vrais liens d'ancre.
- `aria-current="page"` sur l'item actif.
- Focus ring : `outline: 2px solid rgba(255,255,255,0.7)` sur `focus-visible`.

---

## Stack detail anchor navigation (`sd-nav`)

La navigation interne des pages détail stack est une navigation d'ancre, pas des tabs.

**Sémantique :**
- Utiliser `<nav aria-label="Navigation de la page">`.
- Les items restent de vrais liens `<a href="#section">`.
- Ne pas utiliser `role="tablist"` / `role="tab"`.
- Le lien actif expose `aria-current="location"`.

**Style :**
- Sticky sous le header : `top: var(--navbar-h, 68px)`.
- Hauteur desktop : `56px`; mobile : `52px`.
- Fond : `rgba(248,248,244,.92)` + `backdrop-filter: blur(10px)`.
- Items en pilules sobres : actif noir `#222222`, texte blanc, aucun bleu.
- Scroll horizontal interne sur mobile, pas de scroll horizontal page.

**Ancrage :**
- Les sections cibles utilisent `scroll-margin-top: calc(var(--navbar-h, 68px) + 72px)`.
- Le smooth scroll est natif et désactivé avec `prefers-reduced-motion: reduce`.

## Stack detail hero quick-read pattern

Le hero d'une page stack detail doit lire comme une carte de décision, pas comme un simple titre de page. Il répond dès le premier écran à : pour qui, ce que ça couvre, quand éviter, budget, nombre d'outils, niveau, complexité, point de vigilance et outils clés.

**Grille :**
- Desktop : `minmax(0, 1fr) 380px`.
- Gap : `clamp(64px, 7vw, 112px)`.
- À partir de tablette/mobile, les colonnes se superposent et la carte résumé passe sous l'intro.

**Côté gauche :**
- Ordre : breadcrumb, eyebrow, H1, promesse courte, trois cartes de décision, CTA.
- Les cartes `stack-fit-*` portent `POUR QUI`, `CE QUE ÇA COUVRE`, `À ÉVITER SI`.
- Style : fond blanc, bordure `#DADAD4`, rayon 18px, padding 20px, texte 15px/1.4.

**Carte droite `sd-snapshot` :**
- Budget en premier : valeur 40px, suffixe `/mois` en 16px.
- Facts grid en 2 colonnes : Profil, Outils, Niveau, Complexité.
- Bloc `Workflow` : résumé de la chaîne principale, court et lisible.
- Bloc `À surveiller` limité à une phrase courte.
- Bloc `Outils clés` : 5–6 logos visibles, pastilles 32px, puis `+N`.
- Éviter les séparateurs ligne par ligne ; utiliser seulement des séparations de groupes.

**Navigation :**
- Si le hero possède la qualification, ne pas rendre une section `Vue d'ensemble` immédiatement après.
- La navigation d'ancre commence par `Outils`, puis `Budget`, `Risques`, `Calibrage`, `FAQ`.


## Stack detail integrated workflow inventory

Quand une section outils contient beaucoup d'entrées, ne pas afficher un workflow puis un inventaire séparé. Le workflow est l'interface.

**Node fermé :**
- Numéro d'étape `01`, titre, usage court.
- Résumé : `Socle : Y · Selon usage : Z · Extensions : N` (catégories > 0 uniquement).
- Aperçu : jusqu'à 3 outils, Socle d'abord, puis Selon usage si besoin.
- Bouton réel `.sd-expand-btn` avec `aria-expanded`.

**Node ouvert :**
- Groupes `Socle`, `Selon usage`, `Extension`.
- Rows compactes : logo, nom, rôle, prix, lien `Fiche →`.
- Pas de paragraphe long dans les détails. Budget, risques et calibrage restent dans leurs sections dédiées.

**Responsive :**
- Desktop large : 3 colonnes.
- Medium : 2 colonnes.
- Mobile : 1 colonne, détails empilés sans scroll horizontal.


## Stack detail `Stack by Workflow`

Le pattern s'inspire du principe UX `Stack by Layer`, mais sa logique est ToolTrim : il ne montre pas seulement ce qui est utilisé, il explique comment le freelance travaille et quels outils garder, activer selon projet ou challenger.

**Contenu d'un node :**
- Étape de workflow, numéro et usage court.
- Résumé compact : `Socle : Y · Selon usage : Z · Extensions : N`.
- 1 à 3 outils visibles, Socle en priorité.
- Disclosure `Voir le détail` pour afficher tous les outils de l'étape.

**Règle de non-redondance :**
`02 — OUTILS` est un seul module. Ne pas ajouter d'inventaire séparé, de table, de wall of cards ou de matrice décisionnelle sous la grille. Les détails complets vivent dans les nodes expansibles.

**Langage de statut (workflow cards) :**
- Utiliser `Socle`, `Selon usage`, `Extension` — jamais `À challenger`, `Conditionnel` ou `À surveiller` dans les cartes workflow.
- Mapping : `core/socle/essential/keep` → `Socle` ; `conditional/conditionnel/optional` → `Selon usage` ; `challenge/challenger/avoid` → `Extension`.
- Ne pas réintroduire `Essentiel` / `Optionnel` dans les pages stack detail.
- Les statuts doivent rester du texte lisible, jamais un simple code couleur.

**Progressive disclosure :**
- Un seul node est ouvert par défaut : celui qui porte le plus de Socle, ou le premier node métier prioritaire.
- Les autres nodes montrent seulement la forme de la stack : nom d'étape, usage, comptes et 1 à 3 outils.
- Le bouton expand reste un vrai `<button>` avec `aria-expanded`, `aria-controls`, classe `.sd-expand-btn` (bordure `#DADAD4`, radius 999px, hover noir).
- Texte bouton : "Afficher les N outils restants ↓" / "Réduire la liste ↑".

**Indicateur de compte :**
- Afficher `.sd-tools-count-indicator` au-dessus de la grille d'outils, aligné à droite (gauche sur mobile).
- Collapsed : "6 sur 9 outils affichés". Expanded : "9 outils affichés". Toujours visible.

**Badge "À surveiller" :**
- Supprimé des cartes workflow. Ne pas le réintroduire.
- La logique `shouldShowWorkflowWatch()` reste dans le code mais n'est plus rendue.
- Ne pas répéter ici la logique budget, risques ou calibrage : ces informations appartiennent à leurs sections.

**Structure informationnelle :**
- Hero : cible, promesse courte, couverture, avoid-if, budget cible, nombre d'outils, niveau, complexité, vigilance et outils clés.
- Outils : étapes de workflow et outils uniquement.
- Budget : logique de coût, ce qui mérite paiement, ce qui peut rester gratuit, facteurs de dérive et seuil d'audit.
- Risques : erreurs et scénarios d'overbuild.
- Calibrage : seuils où la stack devient trop légère ou trop lourde.

Sur les pages stack detail, éviter les formulations de type “base recommandée divisée par usages”. La page doit se lire comme une fiche de décision workflow-first, pas comme un inventaire.

**Vue d'ensemble :**
- Ne pas rendre de section overview autonome quand le hero contient déjà la qualification.
- Ne pas réintroduire de cartes immédiatement sous le hero qui répètent `POUR QUI`, `CE QUE ÇA COUVRE` ou `À ÉVITER SI`.
- Les conseils pratiques doivent vivre dans les blocs workflow, le budget ou la FAQ selon leur rôle.

**Budget :**
- Le budget est un module de décision seuils + principes, pas un catalogue de prix ni une liste d'outils.
- Structure : eyebrow `03 — BUDGET`, titre dynamique depuis `stack.monthlyBudget` (fallback si 0), intro 18px max 760px, bande de seuils 3 colonnes, bloc principes 3 items texte seul, note 13px muted.
- Bande de seuils (`sd-budget-thresholds`) : grille 3 col avec bordure unifiée + border-radius 16px. Colonne active (target) porte la classe `sd-budget-threshold--active` (fond #F0F0EA). Structure interne : `sd-bt-range` (valeur, clamp 20–26px, 700) / `sd-bt-label` (uppercase 11px) / `sd-bt-desc` (14px muted).
- Principes (`sd-budget-principles`) : grille 3 col, gap 48px. Chaque item : `sd-bp-head` (16px 700) + `sd-bp-body` (15px muted). Texte pur — pas de tool chips, pas de logos.
- Pas de CTA "Auditer ma stack" dans cette section.
- Ne pas réexpliquer tout le workflow ici. La section budget possède uniquement les seuils et les principes de décision.


## Stack detail `Stack Map`

Le pattern `Stack Map` remplace les nodes workflow interactifs quand la page doit être plus calme et plus visuelle. Il traduit l'inspiration Sana sans copier son style : grands blocs lisibles, titre de famille à gauche, grille d'outils à droite.

**Structure d'un bloc — colonne gauche :**
1. `.sd-stack-card-title` — titre éditorial, clamp(1.625rem → 2rem), 700, tracking –0.03em.
2. `.sd-stack-card-role` — description courte, 17px/400, couleur `#6F6F68`, max-width 380px.
3. `.sd-stack-card-decision` — phrase de recommandation, 15px/500, couleur `#222222`, max-width 380px. Générée par `getWorkflowDecisionCopy()`.
4. `.sd-stack-card-micro` — micro-info "X outils visibles sur Y", 12px, `#9A9A92`. Visible uniquement si `hasHiddenGroups`.
5. `.sd-expand-btn` — bouton expand/collapse. Visible uniquement si `hasHiddenGroups`.

**Structure d'un bloc — colonne droite :**
- Groupes : `Socle recommandé` · `Selon ton usage` · `Extensions` — chacun introduit par `.sd-group-tag` (pill transparent, border `#DADAD4`, 10px caps, height 24px, radius 999px, couleur `#6F6F68`).
- Outils rendus comme `.sd-tool-item` (`Link`, `display:flex`, `gap:14px`) contenant :
  - `.sd-tool-logo` — **unique conteneur logo** : 56×56px, radius 16px, fond blanc, border `1px solid #DADAD4`. Transition border-color 120ms sur hover. **Pas de conteneur intermédiaire.** La `<img>` ToolLogo à l'intérieur a ses propres styles ring/bg/padding strippés par CSS (`!important`).
  - `.sd-tool-name` — 17px, font-weight 650, letter-spacing -0.025em, max-width 180px, -webkit-line-clamp 2.
- **Règle une seule coque logo :** Ne jamais imbriquer `.sd-tool-logo` dans un autre conteneur décoratif. Le composant `ToolLogo` est passé avec `size={34}` — sa `<img>` est 34×34px à l'intérieur de la coque 56px.
- **Pas de badge de statut par outil :** Les group tags portent le sens (Socle / Selon usage / Extensions). Ne pas ajouter `<small>`, `<span class="sd-tool-status">` ou équivalent sous le nom.
- **`.sd-tools-total` supprimé de la colonne droite** — le comptage est dans `.sd-stack-card-micro` (colonne gauche).
- **`.sd-tools-count-indicator` supprimé** — ne pas réintroduire.

**Règle d'inventaire :**
- Le `Stack Map` est l'inventaire. Ne pas ajouter de table, liste complète, inventaire séparé ou wall of cards sous le module.
- Afficher Socle (tout) + 3 premiers Selon usage par défaut.
- Le reste (secondaires > 3 et/ou extensions) s'affiche après expand.
- Bouton `.sd-expand-btn` uniquement si des outils sont masqués. Libellé contextuel selon ce qui est caché.
- **Ne pas afficher de badge de statut répété sur chaque outil** : le groupe tag porte déjà cette information.

**Logique de groupement :**
- `core/socle/essential/keep` → groupe `Socle recommandé`
- `conditional/conditionnel/optional` + fallback → groupe `Selon ton usage`
- `challenge/challenger/avoid/extension` + mots-clés rôle avancé → groupe `Extensions`

**Style :**
- Bloc calme : `#F4F4EF`, radius 28px, padding 40px 44px, sans ombre, sans bordure.
- Grille desktop : colonne gauche 0.75fr, colonne droite 1.25fr, gap 52px.
- Logo outil : 44px × 44px, radius 12px, fond blanc, border `#E8E8E2`. Image interne 26px.
- Nom outil : 15px/600, max-width 160px, 2 lignes max.
- Tool grid : CSS grid `auto-fill minmax(180px, 1fr)`, gap 14px 24px.
- Group tag : inline-flex, h 26px, padding 0 10px, 10px/700 caps, border `#DADAD4`, radius 999px.
- Mobile : une colonne, padding réduit 28px 24px, logos 40px.
