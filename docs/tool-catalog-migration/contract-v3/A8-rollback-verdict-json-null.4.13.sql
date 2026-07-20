\set ON_ERROR_STOP on

begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

set role catalog_owner;
do $rollback$
declare
  view_sql text;
  reverted_sql text;
  needle constant text := 'COALESCE(NULLIF(t.verdict_en, ''null''::jsonb), t.verdict)';
  replacement constant text := 'COALESCE(t.verdict_en, t.verdict)';
begin
  view_sql := pg_get_viewdef('catalog_api.published_tool_projection'::regclass, true);
  if (length(view_sql) - length(replace(view_sql, needle, ''))) / length(needle) <> 1 then
    raise exception 'A8 rollback preflight: expression corrigée introuvable';
  end if;

  reverted_sql := replace(view_sql, needle, replacement);
  execute 'create or replace view catalog_api.published_tool_projection '
       || 'with (security_barrier = true) as ' || reverted_sql;
end
$rollback$;
reset role;

notify pgrst, 'reload schema';
commit;

select 'A8_VERDICT_JSON_NULL_FIX_ROLLED_BACK' as marker;
