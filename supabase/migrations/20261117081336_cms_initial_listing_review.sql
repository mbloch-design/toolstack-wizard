begin;

create table catalog_contrib.listing_product_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references catalog_contrib.listing_requests on delete cascade,
  version bigint not null,
  value jsonb not null check (jsonb_typeof(value) = 'object' and (value->'schemaVersion' = '1'::jsonb) is true and octet_length(value::text) <= 524288),
  hash text not null check (hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  unique (listing_id, version)
);
create table catalog_contrib.listing_editorial_approvals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references catalog_contrib.listing_requests on delete cascade,
  version bigint not null,
  category text not null check (category ~ '^[a-z0-9][a-z0-9-]{0,100}$'),
  fields jsonb not null check (jsonb_typeof(fields) = 'object' and octet_length(fields::text) <= 262144),
  hash text not null check (hash ~ '^[a-f0-9]{64}$'),
  approved_by uuid references auth.users on delete set null,
  approved_at timestamptz not null default clock_timestamp(),
  unique (listing_id, version)
);
create table catalog_contrib.listing_factual_reviews (
  listing_id uuid not null references catalog_contrib.listing_requests on delete cascade,
  product_revision_id uuid not null references catalog_contrib.listing_product_versions on delete cascade,
  requested_by uuid references auth.users on delete set null,
  requested_at timestamptz not null default clock_timestamp(),
  responded_by uuid references auth.users on delete set null,
  responded_at timestamptz,
  decision text check (decision in ('confirm', 'requestChanges')),
  note text check (char_length(note) <= 2000),
  primary key (listing_id, product_revision_id),
  check ((decision is null and responded_at is null) or (decision is not null and responded_at is not null))
);
alter table catalog_contrib.listing_requests
  add column product_revision_id uuid references catalog_contrib.listing_product_versions(id) on delete set null,
  add column editorial_revision_id uuid references catalog_contrib.listing_editorial_approvals(id) on delete set null,
  add column requested_revision_id uuid references catalog_contrib.listing_product_versions(id) on delete set null;

create table catalog_private.initial_listing_approvals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid unique references catalog_contrib.listing_requests on delete set null,
  tool_id text not null unique references public.tools(id) on delete restrict,
  brand_id uuid not null,
  version bigint not null,
  base jsonb not null check (jsonb_typeof(base) = 'object'),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  product_revision_id uuid,
  editorial_revision_id uuid,
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9_-]{8,128}$'),
  requested_brand jsonb not null,
  promotion_actor uuid references auth.users on delete set null,
  approved_at timestamptz not null default clock_timestamp(),
  status text not null default 'approved' check (status in ('approved', 'delivered', 'withdrawn')),
  foreign key (brand_id, tool_id) references catalog_contrib.brand_tool_assignments(brand_id, tool_id) on delete restrict
);
alter table catalog_contrib.listing_requests add constraint listing_initial_approval_fk
  foreign key (initial_approval_id) references catalog_private.initial_listing_approvals(id) on delete restrict;

alter table catalog_contrib.listing_product_versions enable row level security;
alter table catalog_contrib.listing_editorial_approvals enable row level security;
alter table catalog_contrib.listing_factual_reviews enable row level security;
alter table catalog_private.initial_listing_approvals enable row level security;
revoke all on catalog_contrib.listing_product_versions, catalog_contrib.listing_editorial_approvals,
  catalog_contrib.listing_factual_reviews, catalog_private.initial_listing_approvals from public, anon, authenticated;
grant select, insert on catalog_contrib.listing_product_versions, catalog_contrib.listing_editorial_approvals,
  catalog_contrib.listing_factual_reviews, catalog_private.initial_listing_approvals to service_role;
grant update (responded_by, responded_at, decision, note) on catalog_contrib.listing_factual_reviews to service_role;
grant usage on schema catalog_private to service_role;
grant select on catalog_private.cms_listing_badges, catalog_private.cms_listing_payments,
  catalog_private.cms_listing_historical_reviews to service_role;

create function catalog_contrib.cms_initial_listing_review_dto(r catalog_contrib.listing_requests, p_admin boolean)
returns jsonb language sql stable security invoker set search_path = pg_catalog as $$
  select jsonb_build_object('review', jsonb_build_object(
    'listing', catalog_contrib.cms_listing_dto(r),
    'approvalId', case when p_admin then r.initial_approval_id else null end,
    'productRevision', (
      select jsonb_build_object('id', p.id, 'hash', p.hash, 'value', p.value)
      from catalog_contrib.listing_product_versions p
      where p.listing_id = r.id and p.id = case when p_admin then r.product_revision_id else r.requested_revision_id end
    ),
    'editorialRevision', (
      select jsonb_build_object('id', e.id, 'hash', e.hash, 'category', e.category, 'fields', e.fields)
      from catalog_contrib.listing_editorial_approvals e
      where p_admin and e.listing_id = r.id and e.id = r.editorial_revision_id
    ),
    'confirmation', (
      select jsonb_build_object('productRevisionId', f.product_revision_id, 'decision', f.decision, 'note', f.note)
      from catalog_contrib.listing_factual_reviews f
      where f.listing_id = r.id and f.product_revision_id = r.requested_revision_id and f.decision is not null
    ),
    'badgeUrl', (
      select b.badge_url from catalog_private.cms_listing_badges b
      where p_admin and b.listing_id = r.id and b.website_url = r.website_url and b.state = 'present'
    )
  ))
$$;

create function catalog_contrib.cms_initial_commercial_evidence(r catalog_contrib.listing_requests)
returns jsonb language sql stable security invoker set search_path = pg_catalog as $$
  select case
    when r.commercial_status <> 'satisfied' or exists (
      select from catalog_private.cms_listing_historical_reviews h where h.listing_id = r.id
    ) then null
    when r.offer = 'standard_badge' then (
      select jsonb_build_object('type', 'standard_badge', 'websiteUrl', b.website_url, 'badgeUrl', b.badge_url)
      from catalog_private.cms_listing_badges b
      where b.listing_id = r.id and b.website_url = r.website_url and b.state = 'present'
    )
    when r.offer = 'priority_paid' then (
      select jsonb_build_object('type', 'priority_paid', 'receiptId', p.id, 'paidAt', p.paid_at)
      from catalog_private.cms_listing_payments p where p.listing_id = r.id and p.owner_id = r.owner_id
        and p.website_url = r.website_url and p.offer_version = r.offer_version
        and p.state = 'paid' and p.checkout_id is not null and p.order_id is not null
        and p.transaction_id is not null and p.paid_at is not null
    )
  end
$$;

create function public.cms_initial_listing_review(p_actor uuid, p_session uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare
  listing catalog_contrib.listing_requests%rowtype;
  product catalog_contrib.listing_product_versions%rowtype;
  editorial catalog_contrib.listing_editorial_approvals%rowtype;
  approval catalog_private.initial_listing_approvals%rowtype;
  is_admin boolean := p_action not in ('ownerRead', 'respondFactualReview');
  next_status text;
  evidence jsonb;
  brand_selection jsonb;
  selected_brand uuid;
  tool_id text;
  selected_decision text;
  decision_note text;
  base jsonb;
begin
  if is_admin then perform catalog_contrib.cms_require_admin(p_actor, p_session);
  else perform catalog_contrib.cms_require_actor(p_actor, p_session); end if;

  select r.* into listing from catalog_contrib.listing_requests r
    where r.id = (p_payload->>'id')::uuid and (
      is_admin or (r.owner_id = p_actor and r.canonical_tool_id is null)
      or (p_action = 'ownerRead' and catalog_contrib.cms_can_read_attached_listing(p_actor, r.canonical_tool_id))
    )
    for update;
  if not found then raise sqlstate 'PT404' using message = 'LISTING_NOT_FOUND'; end if;
  if p_action in ('adminRead', 'ownerRead') then return catalog_contrib.cms_initial_listing_review_dto(listing, is_admin); end if;

  brand_selection := jsonb_build_object('brandId', p_payload->'brandId', 'brandName', p_payload->'brandName', 'brandDomain', p_payload->'brandDomain');
  if listing.initial_approval_id is not null then
    select a.* into strict approval from catalog_private.initial_listing_approvals a where a.id = listing.initial_approval_id;
    if p_action = 'promoteInitial' and approval.idempotency_key = p_payload->>'idempotencyKey'
      and approval.product_revision_id = (p_payload->>'productRevisionId')::uuid
      and approval.editorial_revision_id = (p_payload->>'editorialRevisionId')::uuid
      and approval.requested_brand = brand_selection then
      return jsonb_build_object('approval', jsonb_build_object('approvalId', approval.id, 'toolId', approval.tool_id, 'version', approval.version));
    end if;
    raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE';
  end if;
  if listing.canonical_tool_id is not null then raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE'; end if;
  if listing.lock_version is distinct from (p_payload->>'version')::bigint then
    raise sqlstate 'PT409' using message = 'LISTING_REVISION_CONFLICT';
  end if;

  if p_action = 'prepareInitial' then
    if listing.status not in ('submitted', 'in_preparation', 'changes_requested', 'ready') then
      raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE';
    end if;
    if p_payload->'value'->>'websiteUrl' is distinct from listing.website_url then
      raise sqlstate 'PT409' using message = 'LISTING_COMMERCIAL_IDENTITY_MISMATCH';
    end if;
    insert into catalog_contrib.listing_product_versions(listing_id, version, value, hash, created_by)
      values(listing.id, listing.lock_version + 1, p_payload->'value', p_payload->>'hash', p_actor)
      returning * into product;
    listing.product_revision_id := product.id;
    listing.requested_revision_id := null;
    listing.status := 'in_preparation';
  elsif p_action = 'requestFactualReview' then
    if listing.status <> 'in_preparation' or listing.product_revision_id is null
      or listing.product_revision_id is distinct from (p_payload->>'productRevisionId')::uuid
      or listing.requested_revision_id is not null then
      raise sqlstate 'PT409' using message = 'LISTING_REVIEW_INCOMPLETE';
    end if;
    insert into catalog_contrib.listing_factual_reviews(listing_id, product_revision_id, requested_by)
      values(listing.id, listing.product_revision_id, p_actor);
    listing.requested_revision_id := listing.product_revision_id;
    listing.status := 'facts_to_review';
  elsif p_action = 'respondFactualReview' then
    if listing.status <> 'facts_to_review' or listing.requested_revision_id is null
      or listing.requested_revision_id is distinct from (p_payload->>'productRevisionId')::uuid
      or not exists (
        select from catalog_contrib.listing_product_versions p
        where p.id = listing.requested_revision_id and p.listing_id = listing.id and p.hash = p_payload->>'hash'
      ) then raise sqlstate 'PT409' using message = 'LISTING_REVISION_CONFLICT'; end if;
    selected_decision := p_payload->>'decision';
    decision_note := btrim(p_payload->>'note');
    if selected_decision is null or selected_decision not in ('confirm', 'requestChanges') or decision_note is null
      or char_length(decision_note) > 2000 or (selected_decision = 'requestChanges' and decision_note = '') then
      raise sqlstate 'PT400' using message = 'INVALID_LISTING_REQUEST';
    end if;
    update catalog_contrib.listing_factual_reviews f
      set responded_by = p_actor, responded_at = clock_timestamp(), decision = selected_decision, note = decision_note
      where f.listing_id = listing.id and f.product_revision_id = listing.requested_revision_id and f.decision is null;
    if not found then raise sqlstate 'PT409' using message = 'LISTING_REVISION_CONFLICT'; end if;
    listing.status := case when selected_decision = 'requestChanges' then 'changes_requested'
      when listing.editorial_revision_id is not null then 'ready' else 'in_preparation' end;
  elsif p_action = 'approveInitialEditorial' then
    if listing.status not in ('submitted', 'in_preparation', 'facts_to_review', 'changes_requested', 'ready') then
      raise sqlstate 'PT409' using message = 'LISTING_NOT_EDITABLE';
    end if;
    if exists (select from jsonb_object_keys(p_payload->'fields') as fields(key) where key not in (
      'longDescription', 'longDescriptionEn', 'verdict', 'verdictEn', 'pros', 'prosEn', 'cons', 'consEn', 'toolTrimRating', 'seo'
    )) or nullif(btrim(p_payload->'fields'->>'longDescription'), '') is null
      or nullif(btrim(p_payload->'fields'->>'longDescriptionEn'), '') is null then
      raise sqlstate 'PT400' using message = 'INVALID_LISTING_REQUEST';
    end if;
    insert into catalog_contrib.listing_editorial_approvals(listing_id, version, category, fields, hash, approved_by)
      values(listing.id, listing.lock_version + 1, p_payload->>'category', p_payload->'fields', p_payload->>'hash', p_actor)
      returning * into editorial;
    listing.editorial_revision_id := editorial.id;
    if listing.product_revision_id = listing.requested_revision_id and exists (
      select from catalog_contrib.listing_factual_reviews f where f.listing_id = listing.id
        and f.product_revision_id = listing.product_revision_id and f.decision = 'confirm'
    ) then listing.status := 'ready'; end if;

  elsif p_action = 'promoteInitial' then
    if listing.status <> 'ready' or listing.product_revision_id is null or listing.editorial_revision_id is null
      or listing.product_revision_id is distinct from (p_payload->>'productRevisionId')::uuid
      or listing.editorial_revision_id is distinct from (p_payload->>'editorialRevisionId')::uuid
      or listing.representation_status not in ('pending', 'verified')
      or not exists (
        select from catalog_contrib.listing_factual_reviews f where f.listing_id = listing.id
          and f.product_revision_id = listing.product_revision_id and f.responded_by = listing.owner_id and f.decision = 'confirm'
      ) then raise sqlstate 'PT409' using message = 'LISTING_REVIEW_INCOMPLETE'; end if;

    perform from public.profiles p join auth.users u on u.id = p.id
      where p.id = listing.owner_id and p.account_status = 'active' and u.email_confirmed_at is not null for share of p;
    if not found then raise sqlstate 'PT403' using message = 'CMS_ACCESS_DENIED'; end if;

    evidence := catalog_contrib.cms_initial_commercial_evidence(listing);
    if evidence is null or (listing.offer = 'standard_badge' and (
      evidence->>'badgeUrl' is distinct from p_payload->>'verifiedBadgeUrl'
      or coalesce((p_payload->>'badgeVerifiedAt')::timestamptz < clock_timestamp() - interval '2 minutes', true)
      or (p_payload->>'badgeVerifiedAt')::timestamptz > clock_timestamp() + interval '5 seconds'
    )) then raise sqlstate 'PT409' using message = 'LISTING_REQUIREMENTS_PENDING'; end if;
    if listing.offer = 'standard_badge' then evidence := evidence || jsonb_build_object('verifiedAt', p_payload->>'badgeVerifiedAt'); end if;

    select p.* into strict product from catalog_contrib.listing_product_versions p where p.id = listing.product_revision_id and p.listing_id = listing.id;
    select e.* into strict editorial from catalog_contrib.listing_editorial_approvals e where e.id = listing.editorial_revision_id and e.listing_id = listing.id;
    selected_brand := (p_payload->>'brandId')::uuid;
    if selected_brand is null then
      insert into catalog_contrib.brands (name, website_domain, status, created_by)
        values(p_payload->>'brandName', p_payload->>'brandDomain', 'verified', listing.owner_id)
        on conflict do nothing returning id into selected_brand;
      if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
      insert into catalog_contrib.brand_memberships (brand_id, user_id, role, status, invited_by, accepted_at)
        values(selected_brand, listing.owner_id, 'owner', 'active', p_actor, clock_timestamp());
    else
      perform from catalog_contrib.brands b join catalog_contrib.brand_memberships m on m.brand_id = b.id
        where b.id = selected_brand and b.status = 'verified' and m.user_id = listing.owner_id
          and m.status = 'active' and m.role in ('owner','admin','editor') for share of b, m;
      if not found then raise sqlstate 'PT409' using message = 'LISTING_ATTRIBUTION_CONFLICT'; end if;
    end if;

    perform catalog_contrib.cms_reserve_listing_slug(listing.id, listing.slug, clock_timestamp() + interval '30 days');
    tool_id := 'listing-' || replace(listing.id::text, '-', '');
    insert into public.tools (id, slug, name, website_url, content_status)
      values(tool_id, listing.slug, product.value->>'name', product.value->>'websiteUrl', 'draft') on conflict do nothing;
    if not found then raise sqlstate 'PT409' using message = 'LISTING_SLUG_UNAVAILABLE'; end if;
    insert into catalog_contrib.brand_tool_assignments(brand_id, tool_id, status, is_primary, verification_method, verified_by, verified_at)
      values(selected_brand, tool_id, 'verified', true, 'tooltrim_initial_review', p_actor, clock_timestamp());
    insert into catalog_contrib.cms_tool_drafts(brand_id, tool_id, value)
      values(selected_brand, tool_id, product.value);

    base := editorial.fields || jsonb_build_object('id', tool_id, 'slug', listing.slug,
      'name', product.value->>'name', 'category', editorial.category);
    insert into catalog_private.initial_listing_approvals (
      listing_id, tool_id, brand_id, version, base, value, product_revision_id, editorial_revision_id,
      evidence, idempotency_key, requested_brand, promotion_actor
    ) values(
      listing.id, tool_id, selected_brand, listing.lock_version + 1, base, product.value, product.id, editorial.id,
      evidence, p_payload->>'idempotencyKey', brand_selection, p_actor
    ) returning * into approval;
    update catalog_contrib.listing_requests set canonical_tool_id = tool_id, initial_approval_id = approval.id,
      representation_status = 'verified', lock_version = approval.version, updated_at = clock_timestamp(),
      reservation_expires_at = clock_timestamp() + interval '30 days'
      where id = listing.id;
    return jsonb_build_object('approval', jsonb_build_object('approvalId', approval.id, 'toolId', approval.tool_id, 'version', approval.version));

  else raise sqlstate 'PT400' using message = 'INVALID_LISTING_REQUEST'; end if;

  update catalog_contrib.listing_requests set lock_version = lock_version + 1, updated_at = clock_timestamp(),
    status = listing.status, product_revision_id = listing.product_revision_id,
    editorial_revision_id = listing.editorial_revision_id, requested_revision_id = listing.requested_revision_id
    where id = listing.id returning * into listing;
  return catalog_contrib.cms_initial_listing_review_dto(listing, is_admin);
end $$;

create function public.cms_initial_release_inputs(p_actor uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor, p_session);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'approvalId', a.id, 'toolId', a.tool_id, 'version', a.version,
      'baseHash', null, 'base', a.base, 'value', a.value, 'commercialEvidence', a.evidence,
      'attached', r.id is not null and r.representation_status = 'verified'
        and catalog_contrib.cms_initial_commercial_evidence(r) is not null and exists (
          select from catalog_contrib.brand_tool_assignments x
          join catalog_contrib.brands b on b.id = x.brand_id
          join catalog_contrib.brand_memberships m on m.brand_id = x.brand_id
          join public.profiles p on p.id = m.user_id
          where x.brand_id = a.brand_id and x.tool_id = a.tool_id and x.status = 'verified' and x.is_primary
            and b.status = 'verified' and m.status = 'active' and m.user_id = r.owner_id and p.account_status = 'active'
        )
    ) order by a.tool_id)
    from catalog_private.initial_listing_approvals a
    left join catalog_contrib.listing_requests r on r.id = a.listing_id and r.initial_approval_id = a.id
    where a.status = 'approved'
  ), '[]'::jsonb);
end $$;

revoke all on function catalog_contrib.cms_initial_listing_review_dto(catalog_contrib.listing_requests, boolean),
  catalog_contrib.cms_initial_commercial_evidence(catalog_contrib.listing_requests),
  public.cms_initial_listing_review(uuid, uuid, text, jsonb),
  public.cms_initial_release_inputs(uuid, uuid) from public, anon, authenticated;
grant execute on function catalog_contrib.cms_initial_listing_review_dto(catalog_contrib.listing_requests, boolean),
  catalog_contrib.cms_initial_commercial_evidence(catalog_contrib.listing_requests),
  public.cms_initial_listing_review(uuid, uuid, text, jsonb),
  public.cms_initial_release_inputs(uuid, uuid) to service_role;

commit;
