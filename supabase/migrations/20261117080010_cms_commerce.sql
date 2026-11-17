begin;

-- Payment and badge evidence are separate from editor permissions and editorial status.
create table catalog_private.cms_listing_payments (
  listing_id uuid primary key references catalog_contrib.listing_requests(id) on delete cascade,
  id uuid unique not null default gen_random_uuid(),
  owner_id uuid not null,
  website_url text not null,
  locale text not null check (locale in ('fr', 'en')),
  offer_version integer not null check (offer_version = 1),
  mode text not null default 'prod' check (mode in ('prod','test')),
  product_id text not null default 'prod_2LMoN4zyRhNAb53r3rWpwX',
  dispatch_started_at timestamptz,
  checkout_id text unique,
  checkout_url text,
  order_id text unique,
  transaction_id text unique,
  state text not null default 'pending' check (state in ('pending', 'paid', 'review_required')),
  paid_at timestamptz
);

create table catalog_private.cms_listing_badges (
  listing_id uuid primary key references catalog_contrib.listing_requests(id) on delete cascade,
  website_url text not null,
  badge_url text not null,
  state text not null check (state in ('present', 'missing', 'unreachable')),
  checked_at timestamptz not null default now()
);

create table catalog_private.cms_listing_historical_reviews (
  listing_id uuid primary key references catalog_contrib.listing_requests(id) on delete cascade,
  requested_at timestamptz not null default now()
);

-- Keep only provider identifiers when a publisher deletes their private account.
create table catalog_private.cms_consumed_listing_receipts (
  attempt_id uuid primary key,
  checkout_id text unique not null,
  order_id text unique not null,
  transaction_id text unique not null
);

alter table catalog_contrib.listing_requests add column last_badge_requested_at timestamptz;

create table catalog_private.cms_listing_billing_events (
  id text primary key,
  kind text not null check (kind in ('checkout.completed', 'refund.created', 'dispute.created')),
  occurred_at timestamptz not null,
  transaction_id text not null,
  listing_id uuid references catalog_contrib.listing_requests(id) on delete set null
);
create index cms_listing_billing_incidents on catalog_private.cms_listing_billing_events (transaction_id)
  where kind in ('refund.created', 'dispute.created');

alter table catalog_private.cms_listing_payments enable row level security;
alter table catalog_private.cms_listing_badges enable row level security;
alter table catalog_private.cms_listing_historical_reviews enable row level security;
alter table catalog_private.cms_listing_billing_events enable row level security;
alter table catalog_private.cms_consumed_listing_receipts enable row level security;
revoke all on catalog_private.cms_listing_payments, catalog_private.cms_listing_badges,
  catalog_private.cms_listing_historical_reviews, catalog_private.cms_listing_billing_events,
  catalog_private.cms_consumed_listing_receipts from public, anon, authenticated;

create function catalog_private.cms_payment_attempt(p catalog_private.cms_listing_payments)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select case when p.id is not null then jsonb_build_object(
    'id', p.id, 'listingId', p.listing_id, 'ownerId', p.owner_id, 'websiteUrl', p.website_url,
    'locale', p.locale, 'offerVersion', p.offer_version, 'productId', p.product_id,
    'mode', p.mode, 'checkoutId', p.checkout_id, 'dispatchStartedAt', p.dispatch_started_at
  ) end;
$$;

create function public.cms_listing_commerce(
  p_actor uuid, p_session uuid, p_listing uuid, p_action text, p_value jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  listing catalog_contrib.listing_requests%rowtype;
  payment catalog_private.cms_listing_payments%rowtype;
  badge catalog_private.cms_listing_badges%rowtype;
  historical boolean;
  dispatch boolean := false;
  verify_badge boolean := false;
  state text;
begin
  perform catalog_contrib.cms_require_listing_account(p_actor, p_session);
  select * into listing from catalog_contrib.listing_requests d
    where d.id = p_listing and d.owner_id = p_actor for update;
  if not found or listing.status = 'archived' then raise sqlstate 'PT404'; end if;
  if listing.representation_status = 'revoked' then raise sqlstate 'PT403'; end if;

  select * into payment from catalog_private.cms_listing_payments p where p.listing_id = p_listing;
  select * into badge from catalog_private.cms_listing_badges b where b.listing_id = p_listing and b.website_url = listing.website_url;
  select exists (select 1 from catalog_private.cms_listing_historical_reviews h where h.listing_id = p_listing) into historical;

  if p_action in ('prepare', 'dispatch', 'bind', 'requestHistoricalReview') and (
      listing.canonical_tool_id is not null or listing.status = 'rejected' or listing.offer not in ('standard_badge', 'priority_paid')
      or (listing.status = 'draft' and listing.reservation_expires_at <= now())
    ) then raise sqlstate 'PT409'; end if;

  case p_action
    when 'status' then null;
    when 'prepare' then
      if not historical and payment.id is null then
        insert into catalog_private.cms_listing_payments(listing_id, owner_id, website_url, locale, offer_version, mode, product_id)
        values (p_listing, p_actor, listing.website_url, listing.locale, listing.offer_version,
          coalesce(p_value->>'mode','prod'), coalesce(p_value->>'productId','prod_2LMoN4zyRhNAb53r3rWpwX')) returning * into payment;
        if listing.offer = 'priority_paid' then
          update catalog_contrib.listing_requests set commercial_status = 'verifying' where id = p_listing;
        end if;
      end if;
    when 'dispatch' then
      if not historical and payment.state = 'pending' and payment.dispatch_started_at is null then
        update catalog_private.cms_listing_payments set dispatch_started_at = now() where listing_id = p_listing
          returning * into payment;
        dispatch := true;
        if listing.commercial_status = 'pending' then
          update catalog_contrib.listing_requests set commercial_status = 'verifying' where id = p_listing;
        end if;
      end if;
    when 'bind' then
      if payment.dispatch_started_at is null or payment.id::text is distinct from (p_value->>'attemptId')
        or (payment.checkout_id is not null and payment.checkout_id is distinct from (p_value->>'checkoutId'))
        or (p_value->>'checkoutId') is null or (p_value->>'checkoutUrl') is null then raise sqlstate 'PT409'; end if;
      update catalog_private.cms_listing_payments p set checkout_id = p_value->>'checkoutId', checkout_url = p_value->>'checkoutUrl'
        where p.id = payment.id returning * into payment;
    when 'beginBadge' then
      if listing.offer <> 'standard_badge' or historical then raise sqlstate 'PT409'; end if;
      if listing.last_badge_requested_at > clock_timestamp() - interval '10 seconds' then
        if p_value->>'reuseRecent' is distinct from 'true' or badge.state is distinct from 'present'
          or badge.checked_at < listing.last_badge_requested_at then raise sqlstate 'PT429'; end if;
      else
        update catalog_contrib.listing_requests set last_badge_requested_at = clock_timestamp()
          where id = p_listing returning * into listing;
        verify_badge := true;
      end if;
    when 'badge' then
      if listing.offer <> 'standard_badge' or listing.website_url is distinct from (p_value->>'websiteUrl')
        or listing.last_badge_requested_at is null
        or listing.last_badge_requested_at is distinct from (p_value->>'requestedAt')::timestamptz then
        raise sqlstate 'PT409';
      end if;
      insert into catalog_private.cms_listing_badges (listing_id, website_url, badge_url, state)
      values (p_listing, listing.website_url, p_value->>'badgeUrl', p_value->>'state')
      on conflict (listing_id) do update set website_url = excluded.website_url, badge_url = excluded.badge_url,
        state = excluded.state, checked_at = clock_timestamp() returning * into badge;
      if listing.canonical_tool_id is null and not historical then
        update catalog_contrib.listing_requests set commercial_status =
          case when badge.state = 'present' then 'satisfied'
            when payment.dispatch_started_at is not null then 'verifying' else 'pending' end where id = p_listing;
      end if;
    when 'requestHistoricalReview' then
      if payment.dispatch_started_at is not null then raise sqlstate 'PT409'; end if;
      insert into catalog_private.cms_listing_historical_reviews(listing_id) values (p_listing) on conflict do nothing;
      update catalog_contrib.listing_requests set commercial_status = 'issue' where id = p_listing;
      historical := true;
    else raise sqlstate 'PT400';
  end case;

  state := case when historical then 'review_required'
    when payment.state in ('paid', 'review_required') then payment.state
    when payment.id is not null and (payment.dispatch_started_at is not null or p_action in ('prepare', 'dispatch', 'bind'))
      then 'pending'
    when listing.offer = 'priority_paid' then 'pending'
    else coalesce(badge.state, 'unchecked') end;
  return jsonb_build_object('state', state, 'checkedAt', badge.checked_at, 'checkoutUrl', payment.checkout_url,
    'historicalReview', historical, 'badgeUrl', badge.badge_url, 'websiteUrl', listing.website_url,
    'attempt', catalog_private.cms_payment_attempt(payment), 'dispatch', dispatch, 'badgeRequestedAt', listing.last_badge_requested_at, 'badgeVerificationRequired', verify_badge);
end;
$$;

create function public.cms_lookup_listing_payment(p_attempt uuid, p_event text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'duplicate', exists (select 1 from catalog_private.cms_listing_billing_events e where e.id = p_event),
    'attempt', (select catalog_private.cms_payment_attempt(p) from catalog_private.cms_listing_payments p
      where p.id = p_attempt and p.dispatch_started_at is not null)
  );
$$;

create function public.cms_apply_listing_billing(
  p_event text, p_kind text, p_occurred_at timestamptz, p_proof jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  payment catalog_private.cms_listing_payments%rowtype;
  target uuid;
  transaction text := p_proof->>'transactionId';
  incident boolean := p_kind in ('refund.created', 'dispute.created');
  next_state text;
begin
  if transaction is null or (p_event is null and p_kind <> 'reconcile') then raise sqlstate 'PT400'; end if;
  -- Serialize matched and unmatched incidents with paid reads of this transaction.
  perform pg_advisory_xact_lock(hashtextextended(transaction, 0));
  if p_event is not null and exists (select 1 from catalog_private.cms_listing_billing_events e where e.id = p_event) then
    return jsonb_build_object('duplicate', true);
  end if;
  if incident then
    select p.listing_id into target from catalog_private.cms_listing_payments p where p.transaction_id = transaction;
  else
    select p.listing_id into target from catalog_private.cms_listing_payments p where p.id = (p_proof->>'attemptId')::uuid;
    if target is null then raise sqlstate 'PT404'; end if;
  end if;
  if p_event is not null then
    insert into catalog_private.cms_listing_billing_events(id, kind, occurred_at, transaction_id, listing_id)
    values (p_event, p_kind, p_occurred_at, transaction, target) on conflict do nothing;
    if not found then return jsonb_build_object('duplicate', true); end if;
  end if;
  if target is null then return jsonb_build_object('duplicate', false); end if;

  perform 1 from catalog_contrib.listing_requests where id = target for update;
  select * into payment from catalog_private.cms_listing_payments p where p.listing_id = target;
  if payment.dispatch_started_at is null then raise sqlstate 'PT409'; end if;
  next_state := case when incident or payment.state = 'review_required' or p_proof->>'state' = 'review_required'
    or exists (select 1 from catalog_private.cms_listing_billing_events e
        where e.transaction_id = transaction and e.kind in ('refund.created', 'dispute.created'))
    then 'review_required' else 'paid' end;

  if not incident then
    if p_proof->>'checkoutId' is null or p_proof->>'orderId' is null or p_proof->>'paidAt' is null
      or (payment.checkout_id is not null and payment.checkout_id is distinct from (p_proof->>'checkoutId'))
      or (payment.order_id is not null and payment.order_id is distinct from (p_proof->>'orderId'))
      or (payment.transaction_id is not null and payment.transaction_id is distinct from transaction) then raise sqlstate 'PT409'; end if;
    insert into catalog_private.cms_consumed_listing_receipts (attempt_id, checkout_id, order_id, transaction_id)
      values (payment.id, p_proof->>'checkoutId', p_proof->>'orderId', transaction) on conflict (attempt_id) do nothing;
    update catalog_private.cms_listing_payments p set checkout_id = p_proof->>'checkoutId', order_id = p_proof->>'orderId',
      transaction_id = transaction, paid_at = coalesce(p.paid_at, (p_proof->>'paidAt')::timestamptz), state = next_state
      where p.listing_id = target;
    update catalog_private.cms_listing_billing_events e set listing_id = target
      where e.transaction_id = transaction and e.listing_id is null and e.kind in ('refund.created', 'dispute.created');
  else
    update catalog_private.cms_listing_payments set state = next_state where listing_id = target;
  end if;

  update catalog_contrib.listing_requests set
    offer = 'priority_paid', commercial_status = case when next_state = 'paid' then 'satisfied' else 'issue' end
    where id = target;
  return jsonb_build_object('duplicate', false, 'state', next_state);
end;
$$;

revoke all on function catalog_private.cms_payment_attempt(catalog_private.cms_listing_payments),
  public.cms_listing_commerce(uuid, uuid, uuid, text, jsonb),
  public.cms_lookup_listing_payment(uuid, text), public.cms_apply_listing_billing(text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.cms_listing_commerce(uuid, uuid, uuid, text, jsonb),
  public.cms_lookup_listing_payment(uuid, text), public.cms_apply_listing_billing(text, text, timestamptz, jsonb) to service_role;

commit;
