# ToolTrim — Guide Codex

Ce fichier aide Codex à naviguer le projet ToolTrim efficacement.

## Projet

ToolTrim est un site éditorial de comparaison d'outils SaaS pour freelances et petites équipes.
Stack : React 18 + React Router v7 (mode déclaratif) + Vite + TypeScript + Tailwind CSS v4.

## Fichiers importants

| Fichier | Rôle |
|---|---|
| `src/pages/ToolDetailPage.tsx` | Page outil — template principal |
| `src/pages/GuidesPage.tsx` | Index guides éditorial |
| `src/pages/GuideDetailPage.tsx` | Article guide éditorial |
| `src/components/Navbar.tsx` | Header fixe + mega-panel Explorer |
| `src/components/tool/StickyDecisionCard.tsx` | Sidebar sticky décision |
| `src/ds/` | Système de design : jetons et composants (CSS Modules, stories) |
| `src/index.css` | Héritage CSS (@layer components), retiré module par module |
| `docs/DESIGN_SYSTEM.md` | Référence palette, typographie, composants |
| `docs/ARCHITECTURE.md` | Structure des pages et conventions techniques |
| `docs/CHANGELOG_AI.md` | Historique des sessions Codex |
| `docs/MA_STACK_ROADMAP.md` | Roadmap active Ma Stack + Explorer |
| `docs/ROADMAP.md` | Historique général et dette technique |

## Conventions CSS

**Système de design (depuis le 06/11/2026).** Un composant du système vit dans `src/ds/<Nom>/` : `<Nom>.tsx`, `<Nom>.module.css`, `<Nom>.fixtures.ts` (données réelles et extrêmes), `<Nom>.stories.tsx`. Storybook est la référence visuelle ; process et commandes dans `docs/DESIGN_SYSTEM.md`.

**Ne rien perdre (depuis le 11/11/2026).** Avant de modifier un module, relire `docs/DESIGN_DECISIONS.md` : chaque décision de Michael y est datée, avec sa règle. Une nouvelle validation, un refus ou une demande y entre au moment où elle est prise. Ce qu'un module doit toujours dire est un test de contrat (bloc « content contract » de `src/test/ma-stack/StackHeroParts.test.tsx`). En fin d'étape, le bilan gardé / perdu / à décider va dans la section « À arbitrer » avant le commit. Storybook ne garde que le vivant : une proposition est supprimée ou promue à la décision, et `npm run audit:ds-usage` (CI) refuse un composant sans usage.
- Le CSS d'un module ne lit que des jetons `--tt-*` (`src/ds/tokens.css`). `npm run lint:ds` refuse les valeurs codées en dur, `!important` et `:global`.
- Une page n'ajoute aucun style à un composant du système.
- `src/index.css` ne reçoit plus de nouvelle règle de design. L'héritage y est retiré module par module, à mesure que les composants du système le remplacent.
- Avant de livrer : `npm run lint:ds`, `npm run test:ds` (invariants de mise en page et a11y sur chaque story), `npm run build-storybook && npm run test:visual`.

**Héritage, en cours de retrait.** Les anciennes classes vivent dans `@layer components` de `src/index.css`.
Préfixes : `td-*` (tool detail), `gi-*` (guides index), `ga-*` (guide article),
`tc-*` (tool card), `tce-*` (tool card editorial), `nav-*` (navbar), `panel-*` (mega-panel).

**Ne pas** utiliser Tailwind inline dans les nouveaux composants.
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
- Pas d'emojis comme icônes (utiliser le système Iconoir centralisé dans `src/lib/icons.tsx`)
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
2. Composant du système dans `src/ds/` (stories d'abord) ; ne plus ajouter de règle dans index.css
3. Modifier le composant / la page
4. `npm run build` pour valider
5. Commit avec message conventionnel
6. Mettre à jour CHANGELOG_AI.md

## Hygiène du dépôt commune à Codex et Claude

- Mettre à jour les références actives au lieu de créer des copies numérotées de code, de tests ou de handoffs.
- Retirer les scripts ponctuels après usage lorsque leurs références ont été vérifiées ; Git conserve les versions suivies.
- Ne pas confondre fichiers exclus du déploiement et fichiers inutiles : préserver les preuves catalogue et les travaux non publiés.
- Séparer les artefacts de build reproductibles des sources ; ne pas les versionner.
- CLAUDE.md renvoie à ce guide pour éviter deux jeux de conventions contradictoires.
