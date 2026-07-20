-- A7 — PREFLIGHT SANS ÉCRITURE PERSISTANTE — rév. 4.12
-- Les seules écritures visent des tables temporaires ; ROLLBACK final obligatoire.
-- Le preflight est répété sous verrou par la migration.
\set ON_ERROR_STOP on
begin;

\i A7-expected-snapshot.4.12.sql
\i A7-schema-preflight.4.12.sql
\i A7-baseline-existing.4.12.sql

create temporary table _unmapped_category on commit drop as
select e.slug, e.expected->>'category' as category
from _expected_tool e
where e.is_json_only and e.expected->>'category' is not null
  and not exists(select 1 from public.categories c where c.id=e.expected->>'category');
do $category_gate$
begin
  if (select count(*) from _unmapped_category)<>61
     or (select count(distinct category) from _unmapped_category)<>11 then
    raise exception 'PREFLIGHT READONLY: cohorte catégories différente de 61/11';
  end if;
end $category_gate$;

do $preflight$
declare owner_name text; rls_enabled boolean; is_super boolean; can_create_role boolean;
begin
  select pg_get_userbyid(relowner),relrowsecurity into owner_name,rls_enabled
  from pg_class where oid='public.tools'::regclass;
  if not rls_enabled then raise exception 'PREFLIGHT READONLY: RLS inactif sur public.tools'; end if;
  select rolcreaterole,rolsuper into can_create_role,is_super from pg_roles where rolname=current_user;
  if not coalesce(can_create_role or is_super,false) then
    raise exception 'PREFLIGHT READONLY: rôle exécutant sans CREATE ROLE';
  end if;
  if not (is_super or current_user=owner_name or pg_has_role(current_user,owner_name,'member')) then
    raise exception 'PREFLIGHT READONLY: rôle exécutant non propriétaire de public.tools';
  end if;
  if to_regnamespace('catalog_private') is not null or to_regnamespace('catalog_api') is not null then
    raise exception 'PREFLIGHT READONLY: schéma du contrat déjà présent';
  end if;
  if exists(select 1 from pg_roles where rolname='catalog_owner') then
    raise exception 'PREFLIGHT READONLY: catalog_owner déjà présent';
  end if;
end $preflight$;

select jsonb_agg(jsonb_build_object(
  'column',column_name,'type',data_type,'nullable',is_nullable)
  order by ordinal_position) as public_tools_fingerprint
from information_schema.columns
where table_schema='public' and table_name='tools';

select current_user as migration_role,
       (select pg_get_userbyid(relowner) from pg_class where oid='public.tools'::regclass) as tools_owner,
       (select count(*) from public.tools) as tools_count,
       (select count(*) from _expected_tool where is_json_only) as expected_json_only;

rollback;
\echo 'DARK_LAUNCH_4_12_READONLY_PREFLIGHT_OK'
