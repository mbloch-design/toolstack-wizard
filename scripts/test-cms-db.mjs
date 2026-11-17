import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const run = async (path) => db.exec(await readFile(new URL("../supabase/" + path, import.meta.url), "utf8"));
const uuid = (n) => "00000000-0000-0000-0000-" + String(n).padStart(12, "0");
const owner = uuid(1);
const viewer = uuid(2);
const outsider = uuid(3);
const brand = uuid(4);
const session = uuid(5);
const viewSession = uuid(6);
const outsideSession = uuid(7);
const read = async (actor, token, tool = "id-42") =>
  (await db.query("select public.cms_read_tool_draft($1,$2,$3) as result", [actor, token, tool])).rows[0].result;
const save = async (actor, token, version, expectedBrand = brand) =>
  (await db.query("select public.cms_save_tool_draft($1,$2,$3,$4,$5,$6) as result",
    [actor, token, "id-42", expectedBrand, version, JSON.stringify({ schemaVersion: 1, name: "Updated" })])).rows[0].result;
const as = async (role, action) => {
  await db.exec("set role " + role);
  try { return await action(); }
  finally { await db.exec("reset role"); }
};

try {
  await run("tests/accounts-auth.fixture.sql");
  await run("migrations/20260825124355_ma_stack_account_sync.sql");
  await run("migrations/20261019081436_personal_stack_v4.sql");
  await run("tests/cms-access.fixture.sql");
  const migrations = await readdir(new URL("../supabase/migrations/", import.meta.url));
  const baseline = migrations.find((name) => name.endsWith("_cms_assignment_baseline.sql"));
  await run("migrations/" + baseline);
  // A local instance upgrades an existing set of attribution relations too.
  await run("migrations/" + baseline);
  const matches = migrations.filter((name) => name.endsWith("_cms_tool_drafts.sql"));
  assert.equal(matches.length, 1, "CMS SQL migration is required");
  await run("migrations/" + matches[0]);

  await db.exec(`
    insert into auth.users(id,email,email_confirmed_at) values
      ('${owner}','owner@example.test',now()),
      ('${viewer}','viewer@example.test',now()),
      ('${outsider}','outsider@example.test',now());
    insert into auth.sessions(id,user_id) values
      ('${session}','${owner}'), ('${viewSession}','${viewer}'), ('${outsideSession}','${outsider}');
    insert into public.tools values ('id-42','slug-42'), ('unlinked','unlinked');
    insert into catalog_contrib.brands(id,name,website_domain,status,created_by)
      values ('${brand}','Brand','example.test','verified','${owner}');
    insert into catalog_contrib.brand_memberships(brand_id,user_id,status,role) values
      ('${brand}','${owner}','active','owner'), ('${brand}','${viewer}','active','viewer');
    insert into catalog_contrib.brand_tool_assignments(brand_id,tool_id,status,is_primary) values ('${brand}','id-42','verified',true);
    insert into catalog_contrib.cms_tool_drafts(brand_id,tool_id,base_hash,value)
      values ('${brand}','id-42',repeat('a',64),'{"schemaVersion":1,"name":"Original"}');
  `);
  await as("service_role", async () => {
    const draft = await read(owner, session);
    assert.equal(draft.version, 1);
    assert.equal(draft.brandId, brand);
    await assert.rejects(save(owner, session, 1, uuid(99)), { code: "PT409" });
    assert.equal(draft.value.name, "Original");
    assert.equal(draft.canEdit, true);
    assert.equal((await read(viewer, viewSession)).canEdit, false);
    await assert.rejects(save(viewer, viewSession, 1), { code: "PT403" });
    await assert.rejects(read(outsider, outsideSession), { code: "PT403" });
    await assert.rejects(read(owner, session, "slug-42"), { code: "PT403" });
    await assert.rejects(read(owner, session, "unlinked"), { code: "PT403" });
    await assert.rejects(read(owner, viewSession), { code: "PT401" });
    assert.equal((await save(owner, session, 1)).version, 2);
    await assert.rejects(save(owner, session, 1), { code: "PT409" });
    assert.equal((await read(owner, session)).value.name, "Updated");
  });

  for (const role of ["anon", "authenticated"]) {
    await as(role, async () => {
      await assert.rejects(read(owner, session), { code: "42501" });
      await assert.rejects(save(owner, session, 2), { code: "42501" });
    });
    const grants = (await db.query(
      "select has_table_privilege($1,'catalog_contrib.cms_tool_drafts','SELECT,UPDATE') as allowed", [role],
    )).rows[0].allowed;
    assert.equal(grants, false);
  }

  const scenarios = [
    ["catalog_contrib.brand_tool_assignments", "is_primary", "false", "true", "tool_id", "id-42", "PT403"],
    ["catalog_contrib.brand_memberships", "status", "'invited'", "'active'", "user_id", owner, "PT403"],
    ["catalog_contrib.brand_memberships", "status", "'revoked'", "'active'", "user_id", owner, "PT403"],
    ["catalog_contrib.brand_tool_assignments", "status", "'claimed'", "'verified'", "tool_id", "id-42", "PT403"],
    ["catalog_contrib.brand_tool_assignments", "status", "'revoked'", "'verified'", "tool_id", "id-42", "PT403"],
    ["catalog_contrib.brands", "status", "'suspended'", "'verified'", "id", brand, "PT403"],
    ["public.profiles", "account_status", "'deleting'", "'active'", "id", owner, "PT409"],
    ["auth.users", "email_confirmed_at", "null", "now()", "id", owner, "PT403"],
    ["auth.sessions", "not_after", "now() - interval '1 hour'", "null", "id", session, "PT401"],
  ];
  for (const [table, column, changed, restored, key, id, code] of scenarios) {
    await db.query(`update ${table} set ${column} = ${changed} where ${key} = $1`, [id]);
    await as("service_role", async () => {
      await assert.rejects(read(owner, session), { code });
      await assert.rejects(save(owner, session, 2), { code });
    });
    await db.query(`update ${table} set ${column} = ${restored} where ${key} = $1`, [id]);
  }
  await db.query("delete from auth.sessions where id = $1", [session]);
  await as("service_role", () => assert.rejects(save(owner, session, 2), { code: "PT401" }));
  assert.deepEqual((await db.query("select version, value->>'name' as name from catalog_contrib.cms_tool_drafts")).rows,
    [{ version: 2, name: "Updated" }]);
  const submissions = migrations.find((name) => name.endsWith("_cms_tool_submissions.sql"));
  await run("migrations/" + submissions);
  await db.query("insert into auth.sessions(id,user_id) values ($1,$2)", [session, owner]);
  await db.query("insert into catalog_contrib.cms_admins(user_id) values ($1)", [outsider]);
  const submit = async (actor, token, version) =>
    (await db.query("select public.cms_submit_tool_draft($1,$2,$3,$4,$5) as result", [actor, token, "id-42", brand, version])).rows[0].result;
  const review = async (actor, token, id, action) =>
    (await db.query("select public.cms_review_tool_submission($1,$2,$3,$4,$5) as result", [actor, token, id, action, "Reviewed"])).rows[0].result;
  await as("service_role", async () => {
    const listing = (await db.query("select public.cms_list_tool_drafts($1,$2) as result", [owner, session])).rows[0].result;
    assert.deepEqual(listing, [{ id: "id-42", slug: "slug-42", name: "Updated", canEdit: true }]);
    await assert.rejects(submit(viewer, viewSession, 2), { code: "PT403" });
    await assert.rejects(submit(owner, session, 1), { code: "PT409" });
    const request = await submit(owner, session, 2);
    assert.equal(request.status, "submitted");
    assert.equal((await submit(owner, session, 2)).id, request.id);
    await save(owner, session, 2);
    await assert.rejects(submit(owner, session, 3), { code: "PT409" });
    await assert.rejects(review(owner, session, request.id, "approved"), { code: "PT403" });
    assert.equal((await review(outsider, outsideSession, request.id, "changes_requested")).status, "changes_requested");
    await assert.rejects(review(outsider, outsideSession, request.id, "approved"), { code: "PT409" });
    const next = await submit(owner, session, 3);
    assert.notEqual(next.id, request.id);
    assert.equal((await review(outsider, outsideSession, next.id, "approved")).status, "approved");
  });
  const sealed = (await db.query("select version, value from catalog_contrib.cms_tool_submissions order by version")).rows;
  assert.equal(sealed.length, 2);
  assert.deepEqual(sealed[0], { version: 2, value: { schemaVersion: 1, name: "Updated" } });
  console.log("CMS PostgreSQL: access, revocation, client grants and draft CAS passed");
} finally {
  await db.close();
}
