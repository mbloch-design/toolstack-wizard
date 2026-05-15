# ToolTrim — Design System

Référence du système de design éditorial. Mis à jour au fil des sessions.

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

## Typographie

### Fonts
```css
--font-brand: "Uncut Sans Variable"  /* titres éditoriaux */
--font-ui:    "Inter Tight"           /* UI, corps, labels */
```

### Hiérarchie éditoriale

| Rôle | Font | Size | Weight | LS | LH |
|---|---|---|---|---|---|
| Hero H1 (tool) | brand | clamp(4.5rem, 8vw, 7.75rem) | 600 | -0.07em | 0.9 |
| Hero H1 (guide) | brand | clamp(3.5rem, 7vw, 7rem) | 600 | -0.065em | 0.94 |
| Section title (td-title) | brand | clamp(2.625rem, 4vw, 4rem) | 600 | -0.055em | 0.98 |
| Footer CTA title | brand | clamp(3rem, 5vw, 5.125rem) | 600 | -0.055em | 0.95 |
| Eyebrow | ui | 11px | 600 | +0.08em | 1 |
| Description courte | ui | 22px | 400 | -0.025em | 1.35 |
| Contexte court | ui | 17px | 400 | -0.015em | 1.5 |
| Corps (td-body) | ui | 18px | 400 | -0.02em | 1.55 |
| Label card meta | ui | 11px | 600 | +0.08em | 1 |
| Tab actif | ui | 16px | 500 | -0.02em | 1 |

---

## Composants CTA

### CTA primaire (black button)
```css
background: #222222;
color: #FFFFFF;
height: 48px;
padding: 0 22px;
border-radius: 8px;
font-size: 15px;
font-weight: 500;
letter-spacing: -0.01em;
transition: background 160ms ease-out;
/* hover → background: #000000 */
```

Utilisé : `StickyDecisionCard` (Visiter le site), `td-diag-band` (Auditer ma stack), `td-footer-cta` (Lancer mon analyse).

### CTA secondaire (ghost button)
```css
background: transparent;
color: #222222;
height: 44px;
border: 1px solid #DADAD4;
border-radius: 8px;
/* hover → border-color: #222222, background: #F8F8F4 */
```

Utilisé : `StickyDecisionCard` (Comparer les alternatives).

**Pas de bouton bleu sur les pages outils.**

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

### Footer CTA full-width (td-footer-cta)
```css
background: #F8F8F4;
border-top: 1px solid #DADAD4;
padding: 72px 0;
/* grille interne : 1fr auto, gap 64px, align-items end */
```

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

## Anti-patterns à éviter

- ❌ Bouton bleu sur les pages outils
- ❌ Gradient background
- ❌ Card avec `border-radius > 10px` sur les sections éditoriales
- ❌ Emojis comme icônes (utiliser Lucide)
- ❌ `position: sticky` sur un enfant d'un grid item (casse le sticky)
- ❌ `overflow: hidden` sur les parents d'éléments sticky
- ❌ Métadonnées répétées (hero ET sidebar)
- ❌ Colonnes décisionnelles dans le hero
