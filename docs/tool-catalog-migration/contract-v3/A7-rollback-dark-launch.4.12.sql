-- =====================================================================================
-- A7 — ROLLBACK POST-COMMIT DARK LAUNCH — rév. 4.12
-- À lancer uniquement sur autorisation distincte. Succès des gates => COMMIT automatique.
-- =====================================================================================
\set ON_ERROR_STOP on
\timing on
set lock_timeout='3s';
set statement_timeout='120s';
set idle_in_transaction_session_timeout='60s';

begin;
set local lock_timeout='3s';
set local statement_timeout='120s';
set local idle_in_transaction_session_timeout='60s';
lock table public.tools in access exclusive mode nowait;

do $preflight$
begin
  if to_regclass('catalog_private.dark_launch_state') is null then
    raise exception 'ROLLBACK: métadonnées dark_launch_state absentes';
  end if;
  if not exists(select 1 from catalog_private.dark_launch_state
                where id='dark-launch-4.12' and batch='dark-launch-4.12') then
    raise exception 'ROLLBACK: batch dark-launch-4.12 absent';
  end if;
  if (select count(*) from public.tools where legacy_payload->>'import_batch'='dark-launch-4.12')<>593 then
    raise exception 'ROLLBACK: provenance des 593 insertions invalide';
  end if;
end $preflight$;

create temporary table _rollback_state on commit drop as
select * from catalog_private.dark_launch_state where id='dark-launch-4.12';

-- 1. Retirer uniquement les 593 lignes créées par ce batch, avant legacy_payload.
delete from public.tools where legacy_payload->>'import_batch'='dark-launch-4.12';
do $$ begin
  if (select count(*) from public.tools)<>(select preflight_tools_count from _rollback_state)
  then raise exception 'ROLLBACK: cardinalité après retrait des insertions incorrecte'; end if;
end $$;

-- 2. Retirer les objets API/privés. CASCADE supprime les triggers dépendant des
-- fonctions privées sur public.tools, notamment trg_validate_canonical_switch.
set role catalog_owner;
drop schema catalog_api cascade;
reset role;
drop schema catalog_private cascade;

-- Les 533 lignes d'origine respectent ces bornes (validé avant lancement).
-- La projection doit être retirée avant de restaurer le type de logo.
alter table public.tools
  alter column logo type varchar(10) using logo::varchar(10),
  alter column team_relevance type varchar(50) using team_relevance::varchar(50);

-- 3. Retirer les objets publics créés par A1.
drop policy if exists catalog_owner_projection_read on public.tools;
drop trigger if exists trg_tools_updated_at on public.tools;
drop function if exists public.set_updated_at();

-- 4. Restaurer exactement les grants antérieurs.
revoke all on public.tools from catalog_owner;
revoke usage on schema public from catalog_owner;
do $service_grant$
begin
  if not (select service_role_had_select from _rollback_state) then
    execute 'revoke select on public.tools from service_role';
  end if;
end $service_grant$;

-- 5. Supprimer les colonnes additives seulement après retrait des lignes marquées.
alter table public.tools
  drop column legacy_payload,
  drop column updated_at,
  drop column next_review_at,
  drop column published_at,
  drop column editorially_reviewed_at,
  drop column trial_days,
  drop column data_contract,
  drop column research_status,
  drop column content_status;

-- Tous les objets possédés et privilèges connus ont été retirés explicitement.
drop role catalog_owner;

do $gates$
declare grants_now jsonb; policies_now jsonb;
begin
  if to_regnamespace('catalog_private') is not null or to_regnamespace('catalog_api') is not null then
    raise exception 'ROLLBACK: schéma du contrat résiduel';
  end if;
  if exists(select 1 from pg_roles where rolname='catalog_owner') then
    raise exception 'ROLLBACK: rôle catalog_owner résiduel';
  end if;
  if exists(select 1 from information_schema.columns
            where table_schema='public' and table_name='tools'
              and column_name in ('content_status','research_status','data_contract','trial_days',
                'editorially_reviewed_at','published_at','next_review_at','updated_at','legacy_payload')) then
    raise exception 'ROLLBACK: colonne additive résiduelle';
  end if;
  if (select count(*) from public.tools)<>(select preflight_tools_count from _rollback_state) then
    raise exception 'ROLLBACK: cardinalité public.tools différente du preflight';
  end if;
  select coalesce(jsonb_agg(to_jsonb(g) order by g.grantee,g.privilege_type),'[]'::jsonb)
    into grants_now
  from (select grantee,privilege_type,is_grantable
        from information_schema.role_table_grants
        where table_schema='public' and table_name='tools') g;
  if grants_now is distinct from (select grants_snapshot from _rollback_state) then
    raise exception 'ROLLBACK: grants public.tools non restaurés';
  end if;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.polname),'[]'::jsonb)
    into policies_now
  from (select polname,polcmd,pg_get_expr(polqual,polrelid) as using_expr,
               pg_get_expr(polwithcheck,polrelid) as check_expr,
               (select array_agg(rolname order by rolname) from pg_roles where oid=any(polroles)) as roles
        from pg_policy where polrelid='public.tools'::regclass) p;
  if policies_now is distinct from (select policies_snapshot from _rollback_state) then
    raise exception 'ROLLBACK: policies public.tools non restaurées';
  end if;
end $gates$;

commit;

select count(*) as postrollback_tools from public.tools;
select to_regnamespace('catalog_private') is null as postrollback_private_absent;
select to_regnamespace('catalog_api') is null as postrollback_api_absent;
\echo 'DARK_LAUNCH_4_12_ROLLED_BACK'
