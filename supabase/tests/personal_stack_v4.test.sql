-- Run only in an isolated database with accounts-auth.fixture.sql, the original
-- accounts migration and personal_stack_v4 applied. All test data rolls back.
begin;
create schema accounts_test;
create function accounts_test.ok(value boolean, label text) returns void
language plpgsql as $$ begin
 if value is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if;
end $$;
create function accounts_test.throws(statement text, expected text, label text) returns void
language plpgsql as $$ begin
 begin execute statement;
 exception when others then
   if sqlstate = expected then return; end if;
   raise exception 'ASSERTION FAILED: %: expected %, got % (%)', label, expected, sqlstate, sqlerrm;
 end;
 raise exception 'ASSERTION FAILED: %: no error', label;
end $$;
grant usage on schema accounts_test to anon, authenticated, service_role;
grant execute on all functions in schema accounts_test to anon, authenticated, service_role;

select accounts_test.ok(not has_table_privilege('authenticated','public.stack_snapshots','UPDATE'), 'clients cannot bypass revision checks');
select accounts_test.ok(not has_table_privilege('authenticated','public.profiles','UPDATE'), 'clients cannot alter deletion status');
select accounts_test.ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('require_account_session','read_personal_stack','save_personal_stack','begin_personal_account_deletion','accounts_dashboard')
 and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE') or p.prosecdef)), 'all RPCs invoker and service-only');

insert into auth.users (id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000001','a@example.invalid',now()),
 ('00000000-0000-0000-0000-000000000002','b@example.invalid',now()),
 ('00000000-0000-0000-0000-000000000003','c@example.invalid',null);
insert into auth.sessions(id,user_id) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
-- Test SQL uses GUCs only as convenient hand-written parameters, never auth claims.
select set_config('test.a','00000000-0000-0000-0000-000000000001',true),
 set_config('test.b','00000000-0000-0000-0000-000000000002',true),
 set_config('test.sa','10000000-0000-0000-0000-000000000001',true),
 set_config('test.sb','10000000-0000-0000-0000-000000000002',true),
 set_config('test.state','{"version":4,"selection":{"version":3,"needs":[{"id":"design","labelFr":"Design","labelEn":"Design","order":10,"source":"custom"}],"toolEntries":[{"toolSlug":"missing-from-json","needIds":["design"],"addedAt":"2026-10-19T00:00:00Z","assignmentMode":"manual","intent":"stack"}],"pinnedToolSlugs":["missing-from-json"]},"billing":{"paid":["missing-from-json"],"reviewed":[],"choices":{"missing-from-json":{"source":"custom","amount":0,"currency":"EUR","period":"monthly","seats":1,"perSeat":false}}},"decisions":{"old|new":{"kind":"replace","kept":"new","removed":"old","saving":12,"at":"2026-10-18T00:00:00Z"}}}',true);
set local role anon;
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid)','42501','anon RPC rejected');
reset role;
set local role authenticated;
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid)','42501','authenticated RPC rejected');
select accounts_test.throws('select * from public.stack_snapshots','42501','direct stack reads rejected');
reset role;
set local role service_role;
select accounts_test.ok(public.read_personal_stack(current_setting('test.a')::uuid,current_setting('test.sa')::uuid) is null,'first login has no empty snapshot');
select accounts_test.ok((select count(*)=1 from public.profiles),'profile bootstrapped');
select public.require_account_session(current_setting('test.a')::uuid,current_setting('test.sa')::uuid);
select accounts_test.ok((select count(*)=1 from public.profiles),'bootstrap idempotent');
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.b'')::uuid,current_setting(''test.sa'')::uuid)','PT401','A session cannot read B');
select accounts_test.ok((public.save_personal_stack(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,0,current_setting('test.state')::jsonb)->>'revision')::int=1,'create revision 0 to 1');
select accounts_test.ok((public.save_personal_stack(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,1,current_setting('test.state')::jsonb)->>'revision')::int=2,'save revision 1 to 2');
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,1,current_setting(''test.state'')::jsonb)','PT409','stale writer conflicts');
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,0,current_setting(''test.state'')::jsonb)','PT409','create cannot overwrite existing');
select accounts_test.ok(public.read_personal_stack(current_setting('test.b')::uuid,current_setting('test.sb')::uuid) is null,'B does not see A');
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.b'')::uuid,null,0,current_setting(''test.state'')::jsonb)','PT401','missing session rejected');
-- Malformed writes must be rejected without changing the last good revision.
do $$ declare bad jsonb; begin
 for bad in select value from jsonb_array_elements(jsonb_build_array(
  'null'::jsonb, '{}'::jsonb,
  jsonb_set(current_setting('test.state')::jsonb,'{version}','3'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,amount}','-1'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,amount}','"NaN"'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,amount}','1e400'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,currency}','"CAD"'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,period}','"week"'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,seats}','1.5'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,seats}','0'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,seats}','9007199254740992'),
  jsonb_set(current_setting('test.state')::jsonb,'{billing,choices,missing-from-json,perSeat}','null'),
  jsonb_set(current_setting('test.state')::jsonb,'{selection,needs,0,order}','"10"'),
  jsonb_set(current_setting('test.state')::jsonb,'{selection,needs,0,labelFr}',to_jsonb(E'\t\n'::text)),
  jsonb_set(current_setting('test.state')::jsonb,'{selection,toolEntries,0,intent}','"purchase"'),
  jsonb_set(current_setting('test.state')::jsonb,'{decisions,old|new,savingCurrency}','"CAD"'),
  jsonb_set(current_setting('test.state')::jsonb,'{selection,toolEntries,0,needIds}','["unknown"]'),
  jsonb_set(current_setting('test.state')::jsonb,'{selection,toolEntries,0,addedAt}','"not a date"'),
  jsonb_set(current_setting('test.state')::jsonb,'{decisions,old|new,saving}','-1')
 )) loop
  perform accounts_test.throws(format('select public.save_personal_stack(%L::uuid,%L::uuid,2,%L::jsonb)',current_setting('test.a'),current_setting('test.sa'),bad),'PT400','invalid JSON rejected');
 end loop;
end $$;
select accounts_test.ok((public.read_personal_stack(current_setting('test.a')::uuid,current_setting('test.sa')::uuid)->>'revision')::int=2,'invalid writes preserve snapshot');
-- Built-in need references remain valid alongside custom needs, matching the shared normalizer.
select accounts_test.ok(public._personal_stack_valid(jsonb_set(current_setting('test.state')::jsonb,
 '{selection,toolEntries,0,needIds}','["dev"]')),'standard needs survive custom input');
-- Conflicting historical duplicates must retain the first entry per trimmed slug.
select public.save_personal_stack(current_setting('test.b')::uuid,current_setting('test.sb')::uuid,0,
 jsonb_set(current_setting('test.state')::jsonb,'{selection,toolEntries}',
 '[{"toolSlug":"missing-from-json","needIds":[],"addedAt":"2026-10-19T00:00:00Z","assignmentMode":"pending","intent":"wishlist"},{"toolSlug":"missing-from-json","needIds":[],"addedAt":"2026-10-19T00:00:00Z","assignmentMode":"pending","intent":"stack"},{"toolSlug":" missing-from-json ","needIds":[],"addedAt":"2026-10-19T00:00:00Z","assignmentMode":"pending","intent":"stack"}]'));
do $$ declare dashboard jsonb; begin
 dashboard := public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{"page":1,"pageSize":1}');
 perform accounts_test.ok(dashboard->'totals'='{"accounts":2,"accountsWithStack":2,"nonemptyStacks":2}'::jsonb,'global confirmed totals independent of pagination');
 perform accounts_test.ok(dashboard->>'total'='2' and jsonb_array_length(dashboard->'accounts')=1,'list paginated');
 perform accounts_test.ok(dashboard->'topTools'='[{"toolSlug":"missing-from-json","usedAccounts":1,"wishlistAccounts":1}]'::jsonb,'conflicting duplicates retain first intent for each trimmed slug');
 dashboard := public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{"search":"b@example.invalid"}');
 perform accounts_test.ok(dashboard->>'total'='1' and dashboard->'totals'->>'accounts'='2','search cannot truncate totals');
 dashboard := public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,jsonb_build_object('mode','detail','userId',current_setting('test.b')));
 perform accounts_test.ok(dashboard->>'email'='b@example.invalid' and dashboard->'stack'->>'revision'='1','detail returns selected account');
 perform accounts_test.throws('select public.accounts_dashboard(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,''{"pageSize":101}'')','PT400','invalid dashboard pagination rejected');
end $$;
-- Existing owner policies remain a second defense if SELECT is accidentally restored.
reset role;
grant select on public.stack_snapshots,public.profiles to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.b'),true);
select accounts_test.ok((select count(*)=1 and min(owner_id::text)=current_setting('test.b') from public.stack_snapshots),'RLS returns only B snapshot');
select accounts_test.ok((select count(*)=1 and min(id::text)=current_setting('test.b') from public.profiles),'RLS returns only B profile');
reset role;
revoke select on public.stack_snapshots,public.profiles from authenticated;
-- Auth revocation/expiry/ban are checked against database state on every write.
update auth.sessions set not_after=now()-interval '1 second' where id=current_setting('test.sa')::uuid;
set local role service_role;
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,2,current_setting(''test.state'')::jsonb)','PT401','expired session rejected');
reset role;
update auth.sessions set not_after=null where id=current_setting('test.sa')::uuid;
update auth.users set banned_until=now()+interval '1 day' where id=current_setting('test.a')::uuid;
set local role service_role;
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid)','PT401','banned identity rejected');
reset role;
update auth.users set banned_until=null,is_anonymous=true where id=current_setting('test.a')::uuid;
set local role service_role;
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid)','PT401','anonymous identity rejected');
reset role;
update auth.users set is_anonymous=false where id=current_setting('test.a')::uuid;
-- Legacy v3 references and an empty stack remain distinct in global metrics.
update auth.users set email_confirmed_at=now() where id='00000000-0000-0000-0000-000000000003';
insert into public.stack_snapshots(owner_id,state,state_version) values
 ('00000000-0000-0000-0000-000000000003','{"version":3,"pinnedToolSlugs":["legacy-tool","legacy-tool"],"toolEntries":[]}',3);
set local role service_role;
select accounts_test.ok(public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{}')->'totals'='{"accounts":3,"accountsWithStack":3,"nonemptyStacks":3}'::jsonb,'v3 stack included without catalogue lookup');
select accounts_test.ok(public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{}')->'topTools' @> '[{"toolSlug":"legacy-tool","usedAccounts":1,"wishlistAccounts":0}]'::jsonb,'legacy duplicate references count once');
-- A confirmed account with an empty saved snapshot counts as saved, not nonempty.
reset role;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000004','empty@example.invalid',now());
insert into auth.sessions(id,user_id) values
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004');
set local role service_role;
select accounts_test.ok(public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{}')->'totals'='{"accounts":4,"accountsWithStack":3,"nonemptyStacks":3}'::jsonb,'confirmed empty account initially has no snapshot');
select public.save_personal_stack('00000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004',0,
 '{"version":4,"selection":{"version":3,"needs":[],"toolEntries":[],"pinnedToolSlugs":[]},"billing":{"paid":[],"reviewed":[],"choices":{}},"decisions":{}}');
do $$ declare dashboard jsonb; begin
 dashboard:=public.accounts_dashboard(current_setting('test.a')::uuid,current_setting('test.sa')::uuid,'{"search":"empty@example.invalid"}');
 perform accounts_test.ok(dashboard->'totals'='{"accounts":4,"accountsWithStack":4,"nonemptyStacks":3}'::jsonb,'empty persisted snapshot increases saved count only');
 perform accounts_test.ok(dashboard->>'total'='1' and dashboard->'accounts'->0->>'hasStack'='true','empty saved snapshot is visible as saved');
 perform accounts_test.ok(dashboard->'topTools'='[{"toolSlug":"missing-from-json","usedAccounts":1,"wishlistAccounts":1},{"toolSlug":"legacy-tool","usedAccounts":1,"wishlistAccounts":0}]'::jsonb,'empty snapshot does not change tool totals');
end $$;
reset role;
delete from auth.sessions where id=current_setting('test.sb')::uuid;
set local role service_role;
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.b'')::uuid,current_setting(''test.sb'')::uuid,1,current_setting(''test.state'')::jsonb)','PT401','revoked session save rejected');
select public.begin_personal_account_deletion(current_setting('test.a')::uuid,current_setting('test.sa')::uuid);
select public.begin_personal_account_deletion(current_setting('test.a')::uuid,current_setting('test.sa')::uuid);
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,2,current_setting(''test.state'')::jsonb)','PT409','deleting prevents late save');
select accounts_test.throws('select public.read_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid)','PT409','deleting prevents private reads');
reset role;
delete from auth.users where id=current_setting('test.a')::uuid;
set local role service_role;
select accounts_test.throws('select public.save_personal_stack(current_setting(''test.a'')::uuid,current_setting(''test.sa'')::uuid,0,current_setting(''test.state'')::jsonb)','PT401','deleted identity cannot recreate stack');
reset role;
select accounts_test.ok(not exists(select from public.stack_snapshots where owner_id=current_setting('test.a')::uuid),'auth deletion cascades only personal snapshot');
select accounts_test.ok((select value='catalogue must stay unchanged' from public.accounts_catalog_sentinel where id=1),'catalogue untouched');
rollback;
