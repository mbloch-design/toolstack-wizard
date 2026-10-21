-- Disable the API without deleting saved names, identities, or stacks.
-- Keep the functions to allow a reversible deployment; migration reapplication
-- must be coordinated if changing signatures. Service role also loses execution.
revoke execute on function public.read_personal_profile(uuid,uuid),public.update_personal_profile(uuid,uuid,text) from public,anon,authenticated,service_role;
