begin;

create table catalog_contrib.listing_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  website_url text not null check (char_length(website_url) between 1 and 500),
  hostname text not null check (char_length(hostname) between 1 and 253),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  offer text not null check (offer in ('standard_badge', 'priority_paid')),
  offer_version integer not null default 1 check (offer_version > 0),
  locale text not null check (locale in ('fr', 'en')),
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'in_preparation', 'facts_to_review', 'changes_requested', 'ready', 'rejected', 'archived')
  ),
  commercial_status text not null default 'pending' check (commercial_status in ('pending', 'verifying', 'satisfied', 'issue')),
  representation_status text not null default 'pending' check (representation_status in ('pending', 'verified', 'rejected', 'revoked')),
  delivery_status text not null default 'unpublished' check (delivery_status in ('unpublished', 'publishing', 'published', 'offline')),
  canonical_tool_id varchar references public.tools(id) on delete restrict,
  initial_approval_id uuid,
  representative_role text not null default '' check (char_length(representative_role) <= 120),
  notes text not null default '' check (char_length(notes) <= 3000),
  lock_version bigint not null default 1 check (lock_version between 1 and 9007199254740991),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9_-]{8,128}$'),
  initial_input jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  reservation_expires_at timestamptz not null,
  unique (owner_id, idempotency_key)
);
create index listing_requests_owner_updated_idx on catalog_contrib.listing_requests (owner_id, updated_at desc);
create index listing_requests_owner_domain_idx on catalog_contrib.listing_requests (owner_id, hostname);
create index listing_requests_canonical_tool_idx on catalog_contrib.listing_requests (canonical_tool_id) where canonical_tool_id is not null;

create table catalog_contrib.listing_slug_reservations (
  slug text primary key,
  listing_id uuid not null unique references catalog_contrib.listing_requests on delete cascade,
  expires_at timestamptz not null
);

-- The identity may exist only in the deployed JSON catalogue. Keep the durable
-- request separate from assignments and refrain from creating a canonical tool.
create table catalog_contrib.listing_claims (
  owner_id uuid not null references auth.users(id) on delete cascade,
  tool_id text not null check (char_length(tool_id) between 1 and 200),
  public_slug text not null check (char_length(public_slug) between 1 and 255),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'revoked')),
  created_at timestamptz not null default clock_timestamp(),
  primary key (owner_id, tool_id)
);

alter table catalog_contrib.listing_requests enable row level security;
alter table catalog_contrib.listing_slug_reservations enable row level security;
alter table catalog_contrib.listing_claims enable row level security;
revoke all on catalog_contrib.listing_requests, catalog_contrib.listing_slug_reservations, catalog_contrib.listing_claims
  from public, anon, authenticated;
grant select, insert, update on catalog_contrib.listing_requests, catalog_contrib.listing_claims to service_role;
grant select, insert, update, delete on catalog_contrib.listing_slug_reservations to service_role;
grant select (slug) on public.tools to service_role;

create function catalog_contrib.cms_require_listing_account(p_actor uuid, p_session uuid)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_actor(p_actor, p_session);
  perform public.require_account_session(p_actor, p_session);
end $$;

create function catalog_contrib.cms_can_read_attached_listing(p_actor uuid, p_tool text)
returns boolean language sql stable security invoker set search_path = pg_catalog as $$
  select exists (
    select from catalog_contrib.brand_tool_assignments a
    join catalog_contrib.brands b on b.id = a.brand_id
    join catalog_contrib.brand_memberships m on m.brand_id = b.id
    where a.tool_id = p_tool and a.status = 'verified' and a.is_primary and b.status = 'verified'
      and m.user_id = p_actor and m.status = 'active' and m.role in ('owner', 'admin', 'editor', 'viewer')
  )
$$;

create function catalog_contrib.cms_listing_dto(r catalog_contrib.listing_requests)
returns jsonb language sql stable security invoker set search_path = pg_catalog as $$
  select jsonb_build_object(
    'id', r.id, 'name', r.name, 'websiteUrl', r.website_url, 'slug', r.slug, 'offer', r.offer,
    'locale', r.locale, 'status', r.status, 'version', r.lock_version,
    'commercialStatus', r.commercial_status, 'representationStatus', r.representation_status,
    'deliveryStatus', r.delivery_status, 'toolId', r.canonical_tool_id, 'representativeRole', r.representative_role, 'notes', r.notes,
    'createdAt', r.created_at, 'updatedAt', r.updated_at, 'reservationExpiresAt', r.reservation_expires_at
  )
$$;

create function catalog_contrib.cms_reserve_listing_slug(p_listing uuid, p_slug text, p_expires_at timestamptz)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if exists (select from public.tools t where t.slug = p_slug) then
    raise sqlstate 'PT409' using message = 'LISTING_SLUG_UNAVAILABLE';
  end if;

  insert into catalog_contrib.listing_slug_reservations as reservation (slug, listing_id, expires_at)
    values (p_slug, p_listing, p_expires_at)
    on conflict (slug) do update set listing_id = excluded.listing_id, expires_at = excluded.expires_at
    where reservation.listing_id = excluded.listing_id or reservation.expires_at <= clock_timestamp();
  if not found then raise sqlstate 'PT409' using message = 'LISTING_SLUG_UNAVAILABLE'; end if;
end $$;

create function public.cms_listing_requests(p_actor uuid, p_session uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  listing catalog_contrib.listing_requests%rowtype;
  claim catalog_contrib.listing_claims%rowtype;
  expires_at timestamptz;
  next_status text;
  requested_version bigint;
begin
  perform catalog_contrib.cms_require_listing_account(p_actor, p_session);

  if p_action = 'list' then
    return jsonb_build_object(
      'listings', coalesce((
        select jsonb_agg(catalog_contrib.cms_listing_dto(r) order by r.updated_at desc, r.id)
        from (
          select d.* from catalog_contrib.listing_requests d
          where (d.owner_id = p_actor and d.canonical_tool_id is null)
            or catalog_contrib.cms_can_read_attached_listing(p_actor, d.canonical_tool_id)
          order by d.updated_at desc, d.id limit 100
        ) r
      ), '[]'::jsonb),
      'claims', coalesce((
        select jsonb_agg(jsonb_build_object('toolId', c.tool_id, 'slug', c.public_slug, 'status', c.status) order by c.created_at desc, c.tool_id)
        from (
          select x.* from catalog_contrib.listing_claims x
          where x.owner_id = p_actor order by x.created_at desc, x.tool_id limit 100
        ) c
      ), '[]'::jsonb)
    );
  end if;

  if p_action = 'lookup' then
    return jsonb_build_object('candidates', coalesce((
      select jsonb_agg(jsonb_build_object('kind', 'listing', 'id', r.id, 'slug', r.slug, 'name', r.name, 'websiteUrl', r.website_url)
        order by r.updated_at desc, r.id)
      from (
        select d.* from catalog_contrib.listing_requests d
        where d.owner_id = p_actor and d.hostname = p_payload->>'hostname'
          and d.canonical_tool_id is null and d.status not in ('archived', 'rejected')
        order by d.updated_at desc, d.id limit 30
      ) r
    ), '[]'::jsonb));
  end if;

  if p_action = 'claimExisting' then
    insert into catalog_contrib.listing_claims(owner_id, tool_id, public_slug)
      values(p_actor, p_payload->>'toolId', p_payload->>'slug')
      on conflict (owner_id, tool_id) do nothing;
    select c.* into strict claim from catalog_contrib.listing_claims c
      where c.owner_id = p_actor and c.tool_id = p_payload->>'toolId';
    return jsonb_build_object('claim', jsonb_build_object('toolId', claim.tool_id, 'status', claim.status));
  end if;

  if p_action = 'create' then
    expires_at := clock_timestamp() + interval '30 days';
    insert into catalog_contrib.listing_requests(
      owner_id, name, website_url, hostname, slug, offer, locale, idempotency_key, initial_input, reservation_expires_at
    ) values(
      p_actor, p_payload->>'name', p_payload->>'websiteUrl', p_payload->>'hostname', p_payload->>'slug',
      p_payload->>'offer', p_payload->>'locale', p_payload->>'idempotencyKey', p_payload, expires_at
    )
    on conflict (owner_id, idempotency_key) do nothing returning * into listing;

    if found then
      perform catalog_contrib.cms_reserve_listing_slug(listing.id, listing.slug, expires_at);
    else
      select r.* into strict listing from catalog_contrib.listing_requests r
        where r.owner_id = p_actor and r.idempotency_key = p_payload->>'idempotencyKey';
      if listing.initial_input is distinct from p_payload then
        raise sqlstate 'PT409' using message = 'LISTING_IDEMPOTENCY_CONFLICT';
      end if;
      if listing.canonical_tool_id is not null and not catalog_contrib.cms_can_read_attached_listing(p_actor, listing.canonical_tool_id) then
        raise sqlstate 'PT404' using message = 'LISTING_NOT_FOUND';
      end if;
    end if;
    return jsonb_build_object('listing', catalog_contrib.cms_listing_dto(listing));
  end if;

  if p_action = 'read' then
    select r.* into listing from catalog_contrib.listing_requests r
      where r.id = (p_payload->>'id')::uuid and ((r.owner_id = p_actor and r.canonical_tool_id is null)
        or catalog_contrib.cms_can_read_attached_listing(p_actor, r.canonical_tool_id));
    if not found then raise sqlstate 'PT404' using message = 'LISTING_NOT_FOUND'; end if;
    return jsonb_build_object('listing', catalog_contrib.cms_listing_dto(listing));
  end if;

  if p_action not in ('save', 'submit', 'withdraw') or p_action is null then
    raise sqlstate 'PT400' using message = 'INVALID_LISTING_REQUEST';
  end if;
  select r.* into listing from catalog_contrib.listing_requests r
    where r.id = (p_payload->>'id')::uuid and r.owner_id = p_actor and r.canonical_tool_id is null
    for update;
  if not found then raise sqlstate 'PT404' using message = 'LISTING_NOT_FOUND'; end if;

  requested_version := (p_payload->>'version')::bigint;
  if listing.lock_version is distinct from requested_version then
    raise sqlstate 'PT409' using message = 'LISTING_REVISION_CONFLICT';
  end if;
  if listing.status not in ('draft', 'changes_requested') then
    raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE';
  end if;

  next_status := listing.status;
  if p_action = 'submit' then
    if listing.commercial_status <> 'satisfied' or btrim(listing.representative_role) = '' then
      raise sqlstate 'PT409' using message = 'LISTING_REQUIREMENTS_PENDING';
    end if;
    next_status := 'submitted';
  elsif p_action = 'withdraw' then
    if listing.commercial_status <> 'pending' or listing.offer = 'priority_paid' then
      raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE';
    end if;
    next_status := 'archived';
  end if;

  expires_at := clock_timestamp() + interval '30 days';
  if p_action = 'withdraw' then
    delete from catalog_contrib.listing_slug_reservations where listing_id = listing.id;
    expires_at := clock_timestamp();
  else
    perform catalog_contrib.cms_reserve_listing_slug(listing.id, listing.slug, expires_at);
  end if;
  update catalog_contrib.listing_requests
    set status = next_status, lock_version = lock_version + 1, updated_at = clock_timestamp(), reservation_expires_at = expires_at,
      representative_role = case when p_action = 'save' then p_payload->>'representativeRole' else representative_role end,
      notes = case when p_action = 'save' then p_payload->>'notes' else notes end
    where id = listing.id
    returning * into strict listing;
  return jsonb_build_object('listing', catalog_contrib.cms_listing_dto(listing));
end $$;

revoke all on function catalog_contrib.cms_require_listing_account(uuid, uuid),
  catalog_contrib.cms_can_read_attached_listing(uuid, text),
  catalog_contrib.cms_listing_dto(catalog_contrib.listing_requests),
  catalog_contrib.cms_reserve_listing_slug(uuid, text, timestamptz),
  public.cms_listing_requests(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function catalog_contrib.cms_require_listing_account(uuid, uuid),
  catalog_contrib.cms_can_read_attached_listing(uuid, text),
  catalog_contrib.cms_listing_dto(catalog_contrib.listing_requests),
  catalog_contrib.cms_reserve_listing_slug(uuid, text, timestamptz),
  public.cms_listing_requests(uuid, uuid, text, jsonb) to service_role;

commit;
