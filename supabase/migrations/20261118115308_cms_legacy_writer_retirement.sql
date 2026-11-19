-- Keep historical records and read grants. Publisher writes use the CMS RPCs.
begin;

do $retire$
declare
  target regclass;
  entry regprocedure;
  columns text;
begin
  foreach target in array array[
    to_regclass('catalog_contrib.tool_change_requests'),
    to_regclass('catalog_contrib.tool_change_request_items'),
    to_regclass('catalog_contrib.tool_change_request_events')
  ] loop
    continue when target is null;
    execute format('revoke insert, update, delete, truncate on table %s from public, anon, authenticated', target);
    select string_agg(quote_ident(attname), ', ' order by attnum) into columns
      from pg_catalog.pg_attribute where attrelid = target and attnum > 0 and not attisdropped;
    execute format('revoke insert (%s), update (%s) on table %s from public, anon, authenticated', columns, columns, target);
    if has_any_column_privilege('authenticated', target, 'INSERT, UPDATE')
      or has_table_privilege('authenticated', target, 'DELETE, TRUNCATE')
      or has_any_column_privilege('anon', target, 'INSERT, UPDATE')
      or has_table_privilege('anon', target, 'DELETE, TRUNCATE') then
      raise exception 'CMS legacy writer privilege remains on %', target;
    end if;
  end loop;

  foreach entry in array array[
    to_regprocedure('catalog_contrib.submit_tool_change_request(uuid)'),
    to_regprocedure('catalog_contrib.withdraw_tool_change_request(uuid)')
  ] loop
    continue when entry is null;
    execute format('revoke execute on function %s from public, anon, authenticated', entry);
    if has_function_privilege('authenticated', entry, 'EXECUTE')
      or has_function_privilege('anon', entry, 'EXECUTE') then
      raise exception 'CMS legacy writer privilege remains on %', entry;
    end if;
  end loop;
end;
$retire$;

commit;
