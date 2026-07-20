-- =====================================================================================
-- A7 — ROLLBACK POST-COMMIT DU DARK LAUNCH — rév. 4.11  (⛔ NON EXÉCUTÉ)
-- =====================================================================================
-- À n'exécuter QUE si le dark launch a été committé puis doit être annulé.
-- Le dark launch n'ayant basculé aucun consommateur, ce retour arrière est sans
-- impact utilisateur. Ordre IMPOSÉ (correction #6). Transaction unique, ON_ERROR_STOP.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f A7-rollback-dark-launch.4.11.sql
-- Filet ultime en cas de dépendance inattendue : restaurer le backup vérifié (§1.5 A7).
-- =====================================================================================

\set ON_ERROR_STOP on
set lock_timeout = '3s';
set statement_timeout = '120s';

begin;
set local lock_timeout = '3s';
lock table public.tools in share update exclusive mode nowait;

-- 1) Supprimer d'ABORD les 593 lignes importées, par PROVENANCE (jamais les 533 existants).
delete from public.tools where legacy_payload->>'import_batch' = 'dark-launch-4.11';
do $$ begin
  if exists (select 1 from public.tools where legacy_payload->>'import_batch'='dark-launch-4.11')
    then raise exception 'ROLLBACK: lignes importées résiduelles'; end if;
end $$;

-- 2) Supprimer la projection publique puis les schémas du contrat (cascade).
drop view if exists catalog_api.published_tool_projection;
drop schema if exists catalog_api cascade;      -- resolvers inclus
drop schema if exists catalog_private cascade;   -- tables privées, manifeste, ledger, triggers

-- 3) Supprimer la policy additive posée par A1 pour la lecture projection.
drop policy if exists catalog_owner_projection_read on public.tools;

-- 4) Restaurer les GRANTS initiaux sur public.tools, dont service_role.
--    On retire les grants ADDITIFS posés par la migration (catalog_owner, service_role)
--    puis on re-applique l'instantané pré-migration archivé au preflight (§1.4 A7).
revoke all on public.tools from catalog_owner;   -- (le rôle sera supprimé en 6)
revoke select on public.tools from service_role; -- grant additif de la rév.4.10
-- Ré-application idempotente de l'instantané pré-migration (fourni par le runner en :grants_snapshot,
--   ou rejoué depuis _preflight_public_tools_grants si la session est la même) :
--   pour chaque (grantee, privilege_type) initial : GRANT <priv> ON public.tools TO <grantee>;
--   (Aucun grantee initial n'est retiré ; aucune policy initiale n'est modifiée.)
\echo '>>> Ré-appliquer ici l''instantané pré-migration des grants public.tools (artefact §1.4).'

-- 5) Supprimer ENSUITE les 9 colonnes additives (annule backfills legacy + publication).
alter table public.tools
  drop column if exists legacy_payload,
  drop column if exists updated_at,
  drop column if exists next_review_at,
  drop column if exists published_at,
  drop column if exists editorially_reviewed_at,
  drop column if exists trial_days,
  drop column if exists data_contract,
  drop column if exists research_status,
  drop column if exists content_status;

-- 6) Retirer les dépendances de catalog_owner AVANT DROP ROLE, puis supprimer le rôle.
do $$ begin
  if exists (select 1 from pg_roles where rolname='catalog_owner') then
    execute 'reassign owned by catalog_owner to '||quote_ident(current_user);
    execute 'drop owned by catalog_owner';   -- retire tout privilège/objet résiduel dépendant
    execute 'drop role catalog_owner';
  end if;
end $$;

-- 7) Vérifications post-rollback : contrat absent, colonnes absentes, rôle absent, tools intacts.
do $$ begin
  if to_regnamespace('catalog_private') is not null then raise exception 'ROLLBACK: catalog_private résiduel'; end if;
  if to_regnamespace('catalog_api')    is not null then raise exception 'ROLLBACK: catalog_api résiduel'; end if;
  if exists (select 1 from pg_roles where rolname='catalog_owner') then raise exception 'ROLLBACK: catalog_owner résiduel'; end if;
  if exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='tools'
       and column_name in ('content_status','research_status','data_contract','trial_days',
                           'editorially_reviewed_at','published_at','next_review_at','updated_at','legacy_payload'))
    then raise exception 'ROLLBACK: colonnes additives résiduelles'; end if;
  if (select count(*) from public.tools) <> 533 then raise exception 'ROLLBACK: public.tools <> 533 après retrait des 593'; end if;
end $$;

\echo '>>> Rollback prêt. COMMIT manuel après vérification, sinon ROLLBACK.'
-- COMMIT;   -- décision humaine
