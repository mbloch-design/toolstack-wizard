# Livrable 0 — Dépôt canonique & correction de l'audit initial

> Note de transparence. Le premier audit avait été mené par erreur sur un **clone périmé**.

## 1. Dépôt canonique confirmé

| | `~/Documents/New project` (**canonique**) | `~/Documents/toolstack-wizard-clean` (clone périmé) |
|---|---|---|
| git-store | `~/.git-store/tooltrim.git` | dépôt local séparé |
| Branche | `codex/go25-preprod-hardening` | `main` |
| HEAD | `df440b6` (« harmonize breadcrumb spacing ») | `f42e2b0` |
| `AGENTS.md` | ✓ | ✗ |
| `scripts/sync-json-to-supabase.mjs` | ✓ | ✗ |
| `src/lib/pricing.ts` | ✓ | ✗ |
| `docs/…BRIEF.md` / `…MIGRATION.md` | ✓ (dans `docs/`) | ✗ (Downloads seulement) |
| `vite.config.ts` | 1899 lignes, `getMergedTools` + `__SSR_TOOL__` | 1153 lignes, sans |
| `tools_v4.json` | 1126 records | 1082 records (md5 différent) |

Même remote (`github.com/mbloch-design/toolstack-wizard.git`) et même backend Supabase (`rtfyfuwfdpnsogovkwai`). **Toute la suite du chantier se fait dans `New project`.** Les 3 documents écrits dans le clone sont orphelins — versions corrigées ici présentes (`01`–`04`).

## 2. Constats du premier §0 à RETIRER (artefacts du clone)

| Affirmation initiale (fausse pour le canonique) | Réalité canonique |
|---|---|
| « `sync-json-to-supabase.mjs` n'existe pas » | **Existe** : dry-run par défaut, `--apply`, par slug, introspection colonnes, `FIELD_MAP` |
| « `AGENTS.md` / `src/lib/pricing.ts` absents » | **Présents** (`pricing.ts` = `hasGenuineFreeTier`, plan gratuit vs essai) |
| « le build ne fetch pas Supabase, JSON-only » | **Faux** : `getMergedTools()` fetch `/rest/v1/tools?select=*&limit=2000`, **fusionne par slug (Supabase override)** ; fallback JSON **uniquement si fetch échoue/vide** |
| « pas de `__SSR_TOOL__`, contenu absent avant JS » | **Faux** : `__SSR_TOOL__` injecté au prerender (l.732/984), hydraté par `src/main.tsx` et `ToolSummaryBlock.tsx` |
| doublons `framer/flux/convertkit/perplexity` | **Artefact du clone.** `tools_v4.json` canonique = **0 doublon** id/slug |

## 3. Constats qui RESTENT valables (backend/données partagés)

- Supabase = **533** fiches ; `tools_v4.json` canonique = **1126** → **593 JSON-only** (cf. livrable 04). Supabase-only = **0** (toutes les fiches Supabase existent dans le JSON).
- `prescription_quality` a **8 valeurs incohérentes** (question 393, contextual 222, medium 193, silence 147, oui 80, ferme 63, ∅ 21, strong 7) — **champ diagnostic, chantier isolé (D2)**.
- Divergences JSON↔Supabase sur les fiches communes (prix, alternatives, `verified_on`) — à réconcilier via rapport de fusion (D4).
- `pricing_truth.csv` (42 lignes sourcées) = 3ᵉ source pricing, seed de reprise.
- Pricing périmé pour les pilotes non-figma (`verified_on 2026-03-13/03-29`, > 90 j au 2026-07-16 ; framer = **~109 j**, correction faite).

## 4. Précisions sur `getMergedTools` (build SEO canonique)

- Merge **par slug** : base JSON (1126) puis override Supabase (533) → union par slug ; **Supabase gagne** sur les slugs communs.
- `sbRowToTool` ignore `pertinence_by_persona`, renomme snake→camel (`SB_RENAME`), dérive `description` de `longDescription`.
- **Fallback silencieux vers JSON** présent (à supprimer en Phase 3 du plan, gate : indispo Supabase ⇒ build échoue).
- Clé anon codée en dur dans `vite.config.ts` pour le prerender — acceptable (lecture publique) mais à confirmer vs politique « pas de clé dans le versionné » du plan.

## 5. Gap `FIELD_MAP` (sync JSON→Supabase)

`FIELD_MAP` **couvre** : name, short/long descriptions (+En), pricing (+En), `pricing_v5`, defaultMonthlyPrice, verdict/pros/cons/useCases (+En), seo, alternatives, relevantFor, solo/teamRelevance, idealFor, free/betterAlternative, bundle_parent, host_app, prescription_quality/output, tool_type.

**Ne couvre PAS** (resteraient locaux si enrichis) : `covers`, `functional_needs`, `verticals`, `personas`, `ia_use_case`, `substitution_cluster_v2`, `decision_policy_v3`, `prescription_block_reasons`, `prescription_context_questions`, `migrationGuide`, `downgradePlan`, `timeGainedHoursPerMonth`, `articles`, `logo`, `websiteUrl`, `affiliateLink`, `substitutable`.

→ Si la collecte enrichit `covers`/`functional_needs`, le sync actuel **ne les pousserait pas**. À étendre le `FIELD_MAP` (hors champs diagnostic, D2) **avant** tout `--apply`.
