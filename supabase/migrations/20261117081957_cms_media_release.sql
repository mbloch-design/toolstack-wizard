begin;

alter table catalog_private.cms_media_assets add column source_listing_id uuid;

-- Move only the media frozen in the initial approval into the verified tool's
-- workspace. Its private object paths and approval references remain stable.
create function catalog_private.cms_transfer_initial_listing_media()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  approval catalog_private.initial_listing_approvals%rowtype;
  item jsonb;
begin
  select * into strict approval from catalog_private.initial_listing_approvals a
    where a.id = new.initial_approval_id and a.listing_id = new.id and a.tool_id = new.canonical_tool_id;
  for item in select value from jsonb_array_elements(coalesce(approval.value->'media', '[]'::jsonb)) loop
    update catalog_private.cms_media_assets a
      set source_listing_id = new.id, target_kind = 'tool', target_id = approval.tool_id,
        brand_id = approval.brand_id, attached_at = clock_timestamp()
      where a.id::text = item->>'assetId' and a.role = item->>'role' and a.state = 'ready'
        and a.target_kind = 'listing' and a.target_id = new.id::text and a.uploader_id = new.owner_id;
    if not found then raise sqlstate 'PT403' using message = 'CMS_INVALID_MEDIA_REFERENCE'; end if;
  end loop;
  return new;
end;
$$;
create trigger cms_transfer_listing_media after update of canonical_tool_id on catalog_contrib.listing_requests
  for each row when (old.canonical_tool_id is null and new.canonical_tool_id is not null and new.initial_approval_id is not null)
  execute function catalog_private.cms_transfer_initial_listing_media();

create function public.cms_approved_media_inputs(p_actor uuid, p_session uuid, p_approval_ids uuid[])
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare approved jsonb;
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  if p_approval_ids is null or cardinality(p_approval_ids) > 200 then raise sqlstate 'PT400'; end if;
  if cardinality(p_approval_ids) = 0 then return '[]'::jsonb; end if;
  approved := public.cms_approved_release_inputs(p_actor, p_session) || public.cms_initial_release_inputs(p_actor, p_session);
  if (select count(*) from jsonb_array_elements(approved) r
        where (r->>'approvalId')::uuid = any(p_approval_ids) and r->'attached' = 'true'::jsonb) <> cardinality(p_approval_ids) then
    raise sqlstate 'PT409' using message = 'CMS_MEDIA_APPROVAL_CHANGED';
  end if;

  return (
    with requested as (
      select r, coalesce(s.brand_id, i.brand_id) as brand_id
      from jsonb_array_elements(approved) r
      left join catalog_contrib.cms_tool_submissions s on s.id::text = r->>'approvalId'
      left join catalog_private.initial_listing_approvals i on i.id::text = r->>'approvalId'
      where (r->>'approvalId')::uuid = any(p_approval_ids)
    )
    select coalesce(jsonb_agg(jsonb_build_object('assetId', a.id, 'approvalId', r->>'approvalId',
      'toolId', r->>'toolId', 'role', a.role, 'sha256', a.derived_sha, 'derivativeBytes', a.derivative_bytes,
      'width', a.width, 'height', a.height) order by r->>'approvalId', m.ordinality), '[]'::jsonb)
    from requested cross join lateral jsonb_array_elements(coalesce(r#>'{value,media}', '[]'::jsonb)) with ordinality m
    join catalog_private.cms_media_assets a on a.id::text = m.value->>'assetId'
      and a.role = m.value->>'role' and a.target_kind = 'tool' and a.state = 'ready'
    where a.brand_id = requested.brand_id and a.target_id = r->>'toolId'
  );
end;
$$;

create function public.cms_review_submission_media(p_actor uuid, p_session uuid, p_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return (
    select coalesce(jsonb_agg(jsonb_build_object('assetId', a.id, 'path', a.derivative_path)),'[]'::jsonb)
    from catalog_contrib.cms_tool_submissions s
    cross join lateral jsonb_array_elements(coalesce(s.value->'media','[]'::jsonb)) item
    join catalog_private.cms_media_assets a
      on a.id::text = item->>'assetId' and a.role = item->>'role' and a.state = 'ready'
    where s.id = p_id and a.brand_id = s.brand_id and a.target_kind = 'tool' and a.target_id = s.tool_id
  );
end $$;

alter table catalog_private.cms_media_assets drop constraint cms_media_assets_state_check;
alter table catalog_private.cms_media_assets add constraint cms_media_assets_state_check
  check (state in ('reserved', 'ready', 'rejected', 'deleting'));

create function catalog_private.cms_media_can_clean(p catalog_private.cms_media_assets)
returns boolean language sql stable security invoker set search_path = '' as $$
  select p.state = 'deleting' or (
    p.attached_at is null and (
      (p.state in ('reserved', 'rejected') and p.expires_at < now() - interval '24 hours'
        and not exists (select 1 from storage.objects o where o.bucket_id = 'catalog-drafts' and o.name = p.original_path))
      or p.created_at < now() - interval '30 days'
    ) and not exists (
      select 1 from (
        select value from catalog_contrib.cms_tool_drafts
        union all select value from catalog_contrib.cms_tool_submissions
        union all select value from catalog_contrib.listing_product_versions
        union all select value from catalog_private.initial_listing_approvals
      ) history
      where history.value @> jsonb_build_object('media', jsonb_build_array(jsonb_build_object('assetId', p.id::text)))
    )
  );
$$;

create function public.cms_cleanup_media(p_action text, p_asset_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare asset catalog_private.cms_media_assets%rowtype;
  paths jsonb;
begin
  if p_action = 'list' then
    return coalesce((select jsonb_agg(id) from (
      select a.id from catalog_private.cms_media_assets a where catalog_private.cms_media_can_clean(a)
      order by a.created_at, a.id limit 25
    ) batch), '[]'::jsonb);
  end if;
  if p_action not in ('claim', 'finish') or p_asset_id is null then raise sqlstate 'PT400'; end if;
  select * into asset from catalog_private.cms_media_assets a where a.id = p_asset_id for update;
  if not found then return null; end if;
  select coalesce(jsonb_agg(o.name order by o.name), '[]'::jsonb) into paths from storage.objects o
    where o.bucket_id = 'catalog-drafts' and (o.name = asset.original_path
      or (left(o.name, 45) = 'derived/' || asset.id::text || '/' and o.name ~ '/[a-f0-9]{64}\.webp$'));
  if p_action = 'claim' then
    if not catalog_private.cms_media_can_clean(asset) then return null; end if;
    update catalog_private.cms_media_assets set state = 'deleting' where id = asset.id;
    return paths;
  end if;
  if asset.state <> 'deleting' or paths <> '[]'::jsonb then raise sqlstate 'PT409'; end if;
  delete from catalog_private.cms_media_assets where id = asset.id;
  return true;
end;
$$;

-- During explicit account deletion, remove user-owned originals via Storage.
-- The approved WebP derivatives are service-owned and remain available.
grant select (owner,owner_id) on storage.objects to service_role;
create function public.cms_owned_media_originals(p_owner uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  perform public.require_account_session(p_owner,p_session);
  if not exists (select from public.profiles p where p.id = p_owner and p.account_status = 'deleting') then
    raise sqlstate 'PT409' using message = 'ACCOUNT_DELETION_NOT_STARTED';
  end if;
  return (
    select coalesce(jsonb_agg(o.name order by o.name), '[]'::jsonb)
    from (
      select s.name from storage.objects s
      where s.bucket_id = 'catalog-drafts' and s.name ~ '^originals/[a-f0-9-]{36}$'
        and (s.owner_id = p_owner::text or s.owner = p_owner)
      order by s.name limit 100
    ) o
  );
end $$;
revoke all on function public.cms_owned_media_originals(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cms_owned_media_originals(uuid,uuid) to service_role;

revoke all on function catalog_private.cms_transfer_initial_listing_media(),
  catalog_private.cms_media_can_clean(catalog_private.cms_media_assets),
  public.cms_approved_media_inputs(uuid,uuid,uuid[]),
  public.cms_review_submission_media(uuid,uuid,uuid), public.cms_cleanup_media(text,uuid) from public, anon, authenticated;
grant execute on function catalog_private.cms_transfer_initial_listing_media(),
  catalog_private.cms_media_can_clean(catalog_private.cms_media_assets), public.cms_approved_media_inputs(uuid,uuid,uuid[]),
  public.cms_review_submission_media(uuid,uuid,uuid), public.cms_cleanup_media(text,uuid) to service_role;

commit;
