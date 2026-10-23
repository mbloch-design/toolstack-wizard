-- Trade and daily rate in the personal stack. Run after personal_stack_usage and personal_stack_onboarding.
-- Every fixture rolls back.
begin;
create schema trade_test;
create function trade_test.ok(value boolean, label text) returns void
language plpgsql as $$ begin
 if value is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if;
end $$;
create function trade_test.state(p_trade jsonb) returns jsonb language sql immutable as $$
 select jsonb_build_object('version',4,
  'selection',jsonb_build_object('version',3,'needs','[]'::jsonb,'toolEntries','[]'::jsonb,'pinnedToolSlugs','[]'::jsonb),
  'billing',jsonb_build_object('paid','[]'::jsonb,'reviewed','[]'::jsonb,'choices','{}'::jsonb),
  'decisions','{}'::jsonb) || case when p_trade is null then '{}'::jsonb else jsonb_build_object('trade',p_trade) end
$$;

select trade_test.ok(public._personal_stack_valid(trade_test.state(null)), 'a snapshot without trade stays valid');
select trade_test.ok(public._personal_stack_valid(trade_test.state('null')), 'an explicit null trade is valid');
select trade_test.ok(public._personal_stack_valid(trade_test.state('"designer"')), 'a known trade is valid');
select trade_test.ok(public._personal_stack_valid(trade_test.state('"solo"')), 'solo is valid');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('"astronaut"')), 'unknown trade rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('""')), 'empty trade rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('3')), 'number rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('["dev"]')), 'array rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('{"trade":"dev"}')), 'object rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.state('"dev"') || '{"usage":{"figma":9}}'), 'usage is still checked');
select trade_test.ok(public._personal_stack_stored(trade_test.state('"ops"')), 'stored snapshots with a trade are recognised');
create function trade_test.rated(p_rate jsonb) returns jsonb language sql immutable as $$
 select trade_test.state(null) || jsonb_build_object('dailyRate',p_rate)
$$;
select trade_test.ok(public._personal_stack_valid(trade_test.rated('null')), 'an explicit null daily rate is valid');
select trade_test.ok(public._personal_stack_valid(trade_test.rated('{"amount":450,"currency":"EUR"}')), 'a daily rate in euros is valid');
select trade_test.ok(public._personal_stack_valid(trade_test.rated('{"amount":612.5,"currency":"USD"}')), 'a decimal daily rate is valid');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('{"amount":0,"currency":"EUR"}')), 'zero rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('{"amount":100001,"currency":"EUR"}')), 'above 100000 rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('{"amount":"450","currency":"EUR"}')), 'string amount rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('{"amount":450,"currency":"JPY"}')), 'unknown currency rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('{"amount":450}')), 'missing currency rejected');
select trade_test.ok(not public._personal_stack_valid(trade_test.rated('450')), 'bare number rejected');
select trade_test.ok(not exists(select from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='_personal_stack_valid'
 and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE') or p.prosecdef)), 'validator stays invoker and service-only');
rollback;
