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
| `src/components/v2shell/AppShellV2.tsx` | Shell actif, header et navigation |
| `src/components/tool/StickyDecisionCard.tsx` | Sidebar sticky décision |
| `src/index.css` | Entrée CSS : ordre explicite des couches et modules |
| `src/styles/foundations.css` | Tokens et thèmes canoniques |
| `src/components/ui/primitives.tsx` | Point d’entrée des contrôles génériques |
| `src/styles/ui.css` | Apparence autonome des primitives |
| `docs/DESIGN_SYSTEM.md` | Référence palette, typographie, composants |
| `docs/ARCHITECTURE.md` | Structure des pages et conventions techniques |
| `docs/CHANGELOG_AI.md` | Historique des sessions Codex |
| `docs/MA_STACK_ROADMAP.md` | Roadmap active Ma Stack + Explorer |
| `docs/ROADMAP.md` | Historique général et dette technique |

## Conventions CSS

Les modules sources sont importés par `src/index.css` dans les couches natives explicites. Les tokens appartiennent à `src/styles/foundations.css`, les contrôles génériques à `src/components/ui/primitives.tsx` et `src/styles/ui.css`, les dispositions et composants métier aux modules propriétaires sous `src/styles/`.

Pour une action, un lien ou un champ, importer la primitive commune. Ne pas copier une ancienne classe de bouton ni importer StackKit pour obtenir un contrôle générique. Choisir une variante explicite ; une page ne redéfinit pas l’apparence d’une primitive. Les migrations restantes sont suivies dans `docs/DESIGN_SYSTEM_MIGRATION.md`.

Préfixes : `ui-*` (socle), `bo-*` (administration), `td-*` (fiche), `gi-*`/`ga-*` (guides), `tc-*`/`tce-*` (cartes), `asv2-*` (shell actif).

**Ne pas** utiliser Tailwind inline dans les nouveaux composants éditoriaux.
**Ne pas** mettre `position: sticky` sur un enfant d’un grid item — toujours sur le grid item lui-même.

Palette, typographie et variantes : voir uniquement `docs/DESIGN_SYSTEM.md` et leurs propriétaires sources ci-dessus. Aucune seconde palette n’est recopiée ici.

## Règles à respecter

- Pas de bouton bleu sur les pages outils
- Pas de gradient background
- Pas de grands logos décoratifs
- Pas d'emojis comme icônes (utiliser le système Iconoir centralisé dans `src/lib/icons.tsx`)
- Pas de métadonnées répétées (hero ET sidebar)
- Préserver les thèmes et le mouvement réduit existants ; documenter la dette dans ROADMAP.md

## Commandes utiles

```bash
npm run dev       # dev server
npm run build     # build + prerender
git log --oneline -10  # derniers commits
```

## Workflow typique

1. Lire les docs concernées avant de coder
2. Utiliser les primitives communes ; modifier le module CSS propriétaire (classes préfixées)
3. Modifier le composant / la page
4. Tests ciblés, `npm run build`, puis vérification des routes rendues sur preview de production
5. Commit avec message conventionnel
6. Mettre à jour CHANGELOG_AI.md

## Hygiène du dépôt commune à Codex et Claude

- Mettre à jour les références actives au lieu de créer des copies numérotées de code, de tests ou de handoffs.
- Retirer les scripts ponctuels après usage lorsque leurs références ont été vérifiées ; Git conserve les versions suivies.
- Ne pas confondre fichiers exclus du déploiement et fichiers inutiles : préserver les preuves catalogue et les travaux non publiés.
- Séparer les artefacts de build reproductibles des sources ; ne pas les versionner.
- CLAUDE.md renvoie à ce guide pour éviter deux jeux de conventions contradictoires.
