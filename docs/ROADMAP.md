# ToolTrim — Roadmap

État d'avancement et prochaines phases.

> Ce document conserve l’historique général du site.
>
> Le suivi technique actif et ses prochaines priorités figurent ci-dessous.
> Les autres roadmaps actives et décisionnelles sont :
> - [`ROADMAP_DIAGNOSTIC.md`](../ROADMAP_DIAGNOSTIC.md) pour le diagnostic adaptatif ;
> - [`MA_STACK_ROADMAP.md`](./MA_STACK_ROADMAP.md) pour Ma stack et l’exploration contextuelle.

---

<a id="suivi-technique-actif"></a>

## Suivi technique actif — 9 octobre 2026

**Point d’entrée du chantier : [état des lieux, gains et roadmap complète par lots](ETAT_DES_LIEUX_ET_ROADMAP_2026-10-09.md).** Ce bilan remplace les anciens tableaux d’avancement. Les sections historiques ci-dessous ne sont pas des états de production actuels.

### Situation actuelle

| Niveau | État vérifié |
|---|---|
| Socle publié | Code `4601f877cf` (R1), après contrats API `13b631bc1d` (R0) : CI complètes et statuts Vercel réussis, recette API publique conforme. Socle frontend Router `88d7f5d7a5` conservé : prix/navigation/stockage, SSR/SEO, dépendances compatibles, compactage et hydratation FR/EN. |
| Publié et vérifié | R1 `4601f877cf` : contrat HTTP compatible, retrait du SDK de types ; 82 contrats/types et tests app/SEO passent. Build, CI, Vercel et recette publique réussis. |
| Hors de ces lots | Refonte locale catégories et travaux catalogue/médias non suivis, préservés. |
| Non certifié | Backend annoncé traité manuellement ; API Supabase saine non mesurée dans notre environnement ; qualité complète des relations et valeur utilisateur. |

Gains mesurés : **24,62 MiB de formatage HTML**, **5,59 MiB de bootstrap**, et **17 595 octets / 4,99 % gzip CDN** sur l’index navigateur. Ce sont des métriques distinctes, pas un gain global de vitesse. Audit npm actualisé : **9 entrées complètes / 7 omit-dev, zéro critique**, après retrait du SDK dans R1. Dernier artefact local validé : **824,8 MiB**, dont **713,2 MiB HTML** (budgets 831/716). Dernière CI complète R1 : 266 tests applicatifs, 82 contrats API, 23 contrats SEO, 99 tests Ma Stack et 56 hydratations en 5,2 min ; les suites ne sont pas additionnées.

### Suivi des lots et propositions suivantes

| Lot | Prochaine décision / dépendance |
|---|---|
| R0 — Publication des contrats API | Publié ; nouvelle étape API verte. CI complète et déploiement Vercel réussis. |
| R1 — Réduction SDK | Terminé et publié `4601f877cf` : audit 15 → 9, 104 entrées lock retirées ; CI et recette publique réussies. |
| R2 — Contre-vérification backend manuel | Obtenir preuves/configuration ; ne pas présumer le point manuel non corrigé. |
| R3 — Baseline API catalogue saine | Lecture/DNS fonctionnels nécessaires avant décision d’architecture distante. |
| R4 — Promesse Ma Stack | Aligner coûts, recoupements et économies avec ce qui est réellement démontré. |
| R5 — Relations Explorer | Pilote éditorial de référence et explication des liens. |
| R6 — Catalogue factuel / canary | Base commune existante, identités, faits sourcés, projection et rollback ; coordination requise. |
| R7 — Chargement suivant | Mesure et canary après R3/R6 ; aucune suppression sur gain théorique seul. |
| R8 — Accessibilité / Safari | Parcours stabilisés, focus, clavier, mobile et overlays. |
| R9 — Mesure / utilisateurs | Observer la valeur de la boucle Explorer → ajout → retour, avec consentement respecté. |
| R10 — Tailwind / outils de build | Lot conditionnel, isolé ; coût de migration à comparer au bénéfice réel. |
| R11 — SEO/GEO / médias | Revalider les défauts actuels, corriger les fiches prioritaires, observer l’indexation si accès disponible. |

Le [bilan complet](ETAT_DES_LIEUX_ET_ROADMAP_2026-10-09.md#4-roadmap-complète-proposée-par-lots) décrit pour chaque lot son livrable, sa dépendance, son critère de sortie et l’effort relatif. Les propositions ne valent pas autorisation d’implémentation. Aucun gain Core Web Vitals ou de classement Google n’est établi. Comptes/synchronisation, personnalisation avancée, diagnostic/nouvelles verticales et dark mode restent séparés.

---

## Phase 1 — Composants éditoriaux ✅ (Sessions 1–3)

| Item | Statut |
|---|---|
| StickyDecisionCard redesign | ✅ Fait |
| ToolDetailPage hero simplifié | ✅ Fait |
| Section Décision rapide (3 blocs) | ✅ Fait |
| Onglets renforcés (72px, 16px, 2px underline) | ✅ Fait |
| Bande Audit de stack (full-width) | ✅ Fait |
| Footer CTA ToolTrim (full-width) | ✅ Fait |
| GuidesPage éditorial (gi-*) | ✅ Fait |
| GuideDetailPage article éditorial (ga-*) | ✅ Fait |
| Variable --header-height dans :root | ✅ Fait |

---

## Phase 2 — Stabilisation structurelle (Sprint 1) ✅

| Item | Statut | Notes |
|---|---|---|
| Mobile menu full-screen | ✅ Corrigé | Panel 1023px → full-width, scrollable |
| Variable --navbar-h | ✅ Corrigé | Alias de --header-height |
| Sticky sidebar vérifié | ✅ Vérifié | Pattern correct depuis Session 1 |
| CLAUDE.md créé | ✅ Fait | Guide pour Claude |
| docs/AI_HANDOFF.md créé | ✅ Fait | Handoff opérationnel |
| docs/ROADMAP.md créé | ✅ Fait | Ce fichier |
| ToolCardEditorial (orphelin) | 📋 Documenté | Migration Phase 3 |
| Dark mode gi-*/ga-* | 📋 Dette technique | Phase 6 |

---

## Sprint 2 — Refonte template page outil ✅

| Item | Statut | Notes |
|---|---|---|
| H1 conditionnel noms courts (≤5 chars → max 104px) | ✅ Fait | `clamp(4.5rem, 8vw, 6.5rem)` |
| Sidebar sticky top offset | ✅ Fait | `calc(var(--navbar-h, 68px) + 20px)` |
| Label "Prix à partir de" sidebar | ✅ Fait | Conditionnel si displayPrice > 0 |
| Responsive td-dr-grid, td-diag-inner, td-footer-inner | ✅ Vérifié | Breakpoints 768px/900px existants OK |

---

## Sprint 3 — Guides + Articles ✅

| Item | Statut | Notes |
|---|---|---|
| Hero metadata tags → dot-séparés | ✅ Fait | CSS `::before` |
| Titres lignes articles (30px→42px) | ✅ Fait | `gi-row-title` |
| Bloc featured agrandi | ✅ Fait | `gi-featured-title` |
| H2 articles (42px→56px) | ✅ Fait | `ga-content h2` |
| H3 articles (28px→34px) | ✅ Fait | `ga-content h3` |
| TOC sticky offset → var(--navbar-h) | ✅ Fait | `ga-toc-col` |
| TOC links couleur (#6F6F68) | ✅ Fait | `ga-toc-link` |
| Encadrés "À retenir" | ✅ Fait | parser Markdown → ga-takeaway |
| Module outils — badge prix | ✅ Fait | `ToolRow` amélioré |
| Correction CTA /diagnostic → /selector | ✅ Fait | GuidesPage + GuideDetailPage |
| eh-description standardisée | ✅ Fait | 19px, #6F6F68, 680px |

---

## Sprint Guides v2 — Filtres, logos, section Commencer ici ✅

| Item | Statut | Notes |
|---|---|---|
| Barre de filtres éditoriaux | ✅ Fait | 7 filtres, pills noirs, zéro bleu |
| Tri discret | ✅ Fait | Récents / Sélection / Lecture courte |
| Logos outils cités (pastilles) | ✅ Fait | `tool-logo-stack`, max 5, +N overflow |
| Rows guides améliorées | ✅ Fait | type + intent + logos dans chaque row |
| Section "Commencer ici" | ✅ Fait | 3 angles, `gi-start-here-grid` |
| Load more (12 par défaut) | ✅ Fait | `gi-load-more`, reset sur filtre/tri |
| Hero right module synchro | ✅ Fait | Partage le même `activeFilter` |
| Responsive filtres scroll horizontal | ✅ Fait | `≤700px` |

---

## Sprint Grid — Système de grille global ✅

| Item | Statut | Notes |
|---|---|---|
| Tokens `--layout-*` dans `:root` | ✅ Fait | max, content, article, sidebar, gutter |
| Overrides responsive `--layout-gutter` | ✅ Fait | 48px → 32px (≤1023) → 20px (≤767) |
| Classes utilitaires `.layout-*` | ✅ Fait | shell, content, article-grid, tool-grid |
| `eh-container` 1440px → 1280px | ✅ Corrigé | Aligne hero vs body sur GuidesPage |
| `ga-body-grid` 1120px → 1280px | ✅ Corrigé | Aligne body article vs hero |
| `ga-cta-inner` 1120px → 1280px | ✅ Corrigé | Aligne CTA band vs body |
| Containers tokenisés (`gi-*`, `ga-*`, `td-*`) | ✅ Fait | Utilisent `var(--layout-*)` |

---

## Sprint 5b — Stacks : refonte éditoriale ✅

| Item | Statut | Notes |
|---|---|---|
| StacksPage réécriture (`sk-*`) | ✅ Fait | Hero inline, profils grid, pills filtres, cards pastilles |
| StackDetailPage réécriture (`sd-*`) | ✅ Fait | Hero brand, subnav noir, summary métriques, tool rows, CTA band |
| Fix React hooks violation (useMemo avant return) | ✅ Corrigé | `relatedStacks` déplacé avant `if (!stack)` |
| Suppression `Button` / `ArrowRight` (bleu) | ✅ Fait | Remplacés par boutons noirs inline ou `<Link>` |
| ToolPanel / Sheet conservé intact | ✅ Vérifié | Aucun changement |

---

## Sprint Comparatif v2 — Renforcement affordance de comparaison ✅

| Item | Statut | Notes |
|---|---|---|
| Section "Ce que fait chaque outil" (cp-overview-grid) | ✅ Fait | 2 cards symétriques, desc + cas d'usage |
| Section "Avantages et limites" (cp-pros-cons-grid) | ✅ Fait | Remplace "Limites" seule, pros + cons séparés |
| Section "Ce qui doit te faire choisir" (cp-decision-list) | ✅ Fait | Rows contexte → choix |
| Interface CompareEditorialContent étendue | ✅ Fait | toolADesc/UseCases, prosA/B, decisionRows |
| Subnav 7 ancres | ✅ Fait | Ajout "Ce que font les outils" + "Avantages" |
| Labels verdict plus explicites ("Prends X si…") | ✅ Fait | |
| buildFallbackContent mis à jour | ✅ Fait | Nouveaux champs dérivés des données outil |
| CSS cp-overview-* + cp-pros-cons-* + cp-decision-* | ✅ Fait | ~130 lignes |

---

## Sprint Comparatif — Refonte /fr/comparatif/:pair ✅

| Item | Statut | Notes |
|---|---|---|
| Hero 2 colonnes (cp-hero-inner) | ✅ Fait | H1 font-brand, module VS sticky |
| Subnav 6 ancres (cp-subnav) | ✅ Fait | Zéro bleu, underline noir |
| Verdict rapide 3 colonnes (cp-verdict-grid) | ✅ Fait | |
| Tableau comparatif 10 lignes (cp-table) | ✅ Fait | Responsive data-label mobile |
| Profils 6 cartes (cp-profile-grid) | ✅ Fait | |
| Prix avec bold (PricingNote) | ✅ Fait | Composant interne regex |
| Limites 2 colonnes (cp-limits-grid) | ✅ Fait | `::before "—"` |
| Alternatives 5 lignes (cp-alt-row) | ✅ Fait | Link DB / div statique |
| CTA band fond #EDEDE8 (cp-cta-band) | ✅ Fait | |
| FAQ accordion (FaqItem) | ✅ Fait | `<details>/<summary>` natif |
| Registre éditorial + fallback générique | ✅ Fait | `EDITORIAL_CONTENT` + `buildFallbackContent()` |
| Système CSS `cp-*` (~300 lignes) | ✅ Fait | Ajouté dans `index.css` |
| Documentation CHANGELOG/DESIGN_SYSTEM/ARCHITECTURE/ROADMAP | ✅ Fait | Ce sprint |

---

## Sprint Stack Detail — Refonte éditoriale StackDetailPage ✅

| Item | Statut | Notes |
|---|---|---|
| Hero 2 colonnes (sd-hero-grid) + Snapshot sticky (sd-snapshot) | ✅ Fait | Logos outils pastilles, métriques, verdict court |
| Subnav 6 ancres (sd-nav) | ✅ Fait | Vue d'ensemble / Outils / Budget / Risques / Alternatives / FAQ |
| Section Vue d'ensemble : intro + grille 3 col + note expert | ✅ Fait | sd-overview-grid, sd-expert-note |
| Section Outils : groupes par couche + labels Essentiel/Optionnel/À challenger | ✅ Fait | PERSONA_LAYERS pour persona contenu |
| Section Priorités 3 colonnes (sd-priority-grid) | ✅ Fait | Codes couleur vert/gris/rouge |
| Section Budget 3 niveaux (sd-budget-list) | ✅ Fait | Minimal / Recommandé / À surveiller |
| Section Risques (sd-risk-enhanced-row) | ✅ Fait | Format Problème / Conséquence / Recommandation |
| Section Alternatives 3 variantes (sd-alt-grid) | ✅ Fait | Minimale / Recommandée / Intensive |
| CTA band fond #EDEDE8 (sd-cta-band + sd-cta-inner) | ✅ Fait | |
| Section FAQ accordéon (sd-faq-list) | ✅ Fait | details/summary natif + ChevronDown |
| Registre éditorial EDITORIAL_REGISTRY + buildFallbackEditorial() | ✅ Fait | Contenu complet pour createur-contenu-operateur |
| PERSONA_LAYERS — couches thématiques persona contenu | ✅ Fait | Remplace STACK_LAYERS générique |
| ~297 classes CSS sd-* ajoutées dans index.css | ✅ Fait | |

---

## Sprint Stacks Facettes — Sidebar de facettes ✅

| Item | Statut | Notes |
|---|---|---|
| Layout 2 colonnes `sk-listing-layout` (256px + 1fr) | ✅ Fait | Gap 48px, align-items start |
| Sidebar sticky + scrollable (`sk-sidebar`) | ✅ Fait | max-height viewport, overflow-y auto, scrollbar thin |
| 4 groupes de facettes : Profil / Objectif / Budget / Complexité | ✅ Fait | `sk-facet-group`, `sk-facet-option`, `sk-facet-count` |
| `FacetGroup<T>` composant générique | ✅ Fait | TypeScript generic, réutilisable desktop + mobile |
| `SidebarContent` composant partagé | ✅ Fait | Utilisé dans sk-sidebar ET sk-mobile-panel |
| Filtrage combinatoire `stackMatchesFacets` | ✅ Fait | Profile × Objectif × Budget × Complexité × Query |
| Dérivation objectifs depuis `subProfiles` | ✅ Fait | `OBJECTIVE_SUBPROFILES` + `getStackObjectives()` |
| Compteurs dynamiques par facette | ✅ Fait | Sur l'ensemble STACKS, pas la sélection courante |
| Panneau mobile full-screen (`sk-mobile-panel`) | ✅ Fait | Fixed, scrollable, Escape key, body overflow lock |
| Bouton "Filtres (N)" avec badge count | ✅ Fait | `sk-mobile-trigger-row`, masqué >= 1024px |
| Barre résultats (count + tri) | ✅ Fait | `sk-results-header`, search desktop dans `sk-results-search` |
| Tags cards : budget tier + complexité + outils | ✅ Fait | `sk-card-tags-row`, `sk-card-tag` |
| Empty state + reset button | ✅ Fait | `sk-empty-state`, `sk-empty-reset` |
| Suppression `FILTER_PILLS` / `StackFilterId` | ✅ Fait | Remplacés par sidebar facettes |

---

## Sprint Stacks v2 — Filtre + tri ✅

| Item | Statut | Notes |
|---|---|---|
| Contrôle de tri (Recommandé / Budget / Outils) | ✅ Fait | `gi-sort-select`, même ligne que filtres |
| `StackSortId` type + `sortBy` state | ✅ Fait | `"recommended" \| "budget" \| "tools"` |
| Logique de tri dans `filteredStacks` useMemo | ✅ Fait | Budget croissant, outils décroissant, recommended = FEATURED_STACK_SLUGS |
| `sk-filter-row` layout filtre + tri | ✅ Fait | `display: flex; flex-wrap: wrap; gap: 8px` |
| Empty state amélioré avec reset button | ✅ Fait | Reset filtre + query + tri en un clic |

---

## Sprint Comparatifs Index v2 — Refonte éditoriale ✅

| Item | Statut | Notes |
|---|---|---|
| Hero inline (sans EditorialHero) | ✅ Fait | `cix-hero`, H1 2 lignes, zéro badge |
| Barre de recherche 56px (`cix-search-input`) | ✅ Fait | Filtering temps réel sur nom d'outil |
| Chips de suggestion (`cix-suggestion-chip`) | ✅ Fait | 5 suggestions, injectées dans searchQuery |
| Filtres catégorie (`cix-filter-pill`) | ✅ Fait | IA / Productivité / Design / Automatisation / CRM |
| `getSlugCategory()` détection auto par slug | ✅ Fait | Pas de modification de comparisons.ts |
| `deriveCardDesc()` description contextuelle | ✅ Fait | verdict.keepIf → shortDescription → fallback |
| Grille 2 colonnes (`cix-grid`) | ✅ Fait | Gap 24px, ≤900px → 1 colonne |
| Cards redessinées (`cix-card`) | ✅ Fait | VS block, logos pastilles, cta arrow hover |
| Comparateur custom conservé et restyled | ✅ Fait | `cix-comparator-band`, fond #F8F8F4 |
| Système CSS `cix-*` (~280 lignes) | ✅ Fait | Ajouté dans `index.css` |

---

## Sprint 5a — Responsive / QA global (à faire)

| Item | Priorité | Notes |
|---|---|---|
| CategoryPage sidebar sticky offset | HAUTE | `sticky top-6` → `calc(var(--navbar-h, 68px) + 20px)` |
| Nettoyage CSS `tc-list-row` orphelin | MOYENNE | Remplacé par `tcr-*`, anciens sélecteurs à supprimer |
| Suppression dead code `ToolCard` default/list-row | MOYENNE | Variants dépréciés mais encore présents dans le fichier |
| Audit breakpoints 1440→375px sur toutes les pages | HAUTE | 10 breakpoints, vérification visuelle |
| GuidesPage filtres scroll horizontal ≤700px | MOYENNE | Vérifier que le scroll fonctionne sur iOS |
| Accessibilité : focus rings, Escape menus, labels boutons | MOYENNE | |

---

## Phase 3 — Cards / Listings ✅ Sprint 4

| Item | Statut | Notes |
|---|---|---|
| Migration ToolCardEditorial → remplace ToolCard default | ✅ Fait | ToolsPage grille principale |
| Score ToolTrim visible sur card grid | ✅ Fait | prescription_quality → score numérique |
| ToolRowEditorial (list row éditorial) | ✅ Fait | Remplace list-row dans CategoryPage |
| Stack cards contextuelles (`sk-card`) | ✅ Fait | StacksPage sélection profil / budget / niveau |
| ResultsPage : intégrer editorial card | 📋 Backlog | Après validation sur ToolsPage |

**Système de cards stabilisé :**
- `ToolCardEditorial` — grille outils (ToolsPage) — **actif**
- `ToolRowEditorial` — liste catégorie (CategoryPage) — **actif**  
- `sk-card` — stacks contextuelles (StacksPage) — **actif**
- `ToolCard variant="featured"` — sélection éditoriale (ToolsPage) — conservé
- `ToolCard variant="list-row"` — déprécié (remplacé par ToolRowEditorial)
- `ToolCard variant="default"` — déprécié (remplacé par ToolCardEditorial)

---

## Phase 4 — Homepage

| Item | Priorité |
|---|---|
| Vérifier cohérence typographique eh-hero-title vs td-hero | HAUTE |
| Standardiser H1 hero home avec --font-brand, ls -0.07em | MOYENNE |
| Améliorer section "Stacks en vedette" | BASSE |

---

## Phase 5 — Performance

| Item | Priorité | Notes |
|---|---|---|
| Chargement catalogue : projections et shards | HAUTE | Ancienne mesure 3,3 MB obsolète ; shards outil/stack déjà générés. Mesurer les téléchargements réels avant le prochain découpage ; voir le suivi technique actif. |
| Lazy loading des sections ToolDetail | MOYENNE | ToolVerdictBlock, ToolAlternativesSection |
| Images WebP + srcset | MOYENNE | Logos outils |

---

## Phase 6 — Dark mode

| Item | Statut | Notes |
|---|---|---|
| Préférence clair/sombre persistante | ✅ Fait | Sélecteur dans la sidebar, fallback sur la préférence système |
| Guides `gi-*` en sombre | ✅ Vérifié | Index contrôlé visuellement dans le shell desktop |
| Audit global des pages historiques | 📋 Dette technique | Vérifier les anciennes surfaces non migrées vers les tokens |
| Prévention du flash de thème au chargement | 📋 À évaluer | Ajouter un script de pré-hydratation uniquement si le flash est perceptible en production |

---

## Backlog

- Colonnes thèmes GuidesPage dynamiques (actuellement statiques/hardcodées)
- TOC de GuideDetailPage : tester avec accents dans les titres H2
- Mobile menu : skeleton ou état de chargement dans panel-content (données Supabase tardives)
- Submit tool flow : vérifier le flux complet
- Ajouter `llms.txt` pour GEO readiness


## 5 octobre 2026 — Mon Stack V1

- Expérience personnelle locale : Stack/Map, recherche directe, inspection contextuelle et retrait annulable. Voir `docs/MON_STACK_V1.md`.
- Dette dark mode : les nouvelles classes ms-* utilisent les tokens du thème ; validation visuelle sombre détaillée différée.
- Dette transverse : vérificateur TypeScript strict et baseline design-tokens déjà en échec hors périmètre. Aucun nouveau rayon littéral ni couleur hex dans ce chantier.
