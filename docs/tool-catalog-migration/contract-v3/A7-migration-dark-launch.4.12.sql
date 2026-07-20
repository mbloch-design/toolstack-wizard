-- =====================================================================================
-- A7 — DARK LAUNCH SUPABASE — rév. 4.12 (EXÉCUTABLE, NON EXÉCUTÉ SUR SUPABASE)
-- Autorisation humaine donnée AVANT lancement. Tous les gates sont déterministes.
-- Succès complet => COMMIT. Toute erreur avec ON_ERROR_STOP => connexion fermée + ROLLBACK.
-- =====================================================================================
\set ON_ERROR_STOP on
\timing on

\if :{?backup_ref}
\else
  \echo 'PREFLIGHT: variable backup_ref obligatoire'
  \quit 3
\endif
\if :{?backup_sha256}
\else
  \echo 'PREFLIGHT: variable backup_sha256 obligatoire'
  \quit 3
\endif

set lock_timeout = '3s';
set statement_timeout = '120s';
set idle_in_transaction_session_timeout = '60s';

begin;
set local lock_timeout = '3s';
set local statement_timeout = '120s';
set local idle_in_transaction_session_timeout = '60s';

-- Le verrou est volontairement exclusif et NOWAIT : état des 533 figé, aucun upgrade
-- tardif et aucune attente silencieuse sur l'environnement en ligne unique.
lock table public.tools in access exclusive mode nowait;

-- Référence figée des 1 126 slugs et des 593 payloads JSON-only.
\i A7-expected-snapshot.4.12.sql
\i A7-schema-preflight.4.12.sql

-- Pour les 533 lignes existantes, l'état SQL réel pré-migration reste l'autorité
-- legacy (Supabase gagne actuellement sur le JSON dans getMergedTools).
\i A7-baseline-existing.4.12.sql

-- 61 outils JSON-only portent 11 catégories absentes du référentiel SQL. Le
-- payload source reste intégral ; le champ FK typé reste null jusqu'au mapping éditorial.
create temporary table _unmapped_category on commit drop as
select e.slug, e.expected->>'category' as category
from _expected_tool e
where e.is_json_only and e.expected->>'category' is not null
  and not exists(select 1 from public.categories c where c.id=e.expected->>'category');
do $category_gate$
begin
  if (select count(*) from _unmapped_category)<>61
     or (select count(distinct category) from _unmapped_category)<>11 then
    raise exception 'CATÉGORIES: cohorte attendue 61 outils / 11 catégories';
  end if;
end $category_gate$;
update _expected_tool e
set expected=jsonb_set(e.expected,'{category}','null'::jsonb)
where e.slug in (select slug from _unmapped_category);

-- Élargissements rétrocompatibles nécessaires au payload intégral des 593 outils.
-- Le preflight a validé les types d'origine exacts ; le rollback les restaure.
alter table public.tools
  alter column logo type text,
  alter column team_relevance type text;

-- Snapshot durable après création du schéma privé. Les tables temporaires assurent
-- la comparaison intra-transaction ; la copie privée rend le rollback autonome.
create temporary table _preflight_grants on commit drop as
select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema='public' and table_name='tools';

create temporary table _preflight_policies on commit drop as
select polname, polcmd, pg_get_expr(polqual,polrelid) as using_expr,
       pg_get_expr(polwithcheck,polrelid) as check_expr,
       (select array_agg(rolname order by rolname) from pg_roles where oid=any(polroles)) as roles
from pg_policy where polrelid='public.tools'::regclass;

create temporary table _preflight_state on commit drop as
select has_table_privilege('service_role','public.tools','select') as service_role_had_select,
       (select count(*) from public.tools) as tools_count,
       (select pg_get_userbyid(relowner) from pg_class where oid='public.tools'::regclass) as tools_owner,
       (select relrowsecurity from pg_class where oid='public.tools'::regclass) as tools_rls;

create temporary table _runtime_param on commit drop as
select :'backup_ref'::text as backup_ref, :'backup_sha256'::text as backup_sha256;

do $preflight$
declare
  can_create_role boolean;
  is_super boolean;
  tools_owner text;
  tools_rls boolean;
  conflicting_columns text[];
  v_backup_ref text;
  v_backup_sha256 text;
begin
  select rolcreaterole,rolsuper into can_create_role,is_super from pg_roles where rolname=current_user;
  select s.tools_owner,s.tools_rls into tools_owner,tools_rls from _preflight_state s;
  select backup_ref,backup_sha256 into v_backup_ref,v_backup_sha256 from _runtime_param;
  if not coalesce(can_create_role or is_super,false) then
    raise exception 'PREFLIGHT: % ne peut pas CREATE ROLE',current_user;
  end if;
  if not (is_super or current_user=tools_owner or pg_has_role(current_user,tools_owner,'member')) then
    raise exception 'PREFLIGHT: % ne possède pas public.tools (owner=%)',current_user,tools_owner;
  end if;
  if not tools_rls then raise exception 'PREFLIGHT: RLS doit déjà être actif sur public.tools'; end if;
  if to_regnamespace('catalog_private') is not null or to_regnamespace('catalog_api') is not null then
    raise exception 'PREFLIGHT: schéma catalog_private/catalog_api déjà présent';
  end if;
  if exists(select 1 from pg_roles where rolname='catalog_owner') then
    raise exception 'PREFLIGHT: rôle catalog_owner déjà présent';
  end if;
  select array_agg(column_name order by column_name) into conflicting_columns
  from information_schema.columns where table_schema='public' and table_name='tools'
    and column_name in ('content_status','research_status','data_contract','trial_days',
      'editorially_reviewed_at','published_at','next_review_at','updated_at','legacy_payload');
  if conflicting_columns is not null then
    raise exception 'PREFLIGHT: colonnes additives déjà présentes: %',conflicting_columns;
  end if;
  if exists(select 1 from pg_trigger where tgrelid='public.tools'::regclass and not tgisinternal
            and tgname in ('trg_tools_updated_at','trg_validate_canonical_switch')) then
    raise exception 'PREFLIGHT: trigger ToolTrim déjà présent sur public.tools';
  end if;
  if to_regprocedure('public.set_updated_at()') is not null then
    raise exception 'PREFLIGHT: public.set_updated_at() préexiste';
  end if;
  if length(v_backup_ref) < 8 or v_backup_ref ~* '(placeholder|todo)' then
    raise exception 'PREFLIGHT: backup_ref invalide';
  end if;
  if v_backup_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'PREFLIGHT: backup_sha256 invalide';
  end if;
end $preflight$;

-- DDL métier extrait mécaniquement des blocs SQL A1/A4, sans réécriture.
\i A1-contrat-canonique.sql
\i A4-regle-selection-prix.sql

-- Métadonnées opérationnelles privées utilisées uniquement par le rollback 4.12.
create table catalog_private.dark_launch_state(
  id text primary key,
  batch text not null,
  backup_ref text not null,
  backup_sha256 text not null,
  service_role_had_select boolean not null,
  preflight_tools_count int not null,
  preflight_tools_owner text not null,
  grants_snapshot jsonb not null,
  policies_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
alter table catalog_private.dark_launch_state enable row level security;
revoke all on catalog_private.dark_launch_state from public,anon,authenticated,service_role,catalog_owner;
insert into catalog_private.dark_launch_state(
  id,batch,backup_ref,backup_sha256,service_role_had_select,preflight_tools_count,
  preflight_tools_owner,grants_snapshot,policies_snapshot
)
select 'dark-launch-4.12','dark-launch-4.12',:'backup_ref',:'backup_sha256',
       s.service_role_had_select,s.tools_count,s.tools_owner,
       coalesce((select jsonb_agg(to_jsonb(g) order by g.grantee,g.privilege_type) from _preflight_grants g),'[]'::jsonb),
       coalesce((select jsonb_agg(to_jsonb(p) order by p.polname) from _preflight_policies p),'[]'::jsonb)
from _preflight_state s;

-- Coexistence legacy : aucune fiche canonical dans ce dark launch.
update public.tools set data_contract='legacy',research_status='todo';

-- 533 payloads backfillés sans marqueur ; seules les 593 insertions sont marquées.
\i A2-import-593-legacy.sql

insert into catalog_private.published_manifest(slug,source_commit,slug_set_sha256)
select slug,'dbea365209aa0458d9bc5bdadeefa72a30b4bc7b',
       '9d0e3f599e290e80257fc07e024c120d99087a46101ab70c31024445574ce458'
from _expected_tool;

update public.tools t
set content_status='published',published_at=coalesce(published_at,now())
from catalog_private.published_manifest m where m.slug=t.slug;

do $manifest_gate$
begin
  if (select count(*) from catalog_private.published_manifest)<>1126 then
    raise exception 'MANIFESTE: cardinalité différente de 1126';
  end if;
  if exists((select slug from catalog_private.published_manifest
             except select slug from public.tools where content_status='published')
            union all
            (select slug from public.tools where content_status='published'
             except select slug from catalog_private.published_manifest)) then
    raise exception 'MANIFESTE: ensemble publié différent du manifeste';
  end if;
end $manifest_gate$;

-- État Wix attesté, strictement observed : aucune approbation dans RESEARCH_ONLY.
\i wix-staging-import.embed.4.11.sql

-- Projection publique non consommée par l'application à ce stade.
\i A5-projection-publique.sql

-- Parité exhaustive : 533 lignes figées depuis la base + 593 depuis tools_v4.json.
\i A7-parity-gate.4.12.sql

do $gates$
declare n int;
begin
  if exists(select 1 from public.tools where data_contract<>'legacy') then
    raise exception 'GATE: data_contract canonical interdit';
  end if;
  if (select count(*) from catalog_api.published_tool_projection)<>2252 then
    raise exception 'GATE: projection doit contenir 2252 lignes';
  end if;
  if exists(select 1 from catalog_api.published_tool_projection
            where data_contract='legacy'
              and (compare_native_amount is not null or compare_native_currency is not null)) then
    raise exception 'GATE: prix natif exposé en legacy';
  end if;
  if to_regclass('catalog_api.diagnostic_tool_projection') is not null then
    raise exception 'GATE: projection diagnostic interdite';
  end if;
  if not has_table_privilege('anon','catalog_api.published_tool_projection','select')
     or not has_table_privilege('authenticated','catalog_api.published_tool_projection','select') then
    raise exception 'GATE: projection non lisible par anon/authenticated';
  end if;
  if has_table_privilege('anon','catalog_private.tool_claims','select')
     or has_table_privilege('authenticated','catalog_private.tool_claims','select') then
    raise exception 'GATE: table privée exposée';
  end if;
  select count(*) into n from catalog_private.tool_review_attestations where tool_id='wix';
  if n<>2 then raise exception 'T12: attestations Wix=% attendu=2',n; end if;
  select count(*) into n from catalog_private.active_review_attestations
    where tool_id='wix' and attested_by='ToolTrim — Mike';
  if n<>1 then raise exception 'T12: attestation active ToolTrim Wix=% attendu=1',n; end if;
  select count(*) into n from catalog_private.tool_review_events where tool_id='wix';
  if n<>2 then raise exception 'T12: événements Wix=% attendu=2',n; end if;
  select count(*) into n from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    where p.tool_id='wix' and o.review_status='observed' and o.market_context='reference_fr';
  if n<>4 then raise exception 'T12: observations Wix observed/reference_fr=% attendu=4',n; end if;
  select count(*) into n from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    where p.tool_id='wix' and o.review_status='approved';
  if n<>0 then raise exception 'T12: aucune observation Wix ne doit être approved'; end if;
end $gates$;

-- Les seuls écarts de grants autorisés sont catalog_owner et, si nécessaire,
-- SELECT service_role. Aucun droit existant ne peut disparaître.
do $grant_gate$
begin
  if exists(select grantee,privilege_type,is_grantable from _preflight_grants
            except
            select grantee,privilege_type,is_grantable from information_schema.role_table_grants
            where table_schema='public' and table_name='tools') then
    raise exception 'GRANTS: un privilège préexistant a disparu';
  end if;
  if exists(
    select grantee,privilege_type from information_schema.role_table_grants
    where table_schema='public' and table_name='tools'
      and grantee not in ('catalog_owner','service_role')
    except select grantee,privilege_type from _preflight_grants
  ) then raise exception 'GRANTS: ajout inattendu sur public.tools'; end if;
end $grant_gate$;

commit;

-- Contrôles réellement post-COMMIT. Une erreur ici impose le rollback 4.12.
do $postcommit$
begin
  if (select count(*) from public.tools)<>1126 then raise exception 'POSTCOMMIT: tools<>1126'; end if;
  if (select count(*) from catalog_api.published_tool_projection)<>2252 then raise exception 'POSTCOMMIT: projection<>2252'; end if;
  if (select count(*) from public.tools where legacy_payload->>'import_batch'='dark-launch-4.12')<>593 then
    raise exception 'POSTCOMMIT: import_batch<>593';
  end if;
  if exists(select 1 from catalog_private.tool_price_observations o
            join catalog_private.tool_plans p on p.id=o.plan_id
            where p.tool_id='wix' and o.review_status='approved') then
    raise exception 'POSTCOMMIT: Wix approved interdit';
  end if;
end $postcommit$;
select count(*)=1126 as postcommit_tools from public.tools;
select count(*)=2252 as postcommit_projection from catalog_api.published_tool_projection;
select count(*)=593 as postcommit_imported
from public.tools where legacy_payload->>'import_batch'='dark-launch-4.12';
select count(*)=0 as postcommit_approved_wix
from catalog_private.tool_price_observations o
join catalog_private.tool_plans p on p.id=o.plan_id
where p.tool_id='wix' and o.review_status='approved';

\echo 'DARK_LAUNCH_4_12_COMMITTED'
