begin;

create table catalog_private.cms_editorial_workspaces (
  tool_id varchar primary key references public.tools(id) on delete restrict,
  brand_id uuid not null references catalog_contrib.brands(id) on delete restrict,
  version bigint not null check (version > 0),
  base_hash text not null check (base_hash ~ '^[0-9a-f]{64}$'),
  patch jsonb not null check (jsonb_typeof(patch) = 'object' and octet_length(patch::text) <= 262144),
  updated_at timestamptz not null default clock_timestamp()
);
create table catalog_private.cms_editorial_approvals (
  id uuid primary key default gen_random_uuid(),
  tool_id varchar not null references public.tools(id) on delete restrict,
  brand_id uuid not null references catalog_contrib.brands(id) on delete restrict,
  version bigint not null,
  base_hash text not null,
  patch jsonb not null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz not null default clock_timestamp(),
  status text not null default 'approved' check (status in ('approved', 'superseded', 'delivered', 'verified')),
  unique (tool_id, version)
);
create unique index cms_one_editorial_approval on catalog_private.cms_editorial_approvals(tool_id)
  where status in ('approved', 'delivered');

alter table catalog_private.cms_editorial_workspaces enable row level security;
alter table catalog_private.cms_editorial_approvals enable row level security;
revoke all on catalog_private.cms_editorial_workspaces, catalog_private.cms_editorial_approvals from public, anon, authenticated;
grant usage on schema catalog_private to service_role;
grant select, insert, update on catalog_private.cms_editorial_workspaces to service_role;
grant select, insert on catalog_private.cms_editorial_approvals to service_role;
grant update(status) on catalog_private.cms_editorial_approvals to service_role;
grant update(base_hash) on catalog_contrib.cms_tool_submissions to service_role;

create function public.cms_editorial_workspace(
  p_actor uuid, p_session uuid, p_tool text, p_action text, p_expected bigint, p_base text, p_patch jsonb
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  brand uuid;
  draft catalog_private.cms_editorial_workspaces%rowtype;
  approved catalog_private.cms_editorial_approvals%rowtype;
  state text;
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  if p_action not in ('read','save','approve','discard') or p_action is null then raise sqlstate 'PT400'; end if;
  if p_action <> 'read' then perform pg_advisory_xact_lock(864203174); end if;
  select a.brand_id into brand
    from catalog_contrib.brand_tool_assignments a join catalog_contrib.brands b on b.id = a.brand_id
    where a.tool_id = p_tool and a.status = 'verified' and a.is_primary and b.status = 'verified'
    for share of a, b;
  if brand is null then
    if p_action = 'read' then return null; end if;
    raise sqlstate 'PT409';
  end if;

  select d.* into draft from catalog_private.cms_editorial_workspaces d where d.tool_id = p_tool for update;
  select a.* into approved from catalog_private.cms_editorial_approvals a
    where a.tool_id = p_tool and a.status in ('approved','delivered') for update;
  state := case when draft.brand_id = brand then approved.status end;

  if p_action <> 'read' then
    if p_expected is distinct from coalesce(draft.version, 0) or
      coalesce(p_base,'') !~ '^[0-9a-f]{64}$' then raise sqlstate 'PT409'; end if;
    if state = 'delivered' or exists (
      select from catalog_contrib.cms_release_batches r
        cross join lateral jsonb_array_elements(coalesce(r.manifest->'editorialItems', '[]'::jsonb)) i
      where r.cancelled_at is null and r.verified_at is null and i->>'approvalId' = approved.id::text
    ) then raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS'; end if;
    if p_action = 'approve' then
      if draft.brand_id is distinct from brand or p_base is distinct from draft.base_hash or draft.patch is null
        or draft.patch = '{"set":{},"remove":[]}'::jsonb then raise sqlstate 'PT409'; end if;
      if state is distinct from 'approved' then
        insert into catalog_private.cms_editorial_approvals(tool_id,brand_id,version,base_hash,patch,approved_by)
          values (p_tool,brand,draft.version,draft.base_hash,draft.patch,p_actor) returning * into approved;
        state := approved.status;
      end if;
    else
      if p_action = 'discard' then p_patch := '{"set":{},"remove":[]}'::jsonb; end if;
      if jsonb_typeof(p_patch) is distinct from 'object' or jsonb_typeof(p_patch->'set') is distinct from 'object'
        or jsonb_typeof(p_patch->'remove') is distinct from 'array' or octet_length(p_patch::text) > 262144
        then raise sqlstate 'PT400'; end if;
      if p_action = 'save' and draft.brand_id = brand and draft.patch <> '{"set":{},"remove":[]}'::jsonb
        and draft.base_hash is distinct from p_base then raise sqlstate 'PT409'; end if;
      if approved.id is not null then
        update catalog_private.cms_editorial_approvals a set status = 'superseded' where a.id = approved.id;
      end if;
      insert into catalog_private.cms_editorial_workspaces(tool_id,brand_id,version,base_hash,patch)
        values (p_tool,brand,coalesce(draft.version,0) + 1,p_base,p_patch)
        on conflict (tool_id) do update set brand_id = excluded.brand_id, version = excluded.version,
          base_hash = excluded.base_hash, patch = excluded.patch, updated_at = clock_timestamp()
        returning * into draft;
      state := null;
    end if;
  end if;

  return jsonb_build_object('version',coalesce(draft.version,0),'baseHash',case when draft.brand_id = brand then draft.base_hash end,
    'patch',case when draft.brand_id = brand then draft.patch end,'updatedAt',draft.updated_at,'state',state);
end $$;

create function public.cms_editorial_release_inputs(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return coalesce((
    select jsonb_agg(jsonb_build_object('approvalId',e.id,'toolId',e.tool_id,'version',e.version,
      'baseHash',e.base_hash,'patch',e.patch,'attached',a.tool_id is not null and b.id is not null) order by e.tool_id)
      from catalog_private.cms_editorial_approvals e
      left join catalog_contrib.brand_tool_assignments a on a.tool_id = e.tool_id and a.brand_id = e.brand_id
        and a.status = 'verified' and a.is_primary
      left join catalog_contrib.brands b on b.id = a.brand_id and b.status = 'verified'
      where e.status = 'approved'
  ), '[]'::jsonb);
end $$;

create function public.cms_list_editorial_workspaces(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return coalesce((
    select jsonb_agg(jsonb_build_object('toolId',d.tool_id,'version',d.version,'updatedAt',d.updated_at,
      'state',coalesce(e.status,'draft'),'fields',coalesce((
        select jsonb_agg(k) from jsonb_object_keys(d.patch->'set') k
      ),'[]'::jsonb) || (d.patch->'remove')) order by d.updated_at desc)
      from catalog_private.cms_editorial_workspaces d
      join catalog_contrib.brand_tool_assignments a on a.tool_id = d.tool_id and a.brand_id = d.brand_id
        and a.status = 'verified' and a.is_primary
      join catalog_contrib.brands b on b.id = a.brand_id and b.status = 'verified'
      left join catalog_private.cms_editorial_approvals e on e.tool_id = d.tool_id and e.version = d.version
        and e.status in ('approved','delivered')
      where d.patch <> '{"set":{},"remove":[]}'::jsonb
  ), '[]'::jsonb);
end $$;

create function catalog_contrib.cms_validate_editorial_release(p_actor uuid, p_session uuid, p_items jsonb)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
declare eligible jsonb;
begin
  if coalesce(jsonb_array_length(p_items),0) = 0 then return; end if;
  perform 1 from catalog_private.cms_editorial_approvals e
    where exists (select from jsonb_array_elements(p_items) i where i->>'approvalId' = e.id::text)
    order by e.id for share;
  perform 1 from catalog_contrib.brand_tool_assignments a join catalog_contrib.brands b on b.id = a.brand_id
    where a.status = 'verified' and a.is_primary
      and exists (select from jsonb_array_elements(p_items) i where i->>'toolId' = a.tool_id)
    order by a.tool_id for share of a,b;
  eligible := public.cms_editorial_release_inputs(p_actor,p_session);
  if exists (
    select from jsonb_array_elements(p_items) i where not exists (
      select from jsonb_array_elements(eligible) e where e->>'approvalId' = i->>'approvalId'
        and e->>'version' = i->>'version' and e->>'toolId' = i->>'toolId' and e->'attached' = 'true'::jsonb
    )
  ) then raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED'; end if;
end $$;

create function catalog_contrib.cms_commit_editorial_release(p_items jsonb, p_commit text, p_verified boolean)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if not p_verified then
    update catalog_private.cms_editorial_approvals e set status = 'delivered'
      from jsonb_array_elements(p_items) i where e.id::text = i->>'approvalId' and e.status = 'approved';
    return;
  end if;
  update catalog_private.cms_editorial_workspaces d set version = d.version + 1, patch = '{"set":{},"remove":[]}'::jsonb, updated_at = clock_timestamp()
    from jsonb_array_elements(p_items) i join catalog_private.cms_editorial_approvals e on e.id::text = i->>'approvalId'
    where e.status = 'delivered' and d.tool_id = e.tool_id and d.version = e.version;
  update catalog_private.cms_editorial_approvals e set status = 'verified'
    from jsonb_array_elements(p_items) i where e.id::text = i->>'approvalId' and e.status = 'delivered';
end $$;

-- Editorial/commercial overlays preserve product facts. Advance still-pending
-- product revisions only when their exact previous public base matches.
create function catalog_contrib.cms_rebase_overlay_submissions(p_items jsonb, p_factual_items jsonb)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  update catalog_contrib.cms_tool_drafts d set base_hash = i->>'hash'
    from jsonb_array_elements(p_items) i
    where d.tool_id = i->>'toolId' and d.base_hash = i->>'baseHash'
      and not exists (select from jsonb_array_elements(p_factual_items) f where f->>'toolId' = d.tool_id);
  update catalog_contrib.cms_tool_submissions s set base_hash = i->>'hash'
    from jsonb_array_elements(p_items) i
    where s.tool_id = i->>'toolId' and s.base_hash = i->>'baseHash' and s.status in ('submitted','approved')
      and not exists (select from jsonb_array_elements(p_factual_items) f where f->>'toolId' = s.tool_id);
end $$;

revoke all on function public.cms_editorial_workspace(uuid,uuid,text,text,bigint,text,jsonb),
  public.cms_editorial_release_inputs(uuid,uuid), public.cms_list_editorial_workspaces(uuid,uuid),
  catalog_contrib.cms_validate_editorial_release(uuid,uuid,jsonb),
  catalog_contrib.cms_commit_editorial_release(jsonb,text,boolean),
  catalog_contrib.cms_rebase_overlay_submissions(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.cms_editorial_workspace(uuid,uuid,text,text,bigint,text,jsonb),
  public.cms_editorial_release_inputs(uuid,uuid), public.cms_list_editorial_workspaces(uuid,uuid),
  catalog_contrib.cms_validate_editorial_release(uuid,uuid,jsonb),
  catalog_contrib.cms_commit_editorial_release(jsonb,text,boolean),
  catalog_contrib.cms_rebase_overlay_submissions(jsonb,jsonb) to service_role;

commit;
