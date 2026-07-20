# Livrable 2 — Dictionnaire canonique des champs `tools`

> Dépôt canonique `New project`. **Supabase = identité canonique (D4).**
> Colonne réelle = `category` (le type applicatif `types.ts` la nomme `categoryId` ; le mapper renomme).
> `volatilité` = brief §5.4 · `impact diag.` = lu par `useDiagnosticData.ts`.

**Source de vérité** : **native** (fait sourcé, jamais dérivé) · **calculée** (dérivée) · **éditoriale** (rédaction/décision ToolTrim) · **système** (base/workflow).

## 1. Identité

| Colonne | App | Type | Source vérité | Volatilité | Diag. | Publication |
|---|---|---|---|---|---|---|
| `id` | `id` | text (PK) | système | nulle | clé | obligatoire, immuable |
| `slug` | `slug` | text | système | nulle | — | unique, = route |
| `name` | `name` | text | native | basse | affichage | obligatoire |
| `category` | `categoryId` | text (FK) | **éditoriale** (classement ToolTrim, pas un fait produit) | basse | **oui** | catégorie valide de la taxonomie ToolTrim |
| `tool_type` | `tool_type` | enum | **éditoriale** | basse | **oui** | `metier\|plugin\|ia\|gestion\|satellite` |
| `website_url` | `websiteUrl` | url | native | basse | — | obligatoire (source produit) |
| `affiliate_link` | `affiliateLink` | url | système | basse | — | facultatif |

> `category` est une **décision de rangement éditoriale** (ex. Supabase regroupe sous `design-tools` ce que le JSON éclatait en `prototyping`/`ui-components`) : la trancher relève de la taxonomie ToolTrim, pas d'une donnée factuelle du fournisseur. `tool_type` idem. Legacy JSON à retirer : `categoryId`, `link`, `website`.

## 2. Contenu éditorial

| Colonne | App | Source | Vol. | Diag. | Publication |
|---|---|---|---|---|---|
| `short_description(_en)` | `shortDescription(En)` | éditoriale (factuel) | basse | — | FR obligatoire, 1 phrase, hero ; EN jamais du FR |
| `long_description(_en)` | `longDescription(En)` | éditoriale | basse | — | 2–4 §, « Comprendre » |
| `covers` | `covers` | native (capacités) | moyenne | — | « Ce que fait l'outil » ; ≠ `pros` — **hors FIELD_MAP** |
| `use_cases(_en)` | `useCases(En)` | éditoriale | basse | — | production + résultat |
| `pros(_en)` / `cons(_en)` | `pros`/`cons` | éditoriale | basse | — | bénéfices/limites ≠ `covers`/`billingTraps` |
| `verdict(_en)` | `verdict` | éditoriale | moyenne | — | `keepIf`+`avoidIf` remplis |
| `functional_needs` | `functional_needs` | **éditoriale** (mapping besoin) | moyenne | **oui** | **hors FIELD_MAP** |

## 3. Public

| Colonne | App | Source | Diag. | Note |
|---|---|---|---|---|
| `relevant_for` | `relevantFor` | éditoriale | — | rôles concrets |
| `solo_relevance`/`team_relevance` | idem | éditoriale | — | enum `low\|medium\|high` |
| `personas` | `personas` | éditoriale | — | **hors FIELD_MAP** |
| `pertinence_by_persona` | *(non typé)* | éditoriale | **oui** | jsonb ; ignoré par `getMergedTools` ; **hors FIELD_MAP** |
| `verticals` | `verticals` | éditoriale | indirect | **hors FIELD_MAP** |

## 4. Pricing — modèle v2 (natif + normalisé, D5)

**Vérité = donnée native sourcée** ; l'EUR normalisé est **séparé** (comparateur) ; le JSON-LD utilise **le prix et la devise réellement affichés**. `pricing_v5` (jsonb) est couvert par `FIELD_MAP`. `pricing_truth.csv` = seed. Champs cibles (table dédiée, cf. livrable 03) :

| Champ cible | Source | Vol. | Publication |
|---|---|---|---|
| `native_amount` / `native_currency` | **native** | haute (90 j) | obligatoire si payant ; devise jamais convertie en dur |
| `billing_period` / `billing_commitment` | native | haute | ne pas mélanger mensuel/annualisé |
| `plan_name` | native | moyenne | nom officiel exact |
| `pricing_unit` (`seat\|site\|workspace\|usage\|flat`) | native | moyenne | ≠ « seat » par défaut |
| `tax_inclusion` | native | basse | facultatif |
| `free_core_available` | native | moyenne | **plan gratuit ≠ essai** (`src/lib/pricing.ts`) |
| `verified_at` / `official_source_url` | native | — | obligatoire ; page tarifaire (pas homepage) |
| `normalized_monthly_eur` / `fx_rate` / `fx_rate_date` / `normalization_method` | **calculée** | — | dérivés, jamais édités |

Transition : `default_monthly_price` (fallback), `pricing.{free,paid}` (texte), `pricing_v5.compare_price_monthly_eur` (= futur `normalized_monthly_eur`). Legacy `pricingTiers` à retirer.

## 5. Relations & alternatives

| Colonne | Source | Diag. | Publication |
|---|---|---|---|
| `alternatives` | éditoriale | — | même besoin ; slugs existants |
| `better_alternative` | éditoriale | **oui** | facultatif |
| `free_alternative` | éditoriale | **oui** | slug ≠ soi-même (bug figma `"figma"`) |
| `host_app` / `bundle_parent` | éditoriale | **oui** | plugins / suites |
| `substitution_cluster_v2` | éditoriale | **oui — DIAG** | ⛔ chantier isolé (D2) ; **hors FIELD_MAP** |

## 6. Champs diagnostic — ⛔ chantier isolé (D2)

Lus par `useDiagnosticData.ts`. **Non modifiés dans l'enrichissement éditorial.**

`prescription_quality` (**8 valeurs réelles** : question/contextual/medium/silence/ferme/oui/strong/∅ — vocabulaire à cadrer séparément), `prescription_output`, `prescription_block_reasons`, `prescription_context_questions`, `decision_policy_v3`, `force_silence`, `ia_use_case`, `pertinence_by_persona`. Tables liées : `clusters`, `doublon_rules`, `discovery_questions`. **Tous hors FIELD_MAP sauf `prescription_quality`/`prescription_output`.**

## 7. Média & SEO

`logo` (système), `gallery_images` (jsonb, Supabase-only, hors FIELD_MAP), `og_image_url` (Supabase-only, hors FIELD_MAP), `seo` (éditoriale), `articles` (système), `time_gained_hours_per_month` (éditoriale).

## 8. Cycle de vie — **à créer** (aucune n'existe, cf. livrable 03)

`content_status` (défaut **`draft`**, pas `published`), `research_status`, `content_version`, `editorially_reviewed_at`, `published_at`, `next_review_at`, `updated_at`.

## 9. Champs à retirer (legacy/doublons JSON)

`categoryId`, `description`, `website`/`link`, `pricingTiers`, `bestFor`, `tags`, `pivot_integration_source`, doublon snake `short_description_en`. À traiter à l'alignement `types.ts`, **après** rapport de fusion.
