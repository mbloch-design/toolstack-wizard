\set ON_ERROR_STOP on

begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

-- Les lignes legacy peuvent porter le littéral JSON null dans verdict_en.
-- COALESCE ne le traite pas comme un NULL SQL, alors que le mapper historique
-- JavaScript retombe bien sur verdict. La correction est volontairement
-- limitée à cette expression et conserve owner, grants et colonnes de la vue.
set role catalog_owner;
do $fix$
declare
  view_sql text;
  fixed_sql text;
  needle constant text := 'COALESCE(t.verdict_en, t.verdict)';
  replacement constant text := 'COALESCE(NULLIF(t.verdict_en, ''null''::jsonb), t.verdict)';
begin
  view_sql := pg_get_viewdef('catalog_api.published_tool_projection'::regclass, true);
  if (length(view_sql) - length(replace(view_sql, needle, ''))) / length(needle) <> 1 then
    raise exception 'A8 preflight: expression verdict_en inattendue';
  end if;

  fixed_sql := replace(view_sql, needle, replacement);
  execute 'create or replace view catalog_api.published_tool_projection '
       || 'with (security_barrier = true) as ' || fixed_sql;
end
$fix$;
reset role;

do $gate$
declare
  mismatch_count integer;
begin
  select count(*) into mismatch_count
  from catalog_api.published_tool_projection p
  join public.tools t on t.id = p.tool_id
  where p.lang = 'en'
    and p.verdict is distinct from coalesce(nullif(t.verdict_en, 'null'::jsonb), t.verdict);

  if mismatch_count <> 0 then
    raise exception 'A8 gate: % verdicts EN divergent encore', mismatch_count;
  end if;
end
$gate$;

notify pgrst, 'reload schema';
commit;

select 'A8_VERDICT_JSON_NULL_FIX_COMMITTED' as marker;
