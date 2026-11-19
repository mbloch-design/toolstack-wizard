import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const run = async (path) => db.exec(await readFile(new URL("../supabase/" + path, import.meta.url), "utf8"));
const owner = "00000000-0000-0000-0000-000000000001";
const outsider = "00000000-0000-0000-0000-000000000002";
const session = "00000000-0000-0000-0000-000000000003";
const outsideSession = "00000000-0000-0000-0000-000000000004";
const admin = "00000000-0000-0000-0000-000000000005";
const adminSession = "00000000-0000-0000-0000-000000000006";
const adminCall = async (action, payload = {}, actor = admin, token = adminSession) =>
  (await db.query("select public.cms_admin_listing_requests($1,$2,$3,$4) as result", [
    actor, token, action, JSON.stringify(payload),
  ])).rows[0].result;
const call = async (action, payload = {}, actor = owner, token = session) => action === "acceptInvitation"
  ? (await db.query("select public.cms_accept_listing_invitation($1,$2,$3) as result", [actor, token, payload.digest])).rows[0].result
  : (await db.query("select public.cms_listing_requests($1,$2,$3,$4) as result", [
    actor, token, action, JSON.stringify(payload),
  ])).rows[0].result;
const review = async (action, payload = {}, actor = admin, token = adminSession) =>
  (await db.query("select public.cms_initial_listing_review($1,$2,$3,$4) as result", [
    actor, token, action, JSON.stringify(payload),
  ])).rows[0].result;
const create = {
  name: "New Publisher", websiteUrl: "https://example.com/", hostname: "example.com",
  slug: "new-publisher", idempotencyKey: "original-key", offer: "standard_badge", locale: "fr",
};

try {
  await run("tests/accounts-auth.fixture.sql");
  await run("migrations/20260825124355_ma_stack_account_sync.sql");
  await run("migrations/20261019081436_personal_stack_v4.sql");
  await db.exec(`
    create schema catalog_private;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(bucket_id text,name text,owner uuid,owner_id text,primary key(bucket_id,name));
    alter table storage.objects enable row level security;
    create function auth.jwt() returns jsonb language sql stable as $$
      select current_setting('request.jwt.claims',true)::jsonb
    $$;
    create table public.tools (
      id varchar primary key, slug text unique not null, name text not null default '', website_url text,
      content_status text not null default 'draft'
    );
    grant select, update on public.tools to service_role;
  `);
  await run("migrations/20261116200000_cms_assignment_baseline.sql");
  const migrations = await readdir(new URL("../supabase/migrations/", import.meta.url));
  for (const filename of migrations.filter((name) => /_cms_(tool_drafts|tool_submissions|listing_requests|listing_invitations|commerce|commerce_account|media|initial_listing_review|release_batches|media_release|editorial_workspace|commercial_publication)\.sql$/.test(name)).sort()) {
    await run("migrations/" + filename);
  }
  await db.exec(`
    insert into auth.users(id,email,email_confirmed_at) values
      ('${owner}','owner@example.test',now()), ('${outsider}','outside@example.test',now()), ('${admin}','admin@example.test',now());
    insert into auth.sessions(id,user_id) values ('${session}','${owner}'), ('${outsideSession}','${outsider}'), ('${adminSession}','${admin}');
    insert into catalog_contrib.cms_admins values ('${admin}');
    insert into public.tools(id,slug) values ('id-archive','archived-product');
    set role service_role;
  `);

  const created = (await call("create", create)).listing;
  assert.equal(created.slug, "new-publisher");
  assert.equal(created.locale, "fr");
  assert.equal(created.status, "draft");
  assert.equal(created.commercialStatus, "pending");
  assert.equal((await call("create", create)).listing.id, created.id);
  await assert.rejects(call("create", { ...create, offer: "priority_paid" }), { code: "PT409", message: "LISTING_IDEMPOTENCY_CONFLICT" });
  await assert.rejects(call("read", { id: created.id }, outsider, outsideSession), { code: "PT404" });
  assert.deepEqual((await call("list", {}, outsider, outsideSession)).listings, []);
  assert.equal((await call("lookup", { hostname: "example.com" })).candidates[0].id, created.id);
  assert.deepEqual((await call("lookup", { hostname: "example.com" }, outsider, outsideSession)).candidates, []);
  await assert.rejects(call("list", {}, owner, outsideSession), { code: "PT401" });
  await assert.rejects(call("create", { ...create, slug: "archived-product", idempotencyKey: "different-key" }), { code: "PT409", message: "LISTING_SLUG_UNAVAILABLE" });
  await assert.rejects(call("create", { ...create, name: "Other", websiteUrl: "https://other.example/" }, outsider, outsideSession),
    { code: "PT409", message: "LISTING_SLUG_UNAVAILABLE" });
  assert.equal((await call("create", { ...create, name: "Another Product", slug: "another-product", idempotencyKey: "another-product" })).listing.slug, "another-product");
  assert.equal((await call("lookup", { hostname: "example.com" })).candidates.length, 2);

  const saved = (await call("save", { id: created.id, version: 1, representativeRole: "Founder", notes: "Facts" })).listing;
  assert.equal(saved.version, 2);
  assert.equal(saved.notes, "Facts");
  await assert.rejects(call("save", { id: created.id, version: 1, representativeRole: "Founder", notes: "Stale" }), { code: "PT409" });
  await assert.rejects(call("submit", { id: created.id, version: 2 }), { code: "PT409", message: "LISTING_REQUIREMENTS_PENDING" });
  assert.equal((await call("withdraw", { id: created.id, version: 2 })).listing.status, "archived");
  assert.equal((await call("create", create, outsider, outsideSession)).listing.id === created.id, false);
  assert.equal((await call("create", create)).listing.status, "archived");

  const claim = { toolId: "json-only-id", slug: "public-slug" };
  assert.deepEqual((await call("claimExisting", claim)).claim, { toolId: "json-only-id", status: "pending" });
  assert.deepEqual((await call("claimExisting", claim)).claim, { toolId: "json-only-id", status: "pending" });
  assert.deepEqual((await call("list")).claims, [{ toolId: "json-only-id", slug: "public-slug", status: "pending" }]);
  assert.deepEqual((await call("list", {}, outsider, outsideSession)).claims, []);
  await db.exec("reset role");
  assert.deepEqual((await db.query("select id from public.tools")).rows, [{ id: "id-archive" }]);
  assert.equal((await db.query("select count(*)::int as total from catalog_contrib.brand_tool_assignments")).rows[0].total, 0);

  await db.exec("set role service_role");
  await assert.rejects(adminCall("list", {}, owner, session), { code: "PT403" });
  const invitationInput = {
    ownerId: owner, toolId: claim.toolId, slug: claim.slug, role: "owner",
    brandName: "New Offline Brand", brandDomain: "example.com",
    digest: "1".repeat(64), sourceSha: "2".repeat(40), baseHash: "3".repeat(64),
    draft: { schemaVersion: 1, name: "Imported product", websiteUrl: "https://example.com/" },
  };
  const { invitation } = await adminCall("invite", invitationInput);
  assert.ok(invitation.id);
  const revoked = await adminCall("invite", { ...invitationInput, digest: "4".repeat(64) });
  assert.equal((await adminCall("revokeInvitation", { id: revoked.invitation.id })).invitation.status, "revoked");
  await assert.rejects(call("acceptInvitation", { digest: "4".repeat(64) }), { code: "PT409", message: "LISTING_INVITATION_REVOKED" });
  await assert.rejects(call("acceptInvitation", { digest: invitationInput.digest }, outsider, outsideSession),
    { code: "PT403", message: "LISTING_INVITATION_ACCOUNT_MISMATCH" });
  assert.deepEqual((await db.query("select id from public.tools")).rows, [{ id: "id-archive" }]);
  const accepted = await call("acceptInvitation", { digest: invitationInput.digest });
  assert.equal(accepted.assignment.toolId, claim.toolId);
  assert.equal(accepted.assignment.role, "owner");
  await assert.rejects(call("acceptInvitation", { digest: invitationInput.digest }), { code: "PT409", message: "LISTING_INVITATION_USED" });
  assert.equal((await db.query("select content_status from public.tools where id = $1", [claim.toolId])).rows[0].content_status, "draft");
  assert.equal((await db.query("select base_hash from catalog_contrib.cms_tool_drafts where tool_id = $1", [claim.toolId])).rows[0].base_hash, invitationInput.baseHash);
  assert.equal((await call("list")).claims[0].status, "verified");
  const attributed = (await db.query("select public.cms_read_tool_draft($1,$2,$3) as result", [owner, session, claim.toolId])).rows[0].result;
  assert.equal(attributed.value.name, "Imported product");
  await db.exec("reset role");

  await db.exec("set role service_role");
  const initial = (await call("create", {
    ...create, name: "New Initial Product", slug: "new-initial-product", websiteUrl: "https://new-listing.com/",
    hostname: "new-listing.com", idempotencyKey: "new-initial-product", offer: "priority_paid",
  })).listing;
  await db.exec("reset role");
  const assetId = "00000000-0000-0000-0000-000000000042";
  await db.query(`insert into catalog_private.cms_media_assets(
    id,target_kind,target_id,uploader_id,session_id,role,mime_type,expected_bytes,idempotency_key,state,derived_sha,
    original_bytes,derivative_bytes,width,height
  ) values ($1,'listing',$2,$3,$4,'logo','image/png',123,'listing-image-1','ready',$5,123,100,10,10)`,
    [assetId, initial.id, owner, session, "9".repeat(64)]);
  const media = [{ assetId, role: "logo", alt: { fr: "Logo", en: "Logo" }, caption: { fr: "", en: "" } }];
  await db.exec("set role service_role");
  await assert.rejects(call("save", { id: initial.id, version: 1, representativeRole: "Founder", notes: "",
    media: [{ ...media[0], assetId: "00000000-0000-0000-0000-000000000043" }] }),
  { code: "PT403", message: "CMS_INVALID_MEDIA_REFERENCE" });
  await call("save", { id: initial.id, version: 1, representativeRole: "Founder", notes: "", media });
  await db.exec("reset role");
  await db.query("update catalog_contrib.listing_requests set commercial_status = 'satisfied' where id = $1", [initial.id]);
  await db.query(`insert into catalog_private.cms_listing_payments(
      listing_id,owner_id,website_url,locale,offer_version,checkout_id,order_id,transaction_id,state,paid_at
    ) values ($1,$2,$3,'fr',1,'checkout-proof','order-proof','transaction-proof','paid',now())`,
  [initial.id, owner, "https://new-listing.com/"]);
  await db.exec("set role service_role");
  await call("submit", { id: initial.id, version: 2 });
  const productValue = {
    schemaVersion: 1, name: initial.name, websiteUrl: initial.websiteUrl,
    localized: { fr: {}, en: {} }, plans: [], media, classificationProposals: [], integrations: [],
  };
  const productHash = "a".repeat(64);
  assert.equal((await review("ownerRead", { id: initial.id }, owner, session)).review.productRevision, null);
  await assert.rejects(review("ownerRead", { id: initial.id }, outsider, outsideSession), { code: "PT404" });
  await assert.rejects(review("prepareInitial", { id: initial.id }, owner, session), { code: "PT403" });
  const prepared = (await review("prepareInitial", {
    id: initial.id, version: 3, value: productValue, hash: productHash,
  })).review;
  assert.equal(prepared.listing.status, "in_preparation");
  assert.equal(prepared.productRevision.hash, productHash);
  const queued = (await adminCall("list")).listings.find((row) => row.id === initial.id);
  assert.equal(queued?.status, "in_preparation");
  assert.equal(queued.offer, "priority_paid");
  assert.equal(queued.commercialStatus, "satisfied");

  const approved = (await review("approveInitialEditorial", {
    id: initial.id, version: 4, category: "crm", fields: {
      longDescription: "Analyse ToolTrim", longDescriptionEn: "ToolTrim analysis",
    }, hash: "b".repeat(64),
  })).review;
  const promotion = {
    id: initial.id, version: 5, productRevisionId: prepared.productRevision.id,
    editorialRevisionId: approved.editorialRevision.id, idempotencyKey: "promote-initial-1234",
    brandName: "New Linked Product Brand", brandDomain: "new-listing.com",
  };
  await assert.rejects(review("promoteInitial", promotion), { code: "PT409", message: "LISTING_REVIEW_INCOMPLETE" });
  const requested = (await review("requestFactualReview", {
    id: initial.id, version: 5, productRevisionId: prepared.productRevision.id,
  })).review;
  assert.equal(requested.listing.status, "facts_to_review");
  assert.ok((await adminCall("list")).listings.some((row) => row.id === initial.id));
  const ownerReview = (await review("ownerRead", { id: initial.id }, owner, session)).review;
  assert.equal(ownerReview.productRevision.id, prepared.productRevision.id);
  assert.equal(ownerReview.editorialRevision, null);
  const confirmation = {
    id: initial.id, version: 6, productRevisionId: prepared.productRevision.id, hash: productHash,
    decision: "confirm", note: "",
  };
  await assert.rejects(review("respondFactualReview", { ...confirmation, hash: "d".repeat(64) }, owner, session),
    { code: "PT409", message: "LISTING_REVISION_CONFLICT" });
  assert.equal((await review("respondFactualReview", confirmation, owner, session)).review.listing.status, "ready");
  assert.ok((await adminCall("list")).listings.some((row) => row.id === initial.id));

  const promoted = (await review("promoteInitial", { ...promotion, version: 7 })).approval;
  assert.equal((await adminCall("list")).listings.find((row) => row.id === initial.id)?.deliveryStatus, "unpublished");
  assert.equal((await review("promoteInitial", { ...promotion, version: 7 })).approval.approvalId, promoted.approvalId);
  assert.equal((await call("read", { id: initial.id })).listing.id, initial.id);
  assert.ok((await call("list")).listings.some((row) => row.id === initial.id));
  assert.equal((await review("ownerRead", { id: initial.id }, owner, session)).review.editorialRevision, null);
  await assert.rejects(call("read", { id: initial.id }, outsider, outsideSession), { code: "PT404" });
  await assert.rejects(review("respondFactualReview", confirmation, owner, session), { code: "PT404" });
  const inputs = (await db.query("select public.cms_initial_release_inputs($1,$2) as result", [admin, adminSession])).rows[0].result;
  assert.equal(inputs[0].attached, true);
  assert.equal(inputs[0].baseHash, null);
  assert.equal(inputs[0].base.longDescription, "Analyse ToolTrim");
  assert.equal(inputs[0].base.category, "crm");
  assert.deepEqual(inputs[0].value, productValue);
  const approvedMedia = (await db.query("select public.cms_approved_media_inputs($1,$2,$3) as assets",
    [admin, adminSession, [promoted.approvalId]])).rows[0].assets;
  assert.equal(approvedMedia[0].assetId, assetId);
  assert.equal(approvedMedia[0].toolId, promoted.toolId);
  assert.equal((await db.query("select content_status from public.tools where id = $1", [promoted.toolId])).rows[0].content_status, "draft");
  await db.exec("reset role");
  await db.query("update catalog_contrib.brand_tool_assignments set status = 'revoked' where tool_id = $1", [promoted.toolId]);
  await db.exec("set role service_role");
  await assert.rejects(call("read", { id: initial.id }), { code: "PT404" });
  await assert.rejects(review("ownerRead", { id: initial.id }, owner, session), { code: "PT404" });
  assert.equal((await call("list")).listings.some((row) => row.id === initial.id), false);
  assert.equal((await db.query("select public.cms_initial_release_inputs($1,$2) as result", [admin, adminSession])).rows[0].result[0].attached, false);
  await db.exec("reset role");

  await db.query("update catalog_contrib.brand_tool_assignments set status = 'verified' where tool_id = $1", [promoted.toolId]);
  await db.exec("set role service_role");
  const initialDraft = (await db.query("select public.cms_read_tool_draft($1,$2,$3) as result",
    [owner, session, promoted.toolId])).rows[0].result;
  assert.equal(initialDraft.canEdit, false);
  const manifest = {
    sourceHead: "a".repeat(40), catalogueHash: "b".repeat(64), legacyItems: [],
    items: [{ approvalId: promoted.approvalId, version: promoted.version, toolId: promoted.toolId,
      slug: inputs[0].base.slug, hash: "c".repeat(64) }],
  };
  const seal = (actor, token, key, value) =>
    db.query("select public.cms_seal_release_batch($1,$2,$3,$4) as result", [actor, token, key, JSON.stringify(value)]);
  const key = "e".repeat(64);
  const commit = "e".repeat(40);
  await assert.rejects(seal(owner, session, key, manifest), { code: "PT403" });
  assert.equal((await seal(admin, adminSession, key, manifest)).rows[0].result.commit_sha, null);
  await assert.rejects(seal(admin, adminSession, key, { ...manifest, catalogueHash: "d".repeat(64) }), { code: "PT409" });
  await assert.rejects(seal(admin, adminSession, "f".repeat(64), manifest), { code: "PT409", message: "CMS_RELEASE_VERIFICATION_PENDING" });
  await assert.rejects(db.query("update catalog_contrib.brand_tool_assignments set status='revoked' where tool_id=$1",
    [promoted.toolId]), { code: "PT409", message: "CMS_RELEASE_IN_PROGRESS" });
  const stamped = await db.query("select public.cms_record_release_commit($1,$2,$3,$4) as result",
    [admin, adminSession, key, commit]);
  assert.equal(stamped.rows[0].result.commit_sha, commit);
  assert.equal(stamped.rows[0].result.verified_at, null);
  assert.equal((await call("read", { id: initial.id })).listing.deliveryStatus, "publishing");
  assert.equal((await adminCall("list")).listings.find((row) => row.id === initial.id)?.deliveryStatus, "publishing");
  await assert.rejects(db.query("select public.cms_record_verified_release($1,$2,$3,$4)",
    [admin, adminSession, key, "f".repeat(40)]), { code: "PT409" });
  await db.query("select public.cms_record_verified_release($1,$2,$3,$4)", [admin, adminSession, key, commit]);
  assert.equal((await call("read", { id: initial.id })).listing.deliveryStatus, "published");
  assert.equal((await adminCall("list")).listings.some((row) => row.id === initial.id), false);
  await db.exec("reset role");

  const commerceInput = async () => (await db.query("select public.cms_commercial_release_inputs($1,$2) result", [admin,adminSession])).rows[0].result;
  const commercial = (await commerceInput()).find(item=>item.toolId===promoted.toolId);
  assert.equal(commercial.offer,"priority_paid");
  await db.query("update catalog_private.cms_listing_payments set state=state where listing_id=$1",[initial.id]);
  assert.equal((await commerceInput()).find(item=>item.toolId===promoted.toolId).version,commercial.version);
  const commercialManifest = {...manifest,items:[],commercialItems:[{approvalId:commercial.approvalId,toolId:commercial.toolId,version:commercial.version,
    offer:commercial.offer,commercialStatus:commercial.status,evidence:commercial.evidence,slug:inputs[0].base.slug,hash:"f".repeat(64)}]};
  await db.exec("set role service_role");
  await assert.rejects(seal(admin,adminSession,"a".repeat(64),{...commercialManifest,commercialItems:[{...commercialManifest.commercialItems[0],version:999}]}),{code:"PT409"});
  await seal(admin,adminSession,"a".repeat(64),commercialManifest);
  await db.exec("reset role");
  await assert.rejects(db.query("update catalog_private.cms_listing_payments set state='review_required' where listing_id=$1",[initial.id]),{code:"PT409"});
  await db.exec("set role service_role");
  await db.query("select public.cms_record_release_commit($1,$2,$3,$4)",[admin,adminSession,"a".repeat(64),"a".repeat(40)]);
  await db.query("select public.cms_record_verified_release($1,$2,$3,$4)",[admin,adminSession,"a".repeat(64),"a".repeat(40)]);
  assert.equal((await commerceInput()).some(item=>item.toolId===promoted.toolId),false);
  const recovered=(await call("create",{...create,name:"Old Receipt",slug:"old-receipt",idempotencyKey:"old-receipt",offer:"priority_paid"})).listing;
  assert.equal((await adminCall("list")).listings.some(row=>row.id===recovered.id),false);
  await db.query("select public.cms_listing_commerce($1,$2,$3,'requestHistoricalReview','{}')",[owner,session,recovered.id]);
  const reviewRequested=(await adminCall("list")).listings.find(row=>row.id===recovered.id);
  assert.equal(reviewRequested?.status,"draft");
  assert.equal(reviewRequested?.historicalReviewRequested,true);
  const reconcile = (id,proof,actor=admin,token=adminSession) => db.query("select public.cms_admin_listing_payment($1,$2,$3,'attach',$4) result",[actor,token,id,JSON.stringify(proof)]);
  const historicalProof={websiteUrl:create.websiteUrl,reviewNote:"Confirmed representative and original purchaser using matching provider receipt.",paymentReference:"10000000-0000-4000-8000-000000000001",
    checkoutId:"ch_legacy",orderId:"ord_legacy",transactionId:"tran_legacy",state:"paid",paidAt:"2026-11-17T08:00:00Z",amountPaidMinor:3509,currency:"USD"};
  await assert.rejects(reconcile(recovered.id,historicalProof,owner,session),{code:"PT403"});
  assert.equal((await reconcile(recovered.id,historicalProof)).rows[0].result.amountPaidMinor,3509);
  assert.equal((await reconcile(recovered.id,historicalProof)).rows[0].result.reference,"ord_legacy");
  assert.equal((await db.query("select public.cms_listing_commerce($1,$2,$3,'status','{}') result",[owner,session,recovered.id])).rows[0].result.state,"paid");
  assert.equal((await adminCall("list")).listings.some(row=>row.id===recovered.id),false);
  const secondRecovery=(await call("create",{...create,name:"Other Receipt",slug:"other-receipt",idempotencyKey:"other-receipt",offer:"priority_paid"})).listing;
  await db.query("select public.cms_listing_commerce($1,$2,$3,'requestHistoricalReview','{}')",[owner,session,secondRecovery.id]);
  await assert.rejects(reconcile(secondRecovery.id,historicalProof),{code:"23505"});
  await db.exec("reset role");

  const editorialRpc = async (action, version = null, base = null, patch = null, actor = admin, token = adminSession) =>
    (await db.query("select public.cms_editorial_workspace($1,$2,$3,$4,$5,$6,$7) result",
      [actor,token,promoted.toolId,action,version,base,patch && JSON.stringify(patch)])).rows[0].result;
  const editorialHash = "2".repeat(64);
  const editorialPatch = {set:{longDescription:"Independent update",longDescriptionEn:"Independent English update"},remove:[]};
  await db.exec("set role service_role");
  await assert.rejects(editorialRpc("read",null,null,null,owner,session),{code:"PT403"});
  assert.equal((await editorialRpc("read")).version,0);
  assert.equal((await editorialRpc("save",0,editorialHash,editorialPatch)).version,1);
  await assert.rejects(editorialRpc("save",0,editorialHash,editorialPatch),{code:"PT409"});
  assert.equal((await editorialRpc("read")).patch.set.longDescription,"Independent update");
  assert.equal((await editorialRpc("approve",1,editorialHash)).state,"approved");
  const editorialInput=(await db.query("select public.cms_editorial_release_inputs($1,$2) result",[admin,adminSession])).rows[0].result[0];
  assert.equal(editorialInput.attached,true);
  const editorialToolDraft=(await db.query("select public.cms_read_tool_draft($1,$2,$3) result",[owner,session,promoted.toolId])).rows[0].result;
  const currentProductHash=(await db.query("select base_hash from catalog_contrib.cms_tool_drafts where tool_id=$1",[promoted.toolId])).rows[0].base_hash;
  const productSubmission=(await db.query("select public.cms_submit_tool_draft($1,$2,$3,$4,$5) result",
    [owner,session,promoted.toolId,editorialToolDraft.brandId,editorialToolDraft.version])).rows[0].result;
  const editorialManifest={...manifest,items:[],commercialItems:[],editorialItems:[{
    approvalId:editorialInput.approvalId,version:1,toolId:promoted.toolId,slug:inputs[0].base.slug,
    hash:"3".repeat(64),baseHash:currentProductHash,
  }]};
  await seal(admin,adminSession,"2".repeat(64),editorialManifest);
  await assert.rejects(editorialRpc("save",1,editorialHash,editorialPatch),{code:"PT409",message:"CMS_RELEASE_IN_PROGRESS"});
  await db.exec("reset role");
  await assert.rejects(db.query("update catalog_contrib.brand_tool_assignments set status='revoked' where tool_id=$1",
    [promoted.toolId]),{code:"PT409",message:"CMS_RELEASE_IN_PROGRESS"});
  await db.exec("set role service_role");
  await db.query("select public.cms_record_release_commit($1,$2,$3,$4)",[admin,adminSession,"2".repeat(64),"2".repeat(40)]);
  assert.equal((await editorialRpc("read")).state,"delivered");
  await assert.rejects(editorialRpc("save",1,editorialHash,editorialPatch),{code:"PT409"});
  assert.equal((await db.query("select base_hash from catalog_contrib.cms_tool_submissions where id=$1",[productSubmission.id])).rows[0].base_hash,"3".repeat(64));
  await db.query("select public.cms_record_verified_release($1,$2,$3,$4)",[admin,adminSession,"2".repeat(64),"2".repeat(40)]);
  const afterEditorial=await editorialRpc("read");
  assert.equal(afterEditorial.version,2);
  assert.deepEqual(afterEditorial.patch,{set:{},remove:[]});
  assert.equal((await db.query("select public.cms_editorial_release_inputs($1,$2) result",[admin,adminSession])).rows[0].result.length,0);
  await db.exec("reset role");

  // A dispatched but abandoned optional upgrade must not freeze normal publication.
  // Isolate this free-offer scenario from the paid fixture exercised above.
  await db.exec("begin");
  await db.query("delete from catalog_private.cms_listing_payments where listing_id=$1",[initial.id]);
  await db.query("update catalog_contrib.listing_requests set offer='standard_badge',commercial_status='satisfied' where id=$1",[initial.id]);
  await db.query("insert into catalog_private.cms_listing_badges(listing_id,website_url,badge_url,state) values($1,$2,$2,'present')",[initial.id,initial.websiteUrl]);
  await db.exec("set role service_role");
  const upgradeAction=async(action,payload={})=>(await db.query("select public.cms_listing_commerce($1,$2,$3,$4,$5) result",
    [owner,session,initial.id,action,JSON.stringify(payload)])).rows[0].result;
  const waitingUpgrade=await upgradeAction("prepare");
  await upgradeAction("dispatch");
  await upgradeAction("bind",{attemptId:waitingUpgrade.attempt.id,checkoutId:"ch_abandoned",checkoutUrl:"https://checkout.creem.io/abandoned"});
  const freeInput=(await commerceInput()).find(item=>item.toolId===promoted.toolId);
  assert.equal(freeInput.offer,"standard_badge");
  assert.equal(freeInput.status,"satisfied");
  await editorialRpc("save",2,editorialHash,editorialPatch);
  await editorialRpc("approve",3,editorialHash);
  const nextEditorial=(await db.query("select public.cms_editorial_release_inputs($1,$2) result",[admin,adminSession])).rows[0].result[0];
  await db.query("select public.cms_review_tool_submission($1,$2,$3,'approved','Verified product correction')",[admin,adminSession,productSubmission.id]);
  const nextProduct=(await db.query("select public.cms_approved_release_inputs($1,$2) result",[admin,adminSession])).rows[0].result[0];
  const freeManifest={...manifest,items:[{approvalId:nextProduct.approvalId,version:nextProduct.version,toolId:promoted.toolId,slug:initial.slug,hash:"4".repeat(64)}],
    editorialItems:[{approvalId:nextEditorial.approvalId,version:nextEditorial.version,toolId:promoted.toolId,slug:initial.slug,hash:"4".repeat(64),baseHash:"3".repeat(64)}],
    commercialItems:[{approvalId:freeInput.approvalId,version:freeInput.version,toolId:promoted.toolId,offer:freeInput.offer,commercialStatus:freeInput.status,evidence:freeInput.evidence,slug:initial.slug,hash:"4".repeat(64),baseHash:"3".repeat(64)}]};
  await seal(admin,adminSession,"4".repeat(64),freeManifest);
  assert.equal((await upgradeAction("status")).state,"pending");
  const lateProof={attemptId:waitingUpgrade.attempt.id,checkoutId:"ch_abandoned",orderId:"ord_late_upgrade",transactionId:"tran_late_upgrade",paidAt:"2026-11-18T08:00:00Z",amountPaidMinor:3509,currency:"USD",state:"paid"};
  const receiveLatePayment=()=>db.query("select public.cms_apply_listing_billing('evt_late_upgrade','checkout.completed',now(),$1) result",[JSON.stringify(lateProof)]);
  // Receipt cannot mutate the exact commercial proof while the free lot is in flight.
  await db.exec("savepoint pending_receipt");
  await assert.rejects(receiveLatePayment(),{code:"PT409",message:"CMS_RELEASE_IN_PROGRESS"});
  await db.exec("rollback to savepoint pending_receipt");
  assert.equal((await upgradeAction("status")).checkoutUrl,"https://checkout.creem.io/abandoned");
  await db.exec("reset role");
  assert.equal((await db.query("select count(*)::int n from catalog_private.cms_listing_billing_events where id='evt_late_upgrade'")).rows[0].n,0);
  await db.exec("set role service_role");
  await db.query("select public.cms_record_release_commit($1,$2,$3,$4)",[admin,adminSession,"4".repeat(64),"4".repeat(40)]);
  assert.equal((await receiveLatePayment()).rows[0].result.state,"paid");
  assert.equal((await receiveLatePayment()).rows[0].result.duplicate,true);
  await db.query("select public.cms_record_verified_release($1,$2,$3,$4)",[admin,adminSession,"4".repeat(64),"4".repeat(40)]);
  // The old free revision was published; paid rights remain queued for their own next lot.
  const queuedUpgrade=(await commerceInput()).find(item=>item.toolId===promoted.toolId);
  assert.equal(queuedUpgrade.offer,"priority_paid");
  assert.ok(queuedUpgrade.version>freeInput.version);
  assert.equal((await upgradeAction("status")).publication,"pending");
  assert.equal((await upgradeAction("status")).payments[0].reference,"ord_late_upgrade");
  await db.exec("rollback");

  for (const role of ["anon", "authenticated"]) {
    await db.exec("set role " + role);
    await assert.rejects(call("list"), { code: "42501" });
    await assert.rejects(db.exec("select * from catalog_contrib.listing_requests"), { code: "42501" });
    await db.exec("reset role");
  }
  await db.query("update auth.users set email_confirmed_at = null where id = $1", [owner]);
  await db.exec("set role service_role");
  await assert.rejects(call("list"), { code: "PT403" });
  console.log("CMS listing PostgreSQL: private intake, reservation, claim isolation and session checks passed");
} finally {
  await db.close();
}
