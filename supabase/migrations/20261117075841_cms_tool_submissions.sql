begin;

create table catalog_contrib.cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table catalog_contrib.cms_tool_submissions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  tool_id varchar not null,
  version bigint not null check (version > 0),
  base_hash text check (base_hash ~ '^[a-f0-9]{64}$'),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default clock_timestamp(),
  status text not null default 'submitted'
    check (status in ('submitted','changes_requested','rejected','approved','applied','withdrawn')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (length(review_note) <= 2000),
  unique (brand_id, tool_id, version),
  foreign key (brand_id, tool_id) references catalog_contrib.cms_tool_drafts(brand_id,tool_id)
);
create unique index cms_one_pending_tool_submission on catalog_contrib.cms_tool_submissions(tool_id)
  where status in ('submitted','approved');
create index cms_pending_review_queue on catalog_contrib.cms_tool_submissions(submitted_at, id)
  where status = 'submitted';

alter table catalog_contrib.cms_admins enable row level security;
alter table catalog_contrib.cms_tool_submissions enable row level security;
revoke all on catalog_contrib.cms_admins, catalog_contrib.cms_tool_submissions from public, anon, authenticated;
grant select on catalog_contrib.cms_admins to service_role;
grant select, insert on catalog_contrib.cms_tool_submissions to service_role;
grant update (status, reviewed_by, reviewed_at, review_note) on catalog_contrib.cms_tool_submissions to service_role;

create function catalog_contrib.cms_require_admin(p_actor uuid, p_session uuid)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_actor(p_actor, p_session);
  if not exists (select from catalog_contrib.cms_admins a where a.user_id = p_actor) then
    raise sqlstate 'PT403' using message = 'CMS_ACCESS_DENIED';
  end if;
end $$;

create function public.cms_list_tool_drafts(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_actor(p_actor, p_session);
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'slug', slug, 'name', name, 'canEdit', can_edit
    ) order by slug), '[]'::jsonb)
    from (
      select d.tool_id as id, t.slug, d.value->>'name' as name,
        (m.role in ('owner','admin','editor') and d.base_hash is not null) as can_edit
      from catalog_contrib.cms_tool_drafts d
      join public.tools t on t.id = d.tool_id
      join catalog_contrib.brand_tool_assignments a using (brand_id, tool_id)
      join catalog_contrib.brands b on b.id = d.brand_id
      join catalog_contrib.brand_memberships m on m.brand_id = b.id
      where a.status = 'verified' and a.is_primary and b.status = 'verified'
        and m.user_id = p_actor and m.status = 'active' and m.role in ('owner','admin','editor','viewer')
      order by t.slug limit 1000
    ) as rows
  );
end $$;

create function catalog_contrib.cms_submission_summary(r catalog_contrib.cms_tool_submissions)
returns jsonb language sql stable security invoker set search_path = pg_catalog as $$
  select jsonb_build_object('id', r.id, 'toolId', r.tool_id, 'name', r.value->>'name', 'version', r.version,
    'status', r.status, 'submittedAt', r.submitted_at, 'reviewedAt', r.reviewed_at, 'reviewNote', r.review_note);
$$;

create function public.cms_submit_tool_draft(
  p_actor uuid, p_session uuid, p_tool text, p_expected_brand uuid, p_expected_version bigint
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  access_record record;
  draft catalog_contrib.cms_tool_drafts%rowtype;
  submission catalog_contrib.cms_tool_submissions%rowtype;
begin
  select * into strict access_record
    from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_tool, true);
  if access_record.brand_id is distinct from p_expected_brand then
    raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT';
  end if;

  -- Serialize first submission and replay against edits to this draft.
  select d.* into draft from catalog_contrib.cms_tool_drafts d
    where d.brand_id = access_record.brand_id and d.tool_id = p_tool for update;
  select s.* into submission from catalog_contrib.cms_tool_submissions s
    where s.brand_id = access_record.brand_id and s.tool_id = p_tool and s.version = p_expected_version;
  if found then
    if submission.status in ('withdrawn','changes_requested','rejected') then
      raise sqlstate 'PT409' using message = 'CMS_NEW_REVISION_REQUIRED';
    end if;
    return catalog_contrib.cms_submission_summary(submission);
  end if;
  if draft.version is distinct from p_expected_version or draft.base_hash is null then
    raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT';
  end if;
  insert into catalog_contrib.cms_tool_submissions(brand_id,tool_id,version,base_hash,value,submitted_by)
    values (draft.brand_id,draft.tool_id,draft.version,draft.base_hash,draft.value,p_actor) returning * into submission;
  return catalog_contrib.cms_submission_summary(submission);
exception when unique_violation then
  raise sqlstate 'PT409' using message = 'CMS_SUBMISSION_PENDING';
end $$;

create function public.cms_list_tool_submissions(p_actor uuid, p_session uuid, p_tool text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare access_record record;
begin
  select * into strict access_record
    from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_tool, false);
  return (
    select coalesce(jsonb_agg(catalog_contrib.cms_submission_summary(r) order by r.version desc),'[]'::jsonb)
    from (select s.* from catalog_contrib.cms_tool_submissions s
          where s.tool_id = p_tool and s.brand_id = access_record.brand_id
          order by s.version desc limit 50) r
  );
end $$;

create function public.cms_withdraw_tool_submission(
  p_actor uuid, p_session uuid, p_tool text, p_id uuid
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  access_record record;
  submission catalog_contrib.cms_tool_submissions%rowtype;
begin
  select * into strict access_record
    from catalog_contrib.cms_require_tool_access(p_actor, p_session, p_tool, true);
  update catalog_contrib.cms_tool_submissions s set status = 'withdrawn'
    where s.id = p_id and s.tool_id = p_tool and s.brand_id = access_record.brand_id
      and s.status = 'submitted' returning s.* into submission;
  if found then return catalog_contrib.cms_submission_summary(submission); end if;
  select s.* into submission from catalog_contrib.cms_tool_submissions s
    where s.id = p_id and s.tool_id = p_tool and s.brand_id = access_record.brand_id
      and s.status = 'withdrawn';
  if not found then raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT'; end if;
  return catalog_contrib.cms_submission_summary(submission);
end $$;

create function public.cms_review_tool_submission(
  p_actor uuid, p_session uuid, p_id uuid, p_action text, p_note text
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare submission catalog_contrib.cms_tool_submissions%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  if p_action is null or p_action not in ('approved','changes_requested','rejected','cancel_approval')
    or length(p_note) > 2000
    or (p_action <> 'approved' and nullif(btrim(coalesce(p_note,'')), '') is null) then
    raise sqlstate 'PT400' using message = 'INVALID_CMS_REVIEW';
  end if;
  update catalog_contrib.cms_tool_submissions s
    set status = case when p_action = 'cancel_approval' then 'rejected' else p_action end, reviewed_by = p_actor, reviewed_at = clock_timestamp(), review_note = p_note
    where s.id = p_id
      and ((s.status = 'submitted' and p_action <> 'cancel_approval')
        or (s.status = 'approved' and p_action = 'cancel_approval'))
    returning s.* into submission;
  if not found then raise sqlstate 'PT409' using message = 'CMS_REVISION_CONFLICT'; end if;
  return catalog_contrib.cms_submission_summary(submission);
end $$;

create function public.cms_read_review_queue(p_actor uuid, p_session uuid, p_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  if p_id is not null then
    return (select catalog_contrib.cms_submission_summary(s) || jsonb_build_object('value',s.value)
            from catalog_contrib.cms_tool_submissions s where s.id = p_id);
  end if;
  return (
    select coalesce(jsonb_agg(catalog_contrib.cms_submission_summary(r) order by r.submitted_at,r.id),'[]'::jsonb)
    from (select s.* from catalog_contrib.cms_tool_submissions s where s.status in ('submitted','approved')
          order by s.submitted_at,s.id limit 100) r
  );
end $$;

create function public.cms_protected_tool_ids(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  return (select coalesce(jsonb_agg(t.tool_id order by t.tool_id),'[]'::jsonb)
          from (select distinct d.tool_id from catalog_contrib.cms_tool_drafts d) t);
end $$;

create function public.cms_approved_release_inputs(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'approvalId', s.id, 'toolId', s.tool_id, 'version', s.version,
      'baseHash', s.base_hash, 'value', s.value,
      'attached', exists (
        select from catalog_contrib.brand_tool_assignments a
        join catalog_contrib.brands b on b.id = a.brand_id
        where a.brand_id = s.brand_id and a.tool_id = s.tool_id
          and a.status = 'verified' and a.is_primary and b.status = 'verified'
      )
    ) order by s.tool_id), '[]'::jsonb)
    from catalog_contrib.cms_tool_submissions s where s.status = 'approved'
  );
end $$;

revoke all on function catalog_contrib.cms_require_admin(uuid,uuid),
  catalog_contrib.cms_submission_summary(catalog_contrib.cms_tool_submissions),
  public.cms_list_tool_drafts(uuid,uuid), public.cms_submit_tool_draft(uuid,uuid,text,uuid,bigint),
  public.cms_list_tool_submissions(uuid,uuid,text), public.cms_withdraw_tool_submission(uuid,uuid,text,uuid),
  public.cms_read_review_queue(uuid,uuid,uuid),
  public.cms_review_tool_submission(uuid,uuid,uuid,text,text),
  public.cms_protected_tool_ids(uuid,uuid), public.cms_approved_release_inputs(uuid,uuid) from public,anon,authenticated;
grant execute on function catalog_contrib.cms_require_admin(uuid,uuid),
  catalog_contrib.cms_submission_summary(catalog_contrib.cms_tool_submissions),
  public.cms_list_tool_drafts(uuid,uuid), public.cms_submit_tool_draft(uuid,uuid,text,uuid,bigint),
  public.cms_list_tool_submissions(uuid,uuid,text), public.cms_withdraw_tool_submission(uuid,uuid,text,uuid),
  public.cms_read_review_queue(uuid,uuid,uuid),
  public.cms_review_tool_submission(uuid,uuid,uuid,text,text),
  public.cms_protected_tool_ids(uuid,uuid), public.cms_approved_release_inputs(uuid,uuid) to service_role;

commit;
