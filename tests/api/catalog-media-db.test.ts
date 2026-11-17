import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const owner = "10d169ae-0fae-4061-b657-2b1ff9359f59";
const outsider = "80d169ae-0fae-4061-b657-2b1ff9359f59";
const session = "2a141b6a-483f-49e4-8a5f-637fc9da95f4";
const brand = "71e6c8e4-2a55-4a48-9786-bc5e1b9cfc73";
const listing = "a1cef0ce-bd00-42af-a390-56c682622938";
const sha = "a".repeat(64);
const loadMigration = (file: string) => readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8");
const args = { target: { kind: "tool", id: "fixture" }, role: "logo", mimeType: "image/png", bytes: 100, idempotencyKey: "fixture-reserve-1" };
async function run(action: string, value: object, actor = owner) {
  const { rows } = await db.query<{ result: Record<string, unknown> }>("select public.cms_media($1,$2,$3,$4) result", [actor, session, action, JSON.stringify(value)]);
  return rows[0].result;
}

beforeAll(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${owner}'), ('${outsider}');
    create schema storage; create schema catalog_contrib; create schema catalog_private;
    grant usage on schema auth, storage to authenticated, anon;
    create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(bucket_id text, name text, primary key(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated, anon;
    create table catalog_contrib.listing_requests(id uuid primary key, owner_id uuid not null,
      status text not null default 'draft', representation_status text not null default 'pending', canonical_tool_id text, initial_approval_id uuid,
      reservation_expires_at timestamptz not null default (now() + interval '30 days'));
    insert into catalog_contrib.listing_requests(id,owner_id) values ('${listing}','${owner}');
    create function catalog_contrib.cms_require_listing_account(uuid,uuid) returns void language plpgsql as $$begin
      if $2 <> '${session}' then raise sqlstate 'PT401'; end if;
    end$$;
    create table catalog_contrib.cms_tool_drafts(brand_id uuid, tool_id text, value jsonb default '{"media":[]}', primary key(brand_id, tool_id));
    insert into catalog_contrib.cms_tool_drafts(brand_id, tool_id) values ('${brand}', 'fixture'), ('${brand}', 'another');
    create table catalog_contrib.cms_tool_submissions(id uuid primary key, brand_id uuid, tool_id text, value jsonb, status text);
    create function catalog_contrib.cms_require_admin(uuid,uuid) returns void language plpgsql as $$begin
      if $1 <> '${owner}' or $2 <> '${session}' then raise sqlstate 'PT403'; end if;
    end$$;
    create table catalog_private.initial_listing_approvals(id uuid, listing_id uuid, brand_id uuid, tool_id text, value jsonb, status text);
    create table catalog_contrib.listing_product_versions(value jsonb);
    create function public.cms_approved_release_inputs(uuid,uuid) returns jsonb language sql as $$
      select coalesce(jsonb_agg(jsonb_build_object('approvalId', id, 'toolId', tool_id, 'value', value, 'attached', true)), '[]'::jsonb)
      from catalog_contrib.cms_tool_submissions where status='approved' $$;
    create function public.cms_initial_release_inputs(uuid,uuid) returns jsonb language sql as $$
      select coalesce(jsonb_agg(jsonb_build_object('approvalId', id, 'toolId', tool_id, 'value', value, 'attached', true)), '[]'::jsonb)
      from catalog_private.initial_listing_approvals where status='approved' $$;
    create table public.draft_permissions(allowed boolean);
    insert into public.draft_permissions values (true);
    create function catalog_contrib.cms_require_tool_access(uuid,uuid,text,boolean) returns table(brand_id uuid,can_edit boolean) language plpgsql as $$begin
      if $1 <> '${owner}' or $2 <> '${session}' or not (select allowed from public.draft_permissions) then raise sqlstate 'PT403'; end if;
      return query select '${brand}'::uuid, true;
    end$$;
  `);
  await db.exec(await loadMigration("20261117081038_cms_media.sql"));
  await db.exec(await loadMigration("20261117081957_cms_media_release.sql"));
});
afterAll(() => db.close());

async function asMember(actor: string, operation: () => Promise<unknown>) {
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: actor, session_id: session })]);
  await db.exec("set role authenticated");
  try { return await operation(); } finally { await db.exec("reset role"); }
}

describe("CMS media database and Storage policy", () => {
  it("binds the idempotent reservation to one member and rejects foreign, public, and traversal paths", async () => {
    const reservation = await run("reserve", args);
    expect(reservation).toMatchObject({ state: "reserved", path: `originals/${reservation.assetId}` });
    expect(await run("reserve", args)).toEqual(reservation);
    await expect(run("reserve", { ...args, bytes: 101 })).rejects.toHaveProperty("code", "PT409");
    await expect(run("reserve", args, outsider)).rejects.toHaveProperty("code", "PT403");
    const attempt = (bucket: string, path: unknown) => db.query("insert into storage.objects values ($1,$2)", [bucket, path]);
    await expect(asMember(outsider, () => attempt("catalog-drafts", reservation.path))).rejects.toHaveProperty("code", "42501");
    await expect(asMember(owner, () => attempt("catalog-drafts", `../${reservation.path}`))).rejects.toHaveProperty("code", "42501");
    await expect(asMember(owner, () => attempt("catalog-public", reservation.path))).rejects.toHaveProperty("code", "42501");
    await db.exec("update public.draft_permissions set allowed=false");
    await expect(asMember(owner, () => attempt("catalog-drafts", reservation.path))).rejects.toHaveProperty("code", "42501");
    await db.exec("update public.draft_permissions set allowed=true");
    await asMember(owner, () => attempt("catalog-drafts", reservation.path));
    await expect(asMember(owner, () => db.query("insert into storage.objects values ($1,$2) on conflict (bucket_id,name) do update set name=$2", ["catalog-drafts", reservation.path])))
      .rejects.toHaveProperty("code", "42501");
  });

  it("rejects unprocessed attachments and binds a processed asset to the correct tool", async () => {
    const { assetId } = await run("reserve", args);
    const media = JSON.stringify({ media: [{ assetId, role: "logo" }] });
    const save = (tool: string) => db.query("update catalog_contrib.cms_tool_drafts set value=$1 where tool_id=$2", [media, tool]);
    await expect(save("fixture")).rejects.toHaveProperty("code", "PT403");
    const started = await run("beginFinalize", { assetId });
    await run("finish", { assetId, processingToken: started.processingToken, sha256: sha, originalBytes: 100, derivativeBytes: 75, width: 10, height: 10 });
    await expect(save("another")).rejects.toHaveProperty("code", "PT403");
    await save("fixture");
    const approvalId = "b129ed44-acde-44b5-87f9-f1d61ef0aad5";
    await db.query("insert into catalog_contrib.cms_tool_submissions values ($1,$2,$3,$4,'approved')", [approvalId, brand, "fixture", media]);
    const manifest = "select public.cms_approved_media_inputs($1,$2,$3) result";
    const approval = (actor: string) => db.query(manifest, [actor, session, [approvalId]]);
    await expect(approval(outsider)).rejects.toHaveProperty("code", "PT403");
    expect((await approval(owner)).rows).toEqual([{ result: [{ assetId, approvalId, toolId: "fixture", role: "logo",
      sha256: sha, derivativeBytes: 75, width: 10, height: 10 }] }]);
    await db.query("update catalog_contrib.cms_tool_submissions set status='submitted' where id=$1", [approvalId]);
    await expect(approval(owner)).rejects.toHaveProperty("code", "PT409");
    expect(await run("preview", { assetId })).toMatchObject({ state: "ready", derivativePath: `derived/${assetId}/${sha}.webp` });
    await db.exec("update public.draft_permissions set allowed=false");
    await expect(run("preview", { assetId })).rejects.toHaveProperty("code", "PT403");
    await db.exec("update public.draft_permissions set allowed=true");
  });

  it("enforces target role capacity and rejects expired upload reservations", async () => {
    const base = { ...args, target: { kind: "listing", id: listing }, role: "gallery" };
    const reservations = [];
    for (let i = 0; i < 12; i++) reservations.push(await run("reserve", { ...base, idempotencyKey: `gallery-${i}` }));
    await expect(run("reserve", { ...base, idempotencyKey: "gallery-thirteenth" })).rejects.toHaveProperty("code", "PT409");
    const { assetId, path } = reservations[0];
    await db.query("update catalog_private.cms_media_assets set expires_at=now()-interval '1 day' where id=$1", [assetId]);
    await expect(asMember(owner, () => db.query("insert into storage.objects values ('catalog-drafts',$1)", [path])))
      .rejects.toHaveProperty("code", "42501");
    await expect(run("beginFinalize", { assetId })).rejects.toHaveProperty("code", "PT409");
    const secondListing = "a2cef0ce-bd00-42af-a390-56c682622938";
    await db.query("insert into catalog_contrib.listing_requests (id, owner_id) values ($1,$2)", [secondListing, owner]);
    const extra = { ...base, target: { kind: "listing", id: secondListing } };
    await run("reserve", { ...extra, idempotencyKey: "quota-other-1" });
    await run("reserve", { ...extra, idempotencyKey: "quota-other-2" });
    await expect(run("reserve", { ...extra, idempotencyKey: "quota-other-3" })).rejects.toHaveProperty("code", "PT429");
  });
});
