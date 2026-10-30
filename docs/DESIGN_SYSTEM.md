# ToolTrim — Design System

Référence du système de design éditorial. Mis à jour au fil des sessions.

---

## La planche est la référence (30 oct. 2026)

La planche « Système ToolTrim » est la source de vérité du design du site, jamais l'inverse.

- **Un seul fichier partagé** : `src/styles/tooltrim-system.css`. Tokens `--tt-*` et composants `.tt-*` (le signe qui fait clic, la ligne de coupe, le fil, les trois verbes, le souffle du gain, le trim). Le site l'importe en tête de `src/index.css` ; la planche l'inline.
- **La source de la planche** vit dans `design-system/planche.html`. Ses tokens courts (`--brand`, `--ink`…) sont des alias des `--tt-*`. `npm run planche` construit `design-system/dist/systeme-tooltrim.html` (police du site inlinée), qu'on republie sur le même lien d'artefact.
- **Modifier le design** : changer `tooltrim-system.css` (ou la planche pour un composant pas encore partagé), reconstruire, republier. Le site suit au prochain build.
- **Un composant passe dans le site** en déménageant de la planche vers `tooltrim-system.css` avec le préfixe `tt-` ; la planche l'utilise alors depuis ce fichier.
- **Sens inverse** : un cas du site que la planche ne couvre pas est d'abord ajouté au chapitre « À passer en design » de la planche (capture dans `design-system/cases/`, statut Décision / Écart / Absent, question à trancher), avant d'être retravaillé.
- Mode sombre : classe `.dark` (le site la pose ; la planche aussi, d'après `data-theme` ou le système). La gate des tokens scanne aussi le fichier partagé.
- **Système atomique (30 oct. 2026)** : chaque atome est un token composite (`--tt-eyebrow-font`, `--tt-title-l-font`, `--tt-label-font`, `--tt-text-font`, `--tt-note-font`, `--tt-figure-font`, `--tt-amount-font`, `--tt-gain-ink`, `--tt-tile-pad`, `--tt-row-ring*`, `--tt-row-gone`, `--tt-logo-*`…) et une classe (`.tt-eyebrow`, `.tt-title-l`, `.tt-label`, `.tt-text`, `.tt-note`, `.tt-figure`, `.tt-amount`, `.tt-tag`, `.tt-tile`, `.tt-row`, `.tt-logo-tile`, `.tt-check`, `.tt-steps`, `.tt-btn`). Molécules (`.tt-choice`, `.tt-share`, `.tt-scale`, `.tt-cutgauge`) et organismes (`.tt-decision`) ne lisent que ces tokens, comme les règles du site qui les empruntent. Modifier un atome = modifier son token, une seule fois. La planche a un chapitre « Atomes » avec un atelier qui change les tokens en direct et copie les réglages.

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

### Homepage active

La route d'accueil utilise `HomePageV2.tsx`, `HeroSectionV2.tsx` et `StackGoalsSection.tsx`. Les composants de l'ancienne homepage ont été retirés : ne pas réintroduire leurs exceptions de logos ou leurs styles pour un nouveau chantier. Consulter les composants actifs et les tokens dans `src/index.css`.

## Couleur et image : la règle (29 oct. 2026)

Référence de qualité : apple.com. Chaque couleur saturée vibre, chaque image est d'une précision parfaite.

**Couleur**
- Toute couleur saturée (accent, alertes, statuts, couleurs de données, nouvelles touches de couleur) a deux valeurs : sa valeur sRGB dans les jetons, et un jumeau `oklch` plus vif dans le bloc `@media (color-gamut: p3)` de `src/index.css` (« Display P3, the rule »).
- Le jumeau garde la même luminosité `L` (le contraste du texte tient) et augmente la chroma : +20 % pour les aplats et pastilles, +12 % pour les couleurs utilisées comme texte.
- Les dégradés s'interpolent `in oklch` (pas de gris au milieu). Jamais de filtre `saturate()` ou `hue-rotate()` pour « raviver » : ils écrêtent en sRGB.
- Les neutres (gris, blancs, encre) restent tels quels : le P3 ne leur apporte rien.
- Les couleurs des domaines de Ma stack sont des jetons (`--color-area-1` à `-6`, `--color-area-other`) avec leur jumeau P3 ; `AREA_COLORS` renvoie ces `var()`. En SVG, les passer en `style={{ stroke }}` / `style={{ fill }}`, jamais en attribut (un attribut n'accepte pas `var()`).

**Image**
- Jamais d'image agrandie : chaque visuel est servi à 2x (et 3x pour les petites icônes), via `srcset`, en WebP ou AVIF.
- Logos et pictogrammes en vectoriel (SVG) dès que possible ; sinon une source d'au moins 2x la taille affichée.
- Recadrages, arrondis et ombres au pixel près : pas de bord blanc incrusté dans un logo, pas de double cadre.
- Animations de décor : uniquement `transform` et `opacity` (composées par la carte graphique), jamais de propriété qui force à repeindre à chaque image.

## Palette

| Token | Valeur | Usage |
|---|---|---|
| `#1D1D1F` | Noir principal | Tous les textes de lecture en mode clair, titres, CTA primaire, bordures actives |
| `#F6F5F4` | Crème clair | Backgrounds hero, sidebar, sections |
| `#EDEBE9` | Crème medium | Mega-panel, bandes secondaires |
| `#FFFFFF` | Blanc | Cards, inputs |
| `#E6E6E6` | Bordure standard | Séparateurs, borders par défaut |
| `#E7E7E0` | Bordure douce | Séparateurs internes (sidebar) |
| `#E0DBD7` | Chip/tag | Badges, pills de catégorie |
| `#86868B` | Gris d’accroche | Nuance sémantique volontaire dans un grand titre via `.tt-title-muted` |
| `hsl(var(--primary))` | Bleu ToolTrim | **Usage très limité** — liens actifs, focus ring, rare accent |

> Historique : ces valeurs remplacent l'ancienne palette (#222222 / #F8F8F4 / #EDEDE8 / #DADAD4), réchauffée en s'inspirant de details.so. Les centaines de valeurs hex codées en dur plus bas dans ce document (composants individuels) reflètent encore l'ancienne palette — non ré-alignées dans cette passe, à mettre à jour au fil de l'eau si un composant est retouché.

**Règle bleue :** Le bleu ToolTrim ne doit pas apparaître sur des boutons CTA principaux de pages outils. Il est réservé aux états actifs (tab active, lien actif), au focus ring, et aux labels de score dans la StickyDecisionCard.

**Exception /submit (14 oct. 2026, décision Michael) :** le visuel du hero de `/submit` est posé sur un halo flou (dégradés radiaux bleu ToolTrim, vert et violet à faible opacité, `.sp-hero-visual::before`). C'est la seule dérogation à « pas de gradient background » : pas d'encart, pas de bord, jamais derrière du texte.

**Règle de contraste (révisée le 8 oct. 2026, décision Michael) :** trois tons de texte en mode clair, jamais plus.
- `#1D1D1F` (`--color-text`) : titres, noms, chiffres, tout ce qu'on doit lire en premier.
- `#424245` (`--color-text-secondary`) : texte courant et descriptions (9,2:1 sur #F6F5F4).
- `#6F6F68` (`--color-text-meta`) : métadonnées seulement, surtitres, compteurs, dates, mentions légales (4,65:1 sur #F6F5F4, 5,06:1 sur #FFFFFF ; ne jamais descendre sous 4,5:1).

`--color-muted` reste à `#1D1D1F` (environ 650 usages) : la migration vers ces deux tokens se fait page par page, avec contrôle visuel. Le gris `#86868B` reste réservé à la seconde idée d'une accroche (`.tt-title-muted`).

---

## Sidebar du shell public (`asv2-*`)

Sur desktop, le shell est composé de deux surfaces autonomes posées sur une
gouttière neutre : la boîte de navigation à gauche et la boîte de travail à
droite. Le logo appartient à la sidebar ; le header de recherche appartient à
la surface de contenu. Les pages restent ouvertes à l'intérieur de cette
seconde surface et ne reçoivent pas une coque supplémentaire.

La navigation possède deux états persistants :

- **compact — 76px** : icônes seules, libellés accessibles par `aria-label` et `title` ;
- **déployé — 236px** : icône + libellé, état actif porté par une surface neutre.

Le bas de la sidebar forme une zone de préférences distincte de la navigation :

1. changement de langue en conservant le chemin, la query et l'ancre ;
2. bascule clair/sombre persistée dans `tooltrim:theme` ;
3. commande de réduction/déploiement persistée dans `tooltrim:sidebar-expanded`.

La sidebar reste compacte par défaut et disparaît au profit de la navigation mobile sous le breakpoint du shell. Les états actifs ne doivent pas utiliser un pavé noir : la surface, le poids typographique et l'icône suffisent à créer la hiérarchie.

---

## Profondeur des cards

Le catalogue limite volontairement les rectangles imbriqués. Une card ne reçoit une coque que si cette coque porte une fonction.

| Niveau | Traitement | Usage |
|---|---|---|
| Média | Miniature arrondie + contenu ouvert, sans bordure extérieure | Catalogue, découverte, carrousels |
| Fonctionnel | Surface douce, sans bordure décorative | Actions de stack, filtres, états |
| Décision | Fond blanc + bordure fine | Prix, verdict, comparaison, interaction structurante |

- Une card média affiche au maximum deux signaux sur sa miniature.
- Les actions secondaires sont regroupées dans un menu contextuel unique.
- La miniature, la typographie et l'espacement créent la hiérarchie ; ne pas ajouter une coque par défaut.
- Les piles de logos utilisent des avatars de 36px maximum, sans ombre ni animation décorative.

### Politique des miniatures

1. Capture éditoriale locale `/og-screenshots/<slug>.png` — état `curated`.
2. Image Open Graph distante suffisamment grande — état `og`.
3. Fond ToolTrim + logo produit — état `fallback`.

Les URLs ToolTrim sont normalisées vers l'asset local pour ne pas dépendre du réseau. Une image inférieure à 320×160 est rejetée par la card. L'état actif est exposé via `data-image-quality` pour les audits et les tests. Utiliser `npm run audit:card-images` pour le contrôle offline, ou ajouter `-- --network` pour vérifier les sources distantes.

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

### Hiérarchie des sections

- Un H1 ou un hero peut employer `--tt-size-hero` ou `--tt-size-page-title`.
### Règle typographique (29 oct. 2026, définie sur l'accueil)

| Rôle | Classe | Police | Graisse | Taille | Couleur |
|---|---|---|---|---|---|
| Titre de section (H2) | `.tt-section-title` | Uncut Sans | 500 | `--tt-size-section-h` (30 à 42px), interlettrage -0,035em | encre |
| Surtitre | `.tt-eyebrow` | Inter Tight | 330 | 11,5px, capitales, +0,16em | encre (jamais gris) |
| Intro sous titre | `.tt-lead` | Inter Tight | 400 | 17px, 56ch max | encre |
| Titre de carte | local | Uncut Sans | 500 | 21px, -0,02em | encre |
| Corps de carte | local | Inter Tight | 400 | 15px | encre |

- Le contraste vient de la taille et de la police, pas du gris : textes en encre, graisses 400/500, pas de 600 dans les titres.
- En-tête de section : titre et intro à gauche, `.tt-section-action` à droite sur la dernière ligne de l'intro ; dessous sur mobile.

### Règle CTA (29 oct. 2026)

- **Un seul appel qui mène par vue** : `.tt-cta`, pilule encre de 52px, 15px/500, flèche fine qui glisse de 2px au survol, pas d'icône décorative.
- **L'appel qui l'accompagne est un lien** : `.tt-cta-link`, texte encre 15px/500 et flèche, soulignement au survol seulement. Jamais deux pilules côte à côte.
- **Boutons d'interface** (formulaires, panneaux, back-office) : `.tt-button-primary` (pilule encre 40px) et `.tt-button-secondary` (pilule gris froid, sans contour), 14px/500.
- **Action de section** : `.tt-section-action`, 15px/500 encre, flèche 16px.
- Ne plus créer de bouton local (`.foo-btn`, `.foo-cta`) : composer avec ces quatre classes.
- **Exception écrite (30 oct. 2026)** : le bandeau de consentement garde deux boutons de même poids. Refuser doit être aussi simple qu'accepter.
- Les rails éditoriaux utilisent `CarouselControls` et `CarouselPagination` : boutons circulaires de 36px, icônes de 16px, état désactivé à faible contraste et pagination active en pilule de 20px. Ne pas recréer de contrôles locaux.
- Dans une galerie ou un rail, les images portent la présence visuelle ; la typographie ne doit pas les concurrencer.
- Les kickers sont facultatifs. Ne pas en ajouter uniquement pour donner artificiellement de la hauteur au header.

### Hiérarchie des surfaces publiques

- Média éditorial : sans coque extérieure, rayon `--tt-surface-radius-media` (18px). L'image et l'espace portent la hiérarchie.
- Card informative ou fonctionnelle : surface blanche, bordure douce unique, rayon `--tt-surface-radius-info` (12px).
- Panneau de regroupement ou hero : fond neutre sans bordure ajoutée, rayon `--tt-surface-radius-panel` (24px).
- Ne pas cumuler fond contrasté, bordure et ombre pour exprimer un seul niveau de séparation.
- Les cards éditoriales n'utilisent ni ombre portée ni déplacement vertical au survol ; seul le contraste local évolue.
- Les micro-surfaces d'une même famille (logo, icône, badge, métadonnée) gardent une échelle stable : icône fonctionnelle 36px, rayon 8px, texte secondaire 12–13px. Les badges de statut restent des pilules et ne deviennent pas des mini-cards.
- Au survol d'une card informative, utiliser une bordure neutre et un léger mélange de surface ; ne pas introduire de noir, de bleu ou d'ombre comme signal local.

### Variables CSS de taille (`--tt-size-*`)

Définis dans `:root` (`src/index.css`). **Source unique de vérité.** Toutes les classes `tt-*`, `cp-*`, `sd-*` doivent référencer ces vars — jamais coder `clamp()` en dur sur une page.

| Variable | Valeur | Niveau |
|---|---|---|
| `--tt-size-hero` | `clamp(64px, 8vw, 124px)` | H1 principal (Compare, ToolDetail) |
| `--tt-size-hero-sub` | `clamp(22px, 2vw, 30px)` | Phrase sous H1 |
| `--tt-size-page-title` | `clamp(40px, 4.5vw, 56px)` | H1 de page ou d'article éditorial |
| `--tt-size-section-h` | `clamp(25px, 2.4vw, 32px)` | Titre de section compact |
| `--tt-size-section-intro` | `clamp(16px, 1.3vw, 18px)` | Sous-titre directement lié à la section |
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
| `--tt-section-y` | `clamp(56px, 5.5vw, 88px)` | Padding vertical de section |
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

### Explorer (`ex-*`) : typographie et actions

Explorer utilise la même échelle que les autres pages : `--tt-size-page-title` pour le H1, `--tt-size-section-h` pour les résultats, `--tt-size-body` pour l’introduction, `--tt-size-card-title` pour les noms, `--tt-size-card-body` pour les descriptions, relations et contrôles, `--tt-size-kicker` pour les surtitres. Aucun override de taille local par breakpoint ; le layout s’adapte à la place disponible. En grille, les noms réservent deux lignes ; en colonne unique, leur hauteur reste naturelle.

Les relations utiles sont expliquées sur chaque carte, sans paragraphe générique répété au-dessus des résultats. L’ajout reste visible et cliquable, avec une cible de 44 px et un focus contrasté sur les médias. Les boutons ne se déplacent pas au survol.

### Échelle canonique ToolTrim (`tt-*` classes)

**Règle anti-exception :** Toutes les classes utilisent `var(--tt-size-*)`. Changer une variable `--tt-size-*` dans `:root` propage le changement partout. Ne jamais coder une taille en dur dans une classe `tt-*`, `cp-*`, ou `sd-*` couverte par les tokens.

| Classe | Token | Weight | LS | LH | Usage |
|---|---|---|---|---|---|
| `.tt-hero-title` | `--tt-size-hero` | 700 | -0.07em | 0.92 | H1 pages principales |
| `.tt-hero-subtitle` | `--tt-size-hero-sub` | 400 | -0.035em | 1.28 | Phrase sous H1 |
| `.tt-kicker` | `--tt-size-kicker` | 700 | +0.08em | 1 | Eyebrows, kickers, labels uppercase |
| `.tt-section-title` | `--tt-size-section-h` | 620 | -0.035em | 1.08 | Titres de sections |
| `.tt-section-intro` | `--tt-size-section-intro` | 400 | -0.01em | 1.45 | Sous-titres de section |
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
- H2 comparatif `.cp-title` : `var(--tt-size-section-h)` (`clamp(25px, 2.4vw, 32px)`), weight 620.
- Titres de critères / cartes : `18–20px`.
- Corps de cards et cellules : `14px`.

Les H2 comparatif suivent le token commun `--tt-size-section-h` ; seul le H1 hero conserve une échelle expressive.

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
Carte média éditoriale utilisée par le catalogue, les catégories et les rails de découverte.
- `tce-card--media` — miniature OG 16:10, puis ligne d’identité séparée.
- La ligne d’identité associe logo 24px, nom, catégorie et actions contextuelles.
- Le prix et le statut éditorial peuvent se superposer à la miniature sous forme de capsules factuelles.
- Toute la surface ouvre la fiche ; l’exploration et l’ajout à la stack restent dans un menu contextuel indépendant.
- `variant="decision"` conserve une anatomie dédiée aux surfaces de manipulation de stack.
- Le rail « À découvrir » de Ma Stack réutilise cette variante média : trois pistes maximum, miniature 16:10, aucune coque supplémentaire et contexte de catalogue en texte simple (`contextRole`). `mediaActions` accepte une commande secondaire sur la surface d’actions existante ; `onOpen` conserve le suivi du clic. Ces options ne modifient pas les cartes qui ne les fournissent pas.
- La découverte ouvre aussi aux alternatives et usages proches qualifiés, avec leur raison réelle. Aucune promesse « sans doublon ». Les pistes sont renouvelables ; un outil ajouté reste visible, l’ajout est bloqué pendant son animation. Sur mobile, le rail laisse voir la carte suivante ; le renouvellement revient à la première carte avec focus. Les cibles restent ≥44px, y compris avec un pointeur tactile. Les sources externes ou visuels bloqués conservent le fallback partagé de `ToolCardImage`.

### ToolCardCompact (tcc-*) — recherche et listes contraintes
Ligne compacte sans grande miniature, utilisée lorsque la densité prime sur l’inspiration visuelle.
- Logo 36px, titre 14px et description sur une ligne.
- La surface complète ouvre la fiche ; Explorer reste une action secondaire indépendante.
- Le prix disparaît sous 560px et la cible Explorer passe à 44px.
- Ne pas réintroduire de métadonnées secondaires ou de badges dans cette variante.

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
- `ToolCard` → supprimé, remplacé par `ToolCardEditorial` ou `ToolCardCompact`
- `ToolRowEditorial` → supprimé, les catégories utilisent la grille média
- `StackCardEditorial` → supprimé, remplacé par le système `sk-card` contextualisé de `StacksPage`

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
    div.cp-section-heading ← gauche : h2.cp-title (token --tt-size-section-h, weight 620, tracking -0.035em)
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

### Critères décisionnels (`#criteres`) — Matrice de décision (Sprint 73)

**Règle** : zéro répétition des noms outils dans chaque cellule — les en-têtes de colonnes suffisent. La colonne Décision ToolTrim apporte une conséquence d'usage, pas un simple doublon du badge.

**Anti-patterns supprimés** : `cp-score-list`, `cp-score-row`, `cp-score-tool` (cartes imbriquées avec noms répétés), `cp-score-level` (badges verts saturés), layout `cp-section-grid` restreint à 1.6fr.

Structure desktop — 4 colonnes pleine largeur :
1. `.cp-matrix-header` — eyebrow + titre h2 + intro courte (pleine largeur)
2. `.cp-matrix` — matrice avec `role="table"` sémantique
   - `.cp-matrix-thead` — en-têtes : "Critère" | ToolLogo+nom A | ToolLogo+nom B | "Décision ToolTrim"
   - `.cp-matrix-row` × N — 1 ligne par critère (max 6)
   - Cellule critère `.cp-matrix-cell--criterion` — nom du critère en 14px/600
   - Cellule outil `.cp-matrix-cell--tool` — badge + texte 14px ; `data-label={toolName}` pour mobile
   - Cellule décision `.cp-matrix-cell--decision` — fond `#FAFAF8`, texte conséquence pratique

Structure mobile ≤900px :
- `.cp-matrix-thead` masqué
- Chaque `.cp-matrix-row` → carte autonome avec `border-radius: 8px`
- `.cp-matrix-cell--tool::before` et `::before` injectent le nom via `content: attr(data-label)`
- Critère en haut sur fond `#F4F4F0`, décision en bas sur fond `#F8F8F4`

```css
/* Colonnes : critère 0.85fr | outil A 1.15fr | outil B 1.15fr | décision 1.1fr */
.cp-matrix-thead, .cp-matrix-row {
  grid-template-columns: minmax(180px, 0.85fr) minmax(230px, 1.15fr) minmax(230px, 1.15fr) minmax(250px, 1.1fr);
}
.cp-matrix-th--tool { display: flex; align-items: center; gap: 10px; border-left: 1px solid #DADAD4; }
.cp-matrix-cell { padding: 22px 20px; }
.cp-matrix-cell--decision { border-left: 1px solid #DADAD4; background: #FAFAF8; }
.cp-matrix-cell--winner { background: #F6F6F2; }
```

Badges :
| Classe | Style | Quand |
|---|---|---|
| `.cp-matrix-badge--advantage` | fond `#222222`, texte blanc | outil gagne sur ce critère |
| `.cp-matrix-badge--sufficient` | outline `#DADAD4`, texte `#6F6F68` | outil correct mais pas dominant |
| `.cp-matrix-badge--context` | transparent, texte `#9A9A92` | égalité ou dépend du contexte |

**Logos** : `<ToolLogo size={28} />` uniquement dans l'en-tête de colonne. Ne pas répéter dans chaque cellule.

**Données** (`CompareDecisiveCriterion`) :
- `title` / `titleEn` — nom du critère
- `toolA` / `toolAEn` — texte cellule outil A
- `toolB` / `toolBEn` — texte cellule outil B
- `decision` / `decisionEn` — conséquence pratique (max 2 lignes)
- Badge déduit automatiquement via `getCriterionLevels()` depuis le texte de décision

### Coût réel (`#cout`) — matrice financière (Sprint 74)

**Règle** : ne jamais inventer un prix. Tout montant affiché doit avoir une source et une date (`checkedAt`). Si non vérifié → "à vérifier selon plan / région".

**Anti-patterns supprimés** : `cp-cost-grid`, `cp-cost-row` (grille `160px 1fr 1fr 1fr` étriquée), noms outils répétés dans chaque cellule, `cp-cost-note` timide.

Structure — identique à `#criteres`, mêmes classes `cp-matrix-*` :
1. `.cp-matrix-header` — eyebrow + titre + `cp-matrix-intro` (= `pricingFraming` éditorial)
2. `.cp-matrix` `role="table"` — en-têtes avec logos, lignes de coût
   - Colonne "Critère" — label de la ligne (Prix public, Plan gratuit, Quand payer, Coût caché, Doublon)
   - Colonnes outils — texte sans répéter le nom (header suffit) ; `data-label` pour mobile
   - Colonne "Lecture ToolTrim" — décision pratique différente par ligne
3. `.cp-cost-callout` — encadré `#EDEDE8`, recommandation finale (`pricingReco`)

Lignes recommandées (max 5) :
| Label | Quoi |
|---|---|
| Prix public | Plan utile pour usage pro |
| Plan gratuit | Ce que le gratuit permet vraiment |
| Quand payer | Moment où le payant devient rationnel |
| Coût caché | Ce que le prix ne montre pas |
| Doublon | Quand payer les deux devient incohérent |

**Données** (`CompareCostRealityRow`) :
- `label` / `labelEn` — nom de la ligne
- `toolA` / `toolAEn` — texte outil A (court, sans nom répété)
- `toolB` / `toolBEn` — texte outil B
- `recommendation` / `recommendationEn` — lecture ToolTrim (conséquence pratique)

**Callout** `.cp-cost-callout` — style identique à `.compare-verdict-callout` (fond `#EDEDE8`, border `#DADAD4`, radius 8px). Contient `tt-fact-label` + `tt-body-large`.

### Seuil de bascule (`cp-tipping-*`) — Sprint 75
- ID : `#seuil` — positionné après Features.
- Layout pleine largeur (pas de `cp-section-grid`). Header : `cp-matrix-header` + intro éditoriale fixe.
- **Carte directionnelle** `cp-tipping-card` : grille `1fr 48px 1fr` (desktop) → stacked (mobile ≤768px).
  - Gauche `.cp-tipping-card-state` : label `tt-fact-label` "Par défaut" + `cp-tipping-card-text`.
  - Centre `.cp-tipping-card-arrow` : SVG flèche →, tourne 90° sur mobile.
  - Droite `.cp-tipping-card-state--switch` : bg `#F8F8F4`, border-left, label "Passe à l'autre si".
- **Règles numérotées** `cp-tipping-rules` : max 3 items de `signals[]`, chaque li = `cp-tipping-rule-num` + `<p>`. Fond `#F4F4F0` sur le numéro.
- **CTA** `.cp-tipping-cta` → `tt-button-primary` → `/selector?from={slugPair}`.
- Aucune puce/tiret — `cp-tipping-signals` supprimé. `cp-tipping-panel span` supprimé.

### Erreurs fréquentes (`cp-pitfall-*`) — Sprint 76 + 77
- ID : `#vigilance`.
- Chaque erreur suit la structure : **Erreur → Conséquence → Correction ToolTrim** (max 3 cartes).
- Classe racine `.cp-pitfall-grid` : `repeat(3, 1fr)` → `1fr` sur ≤768px.
- Carte `.cp-pitfall-card` : `border-top: 3px solid #C8600A` (accent attention sobre), fond blanc. `transition` sur border-color + background.
- **Hover** (Sprint 77) : `border-color: #B8B8B2`, `background: #FDFDFB` — signal discret, pas de scale ni d'ombre.
- **Mobile ≤480px** (Sprint 77) : padding réduit à `22px 20px 24px`.
- Index `.cp-pitfall-index` : numéro `01/02/03` en orange `#C8600A`.
- Conséquence `.cp-pitfall-consequence` : couleur `#555554` (contraste > `#6F6F68`).
- Correction `.cp-pitfall-fix` : encadré bg `#FDF5EE`, border `#EDD9C8`, `tt-fact-label` + `<p>`.
- Pas de rouge vif, pas d'emoji, pas d'ombre forte — sobriété ToolTrim.
- `cp-watchout-*` supprimé Sprint 76.

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

### Erreurs fréquentes — règles éditoriales
- Rôle : montrer où la mauvaise décision arrive, avec une action corrective concrète.
- Les erreurs doivent être spécifiques au comparatif, pas des conseils génériques sur les SaaS.
- Chaque carte contient : erreur + conséquence + correction ToolTrim (les 3 champs sont optionnels si absent dans les données).
- Pas de CTA dans cette section — un `cp-cta-band` existe déjà en bas de page.
- Fallback si `tooltrimRisks` vide : 3 items dérivés de `getPitfalls()`, sans conséquence ni correction.

### Seuil de bascule (`cp-tipping-*`) — Sprint 75
- Rôle : montrer quand l'outil recommandé par défaut cesse d'être le meilleur choix.
- Structure : carte directionnelle (Par défaut → Passe à l'autre si) + max 3 règles numérotées + CTA.
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

### CTA band (`cp-cta-band`) — Sprint 77
- Le CTA Diagnostic est l'**unique action principale** en clôture de page (après FAQ si présente).
- Rendu inline : fond blanc `#FFFFFF`, bordure `#DADAD4`, radius `6px`, padding `36px`.
- Description : `.cp-cta-band-desc` (17px, `#6F6F68`, max-width 540px).
- Bouton : `tt-button-primary` (class globale — plus d'inline style ni de `onMouseEnter/Leave`).
- Mobile ≤640px : container padding réduit, bouton pleine largeur.
- Règle : **un seul CTA à ce niveau**. Ne pas ajouter de CTA concurrent dans la section vigilance ou la FAQ.
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
- ❌ Emojis comme icônes (utiliser le système Iconoir centralisé dans `src/lib/icons.tsx`)
- ❌ `position: sticky` sur un enfant d'un grid item (casse le sticky)
- ❌ `overflow: hidden` sur les parents d'éléments sticky
- ❌ Métadonnées répétées (hero ET sidebar)
- ❌ Colonnes décisionnelles dans le hero

---

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
- H2 section : `var(--tt-size-section-h)` (`clamp(25px, 2.4vw, 32px)`), line-height `1.08`.
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


## Compilation Tailwind 4 — 15 octobre 2026

Le passage au compilateur Tailwind 4 conserve les tokens, les classes éditoriales préfixées et leurs règles `@layer components`. La configuration PostCSS rétablit la cascade historique pour préserver la priorité des styles hors couche. Les anciens utilitaires `shadow-sm`, `blur-sm` et `outline-none` sont remplacés, dans les composants actifs, par les équivalents v4 `shadow-xs`, `blur-xs` et `outline-hidden`, conformément au guide de migration. Les rayons personnalisés restent ceux du thème ToolTrim.

Toute évolution du traitement des couches doit conserver les tests `scripts/lib/legacy-css-cascade.test.mjs` et vérifier les pages réelles ; un build seul ne valide pas les tailles de texte ou les espacements.

## Comptes et Ma stack — règle du 23 octobre 2026

- Ma stack reste en haut à droite, comme un panier : destination permanente, compteur de la sélection, accessible avant et après connexion. Elle ne se répète pas dans le menu du compte ou la sidebar.
- La recherche globale a son champ et son raccourci sur ordinateur, son icône sur mobile. Se connecter reste explicite pour le visiteur ; l’avatar donne accès aux paramètres et à la déconnexion. L’inscription principale appartient au parcours de création de stack.
- Lorsque les comptes sont activés, l’ajout du premier outil exige une session. L’accueil déconnecté explique la valeur de la stack et propose Créer ma stack / compte existant. La recherche d’ajout apparaît après connexion. Les ajouts depuis le catalogue et l’explorateur suivent la même règle, sans faux succès en cas de refus.
- Les paramètres sont privés : aucun profil, formulaire ou export de cette page n’est affiché à un visiteur déconnecté. Déconnexion, session expirée et accès anonyme renvoient à l’accueil, en remplaçant l’entrée de navigation.
- Le contenu d’accueil développe chaque bénéfice une seule fois. Les pictogrammes soutiennent les usages ; une illustration décorative n’invente ni prix, ni statistique, ni outil recommandé. Les coûts restent qualifiés d’estimés.

## Kit Ma stack (`mk-*`, 21/10/2026)

Composants de Ma stack, dans `src/components/stack/StackKit.tsx`, styles `mk-*` dans `src/index.css` (bloc « Ma stack kit »). Règle : **un composant, un objectif, une affordance**. Un élément en lecture seule ne réagit jamais au pointeur ; un élément interactif le dit par sa forme (pilule, chevron, pastille en relief), jamais seulement par sa couleur. Préfixe `mk-` et non `sk-`, déjà pris par les pages Stacks.

| Composant | Objectif | Affordance |
|---|---|---|
| `Card` | regrouper une réponse | surface blanche, rayon 22, ombre douce, titre en haut à gauche ; statique |
| `Figure` | le chiffre clé d'une carte | grand chiffre et son unité ; jamais cliquable |
| `Trend` | ce qui a bougé ou ce qu'il faut surveiller | une ligne courte, colorée selon le sens (vert : bon, orange : à surveiller, gris : neutre) |
| `RankedBars` | comparer des montants | une barre par outil, longueur = part du total, montant et % affichés ; lecture seule |
| `Meter` | une progression vers un tout | barre de remplissage et son ratio ; lecture seule |
| `AppIcon` | identifier un outil | logo sur tuile blanche ; pastille verte « vérifié » ou logo estompé « en attente » |
| `AppIconRow` | montrer qui fait partie d'un ensemble | icônes avec statut ; lecture seule |
| `Duo` | montrer une paire qui peut faire doublon | deux icônes autour d'une pastille ⇄ |
| `Footnote` | la dernière ligne, discrète | sous un filet, texte gris |
| `Button` | agir sur la stack | pilule ; noire pour la réponse attendue, grise pour les autres ; `aria-pressed` pour un état |
| `TextLink` | aller vers une action ou un lieu secondaire | texte souligné ; version discrète grise pour « Plus tard » |
| `Segmented` | changer la vue, jamais les données | pouce en relief dans un rail ; `tabs` pilote un panneau (flèches clavier), `toggle` filtre une liste |
| `LinkRow` | ouvrir un lieu | ligne pleine largeur, fond au survol, chevron à droite |
| `ActionRow` | ouvrir un outil | icône, nom, détail, valeur à droite, chevron |

Placement : une commande se trouve à côté de ce qu'elle change (les lentilles au-dessus de la carte, les filtres au-dessus de la liste). Le bilan du haut est en lecture seule : seules ses lignes de paires (`LinkRow`) ouvrent la comparaison.

Couleurs des domaines : six teintes validées par le validateur dataviz sur `#F5F5F7` (`AREA_COLORS`, `src/lib/stackAreas.ts`), sans orange ni rouge, réservés à « à vérifier ». À partir du septième domaine, gris neutre (`AREA_OTHER`), jamais une teinte recyclée.

Tokens du kit (calés sur apollo.io/product/builder-studio, relevés le 21/10/2026) :
- surfaces : aucune ombre ; un filet de 1 px `--mk-line` (#E9E6E1), rayon 14 pour les cartes, 10 pour les boutons et icônes, 8 pour le pouce du sélecteur ;
- neutres chauds : encre #1A1A1A, gris #6F6A65, fond #F6F5F2 ;
- graisses : 400 partout (titres de carte, noms, chiffres clés) ; 500 pour les montants et les titres de décision ; pas de 600 ni de 700 ;
- chiffre clé : 38 px, graisse 400, interlettrage -2,5 % ;
- étiquette de type (« Doublon possible ») : monospace 11,5 px en capitales ;
- icône de carte : trait fin (1,75) dans un cercle teinté de 30 px (bleu budget, orange doublons, vert vérification).

Ajouts du 22/10/2026 :
- `Allocation` : où part un total, comme un portefeuille. Anneau fin découpé par domaine (écart de 2 px), total au centre, légende triée par poids avec montant et part. Au-delà de cinq domaines, le reste est regroupé en « Autres domaines » gris. Lecture seule ; le survol d'un segment ou d'une ligne met ce domaine en avant.
- `Row` : un fait réglé dans une liste, même mise en page que `LinkRow`, sans chevron ni survol.
- `Trend` prend une icône explicite : flèche seulement pour un vrai changement de montant (baisse : économie, hausse : montant à examiner), coche pour un état réglé.
- États obligatoires de chaque carte du bilan : rien encore, en cours, réglé. Une carte réglée montre ce qui a été réglé, jamais un vide.
- Une information n'apparaît qu'à un endroit : la prochaine décision vit dans la file, l'économie réalisée dans le budget.
- Pas de signe « ≈ » : l'estimation est dite en toutes lettres dans la ligne sous le chiffre.
- Identité ToolTrim dans le kit (22/10/2026) : jetons de la palette maison (#1D1D1F, #6F6F68, crème #F6F5F4, bordure #E6E6E6), Inter Tight pour l'UI, Uncut Sans pour les chiffres clés. Chaque carte a un **hero crème** (titre, chiffre de 72 px dont l'unité est dans le second ton #86868B, comme `.tt-title-muted`, une phrase) ; les détails sont sur blanc en dessous. Une carte réglée passe son hero en vert doux.
- Micro-interactions, toujours un retour : le chiffre défile dans le sens où il a bougé après une décision (`ValueChange`, jamais au premier affichage), la coche apparaît avec un léger rebond quand un état devient réglé, un segment de l'anneau s'épaissit sous le pointeur.
- Masse : les trois cartes du bilan partagent leurs lignes de grille (`subgrid`) : les heros finissent sur la même ligne, les contenus démarrent sur la même ligne. Les chiffres sont tous à l'encre ; la couleur ne vit que dans les petits signes (icône, coche, pastille).
- `Figure` est un compteur kilométrique (`Odometer`) : chaque chiffre roule dans sa colonne jusqu'à sa valeur, les unités en dernier, depuis 0 au premier affichage (décision de Michael, 22/10/2026, exception à la règle « jamais au premier affichage » de `ValueChange`), puis seulement les chiffres qui changent.
- Une carte propose une action, elle la permet sur place : trancher la première paire en un geste, ouvrir un outil en attente, saisir un prix manquant.

### Module constats (`StackFindings`, `mf-*`, 22/10/2026)

Remplace le bilan à trois cartes et la file « Prochaine décision ». Un seul écran, lu dans l'ordre :

1. **Prix** (grande carte à gauche) : `Figure` en compteur, barre de répartition des trois outils qui pèsent le plus, puis le reste ; sous un filet, le verdict (« Peut être allégée : jusqu'à X € », « Presque optimisée », « Vous économisez déjà X € »).
2. **À faire maintenant** (carte large) : une seule décision, son étiquette à icône, `Duo` ou `AppIcon` en grand, pour une paire la comparaison des deux coûts en barres, la progression « 3 sur 15 », les réponses en `Button` (le seul bouton noir de l'écran), `TextLink` pour Comparer, la réponse groupée et Plus tard.
3. **Ensuite / Puis** (deux cartes discrètes, sans bouton) : la suite, groupée par type. Une carte vide disparaît et la grille se referme.

Quand tout est réglé, la carte large devient le **bilan** : économie en compteur, « soit X € par an », barres avant et après avec la part économisée hachurée, décisions en logos (outil gardé coché, outil retiré estompé), « Ajouter un outil » et « Explorer autour de ma stack ». Sur mobile, les cartes s'empilent dans le même ordre de lecture, le prix d'abord.

## Ma stack — landing et onboarding (`ss-*`, `sl-*`, `so-*`)

- Non connecté : le hero est le sélecteur d'outils (`StackStarter`, `ss-*`) avec la carte « Votre stack » à droite. Sous le hero, bandes `sl-*` claires uniquement : pas de gris foncé ni de noir, les illustrations montrent un fragment réel du produit sur un plateau teinté (`--tone`), jamais une forme abstraite.
- Connecté avec une stack vide : un écran centré par étape (`so-*`), progression en segments, bouton « Retour » à gauche. Un seul champ libre : le prénom, et seulement s'il manque. Le tarif se choisit avec des pastilles et un stepper.
- Mouvement : aucune `transform` ne doit rester sur un ancêtre du dock mobile fixe (`animation-fill-mode: backwards` sur les étapes). Le bonjour défile mot par mot dans une ligne masquée, sans fondu superposé. Chaque animation a son équivalent `prefers-reduced-motion`.
- Accessibilité : pas de `aria-live` dans une page qui ouvre une fenêtre Radix, sinon la page reste exposée derrière elle.


## Ajout à Ma stack (16/10/2026)

Un seul comportement pour tout le site : `useAddToStack()` (`src/hooks/useAddToStack.ts`), utilisé par `PinToolButton` (cartes, catalogue, fiche outil), l'Explorer et la recherche de Ma stack. Récit : l'image de l'élément se rassemble en jeton, vole en arc jusqu'au « Ma stack » visible (barre collée de l'Explorer, sinon barre du haut), l'outil est ajouté à l'atterrissage (rebond + compteur qui roule), puis la pilule sombre `.stack-toast` propose Annuler / Voir. Sans animation (mouvement réduit, cible invisible) l'ajout est immédiat.

Jetons : `--stack-add-token-size`, `--stack-add-gather`, `--stack-add-travel`, `--stack-add-bump` (lus par `src/lib/stackAddStory.tsx`). Classes : `.stack-fly-ghost`, `.stack-toast*`. La pilule est rendue hors du routeur : jamais de `<Link>` dedans.

### Usage review: stable envelope (`StackUsageReview`, `mu-*`, 25/10/2026)

The usage card keeps its original compact envelope at a given viewport, regardless of its content or state. Historical reference (`7fdeff702f`, original usage scene): 290px at 1440×900, 255.19px at 1440×800, approximately 295px on tablet and 285px on a 390px phone. Desktop reuses the existing `--row2` clamp (230–290px); tablet is 295px and phone 285px. The envelope must not animate its height.

User stories and acceptance:
- **First answer:** show one tool, its current recorded cost and five understandable usage levels. The card remains compact; hover/focus previews a caption without saving. A click or radio arrow selection saves immediately and leaves that tool in place.
- **Several tools:** explicit Next/Previous changes the scene, never the height. Skip this tool advances without inventing an answer; Take a break opens a partial summary. Progress counts actual recorded answers, not skipped steps. Reload restores recorded usage.
- **Confirmation:** the checked radio and fixed caption show the answer; Next/Finish is explicit so a focused target cannot disappear underneath the user.
- **Summary:** distinguish complete stack, completed usage with other questions remaining, and partial progress. Do not derive suitability or savings from usage alone.
- **Correction:** revisit one tool at a time with its current radio checked; changing it preserves every other answer. Return to summary in the same envelope.
- **History:** previous pair decisions remain accessible in a separate internally scrollable scene. Reviewing/cancelling a pair preserves its answer until confirmed; do not append a list beneath the card.
- **Empty/removal/account change:** handle no paid tools and removal of the active tool; rely on existing scoped store/remount and never apply an answer to another tool/account.
- **Keyboard/motion:** native radio semantics, arrows/Home/End, visible focus, no automatic page scrolling. Reduced motion removes decorative icon movement. Do not introduce a live region behind account dialogs.

Three zones form a small interactive application inside the fixed envelope: stable module header, internally scrolling workspace, persistent command bar. All three share a bounded 640px inner column. The question header shows the current tool position (not answered count); name and price stay together. Summary shows recorded progress and a real per-tool list: each answer or missing value opens that tool for correction. History remains a separate tool-choice scene.

The input is a five-level ascending meter, not five pictogram tiles. Rounded peach bars share a common baseline and increase in height; all five full columns remain equal accessible radio hit areas of at least 44px. The selected bar and label turn blue and carry a check; lower recorded levels use light blue. Hover never moves the recorded marker. Labels stay on one line at normal text sizes; enlarged text may reflow within the internally scrolling scene. Pictograms appear only in the reserved feedback area, reacting to the preview/selection with a brief nod and humorous caption. Reduced motion disables that animation. No height animation or invented saving/suitability claim.

Commands have permanent positions: pause/summary at left, previous plus next/finish/skip at right. Previous retains its disabled slot on the first tool. Unanswered tools can be skipped or paused; selecting saves locally without advancing. Summary has one primary resume/review action on the right, with inventory/history secondary. Empty/free and history preserve the same frame and footer. Long names, many summary rows and enlarged text scroll internally without covering the footer. The primary route's existing account status remains responsible for pending/error/cloud-save feedback.

Acceptance details: [usage story matrix](MA_STACK_USAGE_ACCEPTANCE.md). Visible radio labels must occur in accessible names in both languages. Preview and keyboard context follow tool identity when rows change. Pair review keeps exactly three budget decisions; cancellation is a separate navigation action with a 44px target, preserves the recorded decision, and returns focus to its history trigger. On mobile, opening a historical review expands its destination. Usage answers save immediately: pause/summary are navigation, not cancellation of a saved answer.

### Invoice entry in Ma Stack (26/10/2026)

Invoice currency and budget display currency are separate. The quick monthly total has a visible invoice-currency selector, initialized from the budget but kept stable while editing; all users are included in that invoice total. Different currencies show the native amount, its monthly budget equivalent and the date of the reference rate. Preserve declared cents in totals and tool amounts. Do not relabel a draft after a display-currency switch.

The detailed-entry link names currency, users and annual billing and opens the editor directly. Save and Cancel have 44px minimum targets and restore focus to the visible subscription control; closing the sheet restores its trigger when it survives. The Save CTA follows the blue Ma Stack palette. Invalid input cannot reset a subscription or be committed through Enter. An explicit zero remains a real zero and must be reversible to paid. Scope/epoch changes discard the old editor draft.

See [invoice acceptance matrix](MA_STACK_INVOICE_ACCEPTANCE.md) for test evidence and limits. The existing usage-card height contract is unchanged.
