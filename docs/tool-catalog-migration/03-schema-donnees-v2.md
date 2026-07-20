# Livrable 3 — Schéma de données v2 (proposition, **non appliqué**)

> Dépôt canonique `New project`. **Aucun SQL exécuté. Aucun `--apply`.** Document de conception.
> Intègre les réserves émises et le modèle tarifaire natif+normalisé (D5).

## 0. Corrections vs première proposition SQL

| Réserve | Correction v2 |
|---|---|
| `content_status default 'published'` publierait 533 lignes sans revue | Défaut = **`draft`** ; backfill explicite **revu**, jamais implicite |
| Enums `research_status`/`review_status`/`source_type` non cadrés | Valeurs figées via `CHECK` |
| Unicité manquante (sources/claims/révisions) | `unique` + index partiels |
| Grants vues / RLS non testés | Section « Tests d'accès obligatoires » |
| Historique multi-observations d'un claim non défini | Modèle append-only, 1 actif par `claim_key` |

## 1. État réel du build (corrigé)

Contrairement au premier audit (mené sur un clone), le build canonique **fetch déjà Supabase** via `getMergedTools()` et fusionne par slug, avec **fallback JSON silencieux**. La migration ne consiste donc **pas** à « introduire un loader » mais à :
1. ajouter **validation + snapshot** autour de `getMergedTools` ;
2. **supprimer le fallback silencieux** (Phase 3) → échec de build si Supabase KO/vide ;
3. basculer la source de fusion de `JSON+Supabase` vers **`published_tools` seul** une fois les 593 JSON-only traités (livrable 04).

**Prérequis bloquants :** rapport de fusion validé (D4) · tri des 593 JSON-only (D3) · clé serveur en CI (jamais dans le bundle).

## 2. Cycle de vie sur `tools` (additif)

```sql
-- PROPOSITION — NE PAS EXÉCUTER SANS D6
alter table tools
  add column if not exists content_status text not null default 'draft'
    check (content_status in ('draft','review','published','stale','archived')),
  add column if not exists research_status text not null default 'todo'
    check (research_status in ('todo','researching','needs_review','approved','blocked')),
  add column if not exists content_version integer not null default 1,
  add column if not exists editorially_reviewed_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists next_review_at date,
  add column if not exists updated_at timestamptz not null default now();

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_tools_updated_at on tools;
create trigger trg_tools_updated_at before update on tools
  for each row execute function set_updated_at();
```

Backfill du statut = **étape séparée, revue, par lots** (jamais dans le `add column`). Par défaut les 533 lignes restent `draft` → invisibles de `published_tools`.

## 3. Pricing normalisé (D5) — table dédiée

```sql
create table if not exists tool_pricing_plans (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id) on delete cascade,
  plan_name text not null,
  is_compare_plan boolean not null default false,
  -- NATIF (vérité sourcée) --
  native_amount numeric, native_currency text,
  billing_period text check (billing_period in ('monthly','annual')),
  billing_commitment text check (billing_commitment in ('monthly','annual_prepaid')),
  pricing_unit text check (pricing_unit in ('seat','site','workspace','usage','flat')),
  tax_inclusion text check (tax_inclusion in ('ht','ttc','unknown')) default 'unknown',
  seat_minimum int, free_core_available boolean,
  verified_at date, official_source_url text,
  -- NORMALISÉ (calculé, jamais édité) --
  normalized_monthly_eur numeric, fx_rate numeric, fx_rate_date date, normalization_method text,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_compare_plan on tool_pricing_plans (tool_id) where is_compare_plan;
create unique index if not exists uq_tool_plan on tool_pricing_plans (tool_id, plan_name);
```

JSON-LD → `native_amount`/`native_currency` du plan affiché ; comparateur/diagnostic → `normalized_monthly_eur`. `pricing_v5` reste en transition. Seed = `pricing_truth.csv`.

## 4. Provenance : sources, claims, runs, révisions

```sql
create table if not exists tool_research_runs (
  id uuid primary key default gen_random_uuid(),
  tool_id text references tools(id), started_at timestamptz not null default now(), finished_at timestamptz,
  agent text, mode text, collector_version text,
  urls_attempted jsonb, errors jsonb, conflicts jsonb, claims_created int not null default 0,
  review_status text not null default 'open' check (review_status in ('open','in_review','approved','rejected')),
  diff_summary text
);
create table if not exists tool_sources (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id), url text not null, domain text,
  source_type text check (source_type in ('pricing','docs','changelog','security','integration','status','independent')),
  source_tier smallint check (source_tier in (1,2,3)),
  accessed_at timestamptz, http_status int, title text, content_hash text,
  is_official boolean, is_accessible boolean, notes text,
  unique (tool_id, url)
);
create table if not exists tool_claims (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id), claim_key text not null, value_json jsonb,
  source_id uuid references tool_sources(id),
  confidence text check (confidence in ('low','medium','high')),
  volatility text check (volatility in ('low','medium','high')),
  valid_from date, verified_at date, expires_at date,
  status text not null default 'observed'
    check (status in ('observed','conflicted','approved','rejected','superseded')),
  evidence_note text, research_run_id uuid references tool_research_runs(id),
  created_at timestamptz not null default now()
);
create unique index if not exists uq_active_claim on tool_claims (tool_id, claim_key) where status = 'approved';
create index if not exists ix_claims_lookup on tool_claims (tool_id, claim_key, status);
create table if not exists tool_editorial_revisions (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references tools(id), content_version int not null,
  snapshot jsonb not null, author text, reason text,
  published_at timestamptz not null default now(), content_hash text,
  unique (tool_id, content_version)
);
```

**Historique de claim** : append-only. Nouvelle passe → `observed`. Revue → ancien actif `superseded`, nouveau `approved` (index partiel garantit l'unicité de l'actif). Rien n'est supprimé → rollback de claim possible.

## 5. RLS & vues — tests d'accès obligatoires

```sql
alter table tool_research_runs enable row level security;
alter table tool_sources enable row level security;
alter table tool_claims enable row level security;
alter table tool_editorial_revisions enable row level security;
alter table tool_pricing_plans enable row level security;
-- aucune policy anon sur ces tables (accès serveur uniquement)

create or replace view published_tools as select * from tools where content_status='published';
create or replace view published_tool_summaries as
  select id,slug,name,category,short_description,short_description_en,default_monthly_price,website_url,logo
  from tools where content_status='published';
create or replace view published_tool_build_manifest as
  select id,slug,category,updated_at,published_at,content_status,content_version
  from tools where content_status='published';
```

**Tests avant branchement client :**
1. anon `select` sur tables privées → **refus / 0 ligne**.
2. anon `select` sur `published_tools*` → **uniquement `published`**.
3. vérifier héritage RLS des vues (`security_invoker` ou policy `tools`).
4. service = accès complet privé.

> ⚠️ Aujourd'hui `tools` est lisible en anon **en entier** (client + `getMergedTools` lisent `select *`). Ajouter `content_status` sans policy laisserait fuiter les `draft` → définir la policy « lecture publique = `published` only » **dans le même lot** que la colonne, après avoir vérifié qu'aucun usage client ne dépend du non-publié.

## 6. Scénario de migration (sans coupure)

| Étape | Action | Gate |
|---|---|---|
| M0 | Validation + snapshot autour de `getMergedTools` ; `.cache/tooltrim/catalog.json` (git-ignored) | Snapshot ≡ fusion actuelle sur slugs publiés |
| M1 | DDL cycle de vie (§2) + policy lecture `published`. Backfill par lots revus | Aucun `draft` visible en anon |
| M2 | Tables provenance + pricing (§3–4) + RLS (§5) ; migrer les dossiers de recherche | Tests §5 verts ; aucun scraper n'écrit dans `tools` |
| M3 | Fusion → `published_tools` seul ; **suppression du fallback JSON silencieux** | Indispo Supabase ⇒ build échoue, dernier déploiement conservé |
| M4 | Fallbacks client (`useToolBySlug`/`useToolSummaries`/`useTools`/`useDiagnosticData`) → SSR + requêtes ciblées | Aucune page indexable vide |
| M5 | Tests : fixtures au lieu des imports JSON ; contrat mapper | Tests indépendants du catalogue versionné |
| M6 | Suppression `tools_v4.json`/`tools_index.json` + scripts obsolètes | Repo sans import catalogue JSON, prerender vérifié |

## 7. Rollback

- **Par outil** : restaurer `tool_editorial_revisions.snapshot` (`content_version-1`), rebuild, vérifier.
- **Par claim** : repasser le `superseded` en `approved`.
- **Global** : snapshot « last known good » daté (artefact CI, pas source éditée) + dernier déploiement réussi conservé. Panne Supabase ⇒ **jamais** de site incomplet déployé.

## 8. Non tranché (renvoyé à décision)

Regroupement `category` (D4) · sort des 593 JSON-only (D3, livrable 04) · vocabulaire `prescription_quality` (**D2, isolé**) · policy exacte de lecture publique sur `tools` · extension du `FIELD_MAP` aux champs éditoriaux non couverts (`covers`, `functional_needs`, `verticals`, `personas`).
