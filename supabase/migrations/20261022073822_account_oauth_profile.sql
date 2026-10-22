-- Retain cosmetic OAuth data once. No Auth metadata, tokens, rights or stack change.
-- Add with false first so existing rows never silently refill an intentional null.
alter table public.profiles add column oauth_profile_source text check (oauth_profile_source in ('google','github')),
 add column provider_locale text,
 add column display_name_auto_fill_allowed boolean not null default false;
alter table public.profiles alter column display_name_auto_fill_allowed set default true;
-- Private account profile settings. Reuse profiles; never alter Auth/stack data.
create or replace function public.read_personal_profile(p_owner uuid, p_session uuid) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$
declare result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
  raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 select jsonb_build_object('userId',p.id,'displayName',p.display_name,'avatarUrl',p.avatar_url,'providerLocale',p.provider_locale,'oauthProfileSource',p.oauth_profile_source,'createdAt',u.created_at,'updatedAt',p.updated_at)
 into result from public.profiles p join auth.users u on u.id=p.id where p.id=p_owner;
 return result;
end $$;

create or replace function public.update_personal_profile(p_owner uuid, p_session uuid, p_display_name text) returns jsonb
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
 update public.profiles set display_name=name,display_name_auto_fill_allowed=false,updated_at=clock_timestamp() where id=p_owner;
 return public.read_personal_profile(p_owner,p_session);
end $$;
revoke execute on function public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text) to service_role;

create function public.import_personal_oauth_profile(p_owner uuid,p_session uuid,p_provider text,p_display_name text,p_avatar_url text,p_provider_locale text) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$
declare name text; avatar text; provider_language text;
 trim_chars constant text := E' \t\n\r\f\013' || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,478321));
 perform public.require_account_session(p_owner,p_session);
 if exists(select from public.profiles where id=p_owner and account_status='deleting') then
  raise sqlstate 'PT409' using message='ACCOUNT_DELETING'; end if;
 if p_provider is null or p_provider not in ('google','github') then
  raise sqlstate 'PT400' using message='INVALID_ACCOUNT_PROFILE'; end if;
 -- Invalid provider fields are omitted; they never block an otherwise valid account.
 name:=nullif(btrim(p_display_name,trim_chars),'');
 if char_length(name)>80 or name ~ U&'[\0001-\001F\007F-\009F]' then name:=null; end if;
 provider_language:=replace(p_provider_locale,'_','-');
 if char_length(provider_language)>35 or provider_language !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then provider_language:=null; end if;
 if char_length(p_avatar_url)<=2048 and p_avatar_url !~ U&'[\0001-\0020\007F-\009F]' and p_avatar_url !~ '[\\#]'
 and ((p_provider='google' and p_avatar_url ~* '^https://lh[0-9]+[.]googleusercontent[.]com(:443)?(/[^?#]*)?([?](s|sz|v)=[0-9]+(&(s|sz|v)=[0-9]+)*)?$')
   or (p_provider='github' and p_avatar_url ~* '^https://avatars[.]githubusercontent[.]com(:443)?(/[^?#]*)?([?](s|sz|v)=[0-9]+(&(s|sz|v)=[0-9]+)*)?$')) then avatar:=p_avatar_url; end if;
 update public.profiles set
  display_name=case when display_name_auto_fill_allowed then coalesce(display_name,name) else display_name end,
  avatar_url=coalesce(avatar_url,avatar),provider_locale=coalesce(provider_locale,provider_language),
  oauth_profile_source=p_provider,updated_at=clock_timestamp()
 where id=p_owner and oauth_profile_source is null;
 return public.read_personal_profile(p_owner,p_session);
end $$;
revoke execute on function public.import_personal_oauth_profile(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.import_personal_oauth_profile(uuid,uuid,text,text,text,text) to service_role;
