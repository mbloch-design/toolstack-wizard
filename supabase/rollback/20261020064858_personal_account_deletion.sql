-- Disable accounts HTTP first. Preserve deleting barriers, snapshots, history and FKs.
revoke execute on function public.personal_account_has_contributions(uuid,uuid) from service_role,public,anon,authenticated;
