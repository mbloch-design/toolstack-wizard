begin;

create table catalog_contrib.cms_release_batches (
  batch_key text primary key check (batch_key ~ '^[a-f0-9]{64}$'),
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object' and octet_length(manifest::text) <= 131072),
  prepared_by uuid references auth.users(id) on delete set null,
  prepared_at timestamptz not null default clock_timestamp(),
  commit_sha text check (commit_sha ~ '^[a-f0-9]{40}$'),
  committed_at timestamptz,
  verified_at timestamptz,
  cancelled_at timestamptz
);
alter table catalog_contrib.cms_release_batches enable row level security;
grant update (delivery_status) on catalog_contrib.listing_requests to service_role;
grant update (status) on catalog_private.initial_listing_approvals to service_role;
revoke all on catalog_contrib.cms_release_batches from public, anon, authenticated;
grant select, insert on catalog_contrib.cms_release_batches to service_role;
grant update (commit_sha, committed_at, verified_at, cancelled_at)
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

  insert into catalog_contrib.cms_release_batches(batch_key,manifest,prepared_by)
    values (p_key,p_manifest,p_actor) on conflict (batch_key) do nothing;
  select b.* into batch from catalog_contrib.cms_release_batches b where b.batch_key = p_key;
  if batch.cancelled_at is not null or batch.manifest is distinct from p_manifest then
    raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED';
  end if;
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

revoke all on function public.cms_get_release_batch(uuid,uuid,text),
  public.cms_seal_release_batch(uuid,uuid,text,jsonb), public.cms_record_release_commit(uuid,uuid,text,text),
  public.cms_record_verified_release(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.cms_get_release_batch(uuid,uuid,text),
  public.cms_seal_release_batch(uuid,uuid,text,jsonb), public.cms_record_release_commit(uuid,uuid,text,text),
  public.cms_record_verified_release(uuid,uuid,text,text) to service_role;

commit;
