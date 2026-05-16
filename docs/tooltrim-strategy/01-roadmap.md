# ToolTrim — Roadmap éditoriale et produit

> 10 sprints. Chaque sprint = 1 semaine de travail éditorial + développement.

---

## Vue d'ensemble

| Sprint | Thème | Statut |
|--------|-------|--------|
| S1 | Fondations + Stacks v1 | ✅ Livré |
| S2 | Stacks v2 + Comparatifs Index v2 | ✅ Livré |
| S3 | Stacks Facettes | ✅ Livré |
| S4 | Comparatifs — Module VS | ✅ Livré |
| S5 | Stratégie — Docs éditoriaux | 🔄 En cours |
| S6 | Pages Outils (Tool Pages) | 🔜 À venir |
| S7 | Guides par objectif | 🔜 À venir |
| S8 | Audit de stack interactif | 🔜 À venir |
| S9 | SEO — Contenu longue traîne | 🔜 À venir |
| S10 | Monétisation + Partenariats | 🔜 À venir |

---

## Sprint 1 — Fondations + Stacks v1

**Objectif :** Poser les bases techniques et publier les premières stacks.

**Livrables :**
- Setup Vite + React + TypeScript + Tailwind
- Architecture pages FR + EN
- 32 stacks initiales dans `stacks.ts`
- Page `/fr/stacks` avec filtres par persona (pills)
- Design system tokens (couleurs, typo, espacement)

**Critères de validation :**
- Build clean, pas d'erreur TypeScript
- 6 personas avec au moins 3–5 stacks chacun
- Navigation FR/EN fonctionnelle

---

## Sprint 2 — Stacks v2 + Comparatifs Index v2

**Objectif :** Enrichir le catalogue stacks et lancer la section comparatifs.

**Livrables :**
- 212 stacks dans `stacks.ts` (6 personas × multi-stades × sous-profils)
- `comparisons.ts` — 20+ comparatifs éditoriaux avec `verdict`, `keepIf`, `scores`
- Page `/fr/comparatifs` avec listing et chips de catégorie
- `DESIGN_SYSTEM.md` et `ROADMAP.md` créés
- Commit documenté dans `CHANGELOG_AI.md`

**Critères de validation :**
- 212 stacks sans doublon de slug
- Chaque comparatif a un `winner` défini
- Page comparatifs renderable avec filtrage par catégorie

---

## Sprint 3 — Stacks Facettes

**Objectif :** Remplacer les pills par un système de filtrage facetté avancé.

**Livrables :**
- Layout 2 colonnes : sidebar 256px + résultats
- 4 groupes de facettes : Profil, Objectif, Budget, Complexité
- Compteurs dynamiques par valeur de facette
- Composant générique `FacetGroup<T>`
- Composant partagé `SidebarContent` (desktop + mobile)
- Panel mobile full-screen avec Escape key
- Classes CSS `sk-*` dans `index.css`

**Critères de validation :**
- Filtrage combinatoire (AND logic) fonctionnel
- Compteurs cohérents avec les résultats filtrés
- Mobile panel ferme avec Escape et clic overlay
- Sidebar scrollable si contenu > viewport

---

## Sprint 4 — Comparatifs Module VS

**Objectif :** Remplacer la recherche classique par un module VS dans le hero.

**Livrables :**
- Machine à états : `idle | one | found | unavailable`
- Composant `ToolInput` avec autocomplétion + navigation clavier
- Matching bidirectionnel de slugs (`a-vs-b` et `b-vs-a`)
- Cas A : comparatif disponible → bouton Comparer actif + hint vert
- Cas B : comparatif indisponible → zone `cix-unavailable` avec alternatives
- Cas C : un seul outil sélectionné → listing filtré par cet outil
- Classes CSS `cix-vs-*` dans `index.css`

**Critères de validation :**
- Autocomplétion fonctionnelle (> 2 caractères)
- Navigation clavier (↑↓ Enter Escape) dans dropdown
- Redirect vers `/fr/comparatif/[slug-pair]` sur Comparer
- Listing Cas C filtré et cohérent

---

## Sprint 5 — Stratégie — Docs éditoriaux

**Objectif :** Créer la base documentaire stratégique pour guider tous les sprints futurs.

**Livrables :**
- `/docs/tooltrim-strategy/00-positioning.md`
- `/docs/tooltrim-strategy/01-roadmap.md` (ce fichier)
- `/docs/tooltrim-strategy/02-content-models.md`
- `/docs/tooltrim-strategy/03-stack-template.md`
- `/docs/tooltrim-strategy/04-comparison-template.md`
- `/docs/tooltrim-strategy/05-tool-page-template.md`
- `/docs/tooltrim-strategy/06-seo-checklist.md`
- `/docs/tooltrim-strategy/07-prompts-claude-codex.md`
- `/docs/tooltrim-strategy/08-editorial-guidelines.md`
- `/docs/tooltrim-strategy/09-internal-linking.md`
- `/docs/tooltrim-strategy/10-backlog.md`

**Critères de validation :**
- 11 fichiers créés, aucun fichier de code modifié
- Chaque fichier est autonome et actionnable
- Templates suffisamment détaillés pour être utilisés sans explication supplémentaire

---

## Sprint 6 — Pages Outils (Tool Pages)

**Objectif :** Créer des pages dédiées à chaque outil du catalogue.

**Livrables :**
- Route dynamique `/fr/outil/[slug]`
- `tools.ts` — données structurées pour 100+ outils
- Template de page outil (voir `05-tool-page-template.md`)
- Listing `/fr/outils` avec filtres par catégorie
- Liens croisés : stacks → outils, comparatifs → outils

**Critères de validation :**
- Page outil avec pricing, cas d'usage, alternatives, comparatifs liés
- Données manquantes affichées gracieusement (pas d'erreur)
- SEO : title, meta description, schema `SoftwareApplication`

---

## Sprint 7 — Guides par objectif

**Objectif :** Créer 6 guides longs formats par objectif éditorial.

**Livrables :**
- `/fr/guide/creer-du-contenu`
- `/fr/guide/vendre-en-ligne`
- `/fr/guide/gerer-ses-clients`
- `/fr/guide/automatiser-son-business`
- `/fr/guide/produire-design-dev`
- `/fr/guide/organiser-son-ops`
- Chaque guide : 2000–3000 mots, recommandations de stacks, liens outils

**Critères de validation :**
- Guides accessibles depuis la navigation principale
- Chaque guide référence au moins 3 stacks et 5 outils
- Score Flesch-Kincaid acceptable pour niveau B2 (accessible)

---

## Sprint 8 — Audit de stack interactif

**Objectif :** Outil interactif permettant de générer une stack personnalisée.

**Livrables :**
- Formulaire multi-étapes : persona → objectif → budget → complexité
- Recommandation de stacks filtrées + explication du choix
- Résultat exportable (lien partageable, PDF)
- Tracking des résultats pour itérations éditoriales

**Critères de validation :**
- Parcours complet en < 90 secondes
- Résultat pertinent pour chaque combinaison de facettes
- Lien partageable fonctionnel

---

## Sprint 9 — SEO — Contenu longue traîne

**Objectif :** Générer du trafic organique sur des requêtes de comparaison spécifiques.

**Livrables :**
- 30+ comparatifs supplémentaires (longue traîne)
- Optimisation meta title/description pour toutes les pages
- Sitemap XML complet
- Schema.org : `SoftwareApplication`, `FAQPage`, `BreadcrumbList`
- Redirects pour variantes d'URL

**Critères de validation :**
- Score Lighthouse SEO ≥ 95 sur pages stratégiques
- Sitemap soumis à Google Search Console
- 0 erreur de schema dans Rich Results Test

---

## Sprint 10 — Monétisation + Partenariats

**Objectif :** Établir un modèle économique durable sans compromettre l'intégrité éditoriale.

**Livrables :**
- Politique de liens sponsorisés (transparence totale)
- Intégration affiliate links (si applicable) avec disclosure
- Page `/fr/partenariats` expliquant le modèle
- Workflow de validation des contenus sponsorisés

**Critères de validation :**
- Chaque lien sponsorisé clairement marqué `[sponsorisé]`
- Aucune recommandation éditoriale influencée par une contrepartie
- Page partenariats indexable et transparente

---

_Dernière mise à jour : 2026-05-16_
