-- Reversible shutdown: retain columns and all profile/Auth/stack values.
revoke execute on function public.import_personal_oauth_profile(uuid,uuid,text,text,text,text),
 public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text)
 from public,anon,authenticated,service_role;
