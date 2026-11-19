begin;

alter table catalog_contrib.listing_requests
  add column commercial_revision bigint not null default 1,
  add column commercial_published_revision bigint not null default 0;
alter table catalog_private.cms_listing_historical_reviews
  add column resolved_at timestamptz,
  add column resolved_by uuid,
  add column review_note text,
  add column payment_reference uuid;

create or replace function catalog_private.cms_payment_attempt(p catalog_private.cms_listing_payments)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select case when p.id is not null then jsonb_build_object(
    'id',p.id,'listingId',p.listing_id,'ownerId',p.owner_id,'websiteUrl',p.website_url,
    'locale',p.locale,'offerVersion',p.offer_version,'productId',p.product_id,
    'mode',p.mode,'checkoutId',p.checkout_id,'dispatchStartedAt',p.dispatch_started_at,
    'legacyReference',(select h.payment_reference from catalog_private.cms_listing_historical_reviews h
      where h.listing_id=p.listing_id and h.resolved_at is not null)
  ) end;
$$;

create function catalog_private.cms_bump_commerce_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'listing_requests' then
    if new.offer is distinct from old.offer or new.commercial_status is distinct from old.commercial_status then
      new.commercial_revision := old.commercial_revision + 1;
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and row(new.state,new.paid_at,new.amount_paid_minor,new.currency,new.checkout_id,new.order_id,new.transaction_id)
    is not distinct from row(old.state,old.paid_at,old.amount_paid_minor,old.currency,old.checkout_id,old.order_id,old.transaction_id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(864203174);
  if exists (select from catalog_contrib.cms_release_batches b,
    jsonb_array_elements(coalesce(b.manifest->'commercialItems','[]'::jsonb)) i
    where b.commit_sha is null and b.cancelled_at is null and i->>'approvalId' = new.listing_id::text
  ) then raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS'; end if;
  update catalog_contrib.listing_requests set commercial_revision = commercial_revision + 1 where id = new.listing_id;
  return new;
end $$;
create trigger cms_commerce_revision before update of offer,commercial_status on catalog_contrib.listing_requests
  for each row execute function catalog_private.cms_bump_commerce_revision();
create trigger cms_payment_revision after insert or update on catalog_private.cms_listing_payments
  for each row execute function catalog_private.cms_bump_commerce_revision();

-- Resolve the old receipt once, under the same admin/session and ownership lock.
create function public.cms_admin_listing_payment(p_actor uuid,p_session uuid,p_listing uuid,p_action text,p_proof jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r catalog_contrib.listing_requests%rowtype; p catalog_private.cms_listing_payments%rowtype; attempt uuid;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  perform pg_advisory_xact_lock(864203174);
  select * into r from catalog_contrib.listing_requests where id=p_listing for update;
  if not found then raise sqlstate 'PT404'; end if;
  select * into p from catalog_private.cms_listing_payments where listing_id=r.id;
  if p_action='inspect' then
    return jsonb_build_object('listingId',r.id,'name',r.name,'websiteUrl',r.website_url,'ownerId',r.owner_id,
      'reviewRequested',exists(select from catalog_private.cms_listing_historical_reviews where listing_id=r.id and resolved_at is null),
      'paid',p.state='paid');
  end if;
  if p_action<>'attach' then raise sqlstate 'PT400'; end if;
  if r.status in ('archived','rejected') or r.representation_status in ('revoked','rejected')
    or r.website_url is distinct from p_proof->>'websiteUrl'
    or length(btrim(coalesce(p_proof->>'reviewNote',''))) not between 20 and 2000
    or p_proof->>'state' is distinct from 'paid' or p_proof->>'currency' is distinct from 'USD'
    or coalesce(p_proof->>'amountPaidMinor','') !~ '^[0-9]+$'
    or (p_proof->>'amountPaidMinor')::numeric not between 1 and 9007199254740991
    or p_proof->>'checkoutId' is null or p_proof->>'orderId' is null or p_proof->>'transactionId' is null
    or p_proof->>'paidAt' is null or p_proof->>'paymentReference' is null then raise sqlstate 'PT409'; end if;
  if p.state='paid' and p.checkout_id=p_proof->>'checkoutId' and p.order_id=p_proof->>'orderId' then
    return jsonb_build_object('state','paid','reference',p.order_id,'paidAt',p.paid_at,'amountPaidMinor',p.amount_paid_minor,'currency',p.currency);
  end if;
  if p.dispatch_started_at is not null or not exists(select from catalog_private.cms_listing_historical_reviews where listing_id=r.id and resolved_at is null)
    then raise sqlstate 'PT409' using message='CMS_RECEIPT_RECONCILIATION_CONFLICT'; end if;
  attempt:=coalesce(p.id,gen_random_uuid());
  insert into catalog_private.cms_consumed_listing_receipts(attempt_id,checkout_id,order_id,transaction_id)
    values(attempt,p_proof->>'checkoutId',p_proof->>'orderId',p_proof->>'transactionId');
  insert into catalog_private.cms_listing_payments(listing_id,id,owner_id,website_url,locale,offer_version,mode,
    dispatch_started_at,checkout_id,order_id,transaction_id,state,paid_at,amount_paid_minor,currency)
    values(r.id,attempt,r.owner_id,r.website_url,r.locale,r.offer_version,'prod',clock_timestamp(),
      p_proof->>'checkoutId',p_proof->>'orderId',p_proof->>'transactionId','paid',(p_proof->>'paidAt')::timestamptz,
      (p_proof->>'amountPaidMinor')::bigint,p_proof->>'currency')
    on conflict(listing_id) do update set dispatch_started_at=excluded.dispatch_started_at,checkout_id=excluded.checkout_id,
      order_id=excluded.order_id,transaction_id=excluded.transaction_id,state='paid',paid_at=excluded.paid_at,
      amount_paid_minor=excluded.amount_paid_minor,currency=excluded.currency;
  update catalog_private.cms_listing_historical_reviews set resolved_at=clock_timestamp(),resolved_by=p_actor,
    review_note=p_proof->>'reviewNote',payment_reference=(p_proof->>'paymentReference')::uuid where listing_id=r.id;
  update catalog_contrib.listing_requests set offer='priority_paid',commercial_status='satisfied' where id=r.id;
  return jsonb_build_object('state','paid','reference',p_proof->>'orderId','paidAt',p_proof->>'paidAt',
    'amountPaidMinor',(p_proof->>'amountPaidMinor')::bigint,'currency',p_proof->>'currency');
end $$;

-- The lot holds only the current commercial evidence; no public receipt or payer details.
create function public.cms_commercial_release_inputs(p_actor uuid,p_session uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  return coalesce((select jsonb_agg(jsonb_build_object(
    'approvalId',r.id,'toolId',r.canonical_tool_id,'version',r.commercial_revision,'offer',r.offer,
    'status',r.commercial_status,'evidence',catalog_contrib.cms_initial_commercial_evidence(r),
    'attached',r.representation_status='verified' and exists(select from catalog_contrib.brand_tool_assignments a
      join catalog_contrib.brands b on b.id=a.brand_id
      where a.tool_id=r.canonical_tool_id and a.is_primary and a.status='verified' and b.status='verified')
  ) order by r.id) from catalog_contrib.listing_requests r
    where r.canonical_tool_id is not null and r.commercial_revision>r.commercial_published_revision
      and r.status not in ('archived','rejected')
      and (r.commercial_status='satisfied' or (r.offer='priority_paid' and r.commercial_status='issue'))
  ),'[]'::jsonb);
end $$;

create function catalog_contrib.cms_validate_commercial_release(p_actor uuid,p_session uuid,p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_inputs jsonb;
begin
  current_inputs:=public.cms_commercial_release_inputs(p_actor,p_session);
  if exists(select from jsonb_array_elements(p_items) i where not exists(
    select from jsonb_array_elements(current_inputs) e where e->>'approvalId'=i->>'approvalId'
      and e->>'version'=i->>'version' and e->>'toolId'=i->>'toolId' and e->'attached'='true'::jsonb
      and e->>'offer'=i->>'offer' and e->>'status'=i->>'commercialStatus'
      and e->'evidence' is not distinct from i->'evidence'
  )) then raise sqlstate 'PT409' using message='CMS_RELEASE_SOURCE_CHANGED'; end if;
end $$;

revoke all on function catalog_private.cms_bump_commerce_revision(),public.cms_admin_listing_payment(uuid,uuid,uuid,text,jsonb),
 public.cms_commercial_release_inputs(uuid,uuid),catalog_contrib.cms_validate_commercial_release(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cms_admin_listing_payment(uuid,uuid,uuid,text,jsonb),public.cms_commercial_release_inputs(uuid,uuid),
 catalog_contrib.cms_validate_commercial_release(uuid,uuid,jsonb) to service_role;
grant update(commercial_published_revision) on catalog_contrib.listing_requests to service_role;

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
  select * into listing from catalog_contrib.listing_requests d
    where d.id = p_listing and d.owner_id = p_actor for update;
  if not found or (listing.status = 'archived' and p_action <> 'status') then raise sqlstate 'PT404'; end if;
  if listing.representation_status in ('revoked','rejected') then raise sqlstate 'PT403'; end if;
  if listing.canonical_tool_id is not null then
    perform 1 from catalog_contrib.cms_require_tool_access(p_actor,p_session,listing.canonical_tool_id,p_action <> 'status');
  end if;

  select * into payment from catalog_private.cms_listing_payments p where p.listing_id = p_listing;
  select * into badge from catalog_private.cms_listing_badges b where b.listing_id = p_listing and b.website_url = listing.website_url;
  select exists (select 1 from catalog_private.cms_listing_historical_reviews h where h.listing_id = p_listing and h.resolved_at is null) into historical;

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
  return jsonb_build_object('publication',case when listing.canonical_tool_id is null then 'not_published'
      when listing.commercial_revision>listing.commercial_published_revision then 'pending' else 'published' end,
    'state', state, 'checkedAt', badge.checked_at, 'checkoutUrl', payment.checkout_url,
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

create or replace function catalog_contrib.cms_initial_commercial_evidence(r catalog_contrib.listing_requests)
returns jsonb language sql stable security invoker set search_path = pg_catalog as $$
  select case
    when r.commercial_status <> 'satisfied' or exists (
      select from catalog_private.cms_listing_historical_reviews h where h.listing_id = r.id and h.resolved_at is null
    ) then null
    when r.offer = 'standard_badge' then (
      select jsonb_build_object('type', 'standard_badge', 'websiteUrl', b.website_url, 'badgeUrl', b.badge_url)
      from catalog_private.cms_listing_badges b
      where b.listing_id = r.id and b.website_url = r.website_url and b.state = 'present'
    )
    when r.offer = 'priority_paid' then (
      select jsonb_build_object('type', 'priority_paid', 'receiptId', p.id, 'paidAt', p.paid_at, 'mode', p.mode)
      from catalog_private.cms_listing_payments p where p.listing_id = r.id and p.owner_id = r.owner_id
        and p.website_url = r.website_url and p.offer_version = r.offer_version
        and p.state = 'paid' and p.checkout_id is not null and p.order_id is not null
        and p.transaction_id is not null and p.paid_at is not null
    )
  end
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
    or jsonb_typeof(coalesce(p_manifest->'editorialItems','[]'::jsonb)) is distinct from 'array'
    or jsonb_typeof(coalesce(p_manifest->'commercialItems','[]'::jsonb)) is distinct from 'array'
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

  -- An optional upgrade is not the active offer until its receipt is verified.
  -- Pending/abandoned checkouts must not prevent publishing the still-valid free
  -- offer or independent factual/editorial edits. Commercial revision validation
  -- below rejects a receipt arriving before seal; cms_payment_revision protects
  -- its exact proof during dispatch. After commit, the verified paid revision is
  -- queued for a later lot, independently of the completed free publication.

  perform catalog_contrib.cms_validate_editorial_release(p_actor,p_session,coalesce(p_manifest->'editorialItems','[]'::jsonb));
  perform catalog_contrib.cms_validate_commercial_release(p_actor,p_session,coalesce(p_manifest->'commercialItems','[]'::jsonb));

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
      and exists (select from jsonb_array_elements((p_manifest->'items') || coalesce(p_manifest->'editorialItems','[]'::jsonb) || coalesce(p_manifest->'commercialItems','[]'::jsonb)) i where i->>'toolId' = a.tool_id)
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
create or replace function public.cms_record_release_commit(p_actor uuid, p_session uuid, p_key text, p_commit text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  if p_commit is null or p_commit !~ '^[a-f0-9]{40}$' then
    raise sqlstate 'PT400' using message = 'INVALID_CMS_RELEASE';
  end if;
  select b.* into batch from catalog_contrib.cms_release_batches b where b.batch_key = p_key for update;
  if not found or batch.cancelled_at is not null or (batch.commit_sha is not null and batch.commit_sha <> p_commit) then
    raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED';
  end if;
  if batch.commit_sha is not null then return to_jsonb(batch) - 'prepared_by'; end if;

  update catalog_contrib.cms_tool_drafts d set base_hash = i->>'hash'
    from jsonb_array_elements(batch.manifest->'items') i
    join catalog_contrib.cms_tool_submissions s on s.id::text = i->>'approvalId'
    where d.brand_id = s.brand_id and d.tool_id = s.tool_id
      and s.version = (i->>'version')::bigint and s.status = 'approved';

  update catalog_contrib.cms_tool_submissions s set status = 'applied'
    from jsonb_array_elements(batch.manifest->'items') i
    where s.id::text = i->>'approvalId' and s.version = (i->>'version')::bigint
      and s.status = 'approved';

  update catalog_contrib.cms_tool_drafts d set base_hash = i->>'hash'
    from jsonb_array_elements(batch.manifest->'items') i
    join catalog_private.initial_listing_approvals a on a.id::text = i->>'approvalId'
    where d.brand_id = a.brand_id and d.tool_id = a.tool_id
      and a.version = (i->>'version')::bigint and a.status = 'approved';

  update catalog_contrib.listing_requests r set delivery_status = 'publishing'
    from jsonb_array_elements(batch.manifest->'items') i
    where r.initial_approval_id::text = i->>'approvalId' and r.delivery_status = 'unpublished';

  update catalog_private.initial_listing_approvals a set status = 'delivered'
    from jsonb_array_elements(batch.manifest->'items') i
    where a.id::text = i->>'approvalId' and a.version = (i->>'version')::bigint and a.status = 'approved';

  perform catalog_contrib.cms_commit_editorial_release(coalesce(batch.manifest->'editorialItems','[]'::jsonb),p_commit,false);
  perform catalog_contrib.cms_rebase_overlay_submissions(coalesce(batch.manifest->'editorialItems','[]'::jsonb) || coalesce(batch.manifest->'commercialItems','[]'::jsonb),coalesce(batch.manifest->'items','[]'::jsonb));
  update catalog_contrib.cms_tool_drafts d set base_hash=i->>'hash'
    from jsonb_array_elements(coalesce(batch.manifest->'editorialItems','[]'::jsonb) || coalesce(batch.manifest->'commercialItems','[]'::jsonb)) i
    where d.tool_id=i->>'toolId';
  update catalog_contrib.cms_release_batches b set commit_sha = p_commit, committed_at = clock_timestamp()
    where b.batch_key = p_key returning b.* into batch;
  return to_jsonb(batch) - 'prepared_by';
end $$;

create or replace function public.cms_record_verified_release(p_actor uuid, p_session uuid, p_key text, p_commit text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare batch catalog_contrib.cms_release_batches%rowtype;
begin
  perform catalog_contrib.cms_require_admin(p_actor,p_session);
  update catalog_contrib.cms_release_batches b set verified_at = coalesce(b.verified_at, clock_timestamp())
    where b.batch_key = p_key and b.commit_sha = p_commit and b.cancelled_at is null returning b.* into batch;
  if not found then raise sqlstate 'PT409' using message = 'CMS_RELEASE_SOURCE_CHANGED'; end if;
  perform catalog_contrib.cms_commit_editorial_release(coalesce(batch.manifest->'editorialItems','[]'::jsonb),p_commit,true);
  update catalog_contrib.listing_requests r set commercial_published_revision=(i->>'version')::bigint
    from jsonb_array_elements(coalesce(batch.manifest->'commercialItems','[]'::jsonb)) i
    where r.id::text=i->>'approvalId';
  update catalog_contrib.listing_requests r set delivery_status = 'published'
    from jsonb_array_elements(batch.manifest->'items') i
    where r.initial_approval_id::text = i->>'approvalId' and r.delivery_status = 'publishing';
  return to_jsonb(batch) - 'prepared_by';
end $$;

create or replace function catalog_contrib.cms_guard_sealed_release()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare matches_lease boolean;
begin
  if tg_table_name in ('cms_tool_submissions', 'initial_listing_approvals') then
    if new.status in ('applied','delivered') then return new; end if;
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements((b.manifest->'items') || coalesce(b.manifest->'editorialItems','[]'::jsonb) || coalesce(b.manifest->'commercialItems','[]'::jsonb)) i
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and i->>'approvalId' = old.id::text
    ) into matches_lease;
  elsif tg_table_name = 'brand_tool_assignments' then
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements((b.manifest->'items') || coalesce(b.manifest->'editorialItems','[]'::jsonb) || coalesce(b.manifest->'commercialItems','[]'::jsonb)) i
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and i->>'toolId' = old.tool_id
    ) into matches_lease;
  else
    select exists (
      select from catalog_contrib.cms_release_batches b
      cross join lateral jsonb_array_elements((b.manifest->'items') || coalesce(b.manifest->'editorialItems','[]'::jsonb) || coalesce(b.manifest->'commercialItems','[]'::jsonb)) i
      join catalog_contrib.brand_tool_assignments a on a.tool_id = i->>'toolId' and a.is_primary
      where b.commit_sha is null and b.cancelled_at is null and b.leased_until > clock_timestamp()
        and a.brand_id = old.id
    ) into matches_lease;
  end if;
  if matches_lease then raise sqlstate 'PT409' using message = 'CMS_RELEASE_IN_PROGRESS'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;


commit;
