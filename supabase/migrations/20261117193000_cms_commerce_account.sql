begin;

-- Only persist totals actually read from a verified provider receipt. Older rows stay unknown.
alter table catalog_private.cms_listing_payments
  add column amount_paid_minor bigint check (amount_paid_minor > 0),
  add column currency text check (currency = 'USD');

create or replace function public.cms_listing_commerce(
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
  -- Match release locking order: shared publication lock first, then the listing row.
  if p_action in ('prepare','dispatch','bind','requestHistoricalReview') then
    perform pg_advisory_xact_lock(864203174);
  end if;
  perform catalog_contrib.cms_require_listing_account(p_actor, p_session);
  -- Match release preparation lock order before locking the application row.
  if p_action in ('prepare','dispatch','requestHistoricalReview') then
    perform pg_advisory_xact_lock(864203174);
  end if;
  select * into listing from catalog_contrib.listing_requests d
    where d.id = p_listing and d.owner_id = p_actor for update;
  if not found or (listing.status = 'archived' and p_action <> 'status') then raise sqlstate 'PT404'; end if;
  if listing.representation_status in ('revoked','rejected') then raise sqlstate 'PT403'; end if;
  if listing.canonical_tool_id is not null then
    perform 1 from catalog_contrib.cms_require_tool_access(p_actor,p_session,listing.canonical_tool_id,p_action <> 'status');
  end if;

  select * into payment from catalog_private.cms_listing_payments p where p.listing_id = p_listing;
  select * into badge from catalog_private.cms_listing_badges b where b.listing_id = p_listing and b.website_url = listing.website_url;
  select exists (select 1 from catalog_private.cms_listing_historical_reviews h where h.listing_id = p_listing) into historical;

  if p_action in ('prepare', 'dispatch', 'bind', 'requestHistoricalReview') and (
      (listing.canonical_tool_id is not null and listing.delivery_status <> 'published') or listing.status = 'rejected' or listing.offer not in ('standard_badge', 'priority_paid')
      or (listing.status = 'draft' and listing.reservation_expires_at <= now())
    ) then raise sqlstate 'PT409'; end if;

  if p_action in ('prepare','dispatch','requestHistoricalReview') then
    -- Serialize with release preparation; commercial proofs must not change under a sealed batch.
    if listing.canonical_tool_id is not null and exists (
      select from catalog_contrib.cms_release_batches b,
        jsonb_array_elements(b.manifest->'items') i
      where b.cancelled_at is null and b.verified_at is null
        and i->>'toolId' = listing.canonical_tool_id
    ) then raise sqlstate 'PT409'; end if;
  end if;

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
        if listing.offer = 'priority_paid' and listing.commercial_status = 'pending' then
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
    'canUpgrade', listing.offer = 'standard_badge' and listing.status not in ('archived','rejected')
      and not historical and payment.id is null
      and (listing.canonical_tool_id is null or listing.delivery_status = 'published')
      and not (listing.status = 'draft' and listing.reservation_expires_at <= now())
      and not exists (select from catalog_contrib.cms_release_batches b, jsonb_array_elements(b.manifest->'items') i
        where b.cancelled_at is null and b.verified_at is null and i->>'toolId' = listing.canonical_tool_id),
    'payments', case when payment.paid_at is not null then jsonb_build_array(jsonb_build_object(
      'reference', payment.order_id, 'paidAt', payment.paid_at, 'amountPaidMinor', payment.amount_paid_minor,
      'currency', payment.currency, 'status', payment.state, 'mode', payment.mode)) else '[]'::jsonb end,
    'attempt', catalog_private.cms_payment_attempt(payment), 'dispatch', dispatch, 'badgeRequestedAt', listing.last_badge_requested_at, 'badgeVerificationRequired', verify_badge);
end;
$$;

create or replace function public.cms_apply_listing_billing(
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
  perform pg_advisory_xact_lock(864203174);
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
    if p_proof ? 'amountPaidMinor' and (
      jsonb_typeof(p_proof->'amountPaidMinor') <> 'number'
      or (p_proof->>'amountPaidMinor') !~ '^[0-9]+$'
      or (p_proof->>'amountPaidMinor')::numeric <= 0
      or (p_proof->>'amountPaidMinor')::numeric > 9007199254740991
      or p_proof->>'currency' is distinct from 'USD'
    ) then raise sqlstate 'PT400'; end if;
    if payment.amount_paid_minor is not null and p_proof ? 'amountPaidMinor'
      and payment.amount_paid_minor is distinct from (p_proof->>'amountPaidMinor')::bigint then raise sqlstate 'PT409'; end if;
    if p_proof->>'checkoutId' is null or p_proof->>'orderId' is null or p_proof->>'paidAt' is null
      or (payment.checkout_id is not null and payment.checkout_id is distinct from (p_proof->>'checkoutId'))
      or (payment.order_id is not null and payment.order_id is distinct from (p_proof->>'orderId'))
      or (payment.transaction_id is not null and payment.transaction_id is distinct from transaction) then raise sqlstate 'PT409'; end if;
    insert into catalog_private.cms_consumed_listing_receipts (attempt_id, checkout_id, order_id, transaction_id)
      values (payment.id, p_proof->>'checkoutId', p_proof->>'orderId', transaction) on conflict (attempt_id) do nothing;
    update catalog_private.cms_listing_payments p set checkout_id = p_proof->>'checkoutId', order_id = p_proof->>'orderId',
      amount_paid_minor = coalesce(p.amount_paid_minor,(p_proof->>'amountPaidMinor')::bigint),
      currency = coalesce(p.currency,p_proof->>'currency'),
      transaction_id = transaction, paid_at = coalesce(p.paid_at, (p_proof->>'paidAt')::timestamptz), state = next_state
      where p.listing_id = target;
    update catalog_private.cms_listing_billing_events e set listing_id = target
      where e.transaction_id = transaction and e.listing_id is null and e.kind in ('refund.created', 'dispute.created');
  else
    update catalog_private.cms_listing_payments set state = next_state where listing_id = target;
  end if;

  update catalog_contrib.listing_requests set
    offer = case when next_state = 'paid' then 'priority_paid' else offer end,
    commercial_status = case when next_state = 'paid' then 'satisfied'
      when offer = 'priority_paid' then 'issue' else commercial_status end
    where id = target;
  return jsonb_build_object('duplicate', false, 'state', next_state);
end;
$$;


create or replace function public.cms_seal_release_batch(p_actor uuid, p_session uuid, p_key text, p_manifest jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
  eligible jsonb;
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

  perform pg_advisory_xact_lock(864203174);
  select b.* into batch from catalog_contrib.cms_release_batches b where b.batch_key = p_key for update;
  if found then
    if batch.cancelled_at is not null or batch.manifest is distinct from p_manifest then
      raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED';
    end if;
    if batch.commit_sha is not null then return to_jsonb(batch) - 'prepared_by'; end if;
    if batch.leased_until > clock_timestamp() then
      raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS';
    end if;
  elsif exists (select from catalog_contrib.cms_release_batches b where b.cancelled_at is null and b.verified_at is null) then
    raise sqlstate 'PT409' using message = 'CMS_RELEASE_VERIFICATION_PENDING';
  end if;

  -- A checkout dispatched before sealing can still change the offer. Wait for its
  -- receipt/reconciliation rather than freezing obsolete commercial evidence.
  if exists (
    select from catalog_private.cms_listing_payments p
    join catalog_contrib.listing_requests r on r.id = p.listing_id
    where p.state = 'pending' and p.dispatch_started_at is not null
      and exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'toolId' = r.canonical_tool_id)
  ) then raise sqlstate 'PT409' using message = 'CMS_PAYMENT_RECONCILIATION_PENDING'; end if;

  -- Lock the exact approvals and verification records before validating the sealed set.
  perform 1 from catalog_contrib.cms_tool_submissions s
    where exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'approvalId' = s.id::text)
    order by s.id for share;
  perform 1 from catalog_private.initial_listing_approvals a
    where exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'approvalId' = a.id::text)
    order by a.id for share;
  perform 1 from catalog_contrib.brand_tool_assignments a
    join catalog_contrib.brands b on b.id = a.brand_id
    where a.status = 'verified' and a.is_primary
      and exists (select from jsonb_array_elements(p_manifest->'items') i where i->>'toolId' = a.tool_id)
    order by a.tool_id for share of a, b;
  eligible := public.cms_approved_release_inputs(p_actor, p_session) || public.cms_initial_release_inputs(p_actor, p_session);
  if exists (
    select from jsonb_array_elements(p_manifest->'items') i
    where not exists (
      select from jsonb_array_elements(eligible) e
      where e->'attached' = 'true'::jsonb and e->>'approvalId' = i->>'approvalId'
        and e->>'toolId' = i->>'toolId' and e->>'version' = i->>'version'
    )
  ) then raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED'; end if;

  insert into catalog_contrib.cms_release_batches(batch_key,manifest,prepared_by)
    values (p_key,p_manifest,p_actor)
    on conflict (batch_key) do update set leased_until = clock_timestamp() + interval '3 minutes'
    returning * into batch;
  return to_jsonb(batch) - 'prepared_by';
end $$;


commit;
