-- Workspace for an existing tool with an approved primary publisher assignment.
-- Rows are provisioned by the account-to-tool attachment flow, outside these RPCs.
begin;

grant select (email_confirmed_at) on auth.users to service_role;

create table catalog_contrib.cms_tool_drafts (
  brand_id uuid not null,
  tool_id varchar not null,
  version bigint not null default 1 check (version between 1 and 9007199254740991),
  base_hash text check (base_hash ~ '^[a-f0-9]{64}$'),
  value jsonb not null check (
    jsonb_typeof(value) = 'object'
    and (value->'schemaVersion' = '1'::jsonb) is true
    and octet_length(value::text) <= 524288
  ),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (brand_id, tool_id),
  foreign key (brand_id, tool_id)
    references catalog_contrib.brand_tool_assignments (brand_id, tool_id) on delete restrict
);
alter table catalog_contrib.cms_tool_drafts enable row level security;
revoke all on catalog_contrib.cms_tool_drafts from public, anon, authenticated;
grant select, insert, update on catalog_contrib.cms_tool_drafts to service_role;

create function catalog_contrib.cms_require_actor(p_actor uuid, p_session uuid)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform public.require_account_session(p_actor, p_session);
  perform from public.profiles p
    where p.id = p_actor and p.account_status = 'active'
    for share;
  if not found then
    raise sqlstate 'PT409' using message = 'ACCOUNT_DELETING';
  end if;

  if not exists (
    select from auth.users u
    where u.id = p_actor and nullif(u.email, '') is not null and u.email_confirmed_at is not null
  ) then
    raise sqlstate 'PT403' using message = 'CMS_ACCESS_DENIED';
  end if;

end $$;

create function catalog_contrib.cms_require_tool_access(
  p_actor uuid, p_session uuid, p_tool text, p_write boolean
) returns table (brand_id uuid, can_edit boolean)
language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_actor(p_actor, p_session);

  -- Share locks serialize draft writes with membership, brand and assignment changes.
  return query
    select a.brand_id, m.role in ('owner', 'admin', 'editor')
    from catalog_contrib.brand_tool_assignments a
    join catalog_contrib.brands b on b.id = a.brand_id
    join catalog_contrib.brand_memberships m on m.brand_id = b.id
    where a.tool_id = p_tool and a.status = 'verified' and a.is_primary
      and b.status = 'verified' and m.user_id = p_actor and m.status = 'active'
      and m.role in ('owner', 'admin', 'editor', 'viewer')
      and (p_write is false or m.role in ('owner', 'admin', 'editor'))
    for share of a, b, m;
  if not found then
    raise sqlstate 'PT403' using message = 'CMS_ACCESS_DENIED';
  end if;
  perform public.require_account_session(p_actor, p_session);
end $$;

create function public.cms_read_tool_draft(p_actor uuid, p_session uuid, p_tool text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  access_record record;
  draft catalog_contrib.cms_tool_drafts%rowtype;
begin
  select * into strict access_record
    from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_tool, false);
  select d.* into draft
    from catalog_contrib.cms_tool_drafts d
    where d.brand_id = access_record.brand_id and d.tool_id = p_tool;
  if not found then
    raise sqlstate 'PT404' using message = 'CMS_WORKSPACE_NOT_FOUND';
  end if;
  return jsonb_build_object('brandId', draft.brand_id, 'value', draft.value, 'version', draft.version,
    'updatedAt', draft.updated_at, 'canEdit', access_record.can_edit);
end $$;

create function public.cms_save_tool_draft(
  p_actor uuid, p_session uuid, p_tool text, p_expected_brand uuid, p_expected_version bigint, p_value jsonb
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  access_record record;
  draft catalog_contrib.cms_tool_drafts%rowtype;
begin
  select * into strict access_record
    from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_tool, true);
  if access_record.brand_id is distinct from p_expected_brand then
    raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT';
  end if;
  if p_expected_version is null or p_expected_version < 1
    or p_expected_version >= 9007199254740991
    or jsonb_typeof(p_value) is distinct from 'object'
    or p_value->'schemaVersion' is distinct from '1'::jsonb
    or octet_length(p_value::text) > 524288 then
    raise sqlstate 'PT400' using message = 'INVALID_PUBLISHER_DRAFT';
  end if;

  update catalog_contrib.cms_tool_drafts d
    set value = p_value, version = d.version + 1, updated_at = clock_timestamp()
    where d.brand_id = access_record.brand_id and d.tool_id = p_tool
      and d.version = p_expected_version
    returning d.* into draft;
  if not found then
    raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT';
  end if;
  return jsonb_build_object('brandId', draft.brand_id, 'value', draft.value, 'version', draft.version,
    'updatedAt', draft.updated_at, 'canEdit', true);
end $$;

revoke all on function catalog_contrib.cms_require_actor(uuid,uuid),
  catalog_contrib.cms_require_tool_access(uuid,uuid,text,boolean),
  public.cms_read_tool_draft(uuid,uuid,text),
  public.cms_save_tool_draft(uuid,uuid,text,uuid,bigint,jsonb) from public, anon, authenticated;
grant execute on function catalog_contrib.cms_require_actor(uuid,uuid),
  catalog_contrib.cms_require_tool_access(uuid,uuid,text,boolean),
  public.cms_read_tool_draft(uuid,uuid,text),
  public.cms_save_tool_draft(uuid,uuid,text,uuid,bigint,jsonb) to service_role;

commit;
