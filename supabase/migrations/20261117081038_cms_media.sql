begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('catalog-drafts', 'catalog-drafts', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']);

create table catalog_private.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('listing', 'tool')),
  target_id text not null,
  brand_id uuid,
  uploader_id uuid references auth.users(id) on delete set null,
  session_id uuid not null,
  role text not null check (role in ('logo', 'cover', 'gallery')),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  expected_bytes int not null check (expected_bytes between 1 and 5242880),
  idempotency_key text not null,
  replaced_asset_id text,
  original_path text generated always as ('originals/' || id::text) stored unique,
  state text not null default 'reserved' check (state in ('reserved', 'ready', 'rejected')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '15 minutes'),
  processing_token uuid,
  processing_started_at timestamptz,
  derived_sha text check (derived_sha ~ '^[a-f0-9]{64}$'),
  derivative_path text generated always as ('derived/' || id::text || '/' || derived_sha || '.webp') stored,
  original_bytes int check (original_bytes between 1 and 5242880),
  derivative_bytes int check (derivative_bytes between 1 and 2097152),
  width int check (width between 1 and 1920),
  height int check (height between 1 and 1920),
  attached_at timestamptz,
  check ((target_kind = 'tool') = (brand_id is not null)),
  unique (uploader_id, idempotency_key)
);
create index cms_media_assets_target_idx on catalog_private.cms_media_assets(target_kind, target_id, brand_id, role);
alter table catalog_private.cms_media_assets enable row level security;
revoke all on catalog_private.cms_media_assets from public, anon, authenticated;
grant usage on schema catalog_private, storage to service_role;
grant select (bucket_id, name) on storage.objects to service_role;
grant select, insert, update, delete on catalog_private.cms_media_assets to service_role;

create function catalog_private.cms_media_require_target(p_actor uuid, p_session uuid, p_kind text, p_target text, p_write boolean)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare selected_brand uuid;
begin
  if p_kind = 'listing' and p_target ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then
    perform catalog_contrib.cms_require_listing_account(p_actor, p_session);
    perform 1 from catalog_contrib.listing_requests l
      where l.id = p_target::uuid and l.owner_id = p_actor and l.status <> 'archived'
        and l.representation_status <> 'revoked' and l.canonical_tool_id is null
        and (not p_write or (l.status = 'draft' and l.reservation_expires_at > clock_timestamp()))
      for share;
    if not found then raise sqlstate 'PT403'; end if;
    return null;
  end if;
  if p_kind = 'tool' and p_target is not null and length(p_target) between 1 and 200 then
    select a.brand_id into strict selected_brand
      from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_target, p_write) a;
    perform 1 from catalog_contrib.cms_tool_drafts d where d.brand_id = selected_brand and d.tool_id = p_target;
    if not found then raise sqlstate 'PT404'; end if;
    return selected_brand;
  end if;
  raise sqlstate 'PT400';
end;
$$;

-- Storage calls this predicate on the exact original reservation path. It has
-- no table read endpoint and derives both identity and session from the JWT.
create function catalog_private.cms_can_upload_reserved_object(p_path text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  asset catalog_private.cms_media_assets%rowtype;
  actor uuid := auth.uid();
  jwt_session text := auth.jwt()->>'session_id';
begin
  if actor is null or jwt_session is null or length(p_path) <> 46 then return false; end if;
  select * into asset from catalog_private.cms_media_assets a
    where a.original_path = p_path and a.state = 'reserved' and a.expires_at > clock_timestamp()
      and a.uploader_id = actor and a.session_id::text = jwt_session;
  if not found then return false; end if;
  return catalog_private.cms_media_require_target(actor, asset.session_id, asset.target_kind, asset.target_id, true)
    is not distinct from asset.brand_id;
exception when sqlstate 'PT401' or sqlstate 'PT403' or sqlstate 'PT404' or sqlstate 'PT409' then return false;
end;
$$;

create policy cms_media_insert on storage.objects for insert to authenticated with check (bucket_id = 'catalog-drafts');
create policy cms_media_restrict_insert on storage.objects as restrictive for insert to authenticated with check (
  bucket_id <> 'catalog-public' and (bucket_id <> 'catalog-drafts' or catalog_private.cms_can_upload_reserved_object(name))
);
create policy cms_media_no_anonymous_write on storage.objects as restrictive for all to anon
  using (bucket_id <> 'catalog-drafts') with check (bucket_id not in ('catalog-drafts', 'catalog-public'));
create policy cms_media_no_private_read on storage.objects as restrictive for select to authenticated using (bucket_id <> 'catalog-drafts');
create policy cms_media_no_update on storage.objects as restrictive for update to authenticated
  using (bucket_id not in ('catalog-drafts', 'catalog-public')) with check (bucket_id not in ('catalog-drafts', 'catalog-public'));
create policy cms_media_no_delete on storage.objects as restrictive for delete to authenticated
  using (bucket_id not in ('catalog-drafts', 'catalog-public'));
create policy cms_media_no_anonymous_delete on storage.objects as restrictive for delete to anon
  using (bucket_id not in ('catalog-drafts', 'catalog-public'));

create function catalog_private.cms_media_dto(p catalog_private.cms_media_assets)
returns jsonb language sql security invoker set search_path = '' as $$
  select jsonb_build_object('assetId', p.id, 'state', p.state, 'path', p.original_path, 'role', p.role,
    'mimeType', p.mime_type, 'bytes', p.expected_bytes, 'expiresAt', p.expires_at,
    'processingToken', p.processing_token, 'derivativePath', p.derivative_path,
    'uploadRequired', not exists (select 1 from storage.objects o where o.bucket_id = 'catalog-drafts' and o.name = p.original_path));
$$;

create function public.cms_media(p_actor uuid, p_session uuid, p_action text, p_value jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  asset catalog_private.cms_media_assets%rowtype;
  media_role text := p_value->>'role';
  kind text := p_value#>>'{target,kind}';
  target text := p_value#>>'{target,id}';
  selected_brand uuid;
  previous_media jsonb := '[]'::jsonb;
  replace_id text := p_value->>'replaceAssetId';
  declared_bytes int;
  occupied integer;
  group_bytes bigint;
  total_bytes bigint;
begin
  if p_action = 'reserve' then
    if media_role is null or media_role not in ('logo', 'cover', 'gallery')
      or not coalesce((p_value->>'mimeType') in ('image/png', 'image/jpeg', 'image/webp'), false)
      or not coalesce((p_value->>'bytes') ~ '^[0-9]{1,7}$', false)
      or not coalesce((p_value->>'idempotencyKey') ~ '^[A-Za-z0-9_-]{8,128}$', false)
      or (replace_id is not null and length(replace_id) not between 1 and 160) then raise sqlstate 'PT400'; end if;
    declared_bytes := (p_value->>'bytes')::int;
    if declared_bytes not between 1 and 5242880 then raise sqlstate 'PT400'; end if;
    selected_brand := catalog_private.cms_media_require_target(p_actor, p_session, kind, target, true);

    -- Account conservatively for the full bucket-level size limit of each raw
    -- object and each possible derivative until actual finalized sizes exist.
    perform pg_advisory_xact_lock(4497522783930411205);
    select * into asset from catalog_private.cms_media_assets a
      where a.uploader_id = p_actor and a.idempotency_key = p_value->>'idempotencyKey';
    if found then
      if asset.target_kind is distinct from kind or asset.target_id is distinct from target
        or asset.brand_id is distinct from selected_brand or asset.role is distinct from media_role
        or asset.expected_bytes is distinct from declared_bytes or asset.session_id is distinct from p_session
        or asset.mime_type is distinct from (p_value->>'mimeType') or asset.replaced_asset_id is distinct from replace_id then
        raise sqlstate 'PT409';
      end if;
      if asset.state = 'rejected' or (asset.state = 'reserved' and asset.expires_at <= clock_timestamp()) then raise sqlstate 'PT409'; end if;
      return catalog_private.cms_media_dto(asset);
    end if;

    if kind = 'tool' then
      select coalesce(d.value->'media', '[]'::jsonb) into previous_media from catalog_contrib.cms_tool_drafts d
        where d.brand_id = selected_brand and d.tool_id = target;
    end if;
    if replace_id is not null and not exists (select 1 from jsonb_array_elements(previous_media) m
        where m->>'assetId' = replace_id and m->>'role' = media_role) then raise sqlstate 'PT409'; end if;
    select count(*) into occupied from jsonb_array_elements(previous_media) m
      where m->>'role' = media_role and (m->>'assetId') is distinct from replace_id;
    occupied := occupied + (select count(*) from catalog_private.cms_media_assets a
      where a.target_kind = kind and a.target_id = target and a.brand_id is not distinct from selected_brand and a.role = media_role
        and ((a.state = 'reserved' and a.expires_at > clock_timestamp()) or
          (a.state = 'ready' and (kind = 'listing' or (a.attached_at is null and a.created_at > clock_timestamp() - interval '24 hours')))));
    if occupied >= (case when media_role = 'gallery' then 12 else 1 end) then raise sqlstate 'PT409'; end if;

    select coalesce(sum(coalesce(a.original_bytes, 5242880) + coalesce(a.derivative_bytes, 2097152)), 0),
      coalesce(sum(coalesce(a.original_bytes, 5242880) + coalesce(a.derivative_bytes, 2097152)) filter (
        where (selected_brand is not null and a.brand_id = selected_brand) or
          (selected_brand is null and a.target_kind = 'listing' and a.uploader_id = p_actor)
      ), 0) into total_bytes, group_bytes from catalog_private.cms_media_assets a;
    if group_bytes + 7340032 > 104857600 or total_bytes + 7340032 > 805306368 then raise sqlstate 'PT429'; end if;

    insert into catalog_private.cms_media_assets(target_kind, target_id, brand_id, uploader_id, session_id, role,
        mime_type, expected_bytes, idempotency_key, replaced_asset_id)
      values (kind, target, selected_brand, p_actor, p_session, media_role, p_value->>'mimeType', declared_bytes,
        p_value->>'idempotencyKey', replace_id) returning * into asset;
    return catalog_private.cms_media_dto(asset);
  end if;

  if not coalesce((p_value->>'assetId') ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$', false) then raise sqlstate 'PT400'; end if;
  select * into asset from catalog_private.cms_media_assets a where a.id = (p_value->>'assetId')::uuid;
  if not found then raise sqlstate 'PT404'; end if;
  selected_brand := catalog_private.cms_media_require_target(p_actor, p_session, asset.target_kind, asset.target_id, p_action <> 'preview');
  if selected_brand is distinct from asset.brand_id then raise sqlstate 'PT403'; end if;
  if p_action = 'preview' then
    if asset.state <> 'ready' then raise sqlstate 'PT409'; end if;
    return catalog_private.cms_media_dto(asset);
  end if;

  select * into strict asset from catalog_private.cms_media_assets a where a.id = asset.id for update;
  if asset.state = 'ready' and p_action = 'beginFinalize' then return catalog_private.cms_media_dto(asset); end if;
  if asset.uploader_id is distinct from p_actor or asset.state <> 'reserved' then raise sqlstate 'PT403'; end if;
  if p_action = 'beginFinalize' then
    if asset.expires_at <= clock_timestamp() or asset.processing_started_at > clock_timestamp() - interval '1 minute' then
      raise sqlstate 'PT409';
    end if;
    update catalog_private.cms_media_assets a set processing_token = gen_random_uuid(), processing_started_at = clock_timestamp()
      where a.id = asset.id returning * into asset;
    return catalog_private.cms_media_dto(asset);
  end if;

  if asset.processing_token is null or asset.processing_token::text is distinct from (p_value->>'processingToken') then raise sqlstate 'PT409'; end if;
  if p_action = 'finish' then
    if not coalesce((p_value->>'sha256') ~ '^[a-f0-9]{64}$', false) or
      asset.expected_bytes is distinct from (p_value->>'originalBytes')::int then raise sqlstate 'PT400'; end if;
    update catalog_private.cms_media_assets a set state = 'ready', processing_token = null, processing_started_at = null,
      derived_sha = p_value->>'sha256', original_bytes = (p_value->>'originalBytes')::int,
      derivative_bytes = (p_value->>'derivativeBytes')::int, width = (p_value->>'width')::int, height = (p_value->>'height')::int
      where a.id = asset.id returning * into asset;
  elsif p_action = 'releaseProcessing' then
    update catalog_private.cms_media_assets a set state = case when p_value->>'invalidImage' = 'true' then 'rejected' else 'reserved' end,
      processing_token = null, processing_started_at = null where a.id = asset.id returning * into asset;
  else raise sqlstate 'PT400'; end if;
  return catalog_private.cms_media_dto(asset);
end;
$$;

-- Existing imported references remain usable. Any newly attached reference
-- must have a validated derivative, the same role and the exact tool and brand.
create function catalog_private.cms_require_draft_media_ownership()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if new.value->'media' is not distinct from old.value->'media' then return new; end if;
  for item in select value from jsonb_array_elements(coalesce(new.value->'media', '[]'::jsonb)) loop
    if exists (select 1 from jsonb_array_elements(coalesce(old.value->'media', '[]'::jsonb)) old_media
        where old_media->>'assetId' = item->>'assetId' and old_media->>'role' = item->>'role') then continue; end if;
    update catalog_private.cms_media_assets a set attached_at = coalesce(a.attached_at, clock_timestamp())
      where a.id::text = item->>'assetId' and a.role = item->>'role' and a.state = 'ready'
        and a.target_kind = 'tool' and a.target_id = new.tool_id and a.brand_id = new.brand_id;
    if not found then raise sqlstate 'PT403' using message = 'CMS_INVALID_MEDIA_REFERENCE'; end if;
  end loop;
  return new;
end;
$$;
create trigger cms_tool_draft_media_ownership before update of value on catalog_contrib.cms_tool_drafts
  for each row execute function catalog_private.cms_require_draft_media_ownership();

revoke all on function catalog_private.cms_media_require_target(uuid,uuid,text,text,boolean),
  catalog_private.cms_can_upload_reserved_object(text), catalog_private.cms_media_dto(catalog_private.cms_media_assets),
  catalog_private.cms_require_draft_media_ownership(), public.cms_media(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function catalog_private.cms_can_upload_reserved_object(text) to authenticated;
grant execute on function public.cms_media(uuid,uuid,text,jsonb),
  catalog_private.cms_media_require_target(uuid,uuid,text,text,boolean),
  catalog_private.cms_media_dto(catalog_private.cms_media_assets),
  catalog_private.cms_require_draft_media_ownership() to service_role;

commit;
