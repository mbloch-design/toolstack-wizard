import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const owner = "10d169ae-0fae-4061-b657-2b1ff9359f59";
const stranger = "80d169ae-0fae-4061-b657-2b1ff9359f59";
const session = "2a141b6a-483f-49e4-8a5f-637fc9da95f4";
const listing = "a1cef0ce-bd00-42af-a390-56c682622938";
const historical = "b1cef0ce-bd00-42af-a390-56c682622938";
const another = "c1cef0ce-bd00-42af-a390-56c682622938";
const site = "https://example.com/";
const query = async (sql: string, args: unknown[]) => (await db.query<{ result: Record<string, unknown> }>(sql, args)).rows[0].result;
const action = (command: string, args?: Record<string, unknown>, actor = owner, id = listing) =>
  query("select public.cms_listing_commerce($1,$2,$3,$4,$5) result", [actor, session, id, command, JSON.stringify(args ?? {})]);
const billing = (event: string | null, type: string, proof: Record<string, unknown>) =>
  query("select public.cms_apply_listing_billing($1,$2,$3,$4) result", [event, type, "2026-11-17T09:00:00Z", JSON.stringify(proof)]);

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema catalog_contrib; create schema catalog_private;
    create table catalog_contrib.listing_requests (
      id uuid primary key, owner_id uuid not null, website_url text not null, offer text not null default 'standard_badge',
      offer_version int not null default 1, locale text not null default 'en', status text not null default 'draft',
      canonical_tool_id text, reservation_expires_at timestamptz not null default (now() + interval '30 days'),
      commercial_status text not null default 'pending', representation_status text not null default 'pending', lock_version int not null default 3, updated_at timestamptz not null default now()
    );
    create function catalog_contrib.cms_require_listing_account(uuid,uuid) returns void language plpgsql as $$begin
      if $2 <> '${session}' then raise sqlstate 'PT401'; end if;
    end$$;
    insert into catalog_contrib.listing_requests (id, owner_id, website_url) values
      ('${listing}', '${owner}', '${site}'), ('${historical}', '${owner}', '${site}'), ('${another}', '${owner}', '${site}');`);
  await db.exec(await readFile(new URL("../../supabase/migrations/20261117080010_cms_commerce.sql", import.meta.url), "utf8"));
});
afterAll(() => db.close());

describe("CMS listing commerce SQL", () => {
  it("keeps RPCs away from clients and refuses access to another owner's listing", async () => {
    const result = await query(`select jsonb_build_object(
      'actor', has_function_privilege('authenticated','public.cms_listing_commerce(uuid,uuid,uuid,text,jsonb)','execute'),
      'webhook', has_function_privilege('anon','public.cms_apply_listing_billing(text,text,timestamptz,jsonb)','execute')) result`, []);
    expect(result).toEqual({ actor: false, webhook: false });
    await expect(action("status", {}, stranger)).rejects.toHaveProperty("code", "PT404");
  });

  it("gates legacy reconciliation before checkout and allows only one provider dispatch per active listing", async () => {
    expect(await action("requestHistoricalReview", {}, owner, historical)).toMatchObject({ state: "review_required" });
    expect(await action("prepare", {}, owner, historical)).toMatchObject({ state: "review_required", attempt: null });
    const prepared = await action("prepare");
    expect(prepared).toMatchObject({ state: "pending", attempt: { websiteUrl: site } });
    const [claim, second] = await Promise.all([action("dispatch"), action("dispatch")]);
    expect([claim.dispatch, second.dispatch]).toEqual([true, false]);
  });

  it("handles an out-of-order refund and prevents a replay or duplicate receipt from granting payment", async () => {
    const prepared = await action("prepare");
    const { id } = prepared.attempt as { id: string };
    const proof = { attemptId: id, checkoutId: "ch_test", orderId: "ord_test", transactionId: "tran_test",
      paidAt: "2026-11-17T08:00:00Z", state: "paid" };
    expect(await billing("evt_refund", "refund.created", { transactionId: "tran_test" })).toMatchObject({ duplicate: false });
    expect(await billing("evt_paid", "checkout.completed", proof)).toMatchObject({ duplicate: false, state: "review_required" });
    expect(await billing("evt_paid", "checkout.completed", proof)).toMatchObject({ duplicate: true });
    expect(await action("status")).toMatchObject({ state: "review_required" });
    expect(await billing(null, "reconcile", proof)).toMatchObject({ state: "review_required" });
    const second = await action("prepare", {}, owner, another);
    await action("dispatch", {}, owner, another);
    await expect(billing(null, "reconcile", { ...proof, attemptId: (second.attempt as { id: string }).id }))
      .rejects.toHaveProperty("code", "23505");
  });

  it("persists badge evidence only for the exact version of the website checked", async () => {
    const started = await action("beginBadge", {}, owner, another);
    const value = { websiteUrl: site, badgeUrl: `${site}badge`, state: "present", requestedAt: started.badgeRequestedAt };
    expect(await action("badge", value, owner, another))
      .toMatchObject({ checkedAt: expect.any(String) });
    await db.query("update catalog_contrib.listing_requests set website_url='https://new.example.com/' where id=$1", [another]);
    await expect(action("badge", value, owner, another))
      .rejects.toHaveProperty("code", "PT409");
  });
});
