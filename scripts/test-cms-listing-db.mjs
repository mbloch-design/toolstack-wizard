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
    create table public.tools (
      id varchar primary key, slug text unique not null, name text not null default '', website_url text,
      content_status text not null default 'draft'
    );
    grant select, update on public.tools to service_role;
  `);
  await run("migrations/20261116200000_cms_assignment_baseline.sql");
  const migrations = await readdir(new URL("../supabase/migrations/", import.meta.url));
  for (const filename of migrations.filter((name) => /_cms_(tool_drafts|tool_submissions|listing_requests|listing_invitations|commerce|initial_listing_review|release_batches)\.sql$/.test(name)).sort()) {
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
  await call("save", { id: initial.id, version: 1, representativeRole: "Founder", notes: "" });
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
    localized: { fr: {}, en: {} }, plans: [], media: [], classificationProposals: [], integrations: [],
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

  const promoted = (await review("promoteInitial", { ...promotion, version: 7 })).approval;
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
  const stamped = await db.query("select public.cms_record_release_commit($1,$2,$3,$4) as result",
    [admin, adminSession, key, commit]);
  assert.equal(stamped.rows[0].result.commit_sha, commit);
  assert.equal(stamped.rows[0].result.verified_at, null);
  assert.equal((await call("read", { id: initial.id })).listing.deliveryStatus, "publishing");
  await assert.rejects(db.query("select public.cms_record_verified_release($1,$2,$3,$4)",
    [admin, adminSession, key, "f".repeat(40)]), { code: "PT409" });
  await db.query("select public.cms_record_verified_release($1,$2,$3,$4)", [admin, adminSession, key, commit]);
  assert.equal((await call("read", { id: initial.id })).listing.deliveryStatus, "published");
  await db.exec("reset role");

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
