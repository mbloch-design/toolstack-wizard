-- Personal stack: what the signed-in onboarding asks, the trade and the daily rate.
-- Additive and optional: snapshots without "trade" or "dailyRate" stay valid, no row
-- is rewritten, privileges are kept by create or replace. Only new writes check them.
create or replace function public._personal_stack_valid(p_state jsonb) returns boolean
language plpgsql stable security invoker set search_path = pg_catalog as $$
declare s jsonb; b jsonb; v jsonb; n jsonb; k text; ids text[]; num numeric;
begin
 if jsonb_typeof(p_state) is distinct from 'object' or p_state->'version' is distinct from '4'::jsonb then return false; end if;
 s := p_state->'selection'; b := p_state->'billing';
 if jsonb_typeof(s) is distinct from 'object' or s->'version' is distinct from '3'::jsonb
   or jsonb_typeof(s->'needs') is distinct from 'array'
   or jsonb_typeof(s->'toolEntries') is distinct from 'array'
   or not public._personal_stack_strings(s->'pinnedToolSlugs') then return false; end if;
 ids := array['ia','organisation','design','automation','marketing','vente','finance','dev'];
 for n in select value from jsonb_array_elements(s->'needs') loop
   if jsonb_typeof(n) is distinct from 'object'
     or not public._personal_stack_strings(jsonb_build_array(n->'id',n->'labelFr',n->'labelEn'))
     or jsonb_typeof(n->'order') is distinct from 'number'
     or coalesce(n->>'source','') not in ('custom','suggested') then return false; end if;
   if abs((n->>'order')::numeric) > 1.7976931348623157e308 then return false; end if;
   ids := array_append(ids,n->>'id');
 end loop;
 for v in select value from jsonb_array_elements(s->'toolEntries') loop
   if jsonb_typeof(v) is distinct from 'object'
     or not public._personal_stack_strings(jsonb_build_array(v->'toolSlug'))
     or not public._personal_stack_strings(v->'needIds')
     or coalesce(v->>'assignmentMode','') not in ('pending','auto','manual')
     or coalesce(v->>'intent','') not in ('stack','wishlist')
     or jsonb_typeof(v->'addedAt') is distinct from 'string'
     or not isfinite((v->>'addedAt')::timestamptz) then return false; end if;
   if exists(select from jsonb_array_elements_text(v->'needIds') id where not (id=any(ids))) then return false; end if;
 end loop;
 if jsonb_typeof(b) is distinct from 'object'
   or not public._personal_stack_strings(b->'paid')
   or not public._personal_stack_strings(b->'reviewed')
   or jsonb_typeof(b->'choices') is distinct from 'object'
   or jsonb_typeof(p_state->'decisions') is distinct from 'object' then return false; end if;
 for k,v in select * from jsonb_each(b->'choices') loop
   if not public._personal_stack_strings(jsonb_build_array(k)) or jsonb_typeof(v) is distinct from 'object'
     or coalesce(v->>'source','') not in ('plan','custom')
     or jsonb_typeof(v->'amount') is distinct from 'number'
     or coalesce(v->>'currency','') not in ('EUR','USD','GBP')
     or coalesce(v->>'period','') not in ('monthly','annual')
     or (v ? 'label' and jsonb_typeof(v->'label') is distinct from 'string')
     or (v ? 'perSeat' and jsonb_typeof(v->'perSeat') is distinct from 'boolean') then return false; end if;
   num := (v->>'amount')::numeric;
   if num < 0 or num > 1.7976931348623157e308 then return false; end if;
   if v ? 'seats' then
     if jsonb_typeof(v->'seats') is distinct from 'number' then return false; end if;
     num := (v->>'seats')::numeric;
     if num < 1 or num > 9007199254740991 or num <> trunc(num) then return false; end if;
   end if;
 end loop;
 for k,v in select * from jsonb_each(p_state->'decisions') loop
   if not public._personal_stack_strings(jsonb_build_array(k)) or jsonb_typeof(v) is distinct from 'object'
     or coalesce(v->>'kind','') not in ('keep-both','keep-one','replace')
     or not public._personal_stack_strings(jsonb_build_array(v->'kept'))
     or jsonb_typeof(v->'saving') is distinct from 'number'
     or jsonb_typeof(v->'at') is distinct from 'string'
     or not isfinite((v->>'at')::timestamptz)
     or (v ? 'removed' and not public._personal_stack_strings(jsonb_build_array(v->'removed')))
     or (v->>'kind' <> 'keep-both' and not (v ? 'removed'))
     or (v ? 'savingCurrency' and coalesce(v->>'savingCurrency','') not in ('EUR','USD','GBP')) then return false; end if;
   num := (v->>'saving')::numeric;
   if num < 0 or num > 1.7976931348623157e308 then return false; end if;
 end loop;
 -- Optional usage levels (since 23/10/2026): tool slug -> integer 1..5.
 if p_state ? 'usage' then
   if jsonb_typeof(p_state->'usage') is distinct from 'object' then return false; end if;
   for k,v in select * from jsonb_each(p_state->'usage') loop
     if not public._personal_stack_strings(jsonb_build_array(k)) or jsonb_typeof(v) is distinct from 'number' then return false; end if;
     num := (v #>> '{}')::numeric;
     if num < 1 or num > 5 or num <> trunc(num) then return false; end if;
   end loop;
 end if;
 -- Optional trade (since 23/10/2026, onboarding): null or one of six known trades.
 if p_state ? 'trade' and jsonb_typeof(p_state->'trade') <> 'null'
   and coalesce(p_state->>'trade','') not in ('dev','designer','consultant','content','ops','solo') then return false; end if;
 -- Optional daily rate (since 23/10/2026, onboarding): null or {amount 1..100000, currency}.
 if p_state ? 'dailyRate' and jsonb_typeof(p_state->'dailyRate') <> 'null' then
   v := p_state->'dailyRate';
   if jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'amount') is distinct from 'number'
     or coalesce(v->>'currency','') not in ('EUR','USD','GBP') then return false; end if;
   num := (v->>'amount')::numeric;
   if num < 1 or num > 100000 then return false; end if;
 end if;
 return true;
exception when others then return false;
end $$;
