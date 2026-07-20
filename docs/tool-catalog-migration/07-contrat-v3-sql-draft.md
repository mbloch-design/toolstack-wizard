# Livrable 7 — Contrat canonique rév. 3 (ciblée) + brouillon SQL **NON EXÉCUTÉ**

> Delta ciblé sur la rév. 2 ([06](./06-contrat-canonique.md)). **Aucun SQL exécuté, aucune écriture Supabase/JSON.** Arrêt pour validation avant tout DDL.
> Architecture rév. 2 validée · FR/fr-FR + fallback USD validés · DDL non autorisé.

## Corrections rév. 3 (delta)

| # | Correction | Application |
|---|---|---|
| 1 | `data_maturity` → **`data_contract`** (`legacy`\|`canonical`) | tout le doc |
| 2 | `billing_commitment` **null en staging**, requis seulement si observation **payante ET `approved`** | §A CHECK |
| 3 | Legacy : `compare_price_monthly_eur` **jamais** présenté comme natif EUR → natif=`null`, conversion legacy **séparée** | §D projection |
| 4 | Figma/Framer `needs_review` → **montant public `null`** tant que non `approved` | §C resolver, §E tests |
| 5 | Migration réordonnée : manifeste/backup → schéma additif → backfill 533 → import 593 legacy → parité 1126 → projection → bascule consommateurs → policy publique | §B |
| 6 | **RLS + REVOKE** sur toutes les nouvelles tables ; anon lit **uniquement la projection** | §A, §B |
| 7 | Contraintes : 1 localisation `approved` par plan/locale ; locale requise pour claim actif ; contexte dans captures ; cohérence FX | §A |
| 8 | Créer **`tool_research_runs`** (référencé par claims) | §A |
| 9 | **`trial_days`** structuré + resolver documenté | §A, §C |
| 10 | Définir `legacy_is_free`, `legacy_freshness`, `select_current_compare_price` | §C |
| 11 | **D11** dérivé du manifeste réel des routes vs sitemap | §F |

---

## A. Brouillon SQL — schéma additif & contraintes (NON EXÉCUTÉ)

```sql
-- ⛔ BROUILLON. NE PAS EXÉCUTER. Additif sur la table `tools` existante.

-- A.1 Colonnes de statut (3 axes) + attributs
alter table tools
  add column if not exists content_status  text not null default 'draft'
     check (content_status in ('draft','review','published','archived')),
  add column if not exists research_status text not null default 'todo'
     check (research_status in ('todo','researching','needs_review','approved','blocked')),
  add column if not exists data_contract   text not null default 'legacy'   -- #1 (ex data_maturity)
     check (data_contract in ('legacy','canonical')),
  add column if not exists trial_days      int,                              -- #9 (null = pas d'essai / inconnu)
  add column if not exists editorially_reviewed_at timestamptz,
  add column if not exists published_at    timestamptz,
  add column if not exists next_review_at  date,
  add column if not exists updated_at      timestamptz not null default now();

-- A.2 Runs de recherche (#8)
create table tool_research_runs (
  id uuid primary key default gen_random_uuid(),
  tool_id text references tools(id),
  started_at timestamptz not null default now(), finished_at timestamptz,
  agent text, mode text, collector_version text,
  urls_attempted jsonb, errors jsonb, conflicts jsonb, claims_created int not null default 0,
  review_status text not null default 'open' check (review_status in ('open','in_review','approved','rejected')),
  diff_summary text
);

-- A.3 Sources + captures datées CONTEXTUALISÉES (#7)
create table tool_sources (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  url text not null, domain text,
  source_type text check (source_type in ('pricing','docs','changelog','security','integration','status','independent')),
  source_tier smallint check (source_tier in (1,2,3)),
  is_official boolean,
  unique (tool_id, url)
);
create table tool_source_captures (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references tool_sources(id) on delete cascade,
  accessed_at timestamptz not null, http_status int, title text, content_hash text,
  rendered_by text check (rendered_by in ('static','browser')),
  observed_market text, observed_locale text, market_context text,   -- #7 contexte dans la capture
  is_accessible boolean, notes text,
  created_at timestamptz not null default now(),
  -- #7 contexte cohérent: si un marché est déclaré, la locale l'est aussi
  check (observed_market is null or observed_locale is not null)
);
create index ix_capture_source on tool_source_captures (source_id, accessed_at desc);

-- A.4 Plans (unicité seat_type nullable)
create table tool_plans (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id) on delete cascade,
  plan_key text not null, seat_type text, pricing_unit text,
  is_free boolean, is_compare_plan boolean not null default false, display_order int,
  created_at timestamptz not null default now()
);
create unique index uq_tool_plan on tool_plans (tool_id, plan_key, coalesce(seat_type,''));
create unique index uq_compare_plan on tool_plans (tool_id) where is_compare_plan;

-- A.5 Observations de prix (append-only ; commitment #2 ; FX #7)
create table tool_price_observations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references tool_plans(id) on delete cascade,
  native_amount numeric, native_currency text,
  billing_period text check (billing_period in ('monthly','annual')),
  billing_commitment text check (billing_commitment in ('monthly','annual_prepaid')),  -- NULL autorisé (staging)
  tax_inclusion text check (tax_inclusion in ('ht','ttc','unknown')) default 'unknown',
  observed_market text, observed_locale text, market_context text,
  observed_on date not null,
  capture_id uuid references tool_source_captures(id),
  confidence text check (confidence in ('low','medium','high')),
  review_status text not null default 'observed'
     check (review_status in ('observed','needs_review','conflicted','approved','superseded','rejected')),
  normalized_monthly_eur numeric, fx_rate numeric, fx_rate_date date, normalization_method text,
  created_at timestamptz not null default now(),
  -- #2 engagement requis seulement si observation PAYANTE et APPROUVÉE
  constraint commitment_required_if_paid_approved check (
    review_status <> 'approved' or native_amount is null or native_amount = 0
    or billing_commitment is not null),
  -- #7 cohérence FX : conversion depuis non-EUR => fx daté requis ; EUR natif => pas de conversion
  constraint fx_coherence check (
    normalized_monthly_eur is null
    or native_currency = 'EUR'
    or (fx_rate is not null and fx_rate_date is not null)),
  constraint fx_eur_identity check (
    native_currency <> 'EUR' or fx_rate is null or fx_rate = 1)
);
-- #5 (rév2) plusieurs prix courants par (plan, engagement, période, marché, locale)
create unique index uq_current_price on tool_price_observations
  (plan_id, coalesce(billing_commitment,''), coalesce(billing_period,''),
   coalesce(observed_market,''), coalesce(observed_locale,''))
  where review_status = 'approved';
create index ix_obs_lookup on tool_price_observations (plan_id, review_status, observed_on desc);

-- A.6 Claims (#7 locale requise pour claim actif ; #8 run)
create table tool_claims (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  claim_key text not null, value_json jsonb,
  capture_id uuid references tool_source_captures(id),
  research_run_id uuid references tool_research_runs(id),
  observed_market text, observed_locale text,
  confidence text check (confidence in ('low','medium','high')),
  volatility text check (volatility in ('low','medium','high')),
  observed_on date, verified_at date, expires_at date,
  status text not null default 'observed'
     check (status in ('observed','needs_review','conflicted','approved','rejected','superseded')),
  evidence_note text, created_at timestamptz not null default now(),
  -- #7 un claim ACTIF (approved) doit porter une locale prouvée
  constraint locale_required_if_approved check (status <> 'approved' or observed_locale is not null)
);
create unique index uq_active_claim on tool_claims
  (tool_id, claim_key, coalesce(observed_market,'')) where status='approved';

-- A.7 Contenu éditorial (1 publié par outil/langue)
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
create unique index uq_editorial_published on tool_editorial_content (tool_id, lang) where status='published';

-- A.8 Localisations de plans (#7 : 1 approuvée par plan/locale)
create table tool_plan_localizations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references tool_plans(id) on delete cascade,
  locale text not null, display_name text not null,
  capture_id uuid references tool_source_captures(id), observed_on date,
  status text not null default 'observed' check (status in ('observed','approved','superseded'))
);
create unique index uq_loc_approved on tool_plan_localizations (plan_id, locale) where status='approved';

-- A.9 Relations (direction, raisons FR/EN, provenance, vérif, historique)
create table tool_relationships (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id),
  related_tool_id text not null references tools(id),
  rel_type text not null check (rel_type in ('substitutes','extends','complements')),
  direction text not null default 'directed' check (direction in ('directed','mutual')),
  reason_fr text, reason_en text,
  capture_id uuid references tool_source_captures(id),
  confidence text check (confidence in ('low','medium','high')),
  verified_at date,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','superseded')),
  created_at timestamptz not null default now(),
  check (tool_id <> related_tool_id)
);
create unique index uq_rel_active on tool_relationships (tool_id, related_tool_id, rel_type) where status='approved';

-- A.10 RLS + REVOKE (#6) — anon ne lit QUE la projection
revoke all on tool_research_runs, tool_sources, tool_source_captures, tool_plans,
  tool_price_observations, tool_claims, tool_editorial_content, tool_plan_localizations,
  tool_relationships from anon, authenticated;
alter table tool_research_runs        enable row level security;
alter table tool_sources              enable row level security;
alter table tool_source_captures      enable row level security;
alter table tool_plans                enable row level security;
alter table tool_price_observations   enable row level security;
alter table tool_claims               enable row level security;
alter table tool_editorial_content    enable row level security;
alter table tool_plan_localizations   enable row level security;
alter table tool_relationships        enable row level security;
-- AUCUNE policy anon sur ces tables. Accès réservé à la clé serveur (service_role bypass RLS).
```

---

## B. Ordre de migration (réordonné #5)

| Étape | Action | Gate |
|---|---|---|
| **1. Manifeste + backup** | Figer le manifeste des routes actuelles (1126 slugs, §F) ; snapshot « last known good » | manifeste = sitemap |
| **2. Schéma additif** | §A (colonnes + tables + RLS + REVOKE) | anon ne voit aucune table privée |
| **3. Backfill 533** | Renseigner `data_contract='legacy'`, `research_status='todo'` sur les 533 existants | 533 en legacy |
| **4. Import 593 legacy** | Insérer les 593 identités JSON-only dans `tools` (`data_contract='legacy'`) | — |
| **5. Parité 1126** | Vérifier `count(tools)=1126`, 0 `canonical` | test T1 |
| **6. Projection** | Créer `published_tool_projection` (§D) + resolvers (§C) ; grant SELECT anon **sur la vue seule** | anon lit la vue, pas les tables |
| **7. Bascule consommateurs** | Fiche / Ma Stack / Explorer / build lisent la projection | parité 4 surfaces (T8) |
| **8. Policy publique** | **En dernier** : restreindre la lecture publique de `tools` au `content_status='published'` | aucun `draft` exposé |

> La restriction de lecture de `tools` est **la dernière étape** pour ne pas casser les consommateurs avant leur bascule.

---

## C. Resolvers (définitions précises #4 #9 #10)

```sql
-- ⛔ BROUILLON NON EXÉCUTÉ

-- C.1 legacy_is_free : plan gratuit DURABLE d'après le texte legacy, via la logique existante
--     src/lib/pricing.ts::hasGenuineFreeTier (essai != gratuit). Réplique SQL conservatrice :
create or replace function legacy_is_free(p_tools tools) returns boolean language sql immutable as $$
  select case
    when coalesce(p_tools.pricing->>'free','') = '' then false
    when lower(p_tools.pricing->>'free') ~ '(essai|trial|jours|days|no free|aucun|pas de)' then false
    else true
  end;
$$;  -- Source de vérité applicative = hasGenuineFreeTier ; cette fonction en est le miroir legacy.

-- C.2 legacy_freshness : fraîcheur à partir de pricing_v5.verified_on (fenêtre 90 j)
create or replace function legacy_freshness(p_tools tools) returns text language sql stable as $$
  select case
    when (p_tools.pricing_v5->>'verified_on') is null then 'unknown'
    when (p_tools.pricing_v5->>'verified_on')::date < current_date - interval '90 days' then 'stale'
    else 'fresh'
  end;
$$;

-- C.3 select_current_compare_price : prix courant canonical (règle §rev2-4)
--     Retourne NULL montant si aucune observation approved (#4 Figma/Framer).
create or replace function select_current_compare_price(p_tool_id text, p_ref_market text default 'FR')
returns table(plan_key text, native_amount numeric, native_currency text,
              billing_commitment text, normalized_monthly_eur numeric, observed_market text,
              price_status text, freshness text, source_url text)
language sql stable as $$
  with plan as (select * from tool_plans where tool_id=p_tool_id and is_compare_plan limit 1),
  obs as (
    select o.*, s.url as source_url
    from tool_price_observations o
    left join tool_source_captures c on c.id=o.capture_id
    left join tool_sources s on s.id=c.source_id
    where o.plan_id = (select id from plan) and o.review_status='approved'
  ),
  pick as (
    select * from obs
    order by (observed_market = p_ref_market) desc,           -- FR d'abord
             (market_context='global_usd_fallback') asc,       -- fallback ensuite
             (billing_commitment='annual_prepaid') desc,       -- aligné affichage fournisseur
             observed_on desc
    limit 1
  )
  select (select plan_key from plan),
         p.native_amount, p.native_currency, p.billing_commitment,
         p.normalized_monthly_eur, p.observed_market,
         case when p.id is null then 'needs_review' else 'approved' end,   -- #4 : null approved => needs_review
         case when p.observed_on is null then 'unknown'
              when p.observed_on < current_date - interval '90 days' then 'stale' else 'fresh' end,
         p.source_url
  from (select * from pick) p;   -- si pick vide => une ligne avec NULLs et price_status='needs_review'
$$;

-- C.4 trial_days : attribut structuré sur tools (#9). Resolver public :
--     trial_days exposé tel quel ; jamais confondu avec is_free. (ex. squarespace.trial_days=14, is_free=false)
```

---

## D. Projection (legacy conversion NON présentée comme native #3)

```sql
-- ⛔ BROUILLON NON EXÉCUTÉ. Vue créée par un rôle privilégié (non security_invoker) ;
--    anon reçoit GRANT SELECT sur la VUE uniquement, pas sur les tables.
create or replace view published_tool_projection as
with langs as (select unnest(array['fr','en']) as lang)
select
  t.id as tool_id, t.slug, t.name, t.logo, t.category, l.lang,
  t.trial_days,
  case when t.data_contract='canonical' then ec.short_description
       else case when l.lang='en' then coalesce(t.short_description_en,t.short_description) else t.short_description end
  end as short_description,
  case when t.data_contract='canonical' then cp.plan_key else t.pricing_v5->>'compare_plan_name' end as compare_plan,
  case when t.data_contract='canonical' then cp.is_free else legacy_is_free(t.*) end as is_free,
  -- #3 NATIF : uniquement canonical ; legacy => natif NULL
  case when t.data_contract='canonical' then cp.native_amount   else null end as compare_native_amount,
  case when t.data_contract='canonical' then cp.native_currency else null end as compare_native_currency,
  case when t.data_contract='canonical' then cp.billing_commitment else null end as billing_commitment,
  -- EUR comparateur : canonical=normalisé (#4 null si needs_review) ; legacy=conversion legacy SÉPARÉE
  case when t.data_contract='canonical' then cp.normalized_monthly_eur
       else (t.pricing_v5->>'compare_price_monthly_eur')::numeric end as compare_monthly_eur,
  case when t.data_contract='canonical' then false else true end as compare_eur_is_legacy_conversion, -- #3 drapeau
  case when t.data_contract='canonical' then cp.observed_market else null end as compare_market,
  case when t.data_contract='canonical' then cp.freshness else legacy_freshness(t.*) end as price_freshness,
  case when t.data_contract='canonical' then cp.price_status else 'legacy' end as price_status,  -- #4
  (select jsonb_agg(jsonb_build_object(
       'slug', rt.slug, 'name', rt.name, 'type', r.rel_type, 'direction', r.direction,
       'reason', case when l.lang='en' then r.reason_en else r.reason_fr end) order by r.rel_type)
   from tool_relationships r join tools rt on rt.id=r.related_tool_id
   where r.tool_id=t.id and r.status='approved') as relationships,
  t.content_status, t.data_contract, t.editorially_reviewed_at, t.next_review_at
from tools t
cross join langs l
left join tool_editorial_content ec on ec.tool_id=t.id and ec.lang=l.lang and ec.status='published'
left join lateral select_current_compare_price(t.id, 'FR') cp on true
where t.content_status='published';

grant select on published_tool_projection to anon;   -- #6 anon: la vue seulement
```

> **#3 :** en legacy, `compare_native_amount = null` et `compare_native_currency = null` ; le montant EUR historique reste dans `compare_monthly_eur` avec `compare_eur_is_legacy_conversion = true`. La conversion legacy n'est jamais étiquetée « native ».
> **Ma Stack** : stocke `{tool_id, monthlyCost_override?, usage}` et lit la projection par `tool_id` (aucune copie de prix).

---

## E. Tests de contrat (assertions, NON EXÉCUTÉ)

```sql
-- T1  Aucune perte des 1126 : après import
select count(*) = 1126 as t1_no_loss from tools;

-- T2  Aucune publication implicite : published = manifeste (§F), pas plus
select (select count(*) from tools where content_status='published')
     = (select count(*) from published_manifest) as t2_no_implicit_publish;

-- T3  Aucune donnée privée en anon (exécuté sous rôle anon)
--     doit LEVER une erreur / renvoyer 0 pour chaque table privée :
--     select count(*) from tool_price_observations;  -> refus
--     seul: select count(*) from published_tool_projection; -> OK

-- T4  Aucune conversion legacy présentée comme native
select bool_and(compare_native_amount is null and compare_native_currency is null)
  as t4_legacy_native_null
from published_tool_projection where data_contract='legacy';

-- T5  Figma/Framer publics avec prix null / needs_review
select bool_and(compare_native_amount is null and price_status='needs_review') as t5_needs_review
from published_tool_projection where tool_id in ('figma','framer') and data_contract='canonical';

-- T6  Webflow/Wix/Squarespace avec prix approuvés
select bool_and(price_status='approved' and compare_native_amount is not null) as t6_approved
from published_tool_projection where tool_id in ('webflow','wix','squarespace') and lang='fr';

-- T7  Une seule ligne par (outil, langue)
select bool_and(c = 1) as t7_one_row from (
  select tool_id, lang, count(*) c from published_tool_projection group by 1,2) x;

-- T8  Parité fiche/Ma Stack/Explorer/snapshot SEO : une seule source de donnée
--     Les 4 surfaces sélectionnent la MÊME ligne de projection par (tool_id,lang).
--     Test applicatif : hash(row fiche)=hash(row explorer)=hash(row ma_stack)=hash(row seo_snapshot).
```

**Résultats attendus (conceptuels)** sur 5 pilotes canonical + 3 legacy (`notion` 9.5€, `calendly` 8.66€, `loom` 15.59€) :

| tool | data_contract | compare_native_amount | compare_monthly_eur | eur_is_legacy_conv | price_status |
|---|---|---|---|---|---|
| framer | canonical | **null** | null | false | needs_review |
| figma | canonical | **null** | null | false | needs_review |
| webflow | canonical | 15 USD | (converti daté) | false | approved |
| wix | canonical | 16.80 EUR | 16.80 | false | approved |
| squarespace | canonical | 12 EUR | 12 | false | approved |
| notion | legacy | **null** | 9.5 | **true** | legacy |
| calendly | legacy | **null** | 8.66 | **true** | legacy |
| loom | legacy | **null** | 15.59 | **true** | legacy |

---

## F. D11 — liste publiée dérivée du manifeste réel (vs sitemap)

- `getMergedTools()` (build) prérend l'**union par slug** de `tools_v4.json` (1126) et Supabase (533).
- Mesure lecture seule (2026-07-16) : **union = 1126 slugs** ; Supabase n'ajoute **0** slug nouveau ; le sitemap (`sitemapPlugin`) boucle la **même** sortie → **parité**.
- **`published_manifest` = ces 1126 slugs** (exactement ce qui est déjà servi). Le backfill `content_status='published'` (étape 3-B3) porte sur cette liste **explicite** — aucune publication au-delà.
- Contrôle continu : `published_tool_projection` (slugs) == entrées `tool/` du sitemap == `published_manifest`. Tout écart = régression bloquante.
- Le tri hors-scope (D3, `hors_scope_candidate`) est une décision **éditoriale séparée** : il retire des slugs du manifeste **après** décision humaine, jamais silencieusement.

---

## G. Décisions attendues avant DDL
- **D7** valider le contrat rév. 3 (renommage `data_contract`, contraintes #7, resolvers).
- **D9** Figma : `needs_review` (montant public null) confirmé.
- **D11** valider `published_manifest` = 1126 slugs comme liste de publication.
- **D12** valider la stratégie « vue privilégiée + grant anon sur la vue seule » (vs `security_invoker` + policies par table).

**Rien n'est appliqué. Arrêt avant tout DDL / APPLY_LOCAL / écriture Supabase.**
