begin;
create schema deletion_test;
create function deletion_test.ok(value boolean, label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function deletion_test.throws(statement text, expected text, label text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when others then
  if sqlstate=expected then return; end if;
  raise exception 'ASSERTION FAILED: % expected %, got % (%)',label,expected,sqlstate,sqlerrm;
 end;
 raise exception 'ASSERTION FAILED: %: no error',label;
end $$;
grant usage on schema deletion_test to anon,authenticated,service_role;
grant execute on all functions in schema deletion_test to anon,authenticated,service_role;

select deletion_test.ok(to_regprocedure('public.personal_account_has_contributions(uuid,uuid)') is not null,'history guard RPC exists');
select deletion_test.ok(not has_function_privilege('anon','public.personal_account_has_contributions(uuid,uuid)','EXECUTE')
 and not has_function_privilege('authenticated','public.personal_account_has_contributions(uuid,uuid)','EXECUTE'),'history guard service-only');
select deletion_test.ok((select not prosecdef and proconfig @> array['search_path=pg_catalog'] from pg_proc where oid='public.personal_account_has_contributions(uuid,uuid)'::regprocedure),'history guard invoker fixed search_path');
insert into auth.users(id) values('00000000-0000-0000-0000-000000000061'),('00000000-0000-0000-0000-000000000062');
insert into auth.sessions(id,user_id) values('10000000-0000-0000-0000-000000000061','00000000-0000-0000-0000-000000000061'),('10000000-0000-0000-0000-000000000062','00000000-0000-0000-0000-000000000062');
set local role service_role;
select public.begin_personal_account_deletion('00000000-0000-0000-0000-000000000061','10000000-0000-0000-0000-000000000061');
select deletion_test.ok(not public.personal_account_has_contributions('00000000-0000-0000-0000-000000000061','10000000-0000-0000-0000-000000000061'),'ordinary personal account can complete deletion');
select deletion_test.throws('select public.personal_account_has_contributions(''00000000-0000-0000-0000-000000000061'',''10000000-0000-0000-0000-000000000062'')','PT401','other session cannot check owner history');
select public.begin_personal_account_deletion('00000000-0000-0000-0000-000000000061','10000000-0000-0000-0000-000000000061');
reset role;
-- Exercise every exact live reference individually; no history is deleted by the RPC.
do $$ declare item text[]; found boolean; begin
 foreach item slice 1 in array array[
  ['catalog_contrib','brand_memberships','user_id'],['catalog_contrib','brand_memberships','invited_by'],
  ['catalog_contrib','brand_tool_assignments','verified_by'],['catalog_contrib','brands','created_by'],
  ['catalog_contrib','tool_change_request_events','actor_user_id'],['catalog_contrib','tool_change_request_items','applied_by'],
  ['catalog_contrib','tool_change_request_items','decided_by'],['catalog_contrib','tool_change_requests','created_by'],
  ['catalog_contrib','tool_change_requests','reviewed_by'],['catalog_private','tool_editorial_content','created_by_user_id'],
  ['catalog_private','tool_editorial_content','reviewed_by_user_id']
 ] loop
  execute format('insert into %I.%I(id,%I) values(61,$1)',item[1],item[2],item[3]) using '00000000-0000-0000-0000-000000000061'::uuid;
  set local role service_role;
  select public.personal_account_has_contributions('00000000-0000-0000-0000-000000000061','10000000-0000-0000-0000-000000000061') into found;
  reset role;
  perform deletion_test.ok(found,format('preserves reference %s.%s.%s',item[1],item[2],item[3]));
  execute format('delete from %I.%I where id=61',item[1],item[2]);
 end loop;
end $$;
-- NO ACTION remains the last guard if a historical reference appears after the check.
insert into catalog_contrib.brands(id,created_by) values(62,'00000000-0000-0000-0000-000000000061');
select deletion_test.throws('delete from auth.users where id=''00000000-0000-0000-0000-000000000061''','23503','concurrent contribution FK still blocks Auth deletion');
delete from catalog_contrib.brands where id=62;
delete from auth.users where id='00000000-0000-0000-0000-000000000061';
set local role service_role;
select deletion_test.throws('select public.require_account_session(''00000000-0000-0000-0000-000000000061'',''10000000-0000-0000-0000-000000000061'')','PT401','deleted identity cannot reuse old session');
reset role;
select deletion_test.ok((select value='catalogue must stay unchanged' from public.accounts_catalog_sentinel where id=1),'catalogue sentinel retained');
rollback;
