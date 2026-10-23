-- Usage levels in the personal stack. Run after personal_stack_v4 and personal_stack_usage.
-- Every fixture rolls back.
begin;
create schema usage_test;
create function usage_test.ok(value boolean, label text) returns void
language plpgsql as $$ begin
 if value is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if;
end $$;
create function usage_test.state(p_usage jsonb) returns jsonb language sql immutable as $$
 select jsonb_build_object('version',4,
  'selection',jsonb_build_object('version',3,'needs','[]'::jsonb,'toolEntries','[]'::jsonb,'pinnedToolSlugs','[]'::jsonb),
  'billing',jsonb_build_object('paid','[]'::jsonb,'reviewed','[]'::jsonb,'choices','{}'::jsonb),
  'decisions','{}'::jsonb) || case when p_usage is null then '{}'::jsonb else jsonb_build_object('usage',p_usage) end
$$;

select usage_test.ok(public._personal_stack_valid(usage_test.state(null)), 'a snapshot without usage stays valid');
select usage_test.ok(public._personal_stack_valid(usage_test.state('{}')), 'empty usage is valid');
select usage_test.ok(public._personal_stack_valid(usage_test.state('{"figma":1,"slack":5,"notion":3}')), 'levels 1 to 5 are valid');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('{"figma":0}')), 'level 0 rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('{"figma":6}')), 'level 6 rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('{"figma":2.5}')), 'fraction rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('{"figma":"full"}')), 'word rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('{" ":3}')), 'blank tool slug rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('["figma"]')), 'array rejected');
select usage_test.ok(not public._personal_stack_valid(usage_test.state('"figma"')), 'string rejected');
select usage_test.ok(public._personal_stack_stored(usage_test.state('{"figma":4}')), 'stored snapshots with usage are recognised');
select usage_test.ok(not exists(select from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='_personal_stack_valid'
 and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE') or p.prosecdef)), 'validator stays invoker and service-only');
rollback;
