-- Service-only bounded history check. Never alters catalogue rows or Auth FKs.
create function public.personal_account_has_contributions(p_owner uuid,p_session uuid) returns boolean
language plpgsql security invoker set search_path=pg_catalog as $$
declare item text[]; found boolean;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,478321));
 perform public.require_account_session(p_owner,p_session);
 if not exists(select from public.profiles where id=p_owner and account_status='deleting') then
  raise sqlstate 'PT409' using message='ACCOUNT_DELETION_NOT_STARTED';
 end if;
 foreach item slice 1 in array array[
  ['catalog_contrib','brand_memberships','user_id'],['catalog_contrib','brand_memberships','invited_by'],
  ['catalog_contrib','brand_tool_assignments','verified_by'],['catalog_contrib','brands','created_by'],
  ['catalog_contrib','tool_change_request_events','actor_user_id'],['catalog_contrib','tool_change_request_items','applied_by'],
  ['catalog_contrib','tool_change_request_items','decided_by'],['catalog_contrib','tool_change_requests','created_by'],
  ['catalog_contrib','tool_change_requests','reviewed_by'],['catalog_private','tool_editorial_content','created_by_user_id'],
  ['catalog_private','tool_editorial_content','reviewed_by_user_id']
 ] loop
  -- Optional schemas may be absent in isolated/personal-only installations.
  if to_regclass(format('%I.%I',item[1],item[2])) is null then continue; end if;
  execute format('select exists(select 1 from %I.%I where %I=$1)',item[1],item[2],item[3]) into found using p_owner;
  if found then return true; end if;
 end loop;
 return false;
end $$;
revoke execute on function public.personal_account_has_contributions(uuid,uuid) from public,anon,authenticated;
grant execute on function public.personal_account_has_contributions(uuid,uuid) to service_role;

-- Fixed identifiers from verified Auth FK preflight; grant only required column reads.
do $$ declare item text[]; begin
 foreach item slice 1 in array array[
  ['catalog_contrib','brand_memberships','user_id'],['catalog_contrib','brand_memberships','invited_by'],
  ['catalog_contrib','brand_tool_assignments','verified_by'],['catalog_contrib','brands','created_by'],
  ['catalog_contrib','tool_change_request_events','actor_user_id'],['catalog_contrib','tool_change_request_items','applied_by'],
  ['catalog_contrib','tool_change_request_items','decided_by'],['catalog_contrib','tool_change_requests','created_by'],
  ['catalog_contrib','tool_change_requests','reviewed_by'],['catalog_private','tool_editorial_content','created_by_user_id'],
  ['catalog_private','tool_editorial_content','reviewed_by_user_id']
 ] loop
  if to_regclass(format('%I.%I',item[1],item[2])) is null then continue; end if;
  execute format('grant usage on schema %I to service_role',item[1]);
  execute format('grant select(%I) on %I.%I to service_role',item[3],item[1],item[2]);
 end loop;
end $$;
