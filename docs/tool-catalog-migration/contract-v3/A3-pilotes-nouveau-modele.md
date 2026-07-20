# Artefact 3/6 — Les cinq pilotes dans le modèle canonical

> Rév. 3. **Aucune écriture.** Représentation (marché/locale/contexte explicites, observations `superseded` conservées). ⭐ = `is_compare_plan`.

## framer — `global_usd_fallback` (marché non détecté)
| plan_key | seat_type | unit | is_free | native | cur | period | commitment | review_status |
|---|---|---|---|---|---|---|---|---|
| free | null | site | true | 0 | USD | — | — | approved |
| basic ⭐ | null | site | false | 10 | USD | monthly | **null (inconnu)** | **observed/needs_review** |
| pro | null | site | false | 30 | USD | monthly | null | observed |
> Stocké `Mini 5€` → `superseded`. Compare `basic` **sans engagement** ⇒ pas d'`approved` ⇒ prix public `null`/`needs_review`.

## figma — `global_usd_fallback` (par siège)
| plan_key | seat_type | unit | native | cur | period | commitment | review_status |
|---|---|---|---|---|---|---|---|
| starter | null | seat | 0 | USD | — | — | approved |
| professional ⭐ | full | seat | 16 | USD | monthly | **null (toggle inconnu)** | **observed/needs_review** |
| professional | dev | seat | 12 | USD | monthly | null | observed |
| professional | collab | seat | 3 | USD | monthly | null | observed |
| professional | full | seat | 12 / 15 | USD | annual / monthly | annual_prepaid / monthly | **superseded** (help 2025-03) |
> Devise stockée EUR → corrigée USD. Compare `full` **sans engagement** ⇒ prix public `null`/`needs_review`.

## webflow — `global_usd_fallback` (site, HT)
| plan_key | unit | is_free | native | cur | period | commitment | tax | review_status |
|---|---|---|---|---|---|---|---|---|
| starter | site | true | 0 | USD | — | — | ht | approved |
| basic ⭐ | site | false | 15 | USD | monthly | annual_prepaid | ht | **approved** |
| premium | site | false | 25 | USD | monthly | annual_prepaid | ht | approved |
> Stocké ~14 USD → `superseded`. Marché **non** « US ». Compare `basic` **approved** ⇒ prix public 15 USD.

## wix — candidat **`market_context='reference_fr'`** (`observed_market='FR'`, `observed_locale='fr-FR'` ; EUR TTC, annual_prepaid, site)
| plan_key | name_fr (loc) | unit | is_free | native | cur | period | commitment | tax | market_context | review_status |
|---|---|---|---|---|---|---|---|---|---|---|
| free | Gratuit | site | true | **aucune observation de montant** | — | — | — | — | claim officiel distinct | observed/needs_review |
| light ⭐ | Light | site | false | 16.80 | EUR | monthly | annual_prepaid | ttc | candidat `reference_fr` | **observed/needs_review** |
| core | Essentiel | site | false | 30.00 | EUR | monthly | annual_prepaid | ttc | candidat `reference_fr` | observed/needs_review |
| business | Business | site | false | 40.80 | EUR | monthly | annual_prepaid | ttc | candidat `reference_fr` | observed/needs_review |
| business_elite | Business Plus | site | false | 178.80 | EUR | monthly | annual_prepaid | ttc | candidat `reference_fr` | observed/needs_review |
> Stocké 20€ « seat » → futur `superseded` après bascule. Localisations candidates pour `tool_plan_localizations`. Compare cible `light` ⇒ 16,80 € TTC après approbation.
> **Rév. 4.2 — origine du `market_context`.** Le dossier `research/tool-pages/wix.json` porte le couple observé FR/fr-FR mais conserve `market_context=null` et `market_context_candidate='reference_fr'`. Le couple seul ne suffit jamais : le staging ne résout `reference_fr` qu'à partir d'une `human_review_attestation` active, non révoquée, rattachée à la capture et au hash exacts. À ce jour, l'unique attestation du dossier est l'incident de test révoqué ; Wix reste donc `needs_review`. Rang de sélection futur inchangé : match FR/fr-FR exact (rang 0) → `global_usd_fallback` (1) → autres (2).
>
> **D13** : `tool_plans.is_free=true` provient du claim officiel `pricing.free_plan_exists=true`. Aucun prix `0 EUR` n'est inventé puisque la source établit la durabilité du plan gratuit mais n'affiche ni montant ni devise.

## squarespace — candidat **`market_context='reference_fr'`** (`observed_market='FR'`, `observed_locale='fr-FR'` ; EUR, annual_prepaid, site ; `is_free=false`, `trial_days=14`)
| plan_key | name_fr (loc) | unit | is_free | native | cur | period | commitment | market_context | review_status |
|---|---|---|---|---|---|---|---|---|---|
| basic ⭐ | Basic | site | false | 12 | EUR | monthly | annual_prepaid | candidat `reference_fr` | **observed/needs_review** |
| core | Essentiel | site | false | 18 | EUR | monthly | annual_prepaid | candidat `reference_fr` | observed/needs_review |
| plus | Plus | site | false | 32 | EUR | monthly | annual_prepaid | candidat `reference_fr` | observed/needs_review |
| advanced | Advanced | site | false | 69 | EUR | monthly | annual_prepaid | candidat `reference_fr` | observed/needs_review |
> Stocké 20€ « seat » + « gratuit » → futur `superseded`. `tools.trial_days=14`, aucun plan gratuit. Compare cible `basic` ⇒ 12 € après approbation.
> **Rév. 4.2 — règle commune.** Le JSON pilote Squarespace ne porte aucun `market_context`, seulement le couple FR/fr-FR. Comme pour Wix, ce couple est nécessaire mais non suffisant : aucune valeur `reference_fr` n'est assignée automatiquement au staging. Une preuve de contexte explicitement revue et rattachée à la capture est requise avant toute approbation. Seul Webflow porte déjà `market_context='global_usd_fallback'` dans son dossier.

**Synthèse cible après staging et revue :** Webflow peut conserver son contexte mondial explicite ; Wix et Squarespace ne deviennent `approved` qu'après preuve humaine de contexte puis revue explicite des observations ; Framer/Figma restent `needs_review` (engagement inconnu ⇒ montant `null`).
