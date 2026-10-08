# ToolTrim — Roadmap

État d'avancement et prochaines phases.

> Ce document conserve l’historique général du site.
>
> Le suivi technique actif et ses prochaines priorités figurent ci-dessous.
> Les autres roadmaps actives et décisionnelles sont :
> - [`ROADMAP_DIAGNOSTIC.md`](../ROADMAP_DIAGNOSTIC.md) pour le diagnostic adaptatif ;
> - [`MA_STACK_ROADMAP.md`](./MA_STACK_ROADMAP.md) pour Ma stack et l’exploration contextuelle.

---

## Suivi technique actif — 8 octobre 2026

Ce suivi remplace les statuts techniques historiques lorsqu'ils se contredisent. Les rapports d'audit conservent leurs mesures à la date de leur réalisation ; ils ne remplacent pas cette roadmap.

### Lots réalisés et publiés

| Lot | État | Résultat / preuve |
|---|---|---|
| Points 2 et 3 de la revue technique | Publiés | CI et types explicites, SSR obligatoire, navigation/cache/recherche, données persistées et synchronisation corrigés. [Corrections](CORRECTIONS_TECHNIQUES_2026-10-07.md) |
| Dépendances compatibles | Publiées ; avis résiduels ouverts | Réduction des alertes, sans migration React Router 7/Tailwind 4. Les chiffres restent ceux du snapshot d'audit. [Rapport](DEPENDANCES_SECURITE_2026-10-08.md) |
| Compactage HTML | Publié | 24,62 MiB de formatage retirés avec équivalence du contenu. [Rapport](COMPACTAGE_HTML_2026-10-08.md) |
| Parité d'hydratation EN | Déployée, `244d7a9d52` | Champs FR nécessaires aux calculs conservés ; recette publique FR/EN. [Rapport](CORRECTIF_HYDRATATION_EN_2026-10-08.md) |
| Hydratation avec Ma Stack enregistrée | Déployée, `cccdbc002b` | Restauration après le premier rendu SSR ; 56/56 parcours publics sans perte des choix. [Rapport](CORRECTIF_HYDRATATION_STACK_2026-10-08.md) |
| Projection des sept champs historiques | Déployée, `90af59e551` | Gain 5,59 MiB, 13 162 HTML identiques hors payload autorisé, sitemap identique ; 56/56 parcours publics, onglets secondaires inclus. [Rapport](PROJECTION_BOOTSTRAP_2026-10-08.md) |

Dernier artefact validé : **824,9 MiB**, dont **713,2 MiB HTML**. Budgets : 831/716 MiB. Recette du dernier lot : 249 tests applicatifs, 23 contrats SEO, types, build et 56 parcours Chromium. Ces mesures ne sont pas des Core Web Vitals ni une garantie de classement SEO.

### Prochaines priorités

| Ordre | Chantier | État | Critère de sortie |
|---|---|---|---|
| 1 | Résorber la dette actuelle du gate design | Déployé, `863e4737eb` | Gate 137/223/125 PASS, baseline et validateur inchangés ; 12 vues publiques contrôlées, 30 parcours locaux PASS. [Preuves](GATE_DESIGN_2026-10-08.md). |
| 2 | Automatiser la recette d'hydratation sur l'artefact construit | Intégré ; première exécution distante à contrôler | Chromium après build, 56 parcours HTML généré, rapport/traces 7 jours, main couvert. Suite plafonnée à 10 minutes et job à 30 ; flakes bloquants. Recette CI locale 56/56 en 4,8 min. [Contrat et preuves](HYDRATATION_CI_2026-10-08.md). |
| 3 | Préparer l'évolution du chargement catalogue | Prochaine étape à cadrer | Mesurer les requêtes/octets réellement reçus et le temps d'interaction sur fiches, listings et Ma Stack ; choisir les prochaines projections/shards sur ces mesures, avec les sources factuelles intactes. Coordonner avec le chantier catalogue existant. |
| 4 | Réexaminer les alertes de dépendances restantes | Lot séparé | Actualiser l'audit, distinguer build/runtime et traiter chaque migration avec recette de routes/SSR ou rendu. Aucun override majeur aveugle ni migration Tailwind/routeur incluse dans une optimisation de poids. |

Le groupe supplémentaire de champs transportés par les adaptateurs représente **3,09 MiB théoriques** dans le snapshot d'audit. Il reste **à auditer**, pas autorisé à supprimer sur cette seule mesure. Comparaisons/stack ont des bootstraps distincts. Cette piste est secondaire par rapport au chargement catalogue et aux gains visibles pour l'utilisateur.

### Limites et travaux différés

- Point 1 sécurité/backend : annoncé traité manuellement par le propriétaire ; configuration et déploiement distants non contre-vérifiés ici. Ne pas le déclarer certifié sur la seule base du dépôt.
- Les protections/avis restants sont détaillés dans la revue technique et le rapport dépendances ; une amélioration des chiffres npm n'est pas une certification de l'infrastructure.
- Audit accessibilité exhaustif, Safari/WebKit et optimisation globale CSS/données restent différés pendant l'évolution de l'architecture catalogue. Les contrôles clavier/mobile ciblés existants restent requis lors d'un changement de ces parcours.
- Aucun changement des catégories locales ou des exports de catalogue n'a été inclus dans les publications ci-dessus.
- Dark mode : dette historique, non prioritaire.

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
