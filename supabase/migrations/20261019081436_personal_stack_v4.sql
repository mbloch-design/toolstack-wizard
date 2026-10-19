-- Accounts MVP: apply only after backing up profiles and stack_snapshots.
-- No catalogue or Auth data is changed. Existing v3 snapshots are preserved.
alter table public.profiles add column account_status text not null default 'active'
  check (account_status in ('active','deleting'));

-- Clients must never bypass session validation/CAS or set account_status.
revoke all on public.profiles, public.stack_snapshots from public, anon, authenticated;
grant select, insert, update on public.profiles, public.stack_snapshots to service_role;
-- SECURITY INVOKER functions need these exact Auth reads; never grant to clients.
grant usage on schema auth to service_role;
grant select (id, email, created_at, confirmed_at, is_anonymous, deleted_at, banned_until) on auth.users to service_role;
grant select (id, user_id, not_after) on auth.sessions to service_role;

create function public._personal_stack_strings(p_value jsonb) returns boolean
language sql immutable security invoker set search_path = pg_catalog as $$
 select case when jsonb_typeof(p_value) = 'array' then not exists (
   select from jsonb_array_elements(p_value) e
   where jsonb_typeof(e) <> 'string' or btrim(e #>> '{}', E' \t\n\r\f\013' || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') = ''
 ) else false end
$$;

create function public._personal_stack_valid(p_state jsonb) returns boolean
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
 return true;
exception when others then return false;
end $$;

-- Trusted HTTP code supplies the verified user ID + JWT session_id, never request body IDs.
create function public.require_account_session(p_owner uuid, p_session uuid) returns void
language plpgsql security invoker set search_path = pg_catalog as $$
begin
 if p_owner is null or p_session is null or not exists (
   select from auth.sessions s join auth.users u on u.id=s.user_id
   where s.id=p_session and s.user_id=p_owner and not coalesce(u.is_anonymous,false)
     and u.deleted_at is null and (u.banned_until is null or u.banned_until<=clock_timestamp())
     and (s.not_after is null or s.not_after>clock_timestamp())
 ) then raise sqlstate 'PT401' using message='ACCOUNT_SESSION_INVALID'; end if;
 insert into public.profiles(id) values(p_owner) on conflict(id) do nothing;
end $$;

create function public.read_personal_stack(p_owner uuid, p_session uuid) returns jsonb
language plpgsql security invoker set search_path = pg_catalog as $$
declare result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
   raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 select jsonb_build_object('state',s.state,'revision',s.revision,'updatedAt',s.updated_at)
 into result from public.stack_snapshots s where s.owner_id=p_owner;
 return result;
end $$;

create function public.save_personal_stack(p_owner uuid, p_session uuid, p_expected_revision bigint, p_state jsonb) returns jsonb
language plpgsql security invoker set search_path = pg_catalog as $$
declare saved public.stack_snapshots;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
   raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 if p_expected_revision is null or p_expected_revision<0 or p_expected_revision>=9007199254740991
   or not public._personal_stack_valid(p_state) then
   raise sqlstate 'PT400' using message='INVALID_PERSONAL_STACK'; end if;
 if p_expected_revision=0 then
   insert into public.stack_snapshots(owner_id,state,state_version,revision,updated_at)
   values(p_owner,p_state,4,1,clock_timestamp()) on conflict(owner_id) do nothing returning * into saved;
 else
   update public.stack_snapshots set state=p_state,state_version=4,revision=revision+1,updated_at=clock_timestamp()
   where owner_id=p_owner and revision=p_expected_revision returning * into saved;
 end if;
 if saved.owner_id is null then raise sqlstate 'PT409' using message='STACK_REVISION_CONFLICT'; end if;
 return jsonb_build_object('state',saved.state,'revision',saved.revision,'updatedAt',saved.updated_at);
end $$;

create function public.begin_personal_account_deletion(p_owner uuid, p_session uuid) returns void
language plpgsql security invoker set search_path = pg_catalog as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 478321));
 perform public.require_account_session(p_owner,p_session);
 update public.profiles set account_status='deleting',updated_at=clock_timestamp() where id=p_owner;
end $$;

-- Admin authorization boundary: the trusted HTTP server MUST first enforce its
-- BACKOFFICE_ADMIN_EMAILS allowlist against the verified identity. The service
-- key already grants cross-account access; this RPC validates that identity's
-- live session only. No client-supplied role or metadata can confer admin rights.
create function public.accounts_dashboard(p_admin uuid, p_session uuid, p_query jsonb default '{}'::jsonb) returns jsonb
language plpgsql security invoker set search_path = pg_catalog as $$
declare mode text; page_no integer; page_size integer; search_text text; target uuid; result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_admin::text,478321));
 perform public.require_account_session(p_admin,p_session);
 if exists(select from public.profiles where id=p_admin and account_status='deleting') then
   raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 if jsonb_typeof(p_query) is distinct from 'object' then raise sqlstate 'PT400' using message='INVALID_ACCOUNTS_QUERY'; end if;
 mode:=coalesce(p_query->>'mode','list');
 if mode='detail' then
   begin target:=(p_query->>'userId')::uuid;
   exception when others then raise sqlstate 'PT400' using message='INVALID_ACCOUNTS_QUERY'; end;
   if target is null then raise sqlstate 'PT400' using message='INVALID_ACCOUNTS_QUERY'; end if;
   select jsonb_build_object('userId',u.id,'email',u.email,'displayName',p.display_name,'createdAt',u.created_at,
    'stack',case when s.owner_id is not null then jsonb_build_object('state',s.state,'revision',s.revision,'updatedAt',s.updated_at) else null end)
   into result from auth.users u left join public.profiles p on p.id=u.id left join public.stack_snapshots s on s.owner_id=u.id
   where u.id=target and u.confirmed_at is not null and not coalesce(u.is_anonymous,false)
     and u.deleted_at is null and coalesce(p.account_status,'active')='active';
   return result;
 end if;
 if mode<>'list' or (p_query ? 'search' and jsonb_typeof(p_query->'search') is distinct from 'string') then
   raise sqlstate 'PT400' using message='INVALID_ACCOUNTS_QUERY'; end if;
 begin
   if (p_query ? 'page' and (jsonb_typeof(p_query->'page')<>'number' or (p_query->>'page')::numeric <> trunc((p_query->>'page')::numeric)))
    or (p_query ? 'pageSize' and (jsonb_typeof(p_query->'pageSize')<>'number' or (p_query->>'pageSize')::numeric <> trunc((p_query->>'pageSize')::numeric))) then
     raise exception 'Invalid pagination'; end if;
   page_no:=coalesce((p_query->>'page')::integer,1); page_size:=coalesce((p_query->>'pageSize')::integer,25);
   if page_no<1 or page_size<1 or page_size>100 then raise exception 'Invalid pagination'; end if;
 exception when others then raise sqlstate 'PT400' using message='INVALID_ACCOUNTS_QUERY'; end;
 search_text:=coalesce(p_query->>'search','');
 with eligible as materialized (
   select u.id,u.email,u.created_at,p.display_name,s.state,s.updated_at as stack_updated_at,s.owner_id
   from auth.users u left join public.profiles p on p.id=u.id left join public.stack_snapshots s on s.owner_id=u.id
   where u.confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null
    and coalesce(p.account_status,'active')='active'
 ), selections as (
   select e.id,case when e.state->>'version'='4' then e.state->'selection' else e.state end as selection from eligible e
 ), tools as (
   select distinct s.id, t->>'toolSlug' as slug,coalesce(t->>'intent','stack') as intent
   from selections s cross join lateral jsonb_array_elements(case when jsonb_typeof(s.selection->'toolEntries')='array' then s.selection->'toolEntries' else '[]'::jsonb end) t
   where nullif(btrim(t->>'toolSlug'),'') is not null
   union
   select distinct s.id,t #>> '{}','stack' from selections s
   cross join lateral jsonb_array_elements(case when jsonb_typeof(s.selection->'pinnedToolSlugs')='array' then s.selection->'pinnedToolSlugs' else '[]'::jsonb end) t
   where jsonb_typeof(t)='string' and nullif(btrim(t #>> '{}'),'') is not null
     and not exists(select from jsonb_array_elements(case when jsonb_typeof(s.selection->'toolEntries')='array' then s.selection->'toolEntries' else '[]'::jsonb end) x where x->>'toolSlug'=t #>> '{}')
 ), top_tools as (
   select slug,count(distinct id) filter(where intent='stack') as used_accounts,
     count(distinct id) filter(where intent='wishlist') as wishlist_accounts from tools group by slug
 ), filtered as (
   select * from eligible where search_text='' or position(lower(search_text) in lower(coalesce(email,'') || ' ' || coalesce(display_name,'')))>0
 ), paged as (
   select * from filtered order by created_at desc,id limit page_size offset (page_no::bigint-1)*page_size
 ) select jsonb_build_object(
   'totals',jsonb_build_object('accounts',(select count(*) from eligible),
     'accountsWithStack',(select count(*) from eligible where owner_id is not null),
     'nonemptyStacks',(select count(distinct id) from tools)),
   'topTools',coalesce((select jsonb_agg(jsonb_build_object('toolSlug',slug,'usedAccounts',used_accounts,'wishlistAccounts',wishlist_accounts) order by used_accounts+wishlist_accounts desc,slug) from top_tools),'[]'::jsonb),
   'accounts',coalesce((select jsonb_agg(jsonb_build_object('userId',id,'email',email,'displayName',display_name,'createdAt',created_at,'hasStack',owner_id is not null,'stackUpdatedAt',stack_updated_at) order by created_at desc,id) from paged),'[]'::jsonb),
   'page',page_no,'pageSize',page_size,'total',(select count(*) from filtered),'updatedAt',clock_timestamp()) into result;
 return result;
end $$;

revoke all on function public._personal_stack_strings(jsonb), public._personal_stack_valid(jsonb),
 public.require_account_session(uuid,uuid),public.read_personal_stack(uuid,uuid),
 public.save_personal_stack(uuid,uuid,bigint,jsonb),public.begin_personal_account_deletion(uuid,uuid),
 public.accounts_dashboard(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public._personal_stack_strings(jsonb), public._personal_stack_valid(jsonb),
 public.require_account_session(uuid,uuid),public.read_personal_stack(uuid,uuid),
 public.save_personal_stack(uuid,uuid,bigint,jsonb),public.begin_personal_account_deletion(uuid,uuid),
 public.accounts_dashboard(uuid,uuid,jsonb) to service_role;
