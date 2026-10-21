-- Local integration only. Every fixture is rolled back.
begin;
create schema profile_test;
create function profile_test.ok(value boolean, label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function profile_test.throws(statement text, expected text, label text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when others then
  if sqlstate=expected then return; end if;
  raise exception 'ASSERTION FAILED: % expected %, got % (%)',label,expected,sqlstate,sqlerrm;
 end;
 raise exception 'ASSERTION FAILED: %: no error',label;
end $$;
grant usage on schema profile_test to anon,authenticated,service_role;
grant execute on all functions in schema profile_test to anon,authenticated,service_role;
select profile_test.ok(to_regprocedure('public.read_personal_profile(uuid,uuid)') is not null,'profile reader exists');
select profile_test.ok(to_regprocedure('public.update_personal_profile(uuid,uuid,text)') is not null,'profile updater exists');
select profile_test.ok(not exists(select from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('read_personal_profile','update_personal_profile') and (p.prosecdef or p.proconfig is distinct from array['search_path=pg_catalog'])),'invoker and fixed search path');
select set_config('test.pa','00000000-0000-0000-0000-000000000051',true);
select set_config('test.pb','00000000-0000-0000-0000-000000000052',true);
select set_config('test.psa','10000000-0000-0000-0000-000000000051',true);
select set_config('test.psb','10000000-0000-0000-0000-000000000052',true);
insert into auth.users(id,email,created_at,email_confirmed_at) values
 (current_setting('test.pa')::uuid,'a@example.invalid','2025-01-01T00:00:00Z',null),
 (current_setting('test.pb')::uuid,'b@example.invalid','2025-02-01T00:00:00Z',now());
insert into auth.sessions(id,user_id) values
 (current_setting('test.psa')::uuid,current_setting('test.pa')::uuid),
 (current_setting('test.psb')::uuid,current_setting('test.pb')::uuid);
insert into public.profiles(id,display_name,created_at,locale,avatar_url) values
 (current_setting('test.pa')::uuid,'Old','2026-01-01T00:00:00Z','en','fixture-avatar'),
 (current_setting('test.pb')::uuid,'B','2026-01-01T00:00:00Z','fr',null);
insert into public.stack_snapshots(owner_id,state) values(current_setting('test.pa')::uuid,'{"version":3,"pinnedToolSlugs":["unchanged"]}');
set local role anon;
select profile_test.throws('select public.read_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid)','42501','anon cannot read');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,''Attack'')','42501','anon cannot update');
reset role;
set local role authenticated;
select profile_test.throws('select public.read_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid)','42501','authenticated cannot read');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,''Attack'')','42501','authenticated cannot update');
reset role;
set local role service_role;
select profile_test.ok(public.read_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid)->>'displayName'='Old','read exact owner');
select profile_test.ok((public.read_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid)->>'createdAt')::timestamptz='2025-01-01T00:00:00Z'::timestamptz,'creation comes from Auth');
select profile_test.throws('select public.read_personal_profile(current_setting(''test.pb'')::uuid,current_setting(''test.psa'')::uuid)','PT401','A session cannot read B');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pb'')::uuid,current_setting(''test.psa'')::uuid,''Attack'')','PT401','A session cannot write B');
select profile_test.ok(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,' New name ')->>'displayName'='New name','trim name');
select profile_test.ok(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,U&'\00A0\2003')->'displayName'='null'::jsonb,'blank normalizes to null');
select profile_test.ok(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,null)->'displayName'='null'::jsonb,'null clears name');
select profile_test.ok(length(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,repeat('x',80))->>'displayName')=80,'80 characters accepted');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,repeat(''x'',81))','PT400','81 characters rejected');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,E''a\nb'')','PT400','newline rejected');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,chr(127))','PT400','DEL rejected');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,chr(133))','PT400','C1 control rejected');
select profile_test.ok(char_length(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,repeat('𐐀',80))->>'displayName')=80,'Unicode characters match API limit');
select profile_test.ok(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,'First')->>'displayName'='First','first write');
select profile_test.ok(public.update_personal_profile(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid,'Last')->>'displayName'='Last','last name write wins');
select profile_test.ok(public.read_personal_profile(current_setting('test.pb')::uuid,current_setting('test.psb')::uuid)->>'displayName'='B','other owner unchanged');
select profile_test.ok((select state='{"version":3,"pinnedToolSlugs":["unchanged"]}'::jsonb and revision=1 from public.stack_snapshots where owner_id=current_setting('test.pa')::uuid),'stack untouched');
select profile_test.ok((select locale='en' and avatar_url='fixture-avatar' and account_status='active' from public.profiles where id=current_setting('test.pa')::uuid),'non-name profile settings untouched');
reset role;
select profile_test.ok((select email='a@example.invalid' and email_confirmed_at is null from auth.users where id=current_setting('test.pa')::uuid),'Auth identity untouched');
delete from auth.sessions where id=current_setting('test.psb')::uuid;
set local role service_role;
select profile_test.throws('select public.read_personal_profile(current_setting(''test.pb'')::uuid,current_setting(''test.psb'')::uuid)','PT401','revoked session read denied');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pb'')::uuid,current_setting(''test.psb'')::uuid,''Late'')','PT401','revoked session write denied');
select public.begin_personal_account_deletion(current_setting('test.pa')::uuid,current_setting('test.psa')::uuid);
select profile_test.throws('select public.read_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid)','PT409','deleting read denied');
select profile_test.throws('select public.update_personal_profile(current_setting(''test.pa'')::uuid,current_setting(''test.psa'')::uuid,''Late'')','PT409','deleting write denied');
reset role;
rollback;
