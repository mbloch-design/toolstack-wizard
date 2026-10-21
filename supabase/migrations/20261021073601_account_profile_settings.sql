-- Private account profile settings. Reuse profiles; never alter Auth/stack data.
create function public.read_personal_profile(p_owner uuid, p_session uuid) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
  raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 select jsonb_build_object('userId',p.id,'displayName',p.display_name,'createdAt',u.created_at,'updatedAt',p.updated_at)
 into result from public.profiles p join auth.users u on u.id=p.id where p.id=p_owner;
 return result;
end $$;

create function public.update_personal_profile(p_owner uuid, p_session uuid, p_display_name text) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$
declare name text;
 trim_chars constant text := E' \t\n\r\f\013' || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
  raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 -- Same Unicode control range as JS \p{Cc}; PostgreSQL text cannot contain NUL.
 if p_display_name ~ U&'[\0001-\001F\007F-\009F]' then
  raise sqlstate 'PT400' using message='INVALID_ACCOUNT_PROFILE'; end if;
 name := nullif(btrim(p_display_name,trim_chars),'');
 if char_length(name)>80 then raise sqlstate 'PT400' using message='INVALID_ACCOUNT_PROFILE'; end if;
 update public.profiles set display_name=name,updated_at=clock_timestamp() where id=p_owner;
 return public.read_personal_profile(p_owner,p_session);
end $$;
revoke execute on function public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text) to service_role;
