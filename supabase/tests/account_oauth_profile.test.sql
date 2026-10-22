-- Entire fixture rolled back; true connection races belong to the PG17 gate.
begin;
create schema oauth_test;
create function oauth_test.ok(value boolean,label text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function oauth_test.throws(statement text,expected text,label text) returns void language plpgsql as $$
begin begin execute statement; exception when others then if sqlstate=expected then return; end if; raise exception 'ASSERTION FAILED: % expected %, got % (%)',label,expected,sqlstate,sqlerrm; end; raise exception 'ASSERTION FAILED: %: no error',label; end $$;
grant usage on schema oauth_test to anon,authenticated,service_role;
grant execute on all functions in schema oauth_test to anon,authenticated,service_role;
select oauth_test.ok(to_regprocedure('public.import_personal_oauth_profile(uuid,uuid,text,text,text,text)') is not null,'import exists');
select oauth_test.ok(not exists(select from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('import_personal_oauth_profile','read_personal_profile','update_personal_profile') and (p.prosecdef or p.proconfig is distinct from array['search_path=pg_catalog'])),'invoker fixed search path');
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000061','oauth-a@example.invalid',now()),
 ('00000000-0000-0000-0000-000000000062','oauth-b@example.invalid',now()),
 ('00000000-0000-0000-0000-000000000063','oauth-c@example.invalid',now());
insert into auth.sessions(id,user_id) values
 ('10000000-0000-0000-0000-000000000061','00000000-0000-0000-0000-000000000061'),
 ('10000000-0000-0000-0000-000000000062','00000000-0000-0000-0000-000000000062'),
 ('10000000-0000-0000-0000-000000000063','00000000-0000-0000-0000-000000000063');
select set_config('test.oa','00000000-0000-0000-0000-000000000061',true);
select set_config('test.ob','00000000-0000-0000-0000-000000000062',true);
select set_config('test.oc','00000000-0000-0000-0000-000000000063',true);
select set_config('test.osa','10000000-0000-0000-0000-000000000061',true);
select set_config('test.osb','10000000-0000-0000-0000-000000000062',true);
select set_config('test.osc','10000000-0000-0000-0000-000000000063',true);
set local role anon;
select oauth_test.throws('select public.import_personal_oauth_profile(null,null,''google'',null,null,null)','42501','anon denied');
reset role; set local role authenticated;
select oauth_test.throws('select public.import_personal_oauth_profile(null,null,''google'',null,null,null)','42501','authenticated denied');
select oauth_test.throws('update public.profiles set oauth_profile_source=''google'',display_name_auto_fill_allowed=true','42501','direct privilege forgery denied');
reset role; set local role service_role;
select public.require_account_session(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid);
select oauth_test.ok((select display_name_auto_fill_allowed from public.profiles where id=current_setting('test.oa')::uuid),'new profiles allow autofill');
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid,'google','Google','https://lh3.googleusercontent.com/a?sz=96','fr-FR')->>'displayName'='Google','first import');
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid,'github','Other','https://avatars.githubusercontent.com/u/1','en')->>'oauthProfileSource'='google','import once no provider mixing');
select oauth_test.ok(public.read_personal_profile(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid)->>'providerLocale'='fr-FR','provider locale retained separately');
select public.update_personal_profile(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid,null);
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid,'google','Resurrect',null,null)->'displayName'='null'::jsonb,'clear after import wins');
select public.update_personal_profile(current_setting('test.ob')::uuid,current_setting('test.osb')::uuid,null);
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.ob')::uuid,current_setting('test.osb')::uuid,'github','Resurrect',null,null)->'displayName'='null'::jsonb,'clear before import wins');
select public.require_account_session(current_setting('test.oc')::uuid,current_setting('test.osc')::uuid);
update public.profiles set display_name='Manual',avatar_url='historical-avatar',locale='en' where id=current_setting('test.oc')::uuid;
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.oc')::uuid,current_setting('test.osc')::uuid,'google','OAuth','https://lh3.googleusercontent.com/a',null)->>'displayName'='Manual','non-null name preserved');
select oauth_test.ok((select avatar_url='historical-avatar' and locale='en' from public.profiles where id=current_setting('test.oc')::uuid),'non-null avatar and UI locale preserved');
select oauth_test.throws('select public.import_personal_oauth_profile(current_setting(''test.ob'')::uuid,current_setting(''test.osa'')::uuid,''google'',null,null,null)','PT401','owner mismatch denied');
select oauth_test.throws('select public.import_personal_oauth_profile(current_setting(''test.oa'')::uuid,current_setting(''test.osa'')::uuid,''admin'',null,null,null)','PT400','provider cannot be authority');
select public.update_personal_profile(current_setting('test.ob')::uuid,current_setting('test.osb')::uuid,'Custom');
select oauth_test.ok(public.import_personal_oauth_profile(current_setting('test.ob')::uuid,current_setting('test.osb')::uuid,'google','Different',null,null)->>'displayName'='Custom','custom name before and after import wins');
select public.begin_personal_account_deletion(current_setting('test.oa')::uuid,current_setting('test.osa')::uuid);
select oauth_test.throws('select public.import_personal_oauth_profile(current_setting(''test.oa'')::uuid,current_setting(''test.osa'')::uuid,''google'',null,null,null)','PT409','deleting denied');
reset role;
delete from auth.sessions where id=current_setting('test.osb')::uuid;
set local role service_role;
select oauth_test.throws('select public.import_personal_oauth_profile(current_setting(''test.ob'')::uuid,current_setting(''test.osb'')::uuid,''google'',null,null,null)','PT401','revoked denied');
reset role;
rollback;
