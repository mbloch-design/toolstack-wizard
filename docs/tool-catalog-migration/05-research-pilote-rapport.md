# Livrable 5 — RESEARCH pilote : rapport, matrice de conflits, bilan méthode

> Mode **RESEARCH**, 2026-07-16 (mise à jour Webflow/Wix accessibles). **Aucune écriture Supabase, aucun changement JSON, aucun SQL, aucun `--apply`, aucun champ diagnostic touché, aucune rédaction éditoriale définitive.**
> Provenance : `research/tool-pages/*.json` (hors-bundle). Valeur native conservée avant toute normalisation. Conflits non résolus. Une ligne de prix = observation datée, sourcée, contextualisée (marché/locale).

## A. Rapports humains par outil

### framer — `needs_review` (P1)
- Ouvert (niveau 1) : `framer.com/pricing`.
- Confirmé : **Free / Basic 10$ / Pro 30$ / Enterprise**, devise **$ (USD)**, **Free durable** (30 pages, 3 éditeurs).
- Conflit : stocké `Mini 5€` → **plan « Mini » disparu** ; entrée = **Basic 10 USD**. Devise EUR/USD incohérente.
- Inconnu : réduction annuelle, grille EUR régionale.

### figma — `needs_review` (P1)
- Ouvert (niveau 1) : `figma.com/pricing` + `help.figma.com`.
- Confirmé : par siège (Full/Dev/Collab). **Professional Full 16$ (USD)**, Dev 12$, Collab 3$. Starter gratuit.
- **`billing_commitment=unknown`** : l'état Monthly/Annual du toggle n'est pas établi → 16$ enregistré comme observation, engagement non figé.
- Historique conservé : article 2025-03 **12$ annuel / 15$ mensuel** en `superseded_candidate` (non supprimé).
- Conflit devise : stocké 16 étiqueté **EUR**, source **USD**.

### webflow — `needs_review` (P1)  *(corrigé : accessible)*
- Confirmé (niveau 1, `webflow.com/pricing`) : **Starter gratuit**, **Basic 15$/mois facturé annuellement**, **Premium 25$/mois facturé annuellement**, **par site, HT**, devise USD (marché US).
- Conflit : stocké ~**14 USD** (JSON 12.12€ / Supabase 13.14) → **périmé** ; `pricing.paid` « USD 14/month » obsolète.
- Inconnu : équivalent en engagement mensuel ; plans CMS/Business ; grille EUR régionale.

### wix — `needs_review` (P1)  *(corrigé : accessible, régionalisé)*
- Confirmé (niveau 1, `wix.com/plans`) : plans **Free / Light / Core / Business / Business Elite**, **vrai plan gratuit**, **par site**, montants = **abonnements annuels payés intégralement**.
- **Montants NON retenus** : page régionalisée, aucun marché/locale observé cette passe → aucun montant enregistré.
- Conflit : stocké `compare_plan_kind="seat"` **faux** (site) ; source stockée = **homepage** (niveau insuffisant).

### squarespace — `needs_review` (P1)
- Confirmé (niveau 1, support officiel) : plans **Basic / Core / Plus / Advanced**, **aucun plan gratuit, essai 14 jours**, **par site**.
- **Montants inconnus** (page pricing rendue en JS). Indices niveau 3 (Basic ~16$, Core ~23$, Plus ~39$) **non promus en claims**.
- Conflit : stocké « Entry paid plan » + `kind="seat"` + `pricing.free` laissant croire à un plan gratuit.

## B. Matrice de conflits — Stocké JSON / Stocké Supabase / Source officielle

| Outil | Champ | JSON (stocké) | Supabase (stocké) | Source officielle (2026-07-16) | Statut |
|---|---|---|---|---|---|
| framer | plan d'entrée | Mini, 5 (EUR) | Mini, 5 (EUR) | **Basic 10 USD** (pas de Mini) | 🔴 périmé |
| framer | devise | 5€ + $ mélangés | idem | **USD** | 🔴 incohérent |
| figma | Full seat Pro | 16 (EUR) | 16 (EUR) | **16 USD** (page, commitment inconnu) | 🔴 devise |
| figma | Full seat (histo) | — | — | 12/15 USD (help 2025-03, superseded_candidate) | 🟠 historique |
| webflow | plan d'entrée | 12.12 (EUR, ~14$) | 13.14 (~14$) | **Basic 15 USD/mois (annuel), par site, HT** | 🔴 périmé |
| webflow | plan Premium | — | — | **25 USD/mois (annuel)** | 🟢 nouveau |
| wix | unité | seat | seat | **site** | 🔴 faux |
| wix | plan gratuit | « base » | « 20€ Pro » | **vrai plan gratuit** (Free) | 🟠 à clarifier |
| wix | montant | 20 (EUR) | 20 (EUR) | **régionalisé, non retenu** | ⚪ à re-collecter (locale) |
| squarespace | plan/unité | « Entry paid plan » seat | idem | **Basic/Core/Plus/Advanced, par site** | 🔴 nom + unité faux |
| squarespace | gratuit | « base » | « 20€ Pro » | **pas de plan gratuit, essai 14 j** | 🔴 essai≠gratuit |
| squarespace | montant | 20 (EUR) | 20 (EUR) | **inconnu (page JS)** | ⚪ non revérifié |

Légende : 🔴 conflit avéré · 🟠 à arbitrer · 🟢 nouveau fait · ⚪ non retenu/à re-collecter. **Aucune valeur publiée n'est écrasée.**

## C. Bilan de méthode (compteurs)

| Catégorie | Nombre | Détail |
|---|---:|---|
| **Claims confirmés (niveau 1)** | 13 | framer 3, figma 2, webflow 3, wix 3 (structure, montants exclus), squarespace 2 |
| **Claims conflictuels** | 6 | framer Mini périmé ; figma devise + historique ; webflow ~14→15 USD ; wix unité ; squarespace essai/gratuit + unité |
| **Claims montant inconnu / à re-collecter** | 3 | squarespace (page JS), wix (locale), figma commitment (toggle) |
| **Sources inaccessibles** | 0 | (Webflow/Wix requalifiés accessibles) |
| **Niveau 3 (discovery, non promu)** | 1 bloc | indices prix squarespace |

Sources ouvertes : framer.com/pricing, figma.com/pricing, help.figma.com, webflow.com/pricing, wix.com/plans, support.squarespace.com. Respect robots/ToS ; aucun bypass captcha/paywall/anti-bot.

## D. Proposition d'évolution du modèle (corrigée)

Le schéma v2 (livrable 03, `tool_pricing_plans`) doit évoluer :

1. **`seat_type` extensible** — texte libre (ou enum ouvert), **non limité** aux valeurs Figma. Exemples : `full`, `dev`, `collab`, `view`, `n/a`, mais d'autres outils peuvent introduire d'autres types. Étendre l'unicité à `(tool_id, plan_name, seat_type, observed_market)`.
2. **Marché & locale au lieu de `native_currency_context`** — remplacer par deux champs explicites : `observed_market` (ex. `US`, `FR`, `EU`) et `observed_locale` (ex. `en-US`, `fr-FR`). Le prix Wix n'a de sens qu'avec son marché/locale.
3. **`billing_commitment` requis conditionnellement** — **NOT NULL dès que `native_amount > 0`** (prix payant). Un montant sans engagement (cas Figma 16$) reste `unknown` explicite, jamais implicite.
4. **Une ligne de prix = une observation** — chaque ligne porte `observed_on` (date), `source_url` (source), `observed_market`/`observed_locale` (contexte). Historisation par empilement d'observations (cf. `superseded_candidate` Figma), sans écrasement.
5. **Add-ons par unité** — Framer facture des éditeurs additionnels (+20$/mo) → `paid_addons` à formaliser.
6. **Flag « pas de plan gratuit » + `trial_days`** — Squarespace : `free_core_available=false`, `trial_days=14`. Contrôle auto « essai présenté comme gratuit » (brief §14).

Aucune de ces évolutions n'est appliquée ; validation requise avant DDL (D6).

## E. Arrêt

RESEARCH pilote corrigé et complété. **Rien n'est appliqué.** J'attends validation avant toute normalisation EUR (FX daté), tout diff `tools_v4.json`/Supabase (APPLY_LOCAL/SUPABASE_STAGE), toute extension du `FIELD_MAP` ou du schéma pricing.
