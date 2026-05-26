---
target: ComparePage /fr/comparatif/figma-vs-canva
total_score: 26
p0_count: 0
p1_count: 2
p2_count: 3
timestamp: 2026-05-22T20-21-40Z
slug: src-pages-comparepage-tsx
---
## Design Health Score

| # | Heuristique | Score | Problème clé |
|---|-------------|-------|--------------|
| 1 | Visibilité du statut système | 3/4 | Breadcrumb + sticky nav solides. Pas d'indicateur de chargement pour les données async. |
| 2 | Correspondance avec le monde réel | 3/4 | Langage éditorial clair. Terminologie 02 vs 04 trop proche. |
| 3 | Contrôle et liberté | 3/4 | Navigation sticky, breadcrumb, FAQ toggle. |
| 4 | Cohérence et standards | 2/4 | cp-section-grid utilisé uniquement dans verdict. Trois CTAs même URL labels différents. Sections 02+04 redondantes. |
| 5 | Prévention des erreurs | 3/4 | Page de lecture, peu de risque. |
| 6 | Reconnaissance plutôt que mémorisation | 3/4 | Labels sticky nav clairs. Badges non expliqués. |
| 7 | Flexibilité et efficacité | 2/4 | Pas de raccourcis clavier. Pas de "retour en haut". Sticky nav seule option. |
| 8 | Design esthétique et minimaliste | 2/4 | 3 tables matricielles visuellement identiques. CTA x3. Microfiche héro trop générique. |
| 9 | Récupération d'erreur | 3/4 | N/A majoritairement. |
| 10 | Aide et documentation | 2/4 | FAQ présente. Pas de contexte méthodologie. Badges non expliqués. |
| **Total** | | **26/40** | **Acceptable** |

## Priority Issues

P1: Sections 02+03+04 trois tables identiques consécutives.
P1: Display Monopoly Rule violée — cp-title et cp-hero-duel-name utilisent Uncut Sans sous 44px.
P2: CTA x3 vers /selector — lignes 1610, 1891, 2016.
P2: tt-fact-label détourné en phrase 57 caractères dans le callout verdict.
P2: Contraste #6F6F68 sur #F8F8F4 ≈ 3.8:1, sous seuil WCAG AA.
