# Artefact 1/6 — Contrat de données canonique (DDL **NON EXÉCUTÉ**)

> Rév. 4.10. **Aucun SQL exécuté sur Supabase, aucune écriture Supabase/JSON.** Modèle métier figé — aucun pivot. Le test PostgreSQL jetable de la rév. 4.9 a validé A1 + import et révélé deux dépendances de droits désormais explicites : lecture `service_role` pour l'import et policy `catalog_owner` sur `public.tools` pour la projection.
> **Rév. 4** : `market_context` accepte `reference_fr` (collecte effective FR/fr-FR), en plus de `market_localized` et `global_usd_fallback` ; `reference_fr` implique `observed_market='FR'` et `observed_locale='fr-FR'`.
> Architecture D12 : tables internes dans `catalog_private`, projections dans `catalog_api`, propriétaire des vues/fonctions `catalog_owner` **NOLOGIN sans BYPASSRLS**, vues `security_barrier`.

## D12 — Schémas, rôle propriétaire, RLS/REVOKE

```sql
-- ⛔ BROUILLON. NE PAS EXÉCUTER.
create schema if not exists catalog_private;   -- tables internes
create schema if not exists catalog_api;       -- projection publique

-- propriétaire dédié, NOLOGIN, SANS BYPASSRLS
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'catalog_owner') then
    create role catalog_owner nologin nobypassrls;
  end if;
end $$;
alter role catalog_owner nologin nobypassrls;
-- PostgreSQL 17 n'accorde pas automatiquement SET ROLE au créateur non-superuser.
-- La migration doit pouvoir transférer les objets API au propriétaire NOLOGIN.
do $catalog_owner_membership$
begin
  execute format('grant catalog_owner to %I with set true, inherit false', current_user);
end
$catalog_owner_membership$;
-- catalog_owner possède uniquement les fonctions/vues API. Les tables privées
-- restent possédées par le rôle de migration, afin que leur propriétaire ne
-- contourne pas silencieusement la RLS.
-- revoke d'usage par défaut
revoke all on schema catalog_private from public, anon, authenticated;
grant usage on schema catalog_api to anon, authenticated;   -- accès à la vue seulement
alter schema catalog_api owner to catalog_owner;
-- L'acteur doit encore créer A4/A5 après le transfert du schéma. Le grant doit
-- être émis par le nouveau propriétaire, sinon il reste implicite puis disparaît.
set role catalog_owner;
grant usage, create on schema catalog_api to session_user;
reset role;
```

## Table `tools` — migrations **additives** (table existante, `public.tools`)

```sql
alter table public.tools
  add column if not exists content_status  text not null default 'draft'
     check (content_status in ('draft','review','published','archived')),
  add column if not exists research_status text not null default 'todo'
     check (research_status in ('todo','researching','needs_review','approved','blocked')),
  add column if not exists data_contract   text not null default 'legacy'
     check (data_contract in ('legacy','canonical')),
  add column if not exists trial_days      int check (trial_days is null or trial_days between 1 and 365),
  add column if not exists editorially_reviewed_at timestamptz,
  add column if not exists published_at    timestamptz,
  add column if not exists next_review_at  date,
  add column if not exists updated_at      timestamptz not null default now(),
  -- Payload source intégral : indispensable à la coexistence des 593 JSON-only.
  -- Il n'est jamais exposé directement par l'API.
  add column if not exists legacy_payload  jsonb;

-- updated_at maintenu par trigger (renforcement)
create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_tools_updated_at on public.tools;
create trigger trg_tools_updated_at before update on public.tools
  for each row execute function public.set_updated_at();
```
> `public.tools` **n'est ni révoqué ni restreint ici**. Le Diagnostic étant différé et conservant des appels directs historiques, toute restriction de lecture fera l'objet d'une migration ultérieure séparée — cf. artefact 6.

## Tables internes (`catalog_private`)

```sql
-- Runs de recherche
create table catalog_private.tool_research_runs (
  id uuid primary key default gen_random_uuid(), tool_id text references public.tools(id),
  started_at timestamptz not null default now(), finished_at timestamptz,
  agent text, mode text, collector_version text, urls_attempted jsonb, errors jsonb, conflicts jsonb,
  claims_created int not null default 0,
  review_status text not null default 'open' check (review_status in ('open','in_review','approved','rejected')),
  diff_summary text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at), check (updated_at >= created_at));

-- Staging déterministe. `payload` contient l'objet tools_v4 complet, pas une identité réduite.
create table catalog_private.legacy_import_stage (
  slug text primary key, payload jsonb not null check (jsonb_typeof(payload)='object'),
  is_json_only boolean not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  source_commit text not null check (source_commit ~ '^[0-9a-f]{40}$'),
  staged_at timestamptz not null default now(),
  check (coalesce(payload->>'slug', payload->>'id') = slug));

-- Copie SQL matérialisée du manifeste local. Le chargement est décrit dans A6.
create table catalog_private.published_manifest (
  slug text primary key, source_commit text not null, slug_set_sha256 text not null,
  loaded_at timestamptz not null default now());

-- Sources (identité URL) + captures datées contextualisées
create table catalog_private.tool_sources (
  id uuid primary key default gen_random_uuid(), tool_id text not null references public.tools(id),
  collector_id text not null check (collector_id ~ '^src:[0-9a-f]{64}$'),
  url text not null, domain text,
  source_type text check (source_type in ('pricing','docs','changelog','security','integration','status','independent')),
  source_tier smallint check (source_tier in (1,2,3)), is_official boolean,
  collector_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(collector_payload)='object'),
  unique (tool_id, url), unique (tool_id, collector_id));
create table catalog_private.tool_source_captures (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references catalog_private.tool_sources(id) on delete cascade,
  collector_id text not null check (collector_id ~ '^cap:[0-9a-f]{64}$'),
  accessed_at timestamptz not null, http_status int, title text, content_hash text,
  rendered_by text check (rendered_by in ('static','browser')),
  observed_market text, observed_locale text, market_context text,
  is_accessible boolean, notes text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  collector_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(collector_payload)='object'),
  -- rév.4 : `reference_fr` = collecte réellement effectuée dans le contexte de
  -- référence éditorial ToolTrim (FR/fr-FR). `market_localized` = autre marché
  -- localisé. `global_usd_fallback` = grille mondiale/USD, marché non détecté.
  check (market_context is null or market_context in ('reference_fr','market_localized','global_usd_fallback')),
  -- Un fallback mondial peut légitimement ne pas porter de locale.
  check (observed_market is null or observed_locale is not null or market_context='global_usd_fallback'),
  -- `reference_fr` implique le couple FR/fr-FR effectivement observé.
  check (market_context <> 'reference_fr'
         or (observed_market = 'FR' and observed_locale = 'fr-FR')),
  check (market_context <> 'global_usd_fallback' or observed_locale is null or observed_locale <> ''),
  unique (source_id, collector_id), unique (source_id, content_hash));

-- Faisceaux machine immuables importés depuis collector.context_attestations.
-- Le payload conserve egress, locale, timezone et marqueurs visibles : stocker
-- le seul hash empêcherait tout réaudit humain ultérieur.
create table catalog_private.tool_context_attestations (
  id text primary key check (id ~ '^sha256:[0-9a-f]{64}$'),
  tool_id text not null references public.tools(id),
  capture_id uuid not null references catalog_private.tool_source_captures(id),
  source_url text not null, content_hash text not null,
  accessed_at timestamptz not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null default now(),
  check (payload->>'attestation_id'=id),
  check (payload->>'source_url'=source_url),
  check (payload->>'content_hash'=content_hash));

-- Actes humains immuables : une attestation vise une basis, une capture et un hash exacts.
create table catalog_private.tool_review_attestations (
  id text primary key check (id ~ '^sha256:[0-9a-f]{64}$'),
  tool_id text not null references public.tools(id),
  attestation_type text not null check (attestation_type in ('market_context')),
  value_json jsonb not null,
  basis_attestation_id text not null references catalog_private.tool_context_attestations(id),
  capture_id uuid not null references catalog_private.tool_source_captures(id),
  content_hash text not null, source_url text not null,
  attested_by text not null check (btrim(attested_by) <> ''),
  attested_at timestamptz not null, note text,
  collector_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(collector_payload)='object'),
  created_at timestamptz not null default now());

-- Événements de revue append-only. `subject_id` est textuel pour adresser les
-- UUID des différentes tables sans FK polymorphe ; les triggers d'approbation
-- vérifient l'existence et le type du sujet avant tout passage à `approved`.
create table catalog_private.tool_review_events (
  id text primary key check (btrim(id) <> ''),
  tool_id text not null references public.tools(id),
  event_type text not null check (event_type in (
    'attestation_revoked','observation_approved','claim_approved',
    'relationship_approved','localization_approved',
    'rejected','superseded','incident_recorded')),
  subject_type text not null check (subject_type in (
    'context_attestation','price_observation','claim','relationship','localization')),
  subject_id text not null check (btrim(subject_id) <> ''),
  attestation_id text references catalog_private.tool_review_attestations(id),
  actor text not null check (btrim(actor) <> ''), occurred_at timestamptz not null,
  reason text, payload jsonb not null default '{}'::jsonb,
  research_run_id uuid references catalog_private.tool_research_runs(id),
  created_at timestamptz not null default now(),
  check (event_type <> 'attestation_revoked' or
         (subject_type='context_attestation' and attestation_id is not null)),
  check (event_type not in ('observation_approved','claim_approved') or
         subject_type in ('price_observation','claim')));

-- État dérivé : une révocation est un événement, jamais une mutation.
create view catalog_private.active_review_attestations as
select a.* from catalog_private.tool_review_attestations a
where not exists (
  select 1 from catalog_private.tool_review_events e
  where e.attestation_id=a.id and e.event_type='attestation_revoked');

-- Cohérence de la basis avec la source/capture avant son insertion.
create or replace function catalog_private.validate_context_attestation() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private, public as $$
begin
  if not exists (
    select 1
    from catalog_private.tool_source_captures c
    join catalog_private.tool_sources s on s.id=c.source_id
    where c.id=new.capture_id and s.tool_id=new.tool_id
      and c.content_hash=new.content_hash and s.url=new.source_url
  ) then raise exception 'context attestation must match tool, capture, hash and source'; end if;
  return new;
end $$;
create trigger trg_validate_context_attestation before insert
  on catalog_private.tool_context_attestations
  for each row execute function catalog_private.validate_context_attestation();

-- Cohérence de l'acte humain avec sa basis et la source/capture.
create or replace function catalog_private.validate_review_attestation() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private, public as $$
begin
  if not exists (
    select 1
    from catalog_private.tool_source_captures c
    join catalog_private.tool_sources s on s.id=c.source_id
    join catalog_private.tool_context_attestations b on b.id=new.basis_attestation_id
    where c.id=new.capture_id and s.tool_id=new.tool_id
      and c.content_hash=new.content_hash and s.url=new.source_url
      and b.tool_id=new.tool_id and b.capture_id=c.id
      and b.content_hash=new.content_hash and b.source_url=new.source_url
  ) then raise exception 'review attestation must match tool, capture, hash and source'; end if;
  return new;
end $$;
create trigger trg_validate_review_attestation before insert
  on catalog_private.tool_review_attestations
  for each row execute function catalog_private.validate_review_attestation();

-- Ledger strictement append-only, y compris pour le pipeline ordinaire.
create or replace function catalog_private.reject_review_ledger_mutation() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
begin raise exception 'review ledger is append-only: % forbidden',tg_op; end $$;
create trigger trg_review_attestations_immutable before update or delete
  on catalog_private.tool_review_attestations
  for each row execute function catalog_private.reject_review_ledger_mutation();
create trigger trg_review_events_immutable before update or delete
  on catalog_private.tool_review_events
  for each row execute function catalog_private.reject_review_ledger_mutation();
create trigger trg_context_attestations_immutable before update or delete
  on catalog_private.tool_context_attestations
  for each row execute function catalog_private.reject_review_ledger_mutation();
revoke all on function catalog_private.validate_context_attestation() from public, anon, authenticated;
revoke all on function catalog_private.validate_review_attestation() from public, anon, authenticated;
revoke all on function catalog_private.reject_review_ledger_mutation() from public, anon, authenticated;

-- Plans (unicité seat_type nullable)
create table catalog_private.tool_plans (
  id uuid primary key default gen_random_uuid(), tool_id text not null references public.tools(id) on delete cascade,
  plan_key text not null, seat_type text, pricing_unit text,
  is_free boolean not null, is_compare_plan boolean not null default false, display_order int,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (not is_compare_plan or pricing_unit is not null),
  check (updated_at >= created_at));
create unique index uq_tool_plan on catalog_private.tool_plans (tool_id, plan_key, coalesce(seat_type,''));
create unique index uq_compare_plan on catalog_private.tool_plans (tool_id) where is_compare_plan;

-- Observations de prix (append-only)
create table catalog_private.tool_price_observations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references catalog_private.tool_plans(id) on delete cascade,
  collector_id text not null check (collector_id ~ '^obs:[0-9a-f]{64}$'),
  native_amount numeric check (native_amount is null or native_amount >= 0),
  native_currency text,
  billing_period text check (billing_period in ('monthly','annual')),
  billing_commitment text check (billing_commitment in ('monthly','annual_prepaid')),  -- NULL en staging
  tax_inclusion text check (tax_inclusion in ('ht','ttc','unknown')) default 'unknown',
  observed_market text, observed_locale text, market_context text,
  market_context_candidate text,
  market_context_source text, market_evidence jsonb,
  evidence_excerpt text, evidence_selector text,
  observed_on date not null, last_confirmed_on date,
  capture_id uuid references catalog_private.tool_source_captures(id),
  context_attestation_id text references catalog_private.tool_review_attestations(id),
  approval_event_id text references catalog_private.tool_review_events(id),
  confidence text check (confidence in ('low','medium','high')),
  review_status text not null default 'observed'
     check (review_status in ('observed','needs_review','conflicted','approved','superseded','rejected')),
  normalized_monthly_eur numeric, fx_rate numeric, fx_rate_date date, normalization_method text,
  collector_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(collector_payload)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  -- engagement requis seulement si observation PAYANTE et APPROUVÉE
  constraint commitment_required_if_paid_approved check (
    review_status <> 'approved' or native_amount is null or native_amount = 0 or billing_commitment is not null),
  -- approbation exige source + date + contexte marché (renforcement)
  constraint approved_price_complete check (
    review_status <> 'approved' or (
      capture_id is not null and native_amount is not null and native_currency ~ '^[A-Z]{3}$'
      and confidence is not null and market_context is not null and approval_event_id is not null
      and (native_amount = 0 or billing_period is not null))),
  -- cohérence FX
  constraint fx_from_noneur check (
    normalized_monthly_eur is null or native_currency = 'EUR'
    or (fx_rate is not null and fx_rate > 0 and fx_rate_date is not null and normalization_method is not null)),
  constraint fx_eur_identity check (
    native_currency is distinct from 'EUR'
    or (normalized_monthly_eur is null and fx_rate is null)
    or (fx_rate = 1 and normalized_monthly_eur = native_amount)),
  constraint fx_values_together check (
    (normalized_monthly_eur is null and fx_rate is null and fx_rate_date is null and normalization_method is null)
    or (normalized_monthly_eur is not null and fx_rate is not null and fx_rate_date is not null and normalization_method is not null)),
  constraint fx_amount_math check (
    normalized_monthly_eur is null or native_amount is null
    or abs(normalized_monthly_eur - native_amount * fx_rate) < 0.01),
  -- Une reconfirmation peut rafraîchir un fait sans réécrire sa première date.
  constraint price_confirmation_chronology check (
    last_confirmed_on is null or last_confirmed_on >= observed_on),
  check (market_context_candidate is null or market_context_candidate in ('reference_fr','market_localized','global_usd_fallback')),
  check (updated_at >= created_at));
create unique index uq_current_price on catalog_private.tool_price_observations
  (plan_id, coalesce(billing_commitment,''), coalesce(billing_period,''),
   coalesce(observed_market,''), coalesce(observed_locale,''))
  where review_status = 'approved';
create unique index uq_collector_price on catalog_private.tool_price_observations (plan_id,collector_id);
create index ix_obs_lookup on catalog_private.tool_price_observations (plan_id, review_status, observed_on desc);

-- Claims (locale requise SAUF global_usd_fallback)
create table catalog_private.tool_claims (
  id uuid primary key default gen_random_uuid(), tool_id text not null references public.tools(id),
  collector_id text not null check (collector_id ~ '^clm:[0-9a-f]{64}$'),
  claim_key text not null, value_json jsonb,
  capture_id uuid references catalog_private.tool_source_captures(id),
  context_attestation_id text references catalog_private.tool_review_attestations(id),
  approval_event_id text references catalog_private.tool_review_events(id),
  research_run_id uuid references catalog_private.tool_research_runs(id),
  observed_market text, observed_locale text, market_context text,
  market_context_candidate text,
  confidence text check (confidence in ('low','medium','high')),
  volatility text check (volatility in ('low','medium','high')),
  observed_on date, verified_at date, expires_at date,
  status text not null default 'observed'
     check (status in ('observed','needs_review','conflicted','approved','rejected','superseded')),
  evidence_note text, collector_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(collector_payload)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  -- La dérogation globale est validée par trigger contre LA CAPTURE, pas par
  -- une simple valeur auto-déclarée sur le claim.
  constraint approved_claim_has_evidence check (
    status <> 'approved' or (capture_id is not null and approval_event_id is not null)),
  check (market_context_candidate is null or market_context_candidate in ('reference_fr','market_localized','global_usd_fallback')),
  check (updated_at >= created_at));
create unique index uq_active_claim on catalog_private.tool_claims
  (tool_id, claim_key, coalesce(observed_market,''),coalesce(observed_locale,'')) where status='approved';
create unique index uq_collector_claim on catalog_private.tool_claims (tool_id,collector_id);

-- Contenu éditorial (1 publié par outil/langue)
create table catalog_private.tool_editorial_content (
  id uuid primary key default gen_random_uuid(), tool_id text not null references public.tools(id),
  lang text not null check (lang in ('fr','en')), content_version int not null default 1,
  short_description text, long_description text,
  covers jsonb, use_cases jsonb, pros jsonb, cons jsonb, verdict jsonb, relevant_for jsonb, seo jsonb,
  -- Présentation publique éditoriale, distincte des faits pricing sourcés :
  -- galerie de fiche, angle IA et éléments tels que costTable/cautions/TCO.
  gallery_images jsonb, ai_angle jsonb, pricing_guidance jsonb,
  status text not null check (status in ('draft','review','published','superseded')),
  author text, reviewed_by text, published_at timestamptz, content_hash text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((status <> 'published') or (published_at is not null and content_hash is not null)),
  check (updated_at >= created_at));
create unique index uq_editorial_version on catalog_private.tool_editorial_content (tool_id, lang, content_version);
create unique index uq_editorial_published on catalog_private.tool_editorial_content (tool_id, lang) where status='published';

-- Localisations de plans (1 approuvée par plan/locale)
create table catalog_private.tool_plan_localizations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references catalog_private.tool_plans(id) on delete cascade,
  collector_id text not null check (collector_id ~ '^loc:[0-9a-f]{64}$'),
  locale text not null, display_name text not null,
  capture_id uuid references catalog_private.tool_source_captures(id), observed_on date,
  approval_event_id text references catalog_private.tool_review_events(id),
  status text not null default 'observed' check (status in ('observed','approved','superseded')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'approved' or
         (capture_id is not null and observed_on is not null and approval_event_id is not null)),
  check (updated_at >= created_at));
create unique index uq_loc_approved on catalog_private.tool_plan_localizations (plan_id, locale) where status='approved';
create unique index uq_collector_localization on catalog_private.tool_plan_localizations (plan_id,collector_id);

-- Relations (direction, raisons FR/EN, provenance, vérif, historique)
create table catalog_private.tool_relationships (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null references public.tools(id), related_tool_id text not null references public.tools(id),
  collector_id text not null check (collector_id ~ '^rel:[0-9a-f]{64}$'),
  rel_type text not null check (rel_type in ('substitutes','extends','complements')),
  direction text not null default 'directed' check (direction in ('directed','mutual')),
  reason_fr text, reason_en text, capture_id uuid references catalog_private.tool_source_captures(id),
  confidence text check (confidence in ('low','medium','high')), observed_on date, verified_at date,
  approval_event_id text references catalog_private.tool_review_events(id),
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','superseded')),
  collector_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(collector_payload)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (tool_id <> related_tool_id),
  check (status <> 'approved' or
         (verified_at is not null and confidence is not null and approval_event_id is not null
          and (reason_fr is not null or reason_en is not null))),
  check (updated_at >= created_at));
create unique index uq_rel_active on catalog_private.tool_relationships
  (tool_id, related_tool_id, rel_type) where status='approved';
create unique index uq_collector_relationship on catalog_private.tool_relationships (tool_id,collector_id);

-- Une bascule canonical ne peut jamais rendre une fiche vide. Le contenu est
-- d'abord importé en draft, revu/publié, puis seulement le contrat est basculé.
create or replace function catalog_private.validate_canonical_switch() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private, public as $$
begin
  if new.data_contract='canonical' and old.data_contract is distinct from 'canonical' then
    if new.content_status <> 'published' or not exists (
      select 1 from catalog_private.published_manifest m where m.slug=new.slug
    ) then raise exception 'canonical switch requires a published manifest tool'; end if;
    if (select count(distinct ec.lang) from catalog_private.tool_editorial_content ec
        where ec.tool_id=new.id and ec.status='published' and ec.lang in ('fr','en')) <> 2
    then raise exception 'canonical switch requires published FR and EN editorial content'; end if;
    if not exists (
      select 1 from catalog_private.tool_plans p where p.tool_id=new.id and p.is_compare_plan
    ) then raise exception 'canonical switch requires one compare plan'; end if;
  end if;
  return new;
end $$;
create trigger trg_validate_canonical_switch before update of data_contract
  on public.tools for each row execute function catalog_private.validate_canonical_switch();
revoke all on function catalog_private.validate_canonical_switch() from public, anon, authenticated;

-- Aucun événement ne peut viser un sujet inexistant ou appartenant à un autre outil.
create or replace function catalog_private.validate_review_event_subject() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private as $$
begin
  if new.attestation_id is not null and not exists (
    select 1 from catalog_private.tool_review_attestations a
    where a.id=new.attestation_id and a.tool_id=new.tool_id
  ) then raise exception 'review event attestation must belong to the same tool'; end if;

  -- Une révocation isolée ne peut jamais laisser un fait approuvé dépendre
  -- d'une attestation devenue inactive. Les faits doivent être déclassés ou
  -- supersédés avant l'insertion de l'événement de révocation.
  if new.event_type='attestation_revoked' and (
    exists (select 1 from catalog_private.tool_price_observations o
            where o.context_attestation_id=new.attestation_id
              and o.review_status='approved')
    or exists (select 1 from catalog_private.tool_claims c
               where c.context_attestation_id=new.attestation_id
                 and c.status='approved')
  ) then raise exception 'revoke dependents first: approved rows still use this attestation'; end if;

  if new.subject_type='context_attestation' then
    if not exists (select 1 from catalog_private.tool_review_attestations a
                   where a.id=new.subject_id and a.tool_id=new.tool_id)
    then raise exception 'review event references an unknown context attestation'; end if;
  elsif new.subject_type='price_observation' then
    if not exists (select 1 from catalog_private.tool_price_observations o
                   join catalog_private.tool_plans p on p.id=o.plan_id
                   where o.id::text=new.subject_id and p.tool_id=new.tool_id)
    then raise exception 'review event references an unknown price observation'; end if;
  elsif new.subject_type='claim' then
    if not exists (select 1 from catalog_private.tool_claims c
                   where c.id::text=new.subject_id and c.tool_id=new.tool_id)
    then raise exception 'review event references an unknown claim'; end if;
  elsif new.subject_type='relationship' then
    if not exists (select 1 from catalog_private.tool_relationships r
                   where r.id::text=new.subject_id and r.tool_id=new.tool_id)
    then raise exception 'review event references an unknown relationship'; end if;
  elsif new.subject_type='localization' then
    if not exists (select 1 from catalog_private.tool_plan_localizations l
                   join catalog_private.tool_plans p on p.id=l.plan_id
                   where l.id::text=new.subject_id and p.tool_id=new.tool_id)
    then raise exception 'review event references an unknown localization'; end if;
  end if;
  return new;
end $$;
create trigger trg_validate_review_event_subject before insert
  on catalog_private.tool_review_events
  for each row execute function catalog_private.validate_review_event_subject();
revoke all on function catalog_private.validate_review_event_subject() from public, anon, authenticated;

-- L'approbation d'un claim/price valide le contexte porté par la capture.
create or replace function catalog_private.validate_approved_context() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private as $$
declare c catalog_private.tool_source_captures%rowtype;
        n jsonb := to_jsonb(new);
        plan_free boolean;
        subject_tool_id text;
        expected_event_type text;
        expected_subject_type text;
        approval catalog_private.tool_review_events%rowtype;
        context_att catalog_private.tool_review_attestations%rowtype;
begin
  if coalesce(n->>'status',n->>'review_status') = 'approved' then
    select * into c from catalog_private.tool_source_captures where id = (n->>'capture_id')::uuid;
    if not found then raise exception 'approved row requires an existing capture'; end if;
    if c.observed_locale is null and c.market_context is distinct from 'global_usd_fallback' then
      raise exception 'approved row requires capture locale or global_usd_fallback';
    end if;
    if n->>'market_context' is distinct from c.market_context
       or n->>'observed_market' is distinct from c.observed_market
       or n->>'observed_locale' is distinct from c.observed_locale then
      raise exception 'approved row context must equal capture context';
    end if;
    if tg_table_name='tool_price_observations' then
      select p.is_free,p.tool_id into plan_free,subject_tool_id
      from catalog_private.tool_plans p where p.id=(n->>'plan_id')::uuid;
      if plan_free is null then raise exception 'approved observation requires plan.is_free'; end if;
      if plan_free is distinct from ((n->>'native_amount')::numeric = 0) then
        raise exception 'approved amount 0 must match plan.is_free';
      end if;
      expected_event_type := 'observation_approved';
      expected_subject_type := 'price_observation';
    else
      subject_tool_id := n->>'tool_id';
      expected_event_type := 'claim_approved';
      expected_subject_type := 'claim';
    end if;

    select * into approval from catalog_private.tool_review_events e
    where e.id=n->>'approval_event_id' and e.tool_id=subject_tool_id
      and e.event_type=expected_event_type and e.subject_type=expected_subject_type
      and e.subject_id=n->>'id';
    if not found then raise exception 'approved row requires a matching attributed approval event'; end if;

    if n->>'market_context' = 'reference_fr' then
      if n->>'context_attestation_id' is null then
        raise exception 'reference_fr approval requires context_attestation_id';
      end if;
      select a.* into context_att
      from catalog_private.active_review_attestations a
      where a.id=n->>'context_attestation_id' and a.tool_id=subject_tool_id
        and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text)
        and a.capture_id=(n->>'capture_id')::uuid
        and a.content_hash=c.content_hash;
      if not found then raise exception 'reference_fr approval requires an active matching attestation'; end if;
      if approval.attestation_id is distinct from context_att.id then
        raise exception 'approval event must reference the active context attestation';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger trg_claim_approved_context before insert or update on catalog_private.tool_claims
  for each row execute function catalog_private.validate_approved_context();
create trigger trg_price_approved_context before insert or update on catalog_private.tool_price_observations
  for each row execute function catalog_private.validate_approved_context();
revoke all on function catalog_private.validate_approved_context() from public, anon, authenticated;

-- Même attribution obligatoire pour localisations et relations approuvées.
create or replace function catalog_private.validate_structural_approval_event() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private as $$
declare n jsonb := to_jsonb(new);
        subject_tool_id text;
        expected_event_type text;
        expected_subject_type text;
begin
  if n->>'status'='approved' then
    if tg_table_name='tool_plan_localizations' then
      select p.tool_id into subject_tool_id from catalog_private.tool_plans p
      where p.id=(n->>'plan_id')::uuid;
      expected_event_type := 'localization_approved';
      expected_subject_type := 'localization';
    else
      subject_tool_id := n->>'tool_id';
      expected_event_type := 'relationship_approved';
      expected_subject_type := 'relationship';
    end if;
    if not exists (
      select 1 from catalog_private.tool_review_events e
      where e.id=n->>'approval_event_id' and e.tool_id=subject_tool_id
        and e.event_type=expected_event_type and e.subject_type=expected_subject_type
        and e.subject_id=n->>'id'
    ) then raise exception 'approved structural row requires a matching attributed approval event'; end if;
  end if;
  return new;
end $$;
create trigger trg_localization_approval_event before insert or update
  on catalog_private.tool_plan_localizations
  for each row execute function catalog_private.validate_structural_approval_event();
create trigger trg_relationship_approval_event before insert or update
  on catalog_private.tool_relationships
  for each row execute function catalog_private.validate_structural_approval_event();
revoke all on function catalog_private.validate_structural_approval_event() from public, anon, authenticated;

-- Tous les objets éditables portant updated_at sont horodatés côté base.
create or replace function catalog_private.set_updated_at() returns trigger
language plpgsql security invoker set search_path = pg_catalog, catalog_private as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare r text; begin
  foreach r in array array['tool_research_runs','tool_source_captures','tool_plans',
    'tool_price_observations','tool_claims','tool_editorial_content',
    'tool_plan_localizations','tool_relationships'] loop
    execute format('drop trigger if exists %I on catalog_private.%I', 'trg_'||r||'_updated_at', r);
    execute format('create trigger %I before update on catalog_private.%I for each row execute function catalog_private.set_updated_at()', 'trg_'||r||'_updated_at', r);
  end loop;
end $$;
revoke all on function catalog_private.set_updated_at() from public, anon, authenticated;
```

## RLS + REVOKE (anon/authenticated n'accèdent qu'à la projection)

```sql
do $$ declare r text; begin
  for r in select tablename from pg_tables where schemaname='catalog_private' loop
    execute format('alter table catalog_private.%I enable row level security;', r);
    execute format('revoke all on catalog_private.%I from public, anon, authenticated;', r);
  end loop;
end $$;
grant usage on schema public, catalog_private to catalog_owner;
grant select on public.tools to catalog_owner;
-- Les vues/fonctions API sont évaluées comme catalog_owner. `public.tools`
-- ayant déjà RLS, un simple GRANT ne suffit pas : cette policy autorise
-- uniquement les fiches publiées et ne modifie aucune policy anon existante.
drop policy if exists catalog_owner_projection_read on public.tools;
create policy catalog_owner_projection_read on public.tools
  for select to catalog_owner using (content_status='published');
grant select on all tables in schema catalog_private to catalog_owner;
-- catalog_owner n'est pas propriétaire des tables et ne bypass pas RLS : policy
-- de lecture dédiée, utilisée uniquement pendant l'évaluation des vues API.
do $$ declare r text; begin
  for r in select tablename from pg_tables where schemaname='catalog_private' loop
    execute format('drop policy if exists catalog_owner_read on catalog_private.%I', r);
    execute format('create policy catalog_owner_read on catalog_private.%I for select to catalog_owner using (true)', r);
  end loop;
end $$;
-- Aucune policy anon/authenticated sur catalog_private.*.
-- Pipeline serveur explicite : BYPASSRLS ne remplace pas les privilèges SQL.
grant usage on schema catalog_private to service_role;
grant select on public.tools to service_role;
grant select, insert, update on all tables in schema catalog_private to service_role;
-- Le ledger reste append-only jusque dans la matrice de droits ; les triggers
-- constituent une seconde barrière pour le propriétaire de migration.
revoke update, delete on catalog_private.tool_review_attestations from service_role;
revoke update, delete on catalog_private.tool_review_events from service_role;
revoke update, delete on catalog_private.tool_context_attestations from service_role;
do $$ declare r text; begin
  for r in select tablename from pg_tables where schemaname='catalog_private' loop
    execute format('drop policy if exists service_role_pipeline on catalog_private.%I', r);
    execute format('create policy service_role_pipeline on catalog_private.%I for all to service_role using (true) with check (true)', r);
  end loop;
end $$;
-- La projection (artefact 5) est dans catalog_api, en security_barrier, possédée par catalog_owner,
-- avec grant SELECT à anon/authenticated. Tests de rôle : artefact 6.
```

Champs **Diagnostic différé** (`substitution_cluster_v2`, `decision_policy_v3`, `prescription_*`, `pertinence_by_persona`, `force_silence`, `functional_needs`, `ia_use_case`, `downgrade_plan`, `bundle_parent`, `host_app`) conservés sur `public.tools`. Cette révision ne crée aucune projection dédiée et ne migre aucun consommateur Diagnostic.
