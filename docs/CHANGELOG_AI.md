# ToolTrim — AI Changelog

---

## 2026-05-19 — Sprint 66 : Hero comparatif — logos, contenu éditorial, battle ChatGPT vs Gemini

### Objectif
Clarifier la valeur ToolTrim dans le hero comparatif. Résoudre six problèmes : logos absents, position label trop long, heroContract trop technique, microfact budget montrant un prix brut, microfact risque vague, et absence de la battle ChatGPT vs Gemini.

### Corrections CSS (`src/index.css`)
- `.cp-hero-duel-logo` — suppression de `border`, `background`, `border-radius` : le conteneur est neutre, `ToolLogo` gère sa propre présentation visuelle
- `.cp-hero-promise` — margin réduit de `0 0 40px` à `0 0 20px` pour serrer avec `.cp-hero-brief`
- Nouvelle classe `.cp-hero-brief` — paragraphe éditorial court entre sous-titre et duel cards, `font-size: var(--tt-size-body)`, `color: #6F6F68`, `max-width: 720px`

### Corrections `src/lib/toolLogos.ts`
- Ajout `gemini: "googlegemini"` dans `SIMPLE_ICON_SLUGS` (section G) — résout le logo absent pour Gemini

### Corrections `src/pages/ComparePage.tsx`
- `getBudgetSignal()` — refactorisé pour retourner un signal éditorial, plus jamais un prix brut (ex: `"Compare le plan utile, pas le prix d'entrée"`)
- `CompareEditorialContent` — nouveau champ `aglanceHeroBrief?: string`
- `BattleRawData.tooltrimAtAGlance` — nouveau champ `heroBrief?: string`
- `buildBattleEditorialContent` — mapping `aglanceHeroBrief: aglance?.heroBrief`
- `heroBrief` dans le render — affiché si présent, null sinon (pas de fallback générique)
- `heroPositionA / heroPositionB` — utilisent `?? null` : label affiché uniquement si explicitement renseigné dans le JSON (plus de fallback `bestForA` trop long)
- Logo `ToolLogo` — taille passée à `size={48}` pour une meilleure lisibilité dans les duel cards
- JSX hero — `{heroBrief && <p className="cp-hero-brief">{heroBrief}</p>}` inséré après le sous-titre
- JSX duel positions — `{heroPositionA && ...}` conditionnel pour éviter les labels vides

### Nouvelle battle : ChatGPT vs Gemini
- Nouveau fichier `src/data/comparison-battles/chatgpt-vs-gemini.json`
- Contenu éditorial intégral selon brief de mission :
  - heroPromise : `"Deux assistants généralistes. Deux écosystèmes."`
  - heroBrief : paragraphe explicatif sur le choix par écosystème
  - heroPositionA : `"Assistant polyvalent"` / bestFor : `"Écriture · analyse · code · images · fichiers"`
  - heroPositionB : `"Assistant Google-first"` / bestFor : `"Workspace · recherche · documents · multimodal"`
  - heroContract : `"Ne choisis pas l'IA \"la plus forte\". Choisis celle qui s'insère le mieux dans ton workflow réel."`
  - defaultChoiceLabel : `"ChatGPT"`, budgetShort : `"Compare le plan utile, pas le prix d'entrée"`, mainRisk : `"Payer deux IA généralistes sans usages séparés"`
- Enregistrement dans `src/data/comparisonBattles.ts` (import + entrée `"chatgpt-vs-gemini"`)

### Règles préservées
- Aucune taille typographique locale créée — tout référence `var(--tt-size-*)`
- Fallback logo propre : `ToolLogo` affiche initiale stylée si toutes les sources CDN échouent
- TypeScript : `exit:0` confirmé

---

## 2026-05-19 — Sprint 65 : Design system typographique scalable — tokens globaux

### Objectif
Créer une source unique de vérité pour toute la typographie ToolTrim. Plus aucune page ne code ses tailles en dur. Changer un token `--tt-size-*` dans `:root` propage le changement partout.

### Nouveaux tokens CSS dans `:root`
13 variables `--tt-size-*` couvrant tous les niveaux typographiques :
- `--tt-size-hero` → `clamp(64px, 8vw, 124px)`
- `--tt-size-hero-sub` → `clamp(22px, 2vw, 30px)`
- `--tt-size-section-h` → `clamp(44px, 5vw, 76px)`
- `--tt-size-section-intro` → `clamp(20px, 1.8vw, 26px)`
- `--tt-size-body-large` → `clamp(18px, 1.5vw, 22px)`
- `--tt-size-body` → `16px`
- `--tt-size-kicker` → `11px`
- `--tt-size-fact` → `clamp(18px, 1.2vw, 22px)`
- `--tt-size-fact-compact` → `14px`
- `--tt-size-card-title` → `15px`
- `--tt-size-card-body` → `14px`
- `--tt-size-metric` → `clamp(24px, 1.8vw, 32px)`
- `--tt-size-cta-h` → `clamp(28px, 4vw, 56px)`

Variables de section : `--tt-section-y`, `--tt-hero-pt`, `--tt-hero-pb`
Variables de radius : `--tt-radius-sm/md/lg/xl`

### Migration classes `tt-*`
Toutes les 12 classes `tt-*` existantes référencent maintenant `var(--tt-size-*)` au lieu de clamp() codés en dur.

### Nouvelles classes `tt-*`
- `.tt-cta-title` — titre de bande CTA (`--tt-size-cta-h`)
- `.tt-container` / `.tt-hero` / `.tt-section` / `.tt-section--last` — primitives layout
- `.tt-section-header` / `.tt-section-grid` — patterns de section
- `.tt-content-narrow` / `.tt-content-wide` — conteneurs à largeur contrainte
- `.tt-table-head-cell` / `.tt-table-criterion` / `.tt-table-value` / `.tt-table-note` / `.tt-table-decision` — tokens table
- `.tt-statement` / `.tt-statement-label` / `.tt-statement-text` — pattern bloc éditorial

### Migration `cp-*` → tokens
Classes clés migrées sur `var(--tt-size-*)` :
- `.cp-hero-title` → `var(--tt-size-hero)`
- `.cp-hero-promise` → `var(--tt-size-hero-sub)`
- `.cp-eyebrow` → `var(--tt-size-kicker)`
- `.cp-title` → `var(--tt-size-section-h)`
- `.cp-section-framing` → `var(--tt-size-section-intro)`
- `.cp-verdict-statement-label` → `var(--tt-size-kicker)`
- `.cp-table-cell--criterion` → `var(--tt-size-fact-compact)`
- `.cp-table-tool-note` → `var(--tt-size-card-body)`
- `.cp-section` → `padding: var(--tt-section-y) 0`
- `.cp-hero` → `padding: var(--tt-hero-pt) 0 var(--tt-hero-pb)`
- `.cp-hero-duel-card` → `border-radius: var(--tt-radius-md)`

### Migration `sd-*` → tokens
- Toutes les occurrences de `font-size: 11px` dans les eyebrows → `var(--tt-size-kicker)`
- Groupe sélecteur (`.sd-hero-eyebrow, .sd-section-eyebrow, …`) migré

### Migration JSX pages
- `ComparePage.tsx` CTA band title → `.tt-cta-title`
- `StackDetailPage.tsx` CTA band title → `.tt-cta-title` + kicker → `.tt-kicker`

### Règle anti-exception renforcée
FORBIDDEN : `font-size: clamp(...)` ou px en dur dans un class `cp-*` / `sd-*` couverte par un token
REQUIRED : référencer `var(--tt-size-*)` ou utiliser directement une class `tt-*`

---

## 2026-05-19 — Sprint 64 : Table décisionnelle "Ce qui change vraiment le choix"

### Objectif
Transformer la table comparative en vraie aide à la décision. Chaque ligne répond : "Sur ce critère, A ou B ?" — pas un catalogue de features.

### Changements de données (Slack vs Teams)
- Remplacement des 5 lignes plates par 6 lignes structurées avec `{ title, note }` pour chaque outil
- Suppression des lignes redondantes avec la section Coût (plan gratuit, prix d'entrée)
- Nouvelles lignes : Usage principal, Collaboration externe, Coût réel, Réunions et documents, Stack d'outils, Risque principal
- Contenu basé sur le brief éditorial de la mission (wording validé)

### Nouveaux types TypeScript
- `BattleRowCellValue = string | { title: string; note?: string }` — rétro-compatible
- `cellTitle()` / `cellNote()` — helpers pour extraire les champs selon le type
- `CompareTableRow` étendu avec `toolANote?`, `toolANoteEn?`, `toolBNote?`, `toolBNoteEn?`
- `BattleRawData.comparisonRows.toolA/toolB` accepte maintenant l'union type

### Architecture JSX
- Cellules outil : `<p className="cp-table-tool-title">` + `{note && <p className="cp-table-tool-note">}` — note absente = pas d'espace vide
- Cellule décision : `<div className="cp-table-verdict">` avec `data-label` pour mobile
- Header : "Décision ToolTrim" au lieu de "Verdict"
- Attribut `role="table/row/cell/columnheader"` pour accessibilité

### Nouveau CSS `cp-table`
- Grille : `minmax(140px,0.8fr) minmax(220px,1.25fr) minmax(220px,1.25fr) minmax(240px,1.3fr)` (verdict large, pas 110px)
- `align-items: start` (plus `baseline`) — hauteur naturelle
- `.cp-table-tool-title` : 17px · weight 650 · -0.03em
- `.cp-table-tool-note` : 14px · 400 · #6F6F68
- `.cp-table-verdict` : `border-left: 2px solid #222222` · 16px · weight 600
- Mobile (≤900px) : stacked card, labels via `::before`, décision avec `border-top` accent

### Fallback
- Autres JSON (strings plates) : `cellTitle()` retourne la string, `cellNote()` retourne `undefined` → `<p className="cp-table-tool-note">` non rendu
- `NOTION_VS_AIRTABLE` : non affecté (note fields `undefined`)
- `buildFallbackContent` : non affecté (pas de notes générées)

### Build
✅ 0 erreur TypeScript · build OK · 32 comparisons pré-rendus

---


## 2026-05-19 — Sprint 63 : Harmonisation typographique Comparatif ↔ Stack

### Objectif
Recaler les pages Comparatif sur le système typographique global ToolTrim. La page Stack est la référence. Supprimer les tailles spécifiques trop agressives introduites au Sprint 62.

### Écarts corrigés

| Élément | Avant | Après |
|---|---|---|
| `cp-hero-title` | `clamp(72px, 12vw, 170px)` | `clamp(64px, 8vw, 124px)` |
| `cp-hero-promise` | `clamp(24px, 2.2vw, 36px)` | `clamp(22px, 2vw, 30px)` |
| `cp-eyebrow` | `12px` | `11px` (aligne Stack) |
| `cp-title` (section) | `clamp(44px, 5vw, 72px)` · ls -0.065em | `clamp(44px, 5vw, 76px)` · ls -0.06em |
| `cp-section-framing` | `clamp(21px, 2vw, 29px)` | `clamp(20px, 1.8vw, 26px)` |
| `cp-verdict-statement p` | `clamp(22px, 2.2vw, 32px)` | `clamp(21px, 2vw, 28px)` |
| Mobile hero (640px) | `clamp(52px, 15vw, 72px)` | `clamp(44px, 12vw, 64px)` |
| Tablet section heading | `clamp(42px, 13vw, 60px)` | `clamp(40px, 9vw, 56px)` |

### Nouveaux tokens globaux `tt-*`
Ajout d'une section `TT TYPE SCALE` dans `src/index.css` avec 12 classes documentées :
`tt-hero-title`, `tt-hero-subtitle`, `tt-kicker`, `tt-section-title`, `tt-section-intro`, `tt-body`, `tt-body-large`, `tt-fact-label`, `tt-fact-value`, `tt-fact-value-compact`, `tt-card-title`, `tt-card-body`, `tt-metric-value`.

### Règle anti-exception documentée
Interdiction de définir des font-sizes spécifiques par page si couverts par `tt-*`. Pages Stack = référence. Comparatif = même échelle, structure différente.

### Fichiers modifiés
- `src/index.css` — tokens `tt-*`, corrections `cp-hero-title`, `cp-hero-promise`, `cp-eyebrow`, `cp-title`, `cp-section-framing`, `cp-verdict-statement p`, overrides mobile/tablet
- `docs/DESIGN_SYSTEM.md` — section typographie canonique avec table `tt-*` et règle anti-exception
- `docs/CHANGELOG_AI.md` — cette entrée

### Build
✅ 0 erreur TypeScript · build OK

---

## 2026-05-19 — Sprint 62 : Hero comparatif face-à-face de décision

### Objectif
Transformer le hero des pages Comparatif en vrai face-à-face de décision. Remplacer la table froide de 6 faits par un duel orienté, un contrat éditorial et 3 signaux clés.

### Principe
Le hero doit répondre en 5 secondes : quels outils, quelle logique pour chacun, quel arbitrage ToolTrim, quel risque principal. Zéro redondance avec le Verdict (conditions si-alors) et le Coût (détails pricing).

### Structure hero cible
1. Breadcrumb + eyebrow COMPARATIF
2. Titre `h1` en display typographique
3. Phrase de promesse ToolTrim (editorial, pas générique)
4. Face-à-face duel (`cp-hero-duel`) — 2 cards avec logo, position, nom, description courte
5. Contrat ToolTrim (`cp-hero-contract`) — statement éditorial entre filets, sans carte
6. Micro-fiche 3 cellules (`cp-hero-microfact`) — PAR DÉFAUT / COÛT RÉEL / RISQUE

### Nouveaux champs JSON (`tooltrimAtAGlance`)
- `heroPromise` — phrase de promesse hero (subtitle éditorial)
- `heroPositionA` — titre de position court pour l'outil A (ex. "Le hub externe")
- `heroPositionB` — titre de position court pour l'outil B (ex. "Le hub Microsoft 365")
- `heroContract` — arbitrage ToolTrim en une phrase forte (sans fioritures)

### Fichiers modifiés
- `src/data/comparison-battles/slack-vs-microsoft-teams.json` — ajout des 4 nouveaux champs dans `tooltrimAtAGlance`
- `src/pages/ComparePage.tsx` — extension de `BattleRawData.tooltrimAtAGlance`, `CompareEditorialContent`, `buildBattleEditorialContent()`, `buildFallbackContent()`, `NOTION_VS_AIRTABLE` ; ajout des variables hero duel ; réécriture du JSX hero
- `src/index.css` — mise à jour `cp-hero-title` (clamp 72px→170px, weight 700, tracking -0.075em), `cp-hero-promise` (clamp 24px→36px) ; suppression de `cp-battle-stage/card/center/hero-fact-sheet/fact` ; ajout de `cp-hero-duel`, `cp-hero-duel-card`, `cp-hero-duel-vs`, `cp-hero-contract`, `cp-hero-microfact`, `cp-hero-microfact-cell`

### Résultats
- Le hero oriente en 5 secondes sans dupliquer le contenu des sections suivantes
- Le contrat ToolTrim remplace la recommandation générique par une phrase d'arbitrage directe
- La micro-fiche 3 cellules remplace la table 6 faits — plus lisible, plus focalisée
- Fallback gracieux : toutes les nouvelles propriétés sont optionnelles — si absentes, les valeurs dérivées existantes prennent le relais
- Build : ✅ 0 erreur TypeScript

---

## 2026-05-19 — Sprint 61 : Architecture typographique éditoriale des sections Comparatif

### Objectif
Transformer la mise en page des pages Comparatif en mise en page éditoriale : hiérarchie typographique forte, sections à 2 colonnes (titre / contenu), recommandation comme temps fort editorial (et non card SaaS), colonnes de décision lisibles et scannables.

### Architecture section (nouveau système)

Chaque section suit désormais la structure :
```
cp-container
  cp-eyebrow          ← 12px caps, margin-bottom 28px, poids 700
  cp-section-grid     ← 2 colonnes desktop : 0.9fr / 1.6fr, gap 80px
    cp-section-heading  ← gauche : titre h2 cp-title
    cp-section-body     ← droite : contenu décisionnel
```

Sauf exceptions full-width (features table, alternatives list, FAQ) → `margin-bottom: 28px` sur le titre.

### Verdict (section 01) — refonte complète

| Avant | Après |
|-------|-------|
| p.cp-title + p.cp-section-intro + p.cp-final-recommendation (card border-radius) + cp-verdict-grid (bullet lists ✓/✕) | h2.cp-title + p.cp-section-framing + div.cp-verdict-statement (editorial) + div.cp-decision-columns (prose éditoriale) |

Structure :
1. **`cp-section-framing`** — phrase de cadrage (22–29px, muted, max-width 760px)
2. **`cp-verdict-statement`** — recommandation entre 2 filets horizontaux, sans fond ni card, texte 22–32px 600 noir
3. **`cp-decision-columns`** — 3 colonnes prose éditoriale, 18–24px, séparateurs fins

### CSS — classes supprimées

`.cp-verdict-grid`, `.cp-verdict-col`, `.cp-verdict-col--full`, `.cp-verdict-text`, `.cp-verdict-label`, `.cp-verdict-list`, `.cp-verdict-list--avoid`, `.cp-verdict-avoid-label`, `.cp-final-recommendation`

### CSS — classes ajoutées / mises à jour

| Classe | Changement |
|--------|-----------|
| `.cp-section` | padding `56px 0` → `clamp(80px, 9vw, 140px) 0` |
| `.cp-eyebrow` | font-size 11→12px, margin-bottom 10→28px, font-weight 600→700 |
| `.cp-title` | size `clamp(1.75rem, 3vw, 2.625rem)` → `clamp(44px, 5vw, 72px)`, weight 600→700, tracking -0.055→-0.065em, line-height 0.98→0.92, max-width 620px |
| `.cp-section-grid` | NEW — 2-col grid layout |
| `.cp-section-heading` | NEW — gauche du grid |
| `.cp-section-framing` | NEW — clamp(21px, 2vw, 29px), muted, max-width 760px |
| `.cp-verdict-statement` | NEW — border-top/bottom, no bg, texte clamp(22px, 2.2vw, 32px) 600 |
| `.cp-verdict-statement-label` | NEW — 11px caps, muted |
| `.cp-decision-columns` | NEW — repeat(3, 1fr), border-top |
| `.cp-decision-col` | NEW — padding 28px, border-left sur col 2/3 |
| `.cp-decision-label` | NEW — 11px 700 caps |
| `.cp-decision-text` | NEW — clamp(18px, 1.6vw, 24px), prose |
| `.cp-decision-note` | NEW — 14px muted, label rouge pour "Évite si" |

### JSX — sections mises à jour

- **Verdict** : h2 + cp-section-grid complet + cp-section-framing + cp-verdict-statement + cp-decision-columns
- **Critères** : h2 + cp-section-grid
- **Coût** : h2 + cp-section-grid  
- **Seuil** : h2 + cp-section-grid
- **Vigilance** : h2 + cp-section-grid
- **Alternatives, Features, FAQ** : h2 (full-width, marginBottom 28px inline)

Toutes les balises `<p className="cp-title">` → `<h2 className="cp-title">` (amélioration sémantique SEO)

### Mobile

- Grille en 1 colonne sous 1023px, gap 32px
- Titre mobile : `clamp(42px, 13vw, 60px)`
- Colonnes de décision empilées, border-left supprimé, border-top par article
- cp-section-framing : 20px
- cp-verdict-statement p : 21px

### Build
- `npx tsc --noEmit` → ✅ 0 errors
- `npm run build` → ✅ built in 13s, 0 errors

## 2026-05-19 — Sprint 60 : Verdict structuré + données pricing réelles

### Objectif
Zéro redondance entre sections de la page comparatif. Chaque section répond à une question distincte. Le verdict affiche des listes à puces contextuelles au lieu d'un bloc de texte. Le coût réel utilise les données `pricingComparison` vérifiées.

### Principe de non-redondance
| Section | Question unique |
|---------|----------------|
| Hero fact sheet | Qui utilise quoi en un regard (étiquettes courtes) |
| 01 Verdict | Conditions précises pour choisir A / B / éviter chacun / éviter les deux |
| 02 Critères | Les critères qui changent vraiment le score final |
| 03 Coût réel | Réalité des plans gratuits, quand payer, coûts cachés (jamais dans le hero) |
| 04 Features | Fonctions qui changent le résultat (table comparative) |
| 05 Seuil | À quel moment on bascule de A vers B |
| 06 Vigilance | Erreurs de choix fréquentes et conséquences |

### Fichiers modifiés

**`src/pages/ComparePage.tsx`**
- `BattleRawData` — 3 nouveaux types top-level : `tooltrimAtAGlance`, `verdict`, `pricingComparison`
- `CompareEditorialContent` — 11 nouveaux champs : `chooseAIfList[]`, `chooseBIfList[]`, `avoidAIfList[]`, `avoidBIfList[]`, `avoidBothIfList[]`, `aglanceBestForA/B`, `aglanceBudget`, `aglanceRisk`, `aglanceDefaultLabel`, `aglanceLevel`
- `buildBattleEditorialContent()` — lit `data.verdict.*` pour les listes puces, `data.pricingComparison.*` pour les 3 lignes coût, `data.tooltrimAtAGlance.*` pour les signaux hero
- Hero fact sheet — préfère les overrides `aglance*` quand disponibles
- Section `#verdict` JSX — remplace les 3 blocs de texte par des listes `✓ / ✕` avec `cp-verdict-list` et `cp-verdict-avoid-label`
- `NOTION_VS_AIRTABLE` inline const — ajout des 11 nouveaux champs
- `buildFallbackContent()` — ajout des 11 champs stub

**`src/data/comparison-battles/*.json`** (11 fichiers)
- Merge de `verdict` (summary, chooseAIf[], chooseBIf[], avoidAIf[], avoidBIf[], avoidBothIf[], finalRecommendation) depuis les fichiers vérifiés Downloads
- Merge de `pricingComparison` (entryLevel, freePlanReality, whenPaidBecomesNecessary, hiddenCosts, tooltrimNote) depuis les fichiers vérifiés Downloads
- `slack-vs-microsoft-teams.json` — `tooltrimAtAGlance` enrichi de 3 champs hero concis : `defaultChoiceLabel`, `budgetShort`, `complexityLabel` (valeurs mission : "Ça dépend du socle existant", "Slack s'ajoute. Teams peut déjà être inclus.", "À cadrer") + mise à jour `bestForToolA/B`, `mainRisk`

**`src/index.css`**
- `.cp-verdict-col--full` — span 3 colonnes pour "Évite les deux"
- `.cp-verdict-list` — liste puces `✓` avec gap 6px
- `.cp-verdict-list--avoid` — puce `✕` rouge (#C0392B)
- `.cp-verdict-avoid-label` — label "Évite X si…" en 11px caps rouge

### QA zero-redondance (Slack vs Teams)
- Hero : étiquettes courtes ("Multi-clients + stack ouverte", "À cadrer", etc.)
- Verdict 01 : conditions précises ×5 (chooseA, chooseB, avoidA, avoidB, avoidBoth)
- Coût 03 : freePlanReality, whenPaid, hiddenCosts — jamais répétés ailleurs
- Aucune information n'apparaît dans deux sections différentes

### Build
- `npx tsc --noEmit` → ✅ 0 errors
- `npm run build` → ✅ built in 27s, 0 errors

## 2026-05-18 — Sprint 59 : Hero fact sheet no-truncation fix

### Objectif
Supprimer toute troncature des valeurs de la table signalétique hero, en particulier NIVEAU qui affichait "inst..." au lieu de "Installé". Restreindre la grille 6 colonnes à ≥1440px.

### Cause racine
`.sd-fact-col--compact .sd-fact-value { white-space: nowrap }` (ligne ~14115, sprint typographie) était appliqué à la colonne NIVEAU car "NIVEAU" figurait dans `compactLabels`. Combiné à `overflow: hidden` hérité du conteneur `.sd-hero-fact-table`, le texte était coupé invisiblement.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — "NIVEAU"/"LEVEL" sortis de `compactLabels` vers un nouveau tableau `levelLabels`; le modificateur `sd-fact-col--level` est appliqué à la place de `sd-fact-col--compact`.
- `src/index.css` — bloc sprint ajouté en fin de fichier : grille 6 col uniquement ≥1440px, 3×2 col 769–1439px, 2 col ≤768px, 1 col ≤480px. Règles `!important` sur `white-space`, `overflow`, `text-overflow`, `-webkit-line-clamp`, `max-width` pour toutes les familles de valeurs (compact, level, long).
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la règle no-truncation et du nouveau modificateur niveau.

### Résultat
- Aucune cellule de la table signalétique ne peut tronquer sa valeur.
- NIVEAU a son propre modificateur CSS `sd-fact-col--level` (police légèrement plus petite que compact, mais `white-space: normal`).
- La grille 6 colonnes ne s'active qu'à ≥1440px ; entre 769px et 1439px, la table est 3×2.

---

## 2026-05-18 — Sprint 58 : Budget decision module redesign

### Objectif
Remplacer les 3 grandes cartes avec tool chips de la section Budget par un module de décision épuré : bande de seuils (3 niveaux), 3 principes courts (sans logos) et une note. Supprimer le CTA "Auditer ma stack" de cette section.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement complet du bloc BUDGET : suppression de `sd-budget-decision-grid`, `BudgetToolChips` et `sd-budget-action`/Link CTA ; ajout de la bande de seuils avec classes `sd-bt-range/label/desc`, du bloc `sd-budget-principles` et d'une note étendue.
- `src/index.css` — ajout du sprint budget decision module : `.sd-budget-thresholds` (bordure + border-radius unifiés), `.sd-budget-threshold--active`, `.sd-bt-range/label/desc`, `.sd-budget-principles`, `.sd-budget-principle`, `.sd-bp-head/body`, `.sd-budget-intro` (18px), `.sd-budget-note` (13px) et responsive ≤900px.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du module décision budget sans logos ni CTA.

### Résultat
- Aucun tool chip / logo dans la section Budget.
- Le CTA "Auditer ma stack" / "Audit my stack" est retiré de cette section.
- Titre dynamique construit depuis `stack.monthlyBudget` avec fallback.
- Bande de seuils : Testing (0–15€) / Livrer régulièrement (valeur dynamique, highlighted) / Auditer (80–100€).
- 3 principes : À payer / À garder gratuit / À auditer — texte uniquement.
- Note éditoriale courte, 13px muted.
- Variables inutilisées `budgetPaidTools`, `budgetFreeTools`, `budgetDriverTools`, `budgetWatchLabel` supprimées.

---

## 2026-05-18 — Sprint 57 : Simplify workflow tool item containers

### Objectif
Alléger les tool items dans les workflow family cards : un seul conteneur logo (56×56px), plus de double border/ring autour des logos, nom à 17px/650, pas de badge statut sous le nom (les group tags portent le sens).

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — `ToolLogo` size prop : 26 → 34 dans les trois groupes (core, secondary, extension).
- `src/index.css` — sprint block mis à jour : `.sd-tool-item` flex + gap 14px, `.sd-tool-logo` 56×56px radius 16px border #DADAD4, `.sd-tool-logo img` strip ring/bg/padding de ToolLogo, `.sd-tool-name` 17px/650, `.sd-tool-grid` auto-fit minmax(210px,1fr), mobile 48px logo / 28px image.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern tool item.

### Avant → après
- **Niveaux de nesting logo :** 2 (`.sd-tool-logo` shell 44px + `ToolLogo <img>` avec ring-1/bg-card/padding propres) → 1 (`.sd-tool-logo` seul shell 56px, img sans décoration propre)
- **Supprimé du JSX :** aucun (status badge déjà absent depuis sprint précédent)
- **Taille logo :** 44px → 56px (shell), 26px → 34px (image), mobile 40px → 48px / 22px → 28px
- **Nom outil :** 15px/600 → 17px/650, max-width 160 → 180px
- **Grid :** minmax(180px) → minmax(210px), gap 14/24 → 18/28

### Résultat
- Logos bien visibles, un seul border, pas de double ring
- Group tags (Socle recommandé / Selon ton usage / Extensions) toujours visibles
- 0 erreurs build, 0 erreurs lint

---

## 2026-05-18 — Sprint 56 : Hero fact sheet typography scale

### Objectif
Harmoniser l'échelle typographique de la table signalétique hero : valeurs métriques (Budget, Outils, Niveau) en grand/gras distinct des valeurs descriptives (Profil, Workflow, Point d'attention) en semi-gras lisible. Budget divisé en montant principal (`118€`, 24–32px, 700) + unité (`/mois`, 14px, muted).

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — refactoring du helper `splitBudget()` (propriétés `main`/`unit`), JSX mis à jour avec `sd-budget-composition` + `sd-budget-main` + `sd-budget-unit`.
- `src/index.css` — nouveau bloc sprint final : `min-width: 0` sur toutes les cellules, deux familles CSS (`sd-fact-col--compact` / `sd-fact-col--long`), composition budget en `inline-flex` baseline.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de l'échelle typographique.

### Échelle typographique
- **Métrique** (`sd-fact-col--compact`): `clamp(1.5rem, 2vw, 2rem)` — 24–32px, font-weight 700, letter-spacing -0.045em, white-space nowrap
- **Descriptif** (`sd-fact-col--long`): `clamp(1.0625rem, 1.1vw, 1.25rem)` — 17–20px, font-weight 600, letter-spacing -0.025em, overflow-wrap anywhere
- **Budget main** (`sd-budget-main`): clamp 24–32px, 700, -0.05em
- **Budget unit** (`sd-budget-unit`): 14px, 500, #6F6F68

### Breakpoints responsive
- ≥1280px : 6 colonnes pondérées (minmax robustes)
- 1025–1279px : 3×2
- ≤1024px : 2 colonnes, border-radius 14px
- ≤420px : 1 colonne, border-radius 12px

### Résultat
- "118€" s'affiche grand et gras, "/mois" en petit et muted — jamais coupé
- Colonnes descriptives lisibles à toutes largeurs sans overflow
- Grille protégée par `min-width: 0` sur chaque cellule

---

## 2026-05-18 — Sprint 55 : Hero fact sheet overflow fix

### Objectif
Corriger les dépassements de contenu dans la table signalétique du hero : la valeur "118€/mois" dans la colonne BUDGET était coupée. Toutes les largeurs de colonnes ont été rendues robustes face à la longueur réelle du contenu, et la typographie a été différenciée entre colonnes compactes (Budget/Outils/Niveau) et colonnes longues (Profil/Workflow/Point d'attention).

### Correctif critique
`min-width: 0` sur les enfants de la grille CSS est indispensable : sans cette propriété, un contenu plus large que l'espace alloué force la colonne à s'élargir, ce qui provoque le blowout de la grille.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du helper `splitBudget()`, rendu conditionnel de la valeur budget avec `sd-budget-amount` (grand) + `sd-budget-unit` (petit).
- `src/index.css` — nouveau bloc sprint avec `grid-template-columns` pondérées (minmax robustes par colonne), `min-width: 0` sur `.sd-fact-col`, typographie compacte/longue différenciée, responsive 6→3 colonnes à 1279px, 2 colonnes à 1024px.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du correctif.

### Budget : affichage montant/unité séparé
Le budget "118€/mois" est maintenant rendu en deux spans : `sd-budget-amount` (valeur, clamp 22–30px, 700) + `sd-budget-unit` ("/mois", 13px, #6F6F68). Plus premium, moins de risque de dépassement.

### Breakpoints responsive
- ≥1280px : 6 colonnes pondérées
- 1025px–1279px : 3 colonnes (3×2)
- 769px–1024px : 2 colonnes
- ≤768px : 2 colonnes, border-radius 12px
- ≤420px : 1 colonne

### Résultat
- "118€/mois" et "420€/mois" ne sont plus coupés à aucune largeur.
- La grille ne blowout plus grâce à `min-width: 0`.
- Le budget passe en 3 colonnes à 1279px, ce qui donne à chaque cellule ≈1/3 du conteneur.

---

## 2026-05-18 — Sprint 54 : Workflow card UX hierarchy

### Objectif
Raffiner la hiérarchie visuelle et typographique des cartes « Carte de la stack » : retravailler la colonne gauche, remplacer les étiquettes de groupe par des pill tags, agrandir les logos, supprimer les compteurs flottants et simplifier les items d'outil.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des classes `sd-stack-card-title`, `sd-stack-card-role`, `sd-stack-card-micro` dans la colonne gauche ; remplacement de `sd-tool-group-label` par `sd-group-tag` ; outils passent de `sd-tool-pill` (Link pill) à `sd-tool-item` (Link avec `sd-tool-logo` + `sd-tool-name`) ; micro-info visible avant le bouton expand quand des outils sont masqués ; suppression du bloc `sd-tools-total` dans la colonne droite.
- `src/index.css` — nouveau bloc Sprint 54 : `sd-stack-card-title` (clamp 26–32px, bold, tight tracking), `sd-stack-card-role` (17px, muted), `sd-stack-card-decision` (15px, 500, dark — override du sprint précédent), `sd-stack-card-micro` (12px, muted), `sd-group-tag` (pill transparent, border, 10px caps), `sd-tool-item` / `sd-tool-logo` (44px, radius 12, white bg) / `sd-tool-name` (15px, 600), `sd-tool-grid` en CSS grid `auto-fill minmax(180px)`, `sd-tools-total` masqué, mobile responsive.

### Résultat
- Colonne gauche : titre éditorial > description > phrase de recommandation > micro-info > bouton expand.
- Plus de compteur flottant "X outils affichés" ni de total au bas de la colonne droite.
- Logos 44px dans un conteneur rond, bien lisibles.
- Pill tags slim pour identifier les trois groupes (Socle recommandé · Selon ton usage · Extensions).
- Items d'outil simplifiés : logo + nom uniquement, sans badge de statut.

---

## 2026-05-18 — Sprint 53 : Workflow cards grouped by recommendation level

### Objectif
Remplacer la liste plate d'outils avec badge de statut par-outil dans les cartes de la stack map. Chaque carte affiche désormais trois groupes — Socle recommandé / Selon ton usage / Extensions — pour que le lecteur comprenne immédiatement quoi adopter, quoi activer selon son usage et quoi éviter par réflexe.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout de `getToolGroup()`, `groupToolsByRecommendation()`, `getWorkflowDecisionCopy()` ; remplacement du rendu de la liste plate par la structure groupée ; suppression de `.sd-tools-count-indicator` (résumé de comptage en haut) ; ajout du total discret en bas `.sd-tools-total` ; logique d'expansion progressive (socle + 3 secondaires visibles, reste sur expand).
- `src/index.css` — ajout du bloc sprint avec `.sd-stack-card-decision`, `.sd-tool-group`, `.sd-tool-group-label`, `.sd-tool-grid`, `.sd-tool-pill`, `.sd-tools-total`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau pattern.

### Résultat
- Les outils sont groupés visuellement par niveau de recommandation dans chaque card.
- Les badges de statut par outil (`Socle`, `Selon usage`, `Extension`) sont supprimés des cartes workflow : le groupe-label porte l'information.
- Un micro-texte éditorial (`sd-stack-card-decision`) sous la phrase de rôle résume la logique de choix pour cette étape.
- L'indicateur "6 sur 9 outils affichés" en haut de grille est supprimé ; remplacé par "9 outils dans cette étape" discret en bas.
- Bouton d'expansion uniquement quand des groupes sont masqués (secondaires > 3 ou extensions présentes).
- 0 erreur de build, 0 erreur lint.

---

## 2026-05-18 — Sprint 52 : Hero fact sheet refinement

### Objectif
Affiner la table signalétique du hero des fiches stack : réordonner les colonnes, pondérer la grille, hiérarchiser la typographie entre colonnes courtes (chiffres) et longues (texte), renommer RISQUE en POINT D'ATTENTION et mettre à jour les copies éditoriales par slug.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouvelle ordre des repères (PROFIL · BUDGET · OUTILS · NIVEAU · WORKFLOW · POINT D'ATTENTION), labels compact/long mis à jour pour inclure `POINT D'ATTENTION` et `KEY RISK`, copies éditoriales mises à jour pour 6 slugs (designer-freelance-solo, consultant-b2b-propre, developpeur-freelance-shipper, createur-sites-ia-automation, architecte-interieur), ajout du slug agence-marketing.
- `src/index.css` — nouveau bloc sprint : grille pondérée 6 colonnes, breakpoints responsive (1199px, 900px, 420px), typographie `.sd-fact-col--compact` (20–26px / 700) et `.sd-fact-col--long` (15–18px / 600), labels `10px/600 #555550`, `.sd-hero-promise max-width 860px`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de l'ordre des colonnes, du renommage RISQUE → POINT D'ATTENTION, de la hiérarchie typographique.

### Résultat
- Ordre des colonnes : PROFIL · BUDGET · OUTILS · NIVEAU · WORKFLOW · POINT D'ATTENTION.
- Budget, Outils, Niveau : colonnes étroites, valeurs 20–26px / gras 700 — les chiffres sautent aux yeux.
- Profil, Workflow, Point d'attention : colonnes larges, valeurs 15–18px / semi-bold 600 — le texte reste lisible sans débordement.
- "RISQUE" disparu de toutes les tables ; remplacé par "POINT D'ATTENTION" (FR) / "KEY RISK" (EN).
- Slug agence-marketing couvert par un bloc éditorial dédié.
- Aucun scroll horizontal sur aucun breakpoint.

---

## 2026-05-18 — Sprint 51 : Workflow card UX improvements

### Objectif
Améliorer la lisibilité des cartes "Carte de la stack" (section Outils) sans toucher au héros ni aux autres sections. Quatre problèmes résolus : étiquette "À challenger" anxiogène → "Extension", badge "À surveiller" supprimé, résumé technique remplacé par un résumé lisible, bouton d'expansion trop discret remplacé par un vrai bouton secondaire avec bordure, et ajout d'un indicateur de compte visible.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des fonctions `getWorkflowStatusLabel()` et `buildWorkflowStatusSummary()` ; remplacement du rendu dans la section workflow cards : suppression du badge `.sd-stack-map-watch`, remplacement du résumé technique par `buildWorkflowStatusSummary()`, remplacement du bouton `.sd-stack-map-toggle` par `.sd-expand-btn`, ajout du wrapper `.sd-stack-map-tools-wrapper` avec indicateur `.sd-tools-count-indicator`, remplacement de `getToolDecisionDisplay()` par `getWorkflowStatusLabel()` pour les labels outils.
- `src/index.css` — bloc sprint appended : `.sd-stack-map-tools-wrapper`, `.sd-tools-count-indicator`, `.sd-expand-btn` (hover, focus-visible), responsive mobile.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — mise à jour des spécifications des cartes workflow.

### Décisions d'implémentation
- `getWorkflowStatusLabel()` utilisé UNIQUEMENT dans les workflow cards — les autres sections (Risques, Budget, hero) gardent leurs labels existants.
- Le modèle de données (`decision: "core" | "conditional" | "challenge"`) est inchangé.
- `buildWorkflowStatusSummary()` utilise `getToolDecisionStatus()` comme fallback pour les items sans `slot.decision` explicite.
- L'indicateur de compte est toujours affiché (même quand tous les outils sont visibles), avec libellé adapté.
- Le bouton expand est masqué quand `hiddenCount === 0` (grâce au `isExpandable` guard existant).
- Le badge "À surveiller" (`shouldWatchFamily`, `.sd-stack-map-watch`) est entièrement supprimé du JSX des workflow cards. La logique `shouldShowWorkflowWatch()` et le CSS existant sont conservés pour éviter des régressions.

### Nouvelles étiquettes de statut (workflow cards uniquement)
| Clé interne | FR | EN |
|---|---|---|
| `core` | Socle | Core |
| `conditional` | Selon usage | As needed |
| `challenge` | Extension | Extension |

### Résultat
- Aucun "À challenger" visible dans les cartes workflow.
- Aucun badge "À surveiller" visible dans les cartes workflow.
- Résumé lisible : "Socle : 2 · Selon usage : 4 · Extensions : 3".
- Indicateur de compte : "6 sur 9 outils affichés" / "9 outils affichés".
- Bouton expand visible, avec bordure `#DADAD4`, hover noir.
- Build : 0 erreurs. Lint : 0 erreurs (156 warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 50 : Balanced hero fact-sheet columns

### Objectif
Remplacer la grille uniforme `repeat(6, 1fr)` de la table signalétique par une grille pondérée : colonnes BUDGET/OUTILS/NIVEAU compactes, colonnes PROFIL/WORKFLOW/RISQUE moyennes à larges. Raccourcir les valeurs dynamiques pour qu'aucune cellule ne devienne un paragraphe.

### Fichiers modifiés
- `src/index.css` — bloc sprint appended : grille pondérée `.sd-hero-fact-table` (1.5fr workflow, 0.4fr outils…), padding `.sd-fact-col` réduit à 22px 24px, modificateur `.sd-fact-col--compact` (valeur 20–24px), modificateur `.sd-fact-col--long` (valeur 15–17px / line-height 1.3), breakpoints 900–1199px → 3 col, ≤900px → 2 col, ≤420px → 1 col.
- `src/pages/StackDetailPage.tsx` — rendu de la table via `.map()` : ajout dynamique des classes `sd-fact-col--compact` (BUDGET, OUTILS, NIVEAU, TOOLS, LEVEL) et `sd-fact-col--long` (PROFIL, WORKFLOW, RISQUE, PROFILE, RISK) ; ajout du helper `truncate(s, max=40)` ; application de `truncate()` aux valeurs PROFIL, WORKFLOW, RISQUE du fallback dynamique.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — mise à jour des spécifications de la table signalétique : grille pondérée, modificateurs compact/long, règle éditoriale max 8 mots, responsive révisé.

### Décisions d'implémentation
- Pas de nouvelles classes sur les stacks éditoriaux dédiés (les valeurs sont déjà courtes) — les classes sont ajoutées dynamiquement sur `repere.label` dans le `.map()`.
- Le fallback dynamique reste intact fonctionnellement ; seule la troncature à 40 chars est ajoutée.
- Les breakpoints remplacent les anciens 1024/640/390 dans le bloc sprint — la cascade CSS garantit que les overrides sprint s'appliquent en dernier.

### Résultat
- Desktop ≥1200px : WORKFLOW 50% plus large que OUTILS, table moins haute.
- 900–1199px : 3 colonnes par rangée.
- ≤900px : 2 colonnes. ≤420px : 1 colonne.
- Build : 0 erreurs. Lint : 0 erreurs (156 warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 49 : Premium sticky bottom section nav (StackStickyNav)

### Objectif
Ajouter une navigation flottante premium en bas d'écran sur les fiches stack detail (desktop uniquement), remplaçant la subnav inline sur desktop. La subnav inline reste visible sur mobile. Inspiration Awwwards : dark capsule centré, logo à gauche, items au centre, item actif avec bordure outline visible.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du composant `StackStickyNav` (inline, avant le composant principal), import `useRef`, états `sentinelRef` et `isStickyVisible`, sentinel `<div>` à la fin de la section hero, wrapper `.sd-subnav-wrapper` autour de la subnav inline, rendu de `<StackStickyNav>` en bas du JSX principal.
- `src/index.css` — bloc sprint appended : `.stack-sticky-nav`, `.stack-sticky-nav--hidden`, `.stack-sticky-nav-logo`, `.stack-sticky-nav-items`, `.stack-sticky-nav-item`, `.stack-sticky-nav-item--active`, masquage `.sd-subnav-wrapper` sur desktop (≥768px), masquage `.stack-sticky-nav` sur mobile (≤767px), `scroll-margin-top: 80px` sur sections.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — documentation du composant `StackStickyNav`.

### Architecture du composant
- `StackStickyNav` : composant fonctionnel inline dans `StackDetailPage.tsx`, reçoit `sections`, `activeId`, `prefix`, `visible`.
- Visibilité contrôlée par `IntersectionObserver` sur un sentinel `<div>` placé à la fin de la `<section>` hero. Quand le sentinel sort du viewport, `isStickyVisible` passe à `true`.
- Active state : partagé avec l'état `activeSection` existant (scrollspy déjà en place).
- Click : `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- Animation : `opacity` + `translateY` 220ms ease. `prefers-reduced-motion` → transition 0ms.

### Décisions d'implémentation
- Pas de nouveau fichier : composant inline dans `StackDetailPage.tsx`.
- La subnav inline existante (`sd-nav`) est conservée intacte pour mobile — seul son wrapper `.sd-subnav-wrapper` est masqué sur desktop via CSS.
- `aria-label` sur le `<nav>`, `aria-current="page"` sur l'item actif, focus ring visible.

### Résultat
- Desktop ≥768px : capsule flottante sombre en bas, subnav inline masquée.
- Mobile <768px : subnav inline visible, capsule masquée.
- Build : 0 erreurs. Lint : 0 erreurs (warnings pre-existants inchangés).

---

## 2026-05-18 — Sprint 48 : Hero premium fact sheet — no CTA, bigger typography, generous spacing

### Objectif
Finaliser le hero des fiches stack en bloc éditorial premium : supprimer le CTA "Analyser ma stack" du hero, agrandir la typographie (H1 plus grande, valeurs de table plus lisibles), aérer les paddings, garder la non-redondance absolue.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — suppression du `<Link>` CTA dans la zone hero (`.sd-hero-editorial`).
- `src/index.css` — bloc sprint appended : overrides `.sd-hero-editorial` (padding 96px), `.sd-hero-h1` (weight 700, clamp plus large), `.sd-hero-desc` (color #3A3A38), `.sd-hero-eyebrow` (margin-bottom 20px), `.sd-hero-fact-table` (margin-top 56px, margin-bottom 72px), `.sd-fact-col` (padding 24px), `.sd-fact-value` (clamp ~15–19px). Mobile 390px → 2 colonnes (pas 1).
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle mise à jour : Zéro CTA dans le hero, non-redondance absolue explicitée, typographie et paddings cibles documentés.

### Résultat
- Hero : breadcrumb → eyebrow → H1 → promesse → table signalétique. Rien d'autre.
- CTA supprimé du hero. Il reste dans `sd-cta-band` après les sections.
- H1 : weight 700, clamp(3.25rem, 5.5vw, 4.5rem), letter-spacing -0.065em.
- Valeurs de la table : clamp(0.9375rem, 1.3vw, 1.1875rem), lisibles sans zoom.
- Mobile 390px : table reste en 2 colonnes (pas de scroll horizontal, pas de colonne unique).
- Build : 0 erreurs. Lint : 0 erreurs (warnings pre-existants inchangés).

---

## 2026-05-18 — Stack detail : hero premium fact sheet (table signalétique, zéro panneau droit)

### Objectif
Transformer le hero des fiches stack en un bloc éditorial propre suivi d'une table signalétique horizontale à 6 colonnes. Suppression du panneau droit (budget + watchout = doublons). Chaque information n'apparaît qu'une seule fois.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouveau layout héro (`.sd-hero-editorial` + `.sd-hero-fact-table`), labels repères renommés (PROFIL/WORKFLOW/BUDGET/OUTILS/NIVEAU/RISQUE), suppression du panneau `.sd-snapshot`, données éditoriales ajoutées pour `consultant-b2b-propre`, alias de slug `consultant-b2b` → `consultant-b2b-propre`, nettoyage des variables inutilisées (budgetDisplay, watchText, logoPills, logoOverflow).
- `src/index.css` — nouveau bloc sprint avec classes `.sd-hero-editorial`, `.sd-hero-fact-table`, `.sd-fact-col`, `.sd-fact-label`, `.sd-fact-value`. Responsive 6→3→2→1 colonnes.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle hero mise à jour.

### Détails
- Suppression de `.sd-reperes-grid` (grille 2×3 administrative) et du panneau `.sd-snapshot` (budget + watchout + logos).
- Remplacement par `.sd-hero-fact-table` : une seule rangée horizontale de 6 colonnes — PROFIL · WORKFLOW · BUDGET · OUTILS · NIVEAU · RISQUE.
- Contenu éditorial spécifique pour 5 stacks : `consultant-b2b-propre`, `designer-freelance-solo`, `developpeur-freelance-shipper`, `createur-sites-ia-automation`, `architecte-interieur`.
- Fallback dynamique pour toutes les autres stacks via `buildFallbackEditorial`.
- Slug alias : `/fr/stacks/consultant-b2b` résolu vers `consultant-b2b-propre`.
- Table style : fond `#FAFAF7`, bordure `#DADAD4`, radius 16px, labels 10px uppercase, valeurs 14px/600.

---

## 2026-05-18 — Stack detail : hero decision dashboard (repères compact + panel simplifié)

### Objectif
Simplifier le hero des fiches stack en un "decision dashboard" lisible en 5 secondes. Remplacement des 3 grandes cartes (POUR QUI / CE QUE ÇA COUVRE / À ÉVITER SI) par une grille compacte de 6 repères. Simplification du panel droit pour éviter les doublons.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — nouveau composant repères, `getHeroDecisionMap` retourne `reperes` + `socleSlugs`, panel droit allégé, helper `getSocleTools`, nettoyage imports inutilisés.
- `src/index.css` — nouveau bloc sprint avec classes `.sd-reperes-grid`, `.sd-repere-item`, `.sd-repere-label`, `.sd-repere-value`.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle hero decision dashboard mise à jour.

### Détails
- Les 3 cartes `stack-fit-card--hero` (POUR QUI / CE QUE ÇA COUVRE / À ÉVITER SI) sont supprimées du hero.
- Remplacement par `.sd-reperes-grid` : grille 3×2 de data points (Pour qui · Workflow · Budget · Outils · Niveau · À surveiller).
- Contenus spécifiques pour 4 stacks : `designer-freelance-solo`, `developpeur-freelance-shipper`, `sites-ia-automation`, `architecte-interieur`. Fallback dynamique pour les autres.
- Panel droit : suppression de la grille facts (Profil/Outils/Niveau/Complexité) — ces infos sont maintenant dans les repères. Seuls Budget cible + Socle (logos) + À surveiller restent.
- Helper `getSocleTools` : utilise `socleSlugs` éditoriales si définies, sinon remonte les outils Socle de la stack.
- `getHeroDecisionMap` refactorisé pour retourner un type `HeroDecisionMap` avec `reperes[]` et `socleSlugs[]`.
- Imports inutilisés supprimés : `getStackDerivedFields`, `getStackObjectives`.

---

## 2026-05-17 — Stack detail : système éditorial, logos et lignes pointillées

### Objectif
Renforcer le langage UI des fiches stack avec des marqueurs ToolTrim plus reconnaissables : séparateurs pointillés, chips d'usage, matrice de décision avec logos et lignes outils plus éditoriales.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — chips d'usage, matrice décisionnelle avec logos/fallbacks, colonne décision dédiée dans les lignes outils.
- `src/index.css` — utilitaire pointillé, chips larges, matrice éditoriale, colonne décision et rythme responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — marqueurs réutilisables pour fiches stack.

### Détails
- Ajout des usages clés dans l'overview pour `architecte-interieur` et `developpeur-freelance-shipper`.
- Remplacement des quatre cartes décision par des lignes éditoriales avec logos ou fallback textuel.
- Ajout d'une colonne décision dédiée dans la liste d'outils, avec séparateurs pointillés.
- Affinage du résumé hero avec séparateurs pointillés internes.

---

## 2026-05-17 — Stack detail : outils recommandés en liste de décision

### Objectif
Transformer la section “Outils recommandés” des fiches stack en liste de décisions plus lisible, notamment pour les longues stacks comme architecte d'intérieur.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre, sous-texte, légende en chips, headers de catégories et lignes d'outils nettoyées.
- `src/index.css` — nouveau layout compact pour les lignes d'outils, catégories et états responsive.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — pattern de liste outils pour les fiches stack.

### Détails
- Remplacement des points couleur par des chips textuelles “Essentiel”, “Conditionnel”, “À challenger”.
- Suppression des libellés répétés “Rôle” et “Pourquoi” dans chaque ligne.
- Catégories structurées avec nom, compteur et séparateur net.
- Lignes organisées autour de l'identité outil, la raison, le prix et l'action.

---

## 2026-05-17 — Stack detail : vue d'ensemble architecte d'intérieur

### Objectif
Rendre la section “Vue d'ensemble” plus lisible sur les fiches stack, avec un titre éditorial court, des cartes de lecture et une note ToolTrim plus légère.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre, intro et cartes spécifiques pour la stack architecte d'intérieur ; note ToolTrim restructurée.
- `src/index.css` — affinage typographique et card-based layout pour la section overview et la note.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle de pattern pour les sections “Vue d'ensemble” des fiches stack.

### Détails
- Remplacement du H2 audience trop long par “Une chaîne claire, du brief au chantier.” pour `/fr/stacks/architecte-interieur`.
- Passage de “Elle sert à / Elle évite / Elle n'est pas faite pour” en cartes blanches avec bordures fines.
- Note ToolTrim allégée avec une ligne principale, une astuce de dossier projet et un point “À challenger”.

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

---

## 2026-05-16 — Sprint 12 : Raffinement du cloud éditorial

### Objectif
Rendre la section plus naturelle et premium : copy moins générique, cloud moins "panel UI", décisions mieux intégrées dans la composition.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — copy affinée, positions du cloud resserrées, classes de profondeur et de motion par logo.
- `src/index.css` — container plus atmosphérique, ombre subtile, labels avec blur, axe discret et animations différenciées.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Subtitle retenu : `Un outil de plus paraît souvent anodin. Jusqu’au moment où ta stack devient illisible.`
- Closing retenu : `ToolTrim transforme le bruit en décisions : garder, couper, remplacer.`
- Ajout du label discret `À challenger` sans densifier la copy principale.

---

## 2026-05-16 — Sprint 13 : Cloud de logos plus structuré

### Objectif
Renforcer uniquement la zone droite de la section de positionnement : plus de densité, plus de profondeur, et une lecture plus claire de la stack comme ensemble.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout de Framer et Webflow, nouvelle composition à 18 logos, classes de profondeur et motion enrichies.
- `src/index.css` — container plus fort, inner frame, axe discret, tailles 46/58/72, profondeur foreground/mid/back et animation `floatLogoD`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La composition devient plus dense au centre et moins uniformément dispersée.
- Les labels décisionnels restent intégrés au cloud, sans créer de diagramme.
- La motion reste ambiante et respecte `prefers-reduced-motion`.

---

## 2026-05-16 — Sprint 14 : Section diagnostic des coûts cachés

### Objectif
Transformer la section `Ce que ToolTrim coupe` en bloc de diagnostic plus lisible : labels métier, exemples plus visibles et CTA rattaché à la liste.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre, intro courte, labels `DOUBLON / DORMANT / TROP TÔT / TROP LOURD / TROP CHER`.
- `src/index.css` — rows diagnostiques, grille label/contenu, exemples sans italique, CTA aligné à la colonne texte.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les puces génériques disparaissent.
- La section explique mieux ce que ToolTrim détecte avant l'audit.
- Les exemples deviennent un élément de preuve, pas une note secondaire.

---

## 2026-05-17 — Sprint 15 : Suppression section visuelle Trois façons

### Objectif
Retirer de la home la section doublon avec chips statistiques et cartes visuelles `Couper / doublons / downgrade`, devenue trop lourde par rapport à la nouvelle direction éditoriale.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — suppression du rendu `StatsSection` et de son import.
- `src/components/home/StatsSection.tsx` — composant supprimé car il n'était plus référencé ailleurs.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La home passe directement de `BusinessObjectivesSection` à `PersonasSection`.
- Les 3 cartes principales `AUDIT / STACK / COMPARER` sont conservées.
- CSS `home-actions-*` / `hac-*` conservé car partagé avec les cartes principales.

---

## 2026-05-17 — Sprint 16 : Fusion diagnostic et résultat

### Objectif
Fusionner la section `Ce qui pèse` et la section `Résultat concret` pour raconter une seule séquence : diagnostic → décision → résultat.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — intégration des tableaux avant/après dans `WhatWeCutSection`, suppression du rendu et du composant `AvantApresSection`.
- `src/index.css` — styles `hp-result-*`, spacing de section unifié et CTA unique.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Une seule section explique ce que ToolTrim révèle et montre un exemple de résultat.
- Le wording précise que l'économie est un exemple, pas une promesse.
- Le CTA `Auditer ma stack` n'apparaît plus qu'une fois dans ce bloc.

---

## 2026-05-17 — Sprint 17 : Suppression position/process redondants

### Objectif
Alléger la home en supprimant deux blocs devenus redondants avec la nouvelle direction : l'ancien bloc position `Pas un annuaire` et le bloc sombre `Processus`.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — suppression des rendus `HowItWorks` et `DiffTable` et de leurs imports lazy.
- `src/components/home/HowItWorks.tsx` — composant supprimé car non référencé ailleurs.
- `src/components/home/DiffTable.tsx` — composant supprimé car non référencé ailleurs.
- `src/index.css` — suppression des styles exclusifs `home-position-*` / `home-decision-*` du bloc `Pas un annuaire`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les sections `NOTRE POSITION` et `Processus` ne sont plus rendues sur la home.
- La home enchaîne directement `PersonasSection` vers `TestimonialsSection`.
- Les styles du ticker `home-decision-ticker-*` sont conservés car ils appartiennent à la barre animée.

---

## 2026-05-17 — Sprint 18 : Diagnostic et résultat dans une seule lecture

### Objectif
Rendre la zone `Ce que ToolTrim révèle` réellement unifiée : le diagnostic, l'exemple chiffré et les tableaux avant/après doivent se lire comme une seule composition, pas comme deux sections successives.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — déplacement du résumé `9 outils, 123 €/mois → 5 outils, 48 €/mois` dans la colonne gauche, intégration du panel `Avant / Après ToolTrim` sous les lignes diagnostiques à droite, suppression du wrapper résultat pleine largeur.
- `src/index.css` — nouvelle grille diagnostic/résultat, résumé chiffré à gauche, panel avant/après compact dans le flux droit, suppression des styles de bloc résultat autonome.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La section ne présente plus `EXEMPLE DE RÉSULTAT` comme un second bloc.
- Le CTA `Auditer ma stack` reste unique et rattaché à la colonne de décision.
- Les tableaux avant/après restent visibles, mais ne dominent plus la section.

---

## 2026-05-17 — Sprint 19 : Diagnostic home simplifié

### Objectif
Réécrire la section diagnostic/résultat pour la rendre plus calme, plus lisible et moins accusatoire, en retirant les tableaux avant/après trop complexes.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau wording `Ce que tu paies encore`, lignes diagnostiques raccourcies, suppression des tableaux `Avant / Après ToolTrim`, ajout d'une carte résultat compacte.
- `src/index.css` — fond plus doux, rows simplifiées label/exemple, carte résultat compacte, suppression des styles de panel résultat dans cette section.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Le bloc ne contient plus de tableaux avant/après.
- Les cinq signaux sont plus courts et plus faciles à scanner.
- Le résultat chiffré reste présent, mais comme exemple indicatif dans une carte légère.

---

## 2026-05-17 — Sprint 20 : Méthode orientée contexte

### Objectif
Rendre la section méthode moins générique en montrant que ToolTrim part du contexte réel avant toute recommandation.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre `On part de ton contexte`, ajout du sous-texte, réécriture des trois étapes et exemples.
- `src/index.css` — style du sous-texte méthode et légère remontée de visibilité des numéros `01 / 02 / 03`.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La méthode met en avant profil, niveau, budget, TJM et usages réels.
- Les étapes évitent le vocabulaire trop générique ou technique.
- La grille existante reste inchangée visuellement.

---

## 2026-05-17 — Sprint 21 : Profils contextualisés

### Objectif
Rendre la section `Chaque profil` plus crédible et moins dashboard, en supprimant les économies fixes et en clarifiant que les recommandations changent selon le contexte.

### Fichiers modifiés
- `src/components/home/PersonasSection.tsx` — nouveau wording `Chaque profil a ses angles morts`, tabs plus courtes, suppression des montants `-€/an`, remplacement par `Budget à recalibrer` / `Abonnements évitables` et colonne `Recommandation ToolTrim`.
- `src/index.css` — nouvelle direction claire et éditoriale pour `home-profile-*`, tabs sobres, panel blanc 3 colonnes, CTA noir.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Plus de promesse d'économie moyenne non sourcée dans cette section.
- La lecture passe de `claim chiffré` à `stack typique → signaux → recommandation`.
- Le bleu dominant disparaît au profit du système noir / gris / blanc de la home.

---

## 2026-05-17 — Sprint 22 : Remplacement témoignages par cas types

### Objectif
Remplacer la section de faux témoignages par une section plus honnête et utile : des cas types repérés par ToolTrim, sans portraits, sans citations inventées et sans promesses d'économies non vérifiées.

### Fichiers modifiés
- `src/components/home/TestimonialsSection.tsx` — suppression du carousel, des portraits, des citations et des montants ; ajout de trois cartes `Designer freelance`, `Fondateur early-stage`, `Solopreneur IA`.
- `src/pages/HomePage.tsx` — commentaire de section mis à jour en `Cas types`.
- `src/index.css` — styles `home-case-*` pour une section claire, sobre, alignée avec la direction éditoriale de la home.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Aucun portrait ni initiales fictives ne sont rendus dans cette section.
- Les claims chiffrés de type `-€/an` disparaissent.
- Le bloc devient une lecture `profil → situation → stack → signal → décision`.

---

## 2026-05-17 — Sprint 23 : Guides home orientés décision

### Objectif
Transformer la section Guides de la home en contenu d'aide à la décision, plutôt qu'en simple flux de blog avec extraits SEO tronqués.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — remplacement des cartes dynamiques issues des posts par trois cartes éditoriales hardcodées pour la home : facturation, compétences IA, stack IA freelance.
- `src/index.css` — styles `home-guide-*` : cartes sans troncature, footer meta/CTA, hover sobre.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Le titre devient `Lire pour mieux décider.`.
- Chaque carte indique la décision que le guide aide à prendre.
- Les extraits tronqués et les titres SEO longs ne sont plus utilisés dans cette section.

---

## 2026-05-17 — Sprint 24 : Stacks par objectif en cartes de recommandation

### Objectif
Transformer la section `Stacks par objectif` pour qu'elle ressemble à des recommandations ToolTrim calibrées par profil, budget et outils, plutôt qu'à des cartes éditoriales avec photos génériques.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nouveau titre `Des stacks calibrées pour ton usage`, ajout du sous-texte, suppression du rendu des photos, remplacement par un panneau de stack avec budget cible, logos/pastilles d'outils et ligne `À challenger`.
- `src/index.css` — styles `home-stack-*` pour les cartes de recommandation, panneaux de stack, logos et footer meta/CTA.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les photos stock ne sont plus rendues dans cette section.
- Les économies fixes de type `-58€` disparaissent de la home.
- Chaque carte affiche un budget cible, des outils clés et un angle de décision.

---

## 2026-05-17 — Sprint 25 : Audit global homepage

### Objectif
Nettoyer la home après les itérations successives pour retrouver une narration cohérente : ToolTrim part du profil, du niveau, du budget, du TJM, des usages et de la stack existante, plutôt que d'empiler des listes d'outils.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — nettoyage des anciennes URLs de photos stock dans les données de stacks, mise à jour des métadonnées SEO et alignement de la FAQ sur le conteneur global.
- `src/components/home/FinalCTA.tsx` — remplacement de la promesse chiffrée `847€/an` par un CTA final plus calme et contextualisé.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- Les anciens marqueurs de comparateur générique et de promesse d'économie non sourcée sont retirés de la home.
- La FAQ utilise le même système de grille que les autres sections.
- Le CTA final revient à la promesse centrale : auditer la stack depuis le profil, le budget et les usages réels.
- La meta description de la home intègre désormais le TJM dans les critères de recommandation.

---

## 2026-05-17 — Sprint 26 : Flux visuel homepage

### Objectif
Retirer les séparateurs pleine largeur trop présents sur la homepage pour retrouver un rythme plus fluide, premium et éditorial.

### Fichiers modifiés
- `src/pages/HomePage.tsx` — ajout d'une classe racine `home-page` pour limiter les ajustements à la home.
- `src/index.css` — override scoped supprimant les `border-top` / `border-bottom` des wrappers de sections homepage, sans toucher aux bordures internes.
- `docs/CHANGELOG_AI.md` — ce fichier.
- `docs/DESIGN_SYSTEM.md` — règle de rythme homepage documentée.

### Résultat
- Les coupes horizontales entre sections sont supprimées sur la home.
- Les bordures du ticker, des cartes, des lignes de diagnostic et des panels restent intactes.
- La séparation repose davantage sur l'espacement, les fonds et la grille commune.

---

## 2026-05-17 — Sprint 27 : Carte d'audit hero

### Objectif
Rendre la carte d'audit du hero plus précise et moins dashboard, sans changer le message du hero ni le rôle de la preview.

### Fichiers modifiés
- `src/components/home/HeroSection.tsx` — footer de carte regroupé, wording budget/disclaimer simplifié.
- `src/index.css` — styles `hp-audit-*` affinés : ombre réduite, grille plus nette, labels décisionnels textuels, CTA secondaire en lien discret.
- `docs/CHANGELOG_AI.md` — ce fichier.

### Résultat
- La preview ressemble davantage à une fiche de décision ToolTrim qu'à un widget SaaS.
- Le CTA de la carte ne concurrence plus le CTA principal du hero.
- Les logos, outils, décisions, budget cible et disclaimer restent présents.

---

## 2026-05-17 — Sprint 28 : Alignement copy et conversion homepage

### Objectif
Aligner la homepage sur la promesse conversion : auditer une stack freelance existante, repérer les doublons et abonnements inutiles, puis recommander selon profil, budget, TJM et usage réel.

### Fichiers modifiés
- `src/components/Navbar.tsx` — label `Alternatives` remplacé par `Comparatifs`, CTA desktop `Auditer ma stack`, lien `Soumettre un outil` rendu plus discret.
- `src/components/home/HeroSection.tsx` — nouveau H1, nouveau sous-texte et disclaimer de preview basé sur un profil freelance type.
- `src/pages/HomePage.tsx` — copy des sections action cards, différence, diagnostic, méthode, stacks, guides, FAQ et metadata mise à jour.
- `src/components/home/PersonasSection.tsx` — suppression du profil `DSI PME` et sous-texte resserré autour des profils freelance/solo.
- `src/components/home/TestimonialsSection.tsx` — sous-texte des cas types aligné sur la logique profil.
- `src/components/home/FinalCTA.tsx` — nouveau CTA final plus direct.
- `src/index.css` — hiérarchie visuelle nav/CTA ajustée.

### Résultat
- La page utilise un ton cohérent en `tu`.
- Le CTA principal devient clairement `Auditer ma stack`.
- Les comparatifs sont nommés comme tels dans la navigation.
- La FAQ commence par indépendance, gratuité, fonctionnement, durée et fiabilité.
- Le positionnement public sort du comparateur générique pour revenir à l'audit de stack freelance.

---

## 2026-05-17 — Sprint 29 : Page stacks contextuelle

### Objectif
Transformer `/fr/stacks` en outil de sélection contextualisé plutôt qu'en liste générique : profil, sous-profil, objectif, budget, niveau, complexité, type de stack et recherche.

### Fichiers modifiés
- `src/pages/StacksPage.tsx` — hero réécrit, filtres URL-persistants, sous-profils dépendants du profil, chips de filtres actifs, grille de cards décisionnelles.
- `src/data/stacks.ts` — ajout de helpers dérivés pour `budgetRange`, `level`, `complexity`, `stackType`, `toolCount`, verdict et outils à garder/challenger.
- `src/index.css` — grille 280px / résultats, cards stack en 2 colonnes, filtres et chips actifs.
- `src/components/StackCardEditorial.tsx` — supprimé : l'ancien composant n'était plus utilisé et créait un deuxième système de cards stack.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` — documentation alignée.

### Résultat
- `/fr/stacks` conserve les données existantes sans casser les fiches détail.
- Les filtres se partagent via query params et se combinent en logique `AND`.
- Les compteurs globaux trompeurs sont retirés.
- Les cards affichent désormais verdict, idéal si, à éviter si, budget cible, niveau, complexité et logos outils.

---

## 2026-05-17 — Sprint 30 : UX facettes stacks

### Objectif
Repenser les filtres de `/fr/stacks` comme une description de situation freelance plutôt qu'un filtrage produit.

### Fichiers modifiés
- `src/pages/StacksPage.tsx` — sidebar réorganisée en `Ton contexte`, `Ton besoin`, `Affiner`; spécialités/objectifs/types en multi-sélection; logique `AND` entre facettes et `OR` dans les facettes multiples; chips actifs supprimables; query params multi-valeurs.
- `src/index.css` — styles des groupes de facettes, options multi-sélection, états désactivés et message de spécialité dépendante.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md` — documentation du nouveau pattern.

### Résultat
- `Profil` reste single-select et réinitialise les spécialités quand il change.
- `Spécialité` n'apparaît qu'après choix d'un profil et permet plusieurs choix.
- `Objectif` et `Type de stack` permettent plusieurs choix en logique `OR`.
- Les filtres impossibles sont désactivés au lieu d'afficher des compteurs globaux trompeurs.
- L'URL peut partager une combinaison comme `?profile=designer&specialty=brand,ui-ux&objective=produce,organize&budget=30-80`.

---

## 2026-05-17 — Sprint 31 : Template détail stack décisionnel

### Objectif
Transformer `/fr/stacks/developpeur-freelance-shipper` en page de décision : pour qui, budget cible, outils essentiels, optionnels, à challenger, limites de calibration.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — hero enrichi avec profil/spécialité, budget, niveau, complexité, verdict, `Idéal si` / `À éviter si`; ajout du bloc `La décision ToolTrim`; contenu éditorial spécifique dev shipper; outils regroupés par rôle métier; section `Quand cette stack devient mal calibrée`.
- `src/index.css` — styles `sd-*` pour résumé décisionnel, rows outil avec fiche produit, calibration trop légère/trop lourde, budget note.
- `docs/CHANGELOG_AI.md`, `docs/ARCHITECTURE.md` — documentation du nouveau template.

### Résultat
- La page ne lit plus comme une simple fiche descriptive : elle expose quoi garder, quoi challenger et quoi éviter dès le haut.
- Les outils affichent logo, rôle, raison, prix/plan indicatif, décision et lien vers la fiche outil.
- Le budget est présenté comme cible de calibration, sans promesse d'économie exacte.
- Les fallbacks s'appuient sur `tools[]`, `decision`, `bestFor`, `avoidIf`, `monthlyBudget`, `stage` et `getStackDerivedFields`.

---

## 2026-05-17 — Sprint 32 : Typographie et rythme détail stack

### Objectif
Rendre `/fr/stacks/developpeur-freelance-shipper` plus contrôlé et scalable sans réécrire le contenu ni modifier la logique produit.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — micro-ajustement des CTA inline et de la métrique risque pour respecter l'échelle typographique.
- `src/index.css` — surcouche `sd-*` pour H1, sous-titre hero, H2, corps, métadonnées, largeur de shell, grille hero, rows outils, labels décisionnels et espacements sectionnels.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du scale détail stack.

### Résultat
- Le H1 plafonne à 104px avec line-height plus serré, les H2 suivent un scale commun et les textes longs reviennent sur une lecture 16px / 1.5.
- Le shell détail stack est limité à 1240px, avec une colonne résumé maîtrisée à 360px.
- Les lignes outils gagnent en scannabilité : nom 18px, raison/rôle 15px, label décisionnel 11px en pastille sobre.
- Les séparateurs pleine largeur du template sont adoucis au profit d'un rythme par espacements.

---

## 2026-05-17 — Sprint 33 : Nettoyage éditorial stack dev

### Objectif
Nettoyer la page `/fr/stacks/developpeur-freelance-shipper` sans toucher au template : ton plus naturel, moins d'anglais, suppression des tirets longs rendus et meilleure lisibilité des labels.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — H1 remplacé par `Dev freelance qui livre`, sous-titre hero simplifié, heading décisionnel réécrit, note ToolTrim renommée `Astuce` / `Réglage utile`, CTA diagnostic et stacks proches réécrits.
- `src/index.css` — puces CSS `sd-*` remplacées par des points sobres pour éviter les tirets longs rendus dans les listes.
- `docs/CHANGELOG_AI.md` — ce suivi.

### Résultat
- La page ne présente plus `shipper` dans le H1.
- Le hero ne répète plus la même idée entre sous-titre et verdict.
- La section décision devient `CE QU'ON GARDE, CE QU'ON ÉVITE` / `Simple par choix, pas par manque.`
- Les tirets longs visibles dans les blocs de cette page sont remplacés par deux-points, phrases naturelles ou puces simples.

---

## 2026-05-17 — Sprint 34 : Navigation d'ancre détail stack

### Objectif
Rendre la navigation interne de `/fr/stacks/developpeur-freelance-shipper` plus claire et plus utile sans changer le contenu ni la structure des sections.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'un état actif `activeSection`, scrollspy via `IntersectionObserver`, `aria-current="location"`, label accessible `Navigation de la page` et libellé discret `Sur cette page`.
- `src/index.css` — style segmenté compact, sticky sous le header, fond translucide avec blur, offset d'ancres et smooth scroll respectant `prefers-reduced-motion`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern d'ancre.

### Résultat
- La barre reste visible au scroll sans ressembler à une seconde navigation globale.
- Le lien actif se met à jour au clic et au scroll.
- Les ancres atterrissent sous le header sticky grâce à `scroll-margin-top`.
- Sur mobile, la navigation reste horizontale avec scroll interne, sans scroll horizontal de page.

---

## 2026-05-17 — Sprint 35 : Hero détail stack, architecture décisionnelle

### Objectif
Renforcer le hero du template StackDetailPage sans réécrire la page : hiérarchie plus claire, fit/avoid moins tableau, carte droite moins administrative.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'une phrase contexte, remplacement du bloc `Idéal si / À éviter si` par deux cartes éditoriales, refonte de la carte `En un coup d'œil` en budget + facts grid + `À surveiller` + logos clés.
- `src/index.css` — grille hero `1fr + 380px`, gap plus ample, cartes `stack-fit-*`, budget fort, facts grid, blocs internes espacés sans séparateurs ligne par ligne.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau pattern hero quick-read.

### Résultat
- Le hero lit d'abord le contexte, puis la décision, puis l'action.
- La carte droite n'est plus une table d'administration : le budget devient l'ancre visuelle et les infos secondaires sont regroupées.
- Les logos clés passent à 6 visibles maximum avec pastilles 32px et `+N`.
- Le même template reste compatible avec les autres stacks, dont architecte d'intérieur.

---

## 2026-05-17 — Sprint 36 : Outils stack en chaîne de workflow

### Objectif
Remplacer la lecture table/cards de la section `02 — OUTILS` par une compréhension en 5 secondes : workflow d'abord, socle ensuite, inventaire complet en secondaire.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout d'un mapping de workflow par stack cible, rendu `La chaîne de travail`, blocs `Le socle à garder`, `À activer selon le projet` et inventaire complet secondaire.
- `src/index.css` — styles des nodes workflow, connecteurs, chips de socle/options et inventaire compact.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern.

### Résultat
- `/fr/stacks/architecte-interieur` lit désormais Brief → Moodboard → Plans → 3D → Rendu → Sourcing → Budget → Validation → Facturation.
- `/fr/stacks/developpeur-freelance-shipper` et `/fr/stacks/designer-freelance-solo` utilisent la même logique de chaîne contextualisée.
- Les outils Socle / Conditionnel / À challenger restent visibles, mais la liste complète n'est plus le premier contact avec la section.

---

## 2026-05-17 — Sprint 37 : Inventaire intégré dans le workflow

### Objectif
Supprimer la redondance entre workflow et inventaire complet dans `02 — OUTILS` : la chaîne devient l'interface principale et contient elle-même tous les détails via disclosure.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement des blocs séparés socle/options/inventaire par des nodes workflow expansibles avec aperçu, résumé de compte et détails par statut.
- `src/index.css` — grille workflow 3/2/1 colonnes, état ouvert, détails intégrés et rows compactes dans chaque node.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern workflow intégré.

### Résultat
- Plus de section `Inventaire complet` séparée sous le workflow.
- Chaque étape affiche le socle en aperçu et expose Conditionnel / À challenger au clic.
- Le premier node important est ouvert par défaut selon la stack.

---

## 2026-05-17 — Sprint 38 : Module outils stack non redondant

### Objectif
Finaliser `02 — OUTILS` comme un seul module workflow, sans inventaire séparé ni couches redondantes héritées des itérations précédentes.

### Fichiers modifiés
- `src/index.css` — suppression des styles morts `sd-inventory`, `sd-stack-essentials` et `sd-stack-options`.
- `docs/DESIGN_SYSTEM.md` — retrait de l'ancien pattern workflow + inventaire séparé au profit du pattern intégré.
- `docs/CHANGELOG_AI.md` — ce suivi.

### Résultat
- Le code ne garde plus de styles pour une section `Inventaire complet` séparée.
- Le pattern documenté est désormais unique : workflow nodes + détails intégrés.

---

## 2026-05-17 — Sprint 39 : Stack par étape

### Objectif
Adapter le principe `Stack by Layer` à ToolTrim sans copier StackShare : la section `02 — OUTILS` présente la stack comme un workflow de décision, pas comme une liste d'outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — framing `La stack par étape`, subtitle orienté workflow et aria-label du module ajusté.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern ToolTrim `stack by workflow`.

### Résultat
- Le module reste unique : nodes workflow + détails intégrés.
- Aucun inventaire séparé, table ou liste complète redondante n'est rendu sous la grille.

---

## 2026-05-17 — Sprint 40 : Reframing Stack by Workflow

### Objectif
Aligner le wording de `02 — OUTILS` sur le modèle mental `Stack by Workflow` : la section explique comment un freelance travaille, pas seulement quels outils sont groupés.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titre `La stack par workflow`, sous-titre `On ne choisit pas des outils un par un...`, label accessible du module ajusté.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du framing.

### Résultat
- Le module reste unique : nodes workflow + disclosure intégré.
- Aucun inventaire séparé, table ou matrice décisionnelle n'est rendu dans `02 — OUTILS`.

---

## 2026-05-18 — Sprint 41 : Stack detail structurée par workflow

### Objectif
Finaliser les pages détail stack autour de la lecture `profil → workflow → décisions`, avec `02 — OUTILS` comme module unique et non redondant.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — objectifs courts par étape pour architecte intérieur, dev freelance et designer solo ; ajout du signal discret `À surveiller` sur les nodes trop chargés en conditionnel/challenge.
- `src/index.css` — style du marqueur workflow `À surveiller`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern final.

### Résultat
- La section outils reste une seule grille `Stack by Workflow`, avec détails accessibles dans chaque node.
- Les outils restent tous accessibles via disclosure, sans inventaire complet séparé ni table-first layout.
- Le poids d'une étape est lisible via le résumé de compte et le marqueur `À surveiller` quand il apporte une vraie information.

---

## 2026-05-18 — Sprint 42 : Stack detail orientée workflow-first

### Objectif
Recentrer la page détail dev freelance sur la lecture `profil → workflow → décisions`, pour éviter le framing générique “base recommandée” et clarifier que la stack sert une chaîne de travail.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — copie hero, metadata SEO, overview, budget et sous-titre `02 — OUTILS` spécifiques à `developpeur-freelance-shipper`.
- `src/data/stacks.ts`, `vite.config.ts` — alignement de la description statique/pré-rendue pour éviter l'ancien framing “base recommandée” et “stack divisée par usages”.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la règle d'information ownership.

### Résultat
- Le hero explique d'abord le workflow dev : coder, montrer, documenter, encaisser.
- La meta description ne dit plus “stack divisée par usages, risques et alternatives”.
- `02 — OUTILS` reste le seul module d'outils, avec nodes workflow et détails intégrés.

---

## 2026-05-18 — Sprint 43 : Stack Map Sana-inspired

### Objectif
Remplacer les nodes workflow trop interactifs par une carte de stack plus calme : familles de travail à gauche, grille de logos à droite, statuts discrets et disclosure seulement quand une famille dépasse 6 outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout des familles `Stack Map` par stack cible et remplacement du rendu `02 — OUTILS` par des blocs de workflow.
- `src/index.css` — styles des blocs `sd-stack-map`, grille logo + label, statut discret et comportement responsive.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern Stack Map.

### Résultat
- `02 — OUTILS` affiche `La carte de la stack.`
- Les outils restent tous accessibles dans les familles de workflow, sans inventaire séparé ni table.
- Les statuts restent `Socle`, `Conditionnel`, `À challenger`, lisibles sans code couleur.

---

## 2026-05-18 — Sprint 44 : Vue d'ensemble simplifiée

### Objectif
Réduire `01 — VUE D'ENSEMBLE` à son rôle principal : qualifier rapidement si la stack correspond à la façon de travailler de l'utilisateur.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — suppression du rendu des chips workflow et de la note ToolTrim dans l'overview ; labels de qualification standardisés.
- `src/index.css` — ajout d'une ligne workflow légère et réduction de l'espacement avant les trois blocs.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du rôle limité de l'overview.

### Résultat
- Plus de bloc `Note ToolTrim` dans `Vue d'ensemble`.
- Plus de chips workflow redondants avant `La carte de la stack`.
- Les trois blocs restent centrés sur `Pour qui`, `Ce que ça évite`, `Quand passer plus lourd`.

---

## 2026-05-18 — Sprint 45 : Budget en module de décision

### Objectif
Transformer `03 — BUDGET` en aide à la décision plutôt qu'en tableau de prix : expliquer quoi payer, ce qui peut rester gratuit, ce qui fait grimper la facture et quand auditer.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — remplacement des rows budget par trois blocs de décision, chips d'outils et bande de seuils.
- `src/index.css` — styles du module budget, seuils compacts et chips logo.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la propriété d'information du budget.

### Résultat
- Le budget répond à `Combien payer, et pour quoi ?`.
- La table `Budget minimal / recommandé / à surveiller` n'est plus le contenu principal.
- Le CTA `Auditer ma stack` apparaît après les seuils pour guider l'action.

---

## 2026-05-18 — Sprint 46 : Vue d'ensemble comme qualification

### Objectif
Réécrire `01 — VUE D'ENSEMBLE` pour les pages stack clés afin qu'elle réponde à `Est-ce que cette stack correspond à ma façon de travailler ?`, sans répéter le hero ni la carte des outils.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — titres, intros et blocs de qualification dédiés pour dev freelance, sites IA & automation, designer freelance solo et architecte intérieur.
- `src/index.css` — allègement des blocs overview et suppression du style de ligne workflow devenue inutile.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du rôle qualification de l'overview.

### Résultat
- Les blocs `POUR QUI`, `CE QUE ÇA ÉVITE`, `QUAND PASSER PLUS LOURD` deviennent la structure standard.
- Les listes de capacités et les détails de workflow restent hors de l'overview.
- Le slug demandé `sites-ia-automation` est résolu vers la stack source `createur-sites-ia-automation`.

---

## 2026-05-18 — Sprint 47 : Hero stack decision map

### Objectif
Faire du hero la vraie carte de décision de la fiche stack : cible, promesse, couverture, condition d'évitement, budget, niveau, complexité, vigilance et outils clés visibles immédiatement.

### Fichiers modifiés
- `src/pages/StackDetailPage.tsx` — ajout du helper hero decision map par stack clé, suppression du rendu de `Vue d'ensemble`, navigation d'ancre démarrant à `Outils`, panel `En un coup d'œil` enrichi avec le workflow.
- `src/index.css` — cartes hero en grille de qualification, bloc workflow dans le snapshot et retrait de l'ancre `apercu`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau rôle du hero et de la suppression de l'overview redondante.

### Résultat
- Les pages stack se comprennent dès le hero, sans attendre une section overview.
- `Outils` devient la première ancre de page.
- `Vue d'ensemble` n'est plus rendue comme section autonome sur le template stack detail.

---

## 2026-05-18 — Sprint 48 : Comparatifs orientés décision

### Objectif
Reprendre les pages comparatif avec la même logique que les fiches stack : verdict visible tôt, table resserrée, cas d'usage concrets et points de vigilance spécifiques.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero signalétique, panel décision rapide, verdict ToolTrim renforcé, table limitée aux critères utiles, remplacement des blocs redondants par `Cas d'usage` et `Points de vigilance`.
- `src/pages/ComparesIndexPage.tsx` — cartes enrichies avec question centrale et signal `Meilleur pour`.
- `src/index.css` — styles `cp-decision-panel`, `cp-usecase-*`, `cp-watchout-*`, `cix-card-question` et `cix-card-signal`.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du nouveau flux décisionnel.

### Résultat
- Le comparatif répond plus vite à `quel outil choisir ?`.
- La table n'est plus l'inventaire principal, mais un module de vrais écarts.
- Les anciens blocs `Ce que fait chaque outil`, `Avantages et limites`, `Critères de décision` et `Profils` ne sont plus rendus comme couches séparées.

---

## 2026-05-18 — Sprint 49 : Comparatifs alignés système Stack

### Objectif
Aligner les pages comparatif avec la logique des fiches stack : hero en fiche signalétique, navigation sticky bottom, sections numérotées et information non redondante.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero sans panneau droit, fact sheet comparatif, `CompareStickyNav`, sections numérotées et libellés clarifiés.
- `src/index.css` — styles du hero fact sheet et de la sticky nav comparatif en capsule basse.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation de la structure comparatif stack-like.

### Résultat
- Le hero répond immédiatement à `de quoi parle ce comparatif et quel choix dois-je faire ?`.
- La navigation de page reprend l'esprit des fiches stack, cachée sur mobile pour préserver la lecture.
- Les sections suivent le flux : verdict, comparer, cas d'usage, attention, alternatives, FAQ.

---

## 2026-05-18 — Sprint 50 : Profondeur décisionnelle des comparatifs

### Objectif
Enrichir les pages comparatif avec un modèle éditorial ToolTrim capable d'expliquer non seulement `qui gagne`, mais dans quel contexte, à quel coût réel et à partir de quel seuil l'autre outil devient plus pertinent.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — ajout des champs `finalRecommendation`, `decisiveCriteria`, `tippingPoint`, `costReality` et `tooltrimRisks`, avec fallback pour les comparatifs non éditorialisés.
- `src/pages/ComparesIndexPage.tsx` — ajout du signal de risque principal sur les cartes comparatif.
- `src/index.css` — styles des critères décisifs, seuil de bascule, coût réel et points d'attention enrichis.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du modèle décisionnel enrichi.

### Résultat
- La page compare d'abord les vrais écarts avant de montrer le tableau.
- Le seuil de bascule devient une section dédiée.
- Le coût réel distingue prix affiché, moment où payer et coût caché.
- Les points d'attention décrivent erreur, conséquence et recommandation ToolTrim.

---

## 2026-05-18 — Sprint 51 : Comparatifs en battle utile

### Objectif
Transformer les pages comparatif en battles utiles : deux outils visibles face-à-face, verdict ToolTrim au centre, signaux d'adéquation qualitatifs et scores par usage sans notation opaque.

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — hero battle face-à-face, fact sheet recentrée sur le choix, navigation sticky `Scores`, section `Scores par usage` et suppression du bloc cas d'usage redondant.
- `src/index.css` — styles `cp-battle-*` et `cp-score-*`, fact sheet hero simplifiée en grille compacte.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du pattern battle utile et des scores qualitatifs.

### Résultat
- Le comparatif démarre par `quel outil est juste pour quel usage ?`, pas par une table.
- Les scores restent éditoriaux : `Avantage`, `Suffisant`, `Dépend`.
- Le flux suit : Verdict, Scores, Comparer, Seuil, Coût, Erreurs, Alternatives, FAQ.

---

## 2026-05-18 — Sprint 52 : Premiers comparatifs battle data

### Objectif
Brancher les premiers fichiers de données comparatif enrichies dans le rendu `ComparePage`, sans casser les fallbacks existants.

### Fichiers modifiés
- `src/data/comparison-battles/*.json` — ajout des fiches enrichies `chatgpt-vs-claude`, `notion-vs-airtable`, `figma-vs-canva`, `make-vs-zapier` et `webflow-vs-framer`.
- `src/data/comparisonBattles.ts` — registre typé des fiches battle.
- `src/pages/ComparePage.tsx` — adaptateur JSON vers le modèle éditorial ToolTrim existant.
- `src/data/comparisons.ts` — ajout de `make-vs-zapier` et `webflow-vs-framer` dans les comparatifs accessibles.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du branchement des données battle.

### Résultat
- Les cinq premiers comparatifs utilisent maintenant leurs données de décision : choix rapide, scores par usage, table des écarts, seuil de bascule, coût réel, erreurs fréquentes et FAQ.
- Les autres comparatifs gardent le fallback éditorial généré depuis les données outils.

---

## 2026-05-19 — Sprint 53 : Modèle comparatif scalable inspiré G2

### Objectif
Transformer les pages Comparatif en pages scalables et utiles : plus de fond décisionnel, plus de structure, moins de texte SEO générique. Inspiré de la structure G2 (At a glance, ratings, pricing, features, reviews, tipping point) mais avec l'angle ToolTrim : pas "A gagne contre B" mais "A est le bon choix dans ce contexte, B dans cet autre".

### Principe ToolTrim vs G2
- **G2** = marketplace d'avis et ratings, score objectif, comparaison exhaustive
- **ToolTrim** = aide à la décision contextuelle pour freelances et petites équipes — chaque section répond à une question précise

### Fichiers modifiés
- `src/pages/ComparePage.tsx` — suppression du `cp-battle-stage` dans le hero (redondant avec la fact sheet), ajout de la section `#apercu` (At a glance), réordonnancement des sections (coût avant features, seuil après features), renommage des IDs (`#scores` → `#criteres`, `#comparaison` → `#features`), mise à jour de la sticky nav avec les nouveaux labels.
- `src/index.css` — ajout des styles `.cp-aglance-*` pour la section At a glance, grille 3 colonnes avec séparateurs signalétiques.
- `docs/CHANGELOG_AI.md`, `docs/DESIGN_SYSTEM.md` — documentation du modèle scalable.

### Architecture de sections cible
1. Hero — table signalétique 6 faits (sans battle stage)
2. En un coup d'œil (#apercu) — grille At a glance
3. Verdict ToolTrim (#verdict) — Le choix rapide
4. Critères décisionnels (#criteres) — Les critères qui changent le choix
5. Coût réel (#cout) — Ce que tu paies vraiment
6. Features décisives (#features) — Ce qui change vraiment la décision (table filtrée)
7. Seuil de bascule (#seuil) — Quand passer de A à B
8. Points d'attention (#vigilance) — Erreurs de choix fréquentes
9. Alternatives (#alternatives) — conditionnel
10. FAQ (#faq) — conditionnel

### Sticky nav
Labels : Coup d'œil, Verdict, Critères, Coût, Features, Seuil, Attention, Alternatives, FAQ

### Fallbacks
- At a glance : toujours rendu depuis les données existantes
- Features : conditionnel si `decisionTableRows.length > 0`
- FAQ : conditionnel si `content.faq.length > 0`
- Sections absentes = non rendues, jamais de titre vide

### Résultat
- Le hero répond en 5 secondes sans double contenu
- La section At a glance oriente avant que l'utilisateur lise le verdict
- Coût réel précède les features pour ancrer la réalité budgétaire
- Le seuil de bascule clôt la partie décisionnelle avant les erreurs
- Build : ✅ 0 erreur, 156 warnings pré-existants
