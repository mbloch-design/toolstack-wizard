begin;

create table catalog_contrib.cms_release_batches (
  batch_key text primary key check (batch_key ~ '^[a-f0-9]{64}$'),
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object' and octet_length(manifest::text) <= 131072),
  prepared_by uuid references auth.users(id) on delete set null,
  prepared_at timestamptz not null default clock_timestamp(),
  leased_until timestamptz not null default clock_timestamp() + interval '3 minutes',
  commit_sha text check (commit_sha ~ '^[a-f0-9]{40}$'),
  committed_at timestamptz,
  verified_at timestamptz,
  cancelled_at timestamptz
);
create unique index cms_single_outstanding_release on catalog_contrib.cms_release_batches ((true))
  where cancelled_at is null and verified_at is null;
alter table catalog_contrib.cms_release_batches enable row level security;
grant update (delivery_status) on catalog_contrib.listing_requests to service_role;
grant update (status) on catalog_private.initial_listing_approvals to service_role;
revoke all on catalog_contrib.cms_release_batches from public, anon, authenticated;
grant select, insert on catalog_contrib.cms_release_batches to service_role;
grant update (commit_sha, committed_at, verified_at, cancelled_at, leased_until)
  on catalog_contrib.cms_release_batches to service_role;

create function public.cms_get_release_batch(p_actor uuid, p_session uuid, p_key text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return (select to_jsonb(b) - 'prepared_by' from catalog_contrib.cms_release_batches b where b.batch_key = p_key);
end $$;

create function public.cms_seal_release_batch(p_actor uuid, p_session uuid, p_key text, p_manifest jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
  eligible jsonb;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  if p_key is null or p_key !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_manifest) is distinct from 'object'
    or jsonb_typeof(p_manifest->'items') is distinct from 'array'
    or jsonb_typeof(p_manifest->'legacyItems') is distinct from 'array'
    or coalesce(p_manifest->>'sourceHead','') !~ '^[a-f0-9]{40}$'
    or coalesce(p_manifest->>'catalogueHash','') !~ '^[a-f0-9]{64}$'
    or octet_length(p_manifest::text) > 131072 then
    raise sqlstate 'PT400' using message = 'INVALID_CMS_RELEASE';
  end if;

  perform pg_advisory_xact_lock(864203174);
  select b.* into batch from catalog_contrib.cms_release_batches b where b.batch_key = p_key for update;
  if found then
    if batch.cancelled_at is not null or batch.manifest is distinct from p_manifest then
      raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED';
    end if;
    if batch.commit_sha is not null then return to_jsonb(batch) - 'prepared_by'; end if;
    if batch.leased_until > clock_timestamp() then
      raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS';
    end if;
  elsif exists (select from catalog_contrib.cms_release_batches b where b.cancelled_at is null and b.verified_at is null) then
    raise sqlstate 'PT409' using message = 'CMS_RELEASE_VERIFICATION_PENDING';
  end if;

  -- Lock the exact approvals and verification records before validating the sealed set.
  perform 1 from catalog_contrib.cms_tool_submissions s
    where exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'approvalId' = s.id::text)
    order by s.id for share;
  perform 1 from catalog_private.initial_listing_approvals a
    where exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'approvalId' = a.id::text)
    order by a.id for share;
  perform 1 from catalog_contrib.brand_tool_assignments a
    join catalog_contrib.brands b on b.id = a.brand_id
    where a.status = 'verified' and a.is_primary
      and exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'toolId' = a.tool_id)
    order by a.tool_id for share of a, b;
  eligible := public.cms_approved_release_inputs(p_actor, p_session) || public.cms_initial_release_inputs(p_actor, p_session);
  if exists (
    select from jsonb_array_elements(p_manifest->'items') i
    where not exists (
      select from jsonb_array_elements(eligible) e
      where e->'attached' = 'true'::jsonb and e->>'approvalId' = i->>'approvalId'
        and e->>'toolId' = i->>'toolId' and e->>'version' = i->>'version'
    )
  ) then raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED'; end if;

  insert into catalog_contrib.cms_release_batches(batch_key,manifest,prepared_by)
    values (p_key,p_manifest,p_actor)
    on conflict (batch_key) do update set leased_until = clock_timestamp() + interval '3 minutes'
    returning * into batch;
  return to_jsonb(batch) - 'prepared_by';
end $$;

create function public.cms_record_release_commit(p_actor uuid, p_session uuid, p_key text, p_commit text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  if p_commit is null or p_commit !~ '^[a-f0-9]{40}$' then
    raise sqlstate 'PT400' using message = 'INVALID_CMS_RELEASE';
  end if;
  select b.* into batch from catalog_contrib.cms_release_batches b where b.batch_key = p_key for update;
  if not found or batch.cancelled_at is not null or (batch.commit_sha is not null and batch.commit_sha <> p_commit) then
    raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED';
  end if;
  if batch.commit_sha is not null then return to_jsonb(batch) - 'prepared_by'; end if;

  update catalog_contrib.cms_tool_drafts d set base_hash = i->>'hash'
    from jsonb_array_elements(batch.manifest->'items') i
    join catalog_contrib.cms_tool_submissions s on s.id::text = i->>'approvalId'
    where d.brand_id = s.brand_id and d.tool_id = s.tool_id
      and s.version = (i->>'version')::bigint and s.status = 'approved';

  update catalog_contrib.cms_tool_submissions s set status = 'applied'
    from jsonb_array_elements(batch.manifest->'items') i
    where s.id::text = i->>'approvalId' and s.version = (i->>'version')::bigint
      and s.status = 'approved';

  update catalog_contrib.cms_tool_drafts d set base_hash = i->>'hash'
    from jsonb_array_elements(batch.manifest->'items') i
    join catalog_private.initial_listing_approvals a on a.id::text = i->>'approvalId'
    where d.brand_id = a.brand_id and d.tool_id = a.tool_id
      and a.version = (i->>'version')::bigint and a.status = 'approved';

  update catalog_contrib.listing_requests r set delivery_status = 'publishing'
    from jsonb_array_elements(batch.manifest->'items') i
    where r.initial_approval_id::text = i->>'approvalId' and r.delivery_status = 'unpublished';

  update catalog_private.initial_listing_approvals a set status = 'delivered'
    from jsonb_array_elements(batch.manifest->'items') i
    where a.id::text = i->>'approvalId' and a.version = (i->>'version')::bigint and a.status = 'approved';

  update catalog_contrib.cms_release_batches b set commit_sha = p_commit, committed_at = clock_timestamp()
    where b.batch_key = p_key returning b.* into batch;
  return to_jsonb(batch) - 'prepared_by';
end $$;

create function public.cms_record_verified_release(p_actor uuid, p_session uuid, p_key text, p_commit text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  update catalog_contrib.cms_release_batches b set verified_at = coalesce(b.verified_at, clock_timestamp())
    where b.batch_key = p_key and b.commit_sha = p_commit and b.cancelled_at is null returning b.* into batch;
  if not found then raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED'; end if;
  update catalog_contrib.listing_requests r set delivery_status = 'published'
    from jsonb_array_elements(batch.manifest->'items') i
    where r.initial_approval_id::text = i->>'approvalId' and r.delivery_status = 'publishing';
  return to_jsonb(batch) - 'prepared_by';
end $$;

-- Cancel a prepared batch only after the server confirms the Git head is
-- still the source revision and the dispatch lease has expired.
create function public.cms_cancel_release_batch(p_actor uuid, p_session uuid, p_key text, p_source text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  perform pg_advisory_xact_lock(864203174);
  update catalog_contrib.cms_release_batches b set cancelled_at = coalesce(b.cancelled_at, clock_timestamp())
    where b.batch_key = p_key and b.commit_sha is null and b.leased_until <= clock_timestamp()
      and b.manifest->>'sourceHead' = p_source returning b.* into batch;
  if not found then raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS'; end if;
  return to_jsonb(batch) - 'prepared_by';
end $$;

create function catalog_contrib.cms_guard_sealed_release()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare matches_lease boolean;
begin
  if tg_table_name in ('cms_tool_submissions', 'initial_listing_approvals') then
    if new.status in ('applied','delivered') then return new; end if;
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements(b.manifest->'items') i
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and i->>'approvalId' = old.id::text
    ) into matches_lease;
  elsif tg_table_name = 'brand_tool_assignments' then
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements(b.manifest->'items') i
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and i->>'toolId' = old.tool_id
    ) into matches_lease;
  else
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements(b.manifest->'items') i
      join catalog_contrib.brand_tool_assignments a on a.tool_id = i->>'toolId' and a.is_primary
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and a.brand_id = old.id
    ) into matches_lease;
  end if;
  if matches_lease then raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger cms_guard_tool_approval before update of status on catalog_contrib.cms_tool_submissions
  for each row when (old.status = 'approved' and new.status is distinct from old.status)
  execute function catalog_contrib.cms_guard_sealed_release();
create trigger cms_guard_initial_approval before update of status on catalog_private.initial_listing_approvals
  for each row when (old.status = 'approved' and new.status is distinct from old.status)
  execute function catalog_contrib.cms_guard_sealed_release();
create trigger cms_guard_active_assignment before update of status, is_primary or delete on catalog_contrib.brand_tool_assignments
  for each row when (old.status = 'verified' and old.is_primary)
  execute function catalog_contrib.cms_guard_sealed_release();
create trigger cms_guard_active_brand before update of status or delete on catalog_contrib.brands
  for each row when (old.status = 'verified')
  execute function catalog_contrib.cms_guard_sealed_release();

create function public.cms_list_release_batches(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return (
    select coalesce(jsonb_agg(to_jsonb(b) - 'prepared_by' - 'manifest' order by b.prepared_at desc), '[]'::jsonb)
    from (select * from catalog_contrib.cms_release_batches order by prepared_at desc limit 20) b
  );
end $$;

revoke all on function public.cms_get_release_batch(uuid,uuid,text),
  public.cms_seal_release_batch(uuid,uuid,text,jsonb), public.cms_record_release_commit(uuid,uuid,text,text),
  public.cms_record_verified_release(uuid,uuid,text,text), public.cms_list_release_batches(uuid,uuid),
  public.cms_cancel_release_batch(uuid,uuid,text,text), catalog_contrib.cms_guard_sealed_release() from public, anon, authenticated;
grant execute on function public.cms_get_release_batch(uuid,uuid,text),
  public.cms_seal_release_batch(uuid,uuid,text,jsonb), public.cms_record_release_commit(uuid,uuid,text,text),
  public.cms_record_verified_release(uuid,uuid,text,text), public.cms_list_release_batches(uuid,uuid),
  public.cms_cancel_release_batch(uuid,uuid,text,text), catalog_contrib.cms_guard_sealed_release() to service_role;

commit;
