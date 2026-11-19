begin;

-- The deployed expression escaped the period twice under standard SQL strings.
alter table catalog_contrib.brands drop constraint if exists brands_website_domain_check1;
alter table catalog_contrib.brands add constraint brands_website_domain_check1
  check (website_domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$');
create unique index if not exists brands_verified_domain_idx on catalog_contrib.brands(lower(website_domain))
  where status = 'verified';

create table catalog_contrib.listing_invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  tool_id text not null,
  slug text not null,
  expected_email text not null,
  brand_id uuid references catalog_contrib.brands on delete cascade,
  brand_name text,
  brand_domain text,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  digest text not null unique check (digest ~ '^[a-f0-9]{64}$'),
  source_sha text not null check (source_sha ~ '^[a-f0-9]{40}$'),
  base_hash text not null check (base_hash ~ '^[a-f0-9]{64}$'),
  product_draft jsonb not null check (
    jsonb_typeof(product_draft) = 'object' and (product_draft->'schemaVersion' = '1'::jsonb) is true
    and (jsonb_typeof(product_draft->'name') = 'string') is true
    and (jsonb_typeof(product_draft->'websiteUrl') = 'string') is true
    and octet_length(product_draft::text) <= 524288
  ),
  invited_by uuid references auth.users on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  foreign key (owner_id, tool_id) references catalog_contrib.listing_claims on delete cascade,
  check ((brand_id is not null and brand_name is null and brand_domain is null)
    or (brand_id is null and brand_name is not null and brand_domain is not null and role = 'owner')),
  check (accepted_at is null or revoked_at is null)
);
create index listing_invitations_claim_idx on catalog_contrib.listing_invitations(owner_id, tool_id);
alter table catalog_contrib.listing_invitations enable row level security;
revoke all on catalog_contrib.listing_invitations from public, anon, authenticated;
grant select, insert, update on catalog_contrib.listing_invitations to service_role;
grant select (id, slug, content_status), insert (id, slug, name, website_url, content_status) on public.tools to service_role;

create function public.cms_admin_listing_requests(p_actor uuid, p_session uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  claim catalog_contrib.listing_claims%rowtype;
  invitation catalog_contrib.listing_invitations%rowtype;
  intended_email text;
  selected_brand uuid;
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);

  if p_action = 'list' then
    return jsonb_build_object(
      'claims', coalesce((
        select jsonb_agg(jsonb_build_object(
          'ownerId', c.owner_id, 'toolId', c.tool_id, 'slug', c.public_slug, 'createdAt', c.created_at,
          'confirmedEmail', case when u.email_confirmed_at is not null then u.email end
        ) order by c.created_at, c.owner_id, c.tool_id)
        from (
          select * from catalog_contrib.listing_claims where status = 'pending'
          order by created_at, owner_id, tool_id limit 100
        ) c join auth.users u on u.id = c.owner_id
      ), '[]'::jsonb),
      'listings', coalesce((
        select jsonb_agg(catalog_contrib.cms_listing_dto(r) || jsonb_build_object(
          'ownerId', r.owner_id, 'confirmedEmail', case when u.email_confirmed_at is not null then u.email end,
          'historicalReviewRequested', exists (
            select from catalog_private.cms_listing_historical_reviews h
            where h.listing_id = r.id and h.resolved_at is null
          )
        ) order by r.updated_at, r.id)
        from (
          select * from catalog_contrib.listing_requests r
          where (
            r.status in ('submitted', 'in_preparation', 'facts_to_review', 'changes_requested', 'ready')
            and (r.canonical_tool_id is null or (r.status = 'ready' and r.delivery_status in ('unpublished', 'publishing')))
          ) or (
            r.status not in ('archived', 'rejected')
            and exists (
              select from catalog_private.cms_listing_historical_reviews h
              where h.listing_id = r.id and h.resolved_at is null
            )
          )
          order by updated_at, id limit 100
        ) r join auth.users u on u.id = r.owner_id
      ), '[]'::jsonb),
      'brands', coalesce((
        select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'websiteDomain', b.website_domain) order by b.name, b.id)
        from (
          select id, name, website_domain from catalog_contrib.brands where status = 'verified'
          order by name, id limit 100
        ) b
      ), '[]'::jsonb),
      'invitations', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', i.id, 'ownerId', i.owner_id, 'toolId', i.tool_id, 'expiresAt', i.expires_at,
          'status', case when i.revoked_at is not null then 'revoked' when i.accepted_at is not null then 'accepted'
            when i.expires_at <= clock_timestamp() then 'expired' else 'pending' end
        ) order by i.created_at desc, i.id)
        from (
          select id, owner_id, tool_id, expires_at, created_at, revoked_at, accepted_at
          from catalog_contrib.listing_invitations order by created_at desc, id limit 100
        ) i
      ), '[]'::jsonb)
    );
  end if;

  if p_action in ('inspectClaim', 'invite') then
    select c.* into claim from catalog_contrib.listing_claims c
      where c.owner_id = (p_payload->>'ownerId')::uuid and c.tool_id = p_payload->>'toolId' and c.status = 'pending'
      for update;
    if not found then raise sqlstate 'PT404' using message = 'LISTING_NOT_FOUND'; end if;
    if p_action = 'inspectClaim' then
      return jsonb_build_object('claim', jsonb_build_object('toolId', claim.tool_id, 'slug', claim.public_slug));
    end if;
    if claim.public_slug is distinct from p_payload->>'slug'
      or p_payload->>'role' is null then
      raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT';
    end if;
    select lower(btrim(u.email)) into intended_email
      from auth.users u join public.profiles p on p.id = u.id
      where u.id = claim.owner_id and u.email_confirmed_at is not null and nullif(btrim(u.email), '') is not null
        and p.account_status = 'active';
    if not found then raise sqlstate 'PT403' using message = 'LISTING_INVITATION_ACCOUNT_MISMATCH'; end if;

    selected_brand := (p_payload->>'brandId')::uuid;
    if selected_brand is not null and not exists (
      select from catalog_contrib.brands b where b.id = selected_brand and b.status = 'verified'
    ) then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;

    insert into catalog_contrib.listing_invitations (
      owner_id, tool_id, slug, expected_email, brand_id, brand_name, brand_domain, role,
      digest, source_sha, base_hash, product_draft, invited_by
    ) values (
      claim.owner_id, claim.tool_id, claim.public_slug, intended_email, selected_brand,
      p_payload->>'brandName', p_payload->>'brandDomain', p_payload->>'role',
      p_payload->>'digest', p_payload->>'sourceSha', p_payload->>'baseHash', p_payload->'draft', p_actor
    ) returning * into invitation;
    return jsonb_build_object('invitation', jsonb_build_object(
      'id', invitation.id, 'expiresAt', invitation.expires_at, 'toolId', invitation.tool_id, 'status', 'pending'
    ));
  end if;

  if p_action = 'revokeInvitation' then
    update catalog_contrib.listing_invitations i set revoked_at = clock_timestamp()
      where i.id = (p_payload->>'id')::uuid and i.accepted_at is null and i.revoked_at is null
      returning * into invitation;
    if not found then raise sqlstate 'PT404' using message = 'LISTING_INVITATION_NOT_FOUND'; end if;
    return jsonb_build_object('invitation', jsonb_build_object('id', invitation.id, 'status', 'revoked'));
  end if;

  raise sqlstate 'PT400' using message = 'INVALID_LISTING_REQUEST';
end $$;

create function public.cms_accept_listing_invitation(p_actor uuid, p_session uuid, p_digest text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  invitation catalog_contrib.listing_invitations%rowtype;
  existing_slug text;
  existing_status text;
  selected_brand uuid;
  assigned_brand uuid;
  membership_status text;
  membership_role text;
begin
  perform catalog_contrib.cms_require_actor(p_actor, p_session);
  select i.* into invitation from catalog_contrib.listing_invitations i where i.digest = p_digest for update;
  if not found then raise sqlstate 'PT404' using message = 'LISTING_INVITATION_NOT_FOUND'; end if;

  if invitation.owner_id <> p_actor or not exists (
    select from auth.users u where u.id = p_actor and u.email_confirmed_at is not null
      and lower(btrim(u.email)) = invitation.expected_email
  ) then raise sqlstate 'PT403' using message = 'LISTING_INVITATION_ACCOUNT_MISMATCH'; end if;
  if invitation.revoked_at is not null then raise sqlstate 'PT409' using message = 'LISTING_INVITATION_REVOKED'; end if;
  if invitation.accepted_at is not null then raise sqlstate 'PT409' using message = 'LISTING_INVITATION_USED'; end if;
  if invitation.expires_at <= clock_timestamp() then raise sqlstate 'PT409' using message = 'LISTING_INVITATION_EXPIRED'; end if;

  perform from catalog_contrib.listing_claims c
    where c.owner_id = p_actor and c.tool_id = invitation.tool_id and c.status = 'pending' for update;
  if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(invitation.tool_id, 82637421));

  -- Store an identity only after verified admin approval and recipient acceptance.
  -- A new identity is private in the Data API and does not replace the live JSON fiche.
  insert into public.tools (id, slug, name, website_url, content_status) values (
    invitation.tool_id, invitation.slug, invitation.product_draft->>'name',
    invitation.product_draft->>'websiteUrl', 'draft'
  ) on conflict do nothing;
  select t.slug, t.content_status into existing_slug, existing_status from public.tools t where t.id = invitation.tool_id for share;
  if not found or existing_slug is distinct from invitation.slug or existing_status = 'archived' then
    raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT';
  end if;

  selected_brand := invitation.brand_id;
  if selected_brand is null then
    insert into catalog_contrib.brands (name, website_domain, status, created_by)
      values(invitation.brand_name, invitation.brand_domain, 'verified', p_actor)
      on conflict do nothing returning id into selected_brand;
    if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
  else
    perform from catalog_contrib.brands b where b.id = selected_brand and b.status = 'verified' for share;
    if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
  end if;

  select a.brand_id into assigned_brand from catalog_contrib.brand_tool_assignments a
    where a.tool_id = invitation.tool_id and a.status = 'verified' and a.is_primary for share;
  if assigned_brand is not null and assigned_brand <> selected_brand then
    raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT';
  end if;
  if assigned_brand is null then
    insert into catalog_contrib.brand_tool_assignments (brand_id, tool_id, status, is_primary, verification_method, verified_by, verified_at)
      values(selected_brand, invitation.tool_id, 'verified', true, 'tooltrim_invitation', invitation.invited_by, clock_timestamp())
      on conflict do nothing;
    if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
  end if;

  insert into catalog_contrib.brand_memberships (brand_id, user_id, role, status, invited_by, accepted_at)
    values(selected_brand, p_actor, invitation.role, 'active', invitation.invited_by, clock_timestamp())
    on conflict (brand_id, user_id) do nothing;
  select m.status, m.role into strict membership_status, membership_role from catalog_contrib.brand_memberships m
    where m.brand_id = selected_brand and m.user_id = p_actor for share;
  if membership_status <> 'active' or membership_role <> invitation.role then
    raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT';
  end if;

  insert into catalog_contrib.cms_tool_drafts (brand_id, tool_id, base_hash, value)
    values(selected_brand, invitation.tool_id, invitation.base_hash, invitation.product_draft)
    on conflict (brand_id, tool_id) do nothing;
  update catalog_contrib.listing_claims c set status = 'verified'
    where c.owner_id = p_actor and c.tool_id = invitation.tool_id;
  update catalog_contrib.listing_invitations i set accepted_at = clock_timestamp() where i.id = invitation.id;

  return jsonb_build_object('assignment', jsonb_build_object('toolId', invitation.tool_id, 'brandId', selected_brand, 'role', membership_role));
end $$;

revoke all on function public.cms_admin_listing_requests(uuid, uuid, text, jsonb),
  public.cms_accept_listing_invitation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cms_admin_listing_requests(uuid, uuid, text, jsonb),
  public.cms_accept_listing_invitation(uuid, uuid, text) to service_role;

commit;
