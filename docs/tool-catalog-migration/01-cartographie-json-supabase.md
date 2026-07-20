# Livrable 1 — Cartographie `tools_v4.json` ↔ Supabase `tools`

> Dépôt canonique `New project`. Lecture seule, 2026-07-16. Aucune écriture catalogue/Supabase.
> Corrige les chiffres du premier passage (mené par erreur sur un clone périmé — cf. livrable 00).

## 1. Volumétrie (canonique)

| Source | Records | IDs uniques | Doublons |
|---|---:|---:|---|
| `src/data/tools_v4.json` | **1126** | 1126 | **0** |
| `src/data/tools_index.json` | 1081 | — | dérivé (désynchronisé du v4 : 1081 ≠ 1126) |
| Supabase `tools` | **533** | 533 | 0 |

**Rapprochement par `id` :**

| Ensemble | Nombre |
|---|---:|
| Rapprochés (id des deux côtés) | **533** |
| JSON-only | **593** |
| Supabase-only | **0** |

→ **Toutes** les fiches Supabase existent dans le JSON. 593 fiches vivent **uniquement** dans le JSON (cf. livrable 04). `tools_index.json` (1081) est désynchronisé de `tools_v4.json` (1126) — à régénérer.

**Pas de doublon** id/slug côté canonique (les doublons framer/flux/convertkit/perplexity étaient un artefact du clone).

## 2. Build SEO : dépendance réelle (canonique)

`vite.config.ts` → `getMergedTools(jsonTools)` :
1. lit `tools_v4.json` (base, 1126) ;
2. fetch Supabase `/rest/v1/tools?select=*&limit=2000` (anon, `Cache-Control: no-cache`) ;
3. **fusionne par slug**, Supabase **override** les slugs communs ;
4. **fallback JSON seul** si le fetch échoue ou renvoie vide ;
5. injecte `__SSR_TOOL__` au prerender (hydraté par `main.tsx` / `ToolSummaryBlock.tsx`).

Conséquences :
- Supprimer `tools_v4.json` aujourd'hui retirerait les **593 JSON-only** de la base de fusion (Supabase n'en a aucune) → perte SEO massive.
- Le **fallback silencieux** vers JSON est présent → à supprimer en Phase 3 (gate : indispo Supabase ⇒ build échoue, dernier déploiement conservé).

## 3. Divergences sur les 533 fiches rapprochées

Motifs observés (échantillon pilote + balayage) : `alternatives`, `pricing_v5.verified_on`, `default_monthly_price`, `short_description`, `substitution_cluster_v2`, `prescription_quality`, `category`, `free_alternative`. Exemples pilotes :
- **figma** : Supabase plus récent (`verified_on 2026-06-15`, alternatives `[canva,sketch,adobe-xd]`, `free_alternative=null`) vs JSON (`2026-03-13`, `free_alternative="figma"` ⚠️ auto-réf).
- **framer** : Supabase alternatives `[webflow,wix,squarespace]` (cohérent) vs JSON `[invision,balsamiq]` (douteux) ; prix JSON 5 vs Supabase 10.
- **webflow** : `default_monthly_price` divergent ; `pricing.paid` incohérent ($14 vs 15$ annuel).

**Règle de réconciliation (D4)** : Supabase = identité canonique. Le `sync-supabase-to-json` (`pick(remote, local)`) **ne remplace jamais** une valeur Supabase non-vide ; le risque réel est le **fallback local quand Supabase est vide/null** (réinjecte du périmé, ex. `free_alternative="figma"`). Toute réconciliation passe par un **rapport de fusion** revu, jamais par un upsert silencieux.

## 4. Inventaire de couverture des 593 JSON-only

Détail complet : livrable 04 + `inventory-json-only.csv`. Synthèse : `migrer 270 · rechercher 303 · archiver 20 · doublon 0`.

## 5. Gap `FIELD_MAP` (sync JSON→Supabase)

`covers`, `functional_needs`, `verticals`, `personas` (+ champs diagnostic) **ne sont pas** dans `FIELD_MAP` → non poussés par le sync. À étendre (hors diagnostic, D2) avant tout `--apply`. Détail : livrable 00 §5.

## Annexe — méthode

Lecture seule : `supabase.from('tools').select('*')` paginé (anon) + parse `tools_v4.json`. Aucune écriture. Champs diagnostic **comptés, non modifiés** (D2).
