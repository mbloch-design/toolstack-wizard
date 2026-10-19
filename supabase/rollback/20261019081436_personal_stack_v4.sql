-- Configuration-only rollback / emergency disablement.
-- Back up profiles + stack_snapshots before any eventual application.
-- Disable the accounts HTTP feature first. Run as the migration owner.
-- Retain all v3/v4 snapshots, profiles, deletion barriers and owner RLS policies.
-- Deliberately do not restore direct browser grants: old clients cannot safely
-- write v4 snapshots or bypass the deletion/session/revision protections.
revoke execute on function public._personal_stack_strings(jsonb),public._personal_stack_valid(jsonb),
 public.require_account_session(uuid,uuid),public.read_personal_stack(uuid,uuid),
 public.save_personal_stack(uuid,uuid,bigint,jsonb),public.begin_personal_account_deletion(uuid,uuid),
 public.accounts_dashboard(uuid,uuid,jsonb) from service_role,public,anon,authenticated;
-- Re-enable only after review by granting these RPCs to service_role again.
