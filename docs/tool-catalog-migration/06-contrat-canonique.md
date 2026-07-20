# Livrable 6 (révision 2) — Contrat de données canonique (proposition, **aucun DDL appliqué**)

> Révision demandée. **Rien n'est exécuté** : ni SQL, ni écriture Supabase, ni changement JSON. Arrêt pour validation avant tout DDL.
> Marché de référence éditorial ToolTrim = **FR / fr-FR** (seulement pour les collectes réellement faites en FR). Fallback mondial/USD **explicite**. Inconnu = `null`.

## Journal des corrections (rév. 2)

| # | Correction | Traitée en |
|---|---|---|
| 1 | M0 : importer les 593 identités JSON-only en `legacy` → 1126 outils canoniques, non vérifiés | §6, §7-M0 |
| 2 | Fallback réel `verified→v2` / `legacy→colonnes historiques` dans la projection | §5 (vue + CASE `data_maturity`) |
| 3 | Sortie unique par `(tool_id, lang)` + une seule révision éditoriale publiée par outil/langue | §1.6, §5 |
| 4 | Unicité `tool_plans` corrigée pour `seat_type` nullable | §1.2 (index `coalesce`) |
| 5 | Plusieurs prix courants par engagement/période/marché/locale | §1.3 (index composite) |
| 6 | `tool_plan_localizations` (noms fournisseurs localisés + provenance) | §1.6b |
| 7 | Séparer URL source et captures datées historiques | §1.4 + `tool_source_captures` |
| 8 | `tool_relationships` : direction, raisons FR/EN, provenance, vérif, historique + jointure slug cible | §1.7, §5 |
| 9 | `research_status` distinct de `content_status` et `data_maturity` | §1.1 (3 axes) |
| 10 | DDL = migrations **additives** sur `tools` existante + RLS + backfills + tests + rollback | §7 |
| 11 | Figma 16 USD reste `observed/needs_review`, pas `approved` | §3, §9 |
| 12 | Ne pas étendre le `FIELD_MAP` legacy ; pipeline staging/revue/approbation dédié | §8 |

---

## 1. Contrat de données canonique (révisé)

**Trois axes de statut orthogonaux** sur `tools` : `content_status` (visibilité) · `research_status` (avancement collecte) · `data_maturity` (source lue : `legacy` vs `verified`).

### 1.1 `tools` — identité + 3 statuts
```sql
-- PROPOSITION — NON APPLIQUÉ (migration additive sur la table existante, cf. §7)
-- colonnes AJOUTÉES à la table tools actuelle :
--   content_status  'draft'|'review'|'published'|'archived'      (défaut 'draft')
--   research_status 'todo'|'researching'|'needs_review'|'approved'|'blocked' (défaut 'todo')
--   data_maturity   'legacy'|'verified'                          (défaut 'legacy')
--   editorially_reviewed_at, published_at, next_review_at, updated_at
-- Les colonnes historiques (pricing_v5, short_description, ...) RESTENT (source 'legacy').
```

### 1.2 `tool_plans` — plans stables (unicité nullable corrigée)
```sql
create table tool_plans (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id) on delete cascade,
  plan_key text not null,           -- neutre: 'free','light','core','business','business_elite','professional'...
  seat_type text,                   -- NULLABLE, extensible: 'full','dev','collab','view'... jamais 'n/a'
  pricing_unit text,                -- 'site','seat','workspace','usage','flat'
  is_free boolean,
  is_compare_plan boolean not null default false,
  display_order int,
  created_at timestamptz not null default now()
);
-- CORRECTION #4 : unicité robuste malgré seat_type NULL
create unique index uq_tool_plan on tool_plans (tool_id, plan_key, coalesce(seat_type,''));
create unique index uq_compare_plan on tool_plans (tool_id) where is_compare_plan;
```

### 1.3 `tool_price_observations` — append-only (plusieurs prix courants)
```sql
create table tool_price_observations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references tool_plans(id) on delete cascade,
  native_amount numeric, native_currency text,
  billing_period text check (billing_period in ('monthly','annual')),
  billing_commitment text check (billing_commitment in ('monthly','annual_prepaid')),
  tax_inclusion text check (tax_inclusion in ('ht','ttc','unknown')) default 'unknown',
  observed_market text, observed_locale text, market_context text, -- null si non prouvé
  observed_on date not null,
  capture_id uuid references tool_source_captures(id),  -- capture datée précise (#7)
  confidence text check (confidence in ('low','medium','high')),
  review_status text not null default 'observed'
     check (review_status in ('observed','needs_review','conflicted','approved','superseded','rejected')),
  normalized_monthly_eur numeric, fx_rate numeric, fx_rate_date date, normalization_method text,
  created_at timestamptz not null default now()
);
alter table tool_price_observations add constraint commitment_required_if_paid
  check (native_amount is null or native_amount = 0 or billing_commitment is not null);
-- CORRECTION #5 : un prix COURANT par (plan, engagement, période, marché, locale) — l'historique reste
create unique index uq_current_price on tool_price_observations
  (plan_id, coalesce(billing_commitment,''), coalesce(billing_period,''),
   coalesce(observed_market,''), coalesce(observed_locale,''))
  where review_status = 'approved';
create index ix_obs_lookup on tool_price_observations (plan_id, review_status, observed_on desc);
```

### 1.4 `tool_sources` (identité stable) + `tool_source_captures` (versions datées) — CORRECTION #7
```sql
create table tool_sources (            -- identité stable d'une source (URL)
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  url text not null, domain text,
  source_type text check (source_type in ('pricing','docs','changelog','security','integration','status','independent')),
  source_tier smallint check (source_tier in (1,2,3)),
  is_official boolean,
  unique (tool_id, url)
);
create table tool_source_captures (    -- captures datées: plusieurs versions par source
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references tool_sources(id) on delete cascade,
  accessed_at timestamptz not null, http_status int, title text,
  content_hash text, rendered_by text, -- 'static'|'browser'
  is_accessible boolean, notes text,
  created_at timestamptz not null default now()
);
create index ix_capture_source on tool_source_captures (source_id, accessed_at desc);
```

### 1.5 `tool_claims` — provenance fine
```sql
create table tool_claims (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  claim_key text not null, value_json jsonb,
  capture_id uuid references tool_source_captures(id),
  observed_market text, observed_locale text,
  confidence text check (confidence in ('low','medium','high')),
  volatility text check (volatility in ('low','medium','high')),
  observed_on date, verified_at date, expires_at date,
  status text not null default 'observed'
     check (status in ('observed','needs_review','conflicted','approved','rejected','superseded')),
  evidence_note text, research_run_id uuid,
  created_at timestamptz not null default now()
);
create unique index uq_active_claim on tool_claims
  (tool_id, claim_key, coalesce(observed_market,'')) where status = 'approved';
```

### 1.6 `tool_editorial_content` — 1 révision publiée par (outil, langue) — CORRECTION #3
```sql
create table tool_editorial_content (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  lang text not null check (lang in ('fr','en')),
  content_version int not null default 1,
  short_description text, long_description text,
  covers jsonb, use_cases jsonb, pros jsonb, cons jsonb, verdict jsonb, relevant_for jsonb, seo jsonb,
  status text not null check (status in ('draft','review','published','superseded')),
  author text, reviewed_by text, published_at timestamptz, content_hash text,
  created_at timestamptz not null default now()
);
create unique index uq_editorial_version on tool_editorial_content (tool_id, lang, content_version);
-- une SEULE révision publiée par (outil, langue)
create unique index uq_editorial_published on tool_editorial_content (tool_id, lang) where status='published';
```

### 1.6b `tool_plan_localizations` — noms fournisseurs localisés + provenance — CORRECTION #6
```sql
create table tool_plan_localizations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references tool_plans(id) on delete cascade,
  locale text not null,               -- 'fr-FR','en-US'
  display_name text not null,         -- ex. plan_key 'core' -> 'Essentiel' (Wix/Squarespace FR)
  capture_id uuid references tool_source_captures(id),  -- provenance
  observed_on date,
  status text not null default 'observed' check (status in ('observed','approved','superseded')),
  unique (plan_id, locale, display_name)  -- l'historique de renommage reste (status superseded)
);
```

### 1.7 `tool_relationships` — direction, raisons FR/EN, provenance, vérif, historique — CORRECTION #8
```sql
create table tool_relationships (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),          -- source
  related_tool_id text not null references tools(id),  -- cible (jointe pour le slug en projection)
  rel_type text not null check (rel_type in ('substitutes','extends','complements')),
  direction text not null default 'directed'           -- 'directed' (tool_id -> related) | 'mutual'
     check (direction in ('directed','mutual')),
  reason_fr text, reason_en text,
  capture_id uuid references tool_source_captures(id), -- provenance
  confidence text check (confidence in ('low','medium','high')),
  verified_at date,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','superseded')),
  created_at timestamptz not null default now(),
  check (tool_id <> related_tool_id)                   -- pas d'auto-référence
);
create unique index uq_rel_active on tool_relationships
  (tool_id, related_tool_id, rel_type) where status='approved';   -- historique via lignes superseded
```

> Champs **diagnostic** (`substitution_cluster_v2`, `decision_policy_v3`, `prescription_*`, `pertinence_by_persona`, `force_silence`) restent **hors contrat** (chantier D2, inchangés).

---

## 2. Mapping ancien → nouveau (avec coexistence)

| Ancien (`tools` colonnes historiques / JSON) | Nouveau (`verified`) | En `legacy` |
|---|---|---|
| `short/long_description(_en), pros, cons, covers, use_cases, verdict, seo, relevant_for` | `tool_editorial_content` (par lang) | **colonnes historiques lues telles quelles** |
| `pricing_v5.compare_plan_name`, `compare_plan_kind` | `tool_plans.plan_key`+`pricing_unit`+`is_compare_plan` | `pricing_v5` lu tel quel |
| `pricing_v5.compare_price_monthly_eur` | `tool_price_observations.normalized_monthly_eur` (calculé) | `pricing_v5.compare_price_monthly_eur` |
| `pricing.paid/free`, `defaultMonthlyPrice` | observations natives + `is_free` | lus tels quels |
| `official_source_url`, `verified_on` | `tool_sources`+`tool_source_captures` | lus tels quels |
| noms de plans localisés | `tool_plan_localizations` | (aucun équivalent legacy) |
| `alternatives, betterAlternative, free_alternative, host_app, bundle_parent` | `tool_relationships` | lus tels quels |
| — | `tools.data_maturity` = `legacy`→`verified` | pilote la source |

---

## 3. Les cinq pilotes dans le nouveau modèle (Figma corrigé)

`is_compare_plan` marqué ⭐. Observations avec `review_status`.

- **framer** (`global_usd_fallback`) : `free`(0, is_free) · `basic`⭐(10 USD, monthly, commitment **unknown → needs_review**) · `pro`(30 USD). Stocké `Mini 5€` → `superseded`.
- **figma** (`global_usd_fallback`, par siège) : `starter`(0) · `professional/full`⭐ **16 USD, commitment unknown → `review_status='observed'/needs_review` (PAS approved)** · `professional/dev`(12) · `professional/collab`(3) · histo `professional/full` 12/15 USD (help 2025-03) → `superseded`. Devise stockée EUR → corrigée USD.
- **webflow** (`global_usd_fallback`, site, HT) : `starter`(0,is_free) · `basic`⭐(15 USD, annual_prepaid) · `premium`(25 USD, annual_prepaid) → `approved`. Stocké ~14 USD → `superseded`. Marché **non** US.
- **wix** (marché **FR/fr-FR**, EUR TTC, annual_prepaid, site) : `free`(0,is_free) · `light`⭐(16.80) · `core`(30) · `business`(40.80) · `business_elite`(178.80) → `approved`. Localisations : core→« Essentiel », business_elite→« Business Plus ». Stocké 20€ « seat » → `superseded`.
- **squarespace** (marché **FR/fr-FR**, EUR, annual_prepaid, site, `is_free=false`+essai 14 j) : `basic`⭐(12) · `core`(18) · `plus`(32) · `advanced`(69) → `approved`. Localisation core→« Essentiel ». Stocké 20€ « seat »+« gratuit » → `superseded`.

---

## 4. Règle de sélection du prix public courant

Pour un outil, marché de référence **FR/fr-FR** :
1. `tool_plans` où `is_compare_plan=true`.
2. Observations `review_status='approved'` du plan :
   a. `observed_market='FR'` en priorité ; sinon
   b. `market_context='global_usd_fallback'` → `normalized_monthly_eur` via FX **daté** (natif conservé), marqué « converti ».
3. Parmi les candidats (plusieurs prix courants possibles par engagement/période/marché), choisir selon la **préférence d'affichage** : `annual_prepaid` FR d'abord (aligné sur l'affichage fournisseur), l'observation `observed_on` la plus récente.
4. Si le plan de comparaison n'a **aucune** observation `approved` (cas **Figma**, commitment `unknown`) → **prix `needs_review`/inconnu**, jamais 0 ni valeur inventée.
5. Fraîcheur : `observed_on` > 90 j → `stale` (affiché + signalé).
6. Jamais fusionner mensuel réel et équivalent annuel : exposer `billing_commitment` ; `unknown` affiché comme tel.
7. JSON-LD = `native_amount`/`native_currency` **affichés** (pas la conversion).

---

## 5. Projection publique commune (fallback réel + 1 ligne par (tool_id, lang))

Une **seule** vue alimente **fiches, Ma Stack, Explorer, snapshot SEO**. **Ma Stack ne stocke que `tool_id` + données utilisateur** et lit cette projection par `tool_id`.

```sql
create or replace view published_tool_projection as
with langs as (select unnest(array['fr','en']) as lang)
select
  t.id as tool_id, t.slug, t.name, t.logo, t.category, l.lang,
  -- CORRECTION #2 : fallback réel selon data_maturity
  case when t.data_maturity='verified'
       then ec.short_description
       else case when l.lang='en' then coalesce(t.short_description_en, t.short_description) else t.short_description end
  end as short_description,
  case when t.data_maturity='verified' then cp.is_free      else legacy_is_free(t) end            as is_free,
  case when t.data_maturity='verified' then cp.plan_key     else t.pricing_v5->>'compare_plan_name' end as compare_plan,
  case when t.data_maturity='verified' then cp.native_amount   else (t.pricing_v5->>'compare_price_monthly_eur')::numeric end as compare_native_amount,
  case when t.data_maturity='verified' then cp.native_currency else 'EUR' end                      as compare_native_currency,
  case when t.data_maturity='verified' then cp.billing_commitment else null end                    as billing_commitment,
  case when t.data_maturity='verified' then cp.normalized_monthly_eur else (t.pricing_v5->>'compare_price_monthly_eur')::numeric end as compare_monthly_eur,
  case when t.data_maturity='verified' then cp.observed_market else null end                        as compare_market,
  case when t.data_maturity='verified' then cp.freshness      else legacy_freshness(t) end          as price_freshness,
  case when t.data_maturity='verified' then cp.price_status   else 'legacy' end                     as price_status,
  -- relations explicables, joignant l'outil cible pour son slug (#8)
  (select jsonb_agg(jsonb_build_object(
       'slug', rt.slug, 'name', rt.name, 'type', r.rel_type, 'direction', r.direction,
       'reason', case when l.lang='en' then r.reason_en else r.reason_fr end)
     order by r.rel_type)
   from tool_relationships r join tools rt on rt.id=r.related_tool_id
   where r.tool_id=t.id and r.status='approved')                                                    as relationships,
  t.content_status, t.data_maturity, t.editorially_reviewed_at, t.next_review_at
from tools t
cross join langs l
left join tool_editorial_content ec
       on ec.tool_id=t.id and ec.lang=l.lang and ec.status='published'   -- 1 seule publiée (uq_editorial_published)
left join lateral select_current_compare_price(t.id, l.lang, 'FR') cp on true
where t.content_status='published';
-- Sortie garantie : 1 ligne par (tool_id, lang). Unicité éditoriale via uq_editorial_published.
```

Champs minimum exposés (contrat de sortie) : **identité (`slug`,`name`), `logo`, description locale, `is_free`, prix comparatif contextualisé (`compare_native_amount`/`currency`/`billing_commitment`/`compare_monthly_eur`/`compare_market`/`price_status`), fraîcheur, relations explicables**. Les 4 surfaces + le build lisent la **même** projection.

---

## 6. Scénario de déploiement (M0 ajouté, coexistence legacy/verified)

| Étape | Action | Gate |
|---|---|---|
| **M0** | **Importer les 593 identités JSON-only dans `tools` en `data_maturity='legacy'`** (identité + colonnes historiques uniquement) → **1126 outils canoniques**, aucun `verified` | 1126 rows ; 0 marqué `verified` ; projection legacy inchangée |
| M1 | Migrations additives (§7) : colonnes statuts + nouvelles tables + RLS | anon ne voit pas les tables privées ; `draft` non exposés |
| M2 | Pipeline staging/revue (§8) : RESEARCH → observations/claims `observed`→`approved` | aucun scraper n'écrit dans `tools`/tables publiées |
| M3 | Peupler `tool_plans`/`observations`/`localizations`/`editorial_content`/`relationships` pour un slug | contrôles §9 verts |
| M4 | Bascule `tools.data_maturity='verified'` (transaction) pour ce slug | projection sert v2 ; autres restent legacy |
| M5 | Répéter M2–M4 par lots ; legacy/verified coexistent sans divergence (projection unique) | parité de sortie legacy vs verified |
| M6 | Quand 100 % publiés = `verified` : retirer colonnes historiques + `tools_v4.json` | repo sans import catalogue JSON |

---

## 7. Migrations additives sur `tools` (RLS, backfills, tests, rollback) — CORRECTION #10

**Additif, non destructif.** NON APPLIQUÉ.
```sql
-- 7.1 ALTER additif (table tools existante)
alter table tools
  add column if not exists content_status text not null default 'draft'
     check (content_status in ('draft','review','published','archived')),
  add column if not exists research_status text not null default 'todo'
     check (research_status in ('todo','researching','needs_review','approved','blocked')),
  add column if not exists data_maturity text not null default 'legacy'
     check (data_maturity in ('legacy','verified')),
  add column if not exists editorially_reviewed_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists next_review_at date,
  add column if not exists updated_at timestamptz not null default now();
-- 7.2 nouvelles tables : cf. §1 (tool_plans, tool_price_observations, tool_sources,
--     tool_source_captures, tool_claims, tool_editorial_content, tool_plan_localizations, tool_relationships)
-- 7.3 RLS : tables privées (plans? non — voir note) ; sources/captures/claims = PRIVÉ
alter table tool_sources enable row level security;
alter table tool_source_captures enable row level security;
alter table tool_claims enable row level security;
-- policies serveur uniquement (aucune policy anon)
-- Politique lecture publique de tools : restreindre au 'published' AVANT d'exposer content_status
-- 7.4 BACKFILLS (séparés, revus, par lots)
--   B1 (M0): insert des 593 identités JSON-only -> tools (data_maturity='legacy', content_status selon état)
--   B2: tous les tools existants -> data_maturity='legacy' (déjà défaut), research_status='todo'
--   B3: backfill content_status='published' UNIQUEMENT pour les slugs actuellement servis (liste explicite)
-- 7.5 TESTS (avant/après chaque étape)
--   T1 anon: select sur tool_sources/captures/claims -> refus
--   T2 anon: published_tool_projection -> uniquement content_status='published'
--   T3 count(tools)=1126 après M0 ; 0 row data_maturity='verified'
--   T4 parité: projection(legacy) == sortie actuelle pour un échantillon
--   T5 1 ligne par (tool_id,lang) ; 1 seule editorial publiée par (tool_id,lang)
-- 7.6 ROLLBACK
--   R1 par outil: data_maturity='verified'->'legacy' (retour instantané aux colonnes historiques)
--   R2 drop des nouvelles tables (additives) sans toucher tools
--   R3 les colonnes ajoutées ont des défauts -> retrait sûr si besoin
```

---

## 8. Pipeline dédié (PAS d'extension du `FIELD_MAP` legacy) — CORRECTION #12

Le `sync-json-to-supabase.mjs` (`FIELD_MAP`) reste **cantonné au legacy** (`tools` colonnes historiques). Les tables normalisées ont un **pipeline séparé** :
```
collecte (research/tool-pages/*.json)
  → STAGING: insert en 'observed' dans tool_price_observations/claims/... (clé serveur, jamais anon)
  → REVUE: validateur (conflits, fraîcheur, engagement manquant, market/locale non prouvés)
  → APPROBATION: passage 'approved' (l'ancien actif -> 'superseded'), création éventuelle d'une révision éditoriale
  → PUBLICATION: bascule data_maturity='verified' de l'outil
```
Aucun scraper n'écrit dans les vues publiées ni dans `tools` directement. `FIELD_MAP` n'est **pas** étendu aux plans/observations/relations.

---

## 9. Test conceptuel — 5 pilotes + 3 legacy, 4 surfaces = même donnée

Hypothèse : les 5 pilotes basculés `verified`, 3 outils restés `legacy` (`notion`, `calendly`, `loom`). Chaque ligne = **la** ligne de projection (fr) lue **identiquement** par Fiche, Ma Stack (via `tool_id`), Explorer et snapshot SEO.

| tool_id | data_maturity | is_free | compare_plan | native | cur | commitment | monthly_eur | market | price_status |
|---|---|---|---|---|---|---|---|---|---|
| framer | verified | true | basic | 10 | USD | unknown | (converti) | fallback_usd | **needs_review** (commitment) |
| figma | verified | true | professional/full | 16 | USD | **unknown** | — | fallback_usd | **needs_review** (pas approved) |
| webflow | verified | true | basic | 15 | USD | annual_prepaid | (converti) | fallback_usd | approved |
| wix | verified | true | light | 16.80 | EUR | annual_prepaid | 16.80 | FR | approved |
| squarespace | verified | false | basic | 12 | EUR | annual_prepaid | 12 | FR | approved |
| notion | legacy | (legacy) | Plus | — | — | — | 9.5 | — | legacy |
| calendly | legacy | (legacy) | Standard | — | — | — | 8.66 | — | legacy |
| loom | legacy | (legacy) | Business | — | — | — | 15.59 | — | legacy |

**Assertions du test :**
1. `count(projection where lang='fr') = count(tools where content_status='published')` → **1 ligne / (tool_id, lang)**.
2. Fiche, Ma Stack, Explorer et snapshot SEO appellent **la même vue** `published_tool_projection` → **mêmes valeurs** (prix, is_free, relations) — aucune surface ne recalcule.
3. Ma Stack : stocke `{tool_id, monthlyCost_override?, usage}` uniquement ; le prix affiché vient de la projection (jointure `tool_id`), pas d'une copie.
4. `figma` et `framer` exposent `price_status='needs_review'` (commitment inconnu) — pas de prix « approuvé » inventé.
5. Les 3 legacy servent leurs colonnes historiques via le `CASE data_maturity` — **cohabitation** sans divergence.
6. JSON-LD SEO = `native_amount/native_currency` (ex. wix 16.80 EUR, webflow 15 USD), pas la conversion.

Un écart entre deux surfaces = bug de mapper, pas de donnée (source unique).

---

## 10. Décisions attendues avant DDL
- **D7** valider le contrat révisé (8 tables, 3 axes de statut, captures datées).
- **D8** confirmer FR/fr-FR par défaut + fallback USD converti (FX daté).
- **D9** Figma : maintenir `needs_review` (commitment inconnu) — OK ?
- **D11** liste explicite des slugs `content_status='published'` pour le backfill B3 (éviter publication implicite des 1126).

**Rien n'est appliqué. Arrêt avant tout DDL / APPLY_LOCAL / écriture Supabase.**
