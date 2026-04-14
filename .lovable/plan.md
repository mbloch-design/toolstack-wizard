

## Refonte de la page Comparaison — Design "Precision Curator"

### Objectif
Remplacer la page `ComparePage.tsx` actuelle (tableau basique) par un layout premium inspiré de la référence fournie : sidebar catégories + sélecteur d'outils, grille de comparaison visuelle avec barres de score, feature checklist, et verdict bento cards. Fort potentiel SEO grâce à une structure sémantique riche (H1, tableaux structurés, FAQ, JSON-LD).

### Architecture

```text
┌─────────────────────────────────────────────────┐
│  HERO — badge "Expert Analysis" + H1 + subtitle │
├──────────┬──────────────────────────────────────┤
│ SIDEBAR  │  TOOL HEADERS (sticky, border-top)   │
│ ──────── │  Logo + Nom + Tagline par outil       │
│ Catégories│──────────────────────────────────────│
│ (filtres)│  PRICING ROW — prix côte à côte       │
│          │──────────────────────────────────────│
│ Selected │  STRENGTH BARS — 3 métriques visuelles│
│ Tools    │──────────────────────────────────────│
│ (chips)  │  FEATURE CHECKLIST — ✓ / ✗ par ligne  │
│          │──────────────────────────────────────│
│ + Add    │  BENTO VERDICT — 2 cards côte à côte  │
│          │  (fond bleu primaire vs blanc)         │
├──────────┴──────────────────────────────────────┤
│  FAQ — 3-4 questions structurées (SEO)           │
│  CTA — liens vers fiches détail                  │
└─────────────────────────────────────────────────┘
```

### Étapes d'implémentation

**1. Refonte complète de `ComparePage.tsx`**

Réécrire le composant avec :
- **Hero** : badge pill "Expert Analysis", H1 avec italique sur "SaaS Decisions", sous-titre, avatars sociaux "Trusted by 24K+ CTOs"
- **Sidebar gauche** (desktop) : liste des catégories cliquables avec état actif (fond primaire), section "Selected Tools" avec chips et bouton "+ Add Tool"
- **Headers outils** (sticky top) : cards blanches avec border-top colorée (bleu/orange), icône, nom, tagline
- **Section Pricing** : prix grand format (DM Mono) côte à côte
- **Section Strength** : barres verticales animées pour 3 métriques (Scalability, UI, Support) — données dérivées des scores existants
- **Feature Checklist** : lignes alternées avec check_circle / cancel icons
- **Bento Verdict** : 2 cards — une fond bleu primaire (gradient), une fond blanc avec border — verdict personnalisé par outil
- **FAQ** : 3-4 questions expandables (conservées, structure `<details>`)
- **CTA** : boutons vers fiches détail

**2. Adaptation des données**

- Utiliser les champs existants du `Tool` type : `pros`, `cons`, `verdict`, `pricing`, `defaultMonthlyPrice`, `functional_needs`
- Mapper les `functional_needs` comme features pour la checklist (Advanced Reporting → check/cross)
- Dériver les scores de "Platform Strength" depuis `pertinenceScore` ou `prescription_quality`
- Conserver les 8 comparaisons existantes dans `COMPARISONS[]`

**3. Tokens design appliqués**

- Fond page : `#F9F9FA` (background)
- Cards : `#FFFFFF` (surface-container-lowest) avec ombre ambiante douce
- Primaire : gradient `#003BC7 → #1E52F1` (135°) pour CTA et card verdict
- Secondaire/orange : `#FD8534` pour le 2e outil
- Typo : Plus Jakarta Sans (headlines), Inter (body)
- Pas de bordures 1px — tonal layering uniquement
- Border-radius : `lg` (16px) pour cards, `full` pour pills/boutons
- Ghost borders à 15% opacity max si nécessaire

**4. SEO renforcé**

- JSON-LD `Article` + `FAQPage` (déjà en place, conservé)
- H1 unique par comparaison, H2 pour sections
- Texte structuré pour les scrapers LLM (answer-first dans le verdict)
- Hreflang FR/EN conservé

**5. Responsive**

- Mobile : sidebar masquée, layout single-column
- Headers outils empilés verticalement
- Barres de score en mode horizontal sur mobile

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — réécriture complète

### Fichiers potentiellement ajoutés
- `src/components/compare/CompareHero.tsx` — hero section
- `src/components/compare/CompareSidebar.tsx` — sidebar catégories
- `src/components/compare/CompareStrengthBars.tsx` — barres de score visuelles
- `src/components/compare/CompareVerdictCards.tsx` — bento verdict

