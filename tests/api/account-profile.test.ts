import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
import handler from "../../api/account-profile";
const owner = "11111111-1111-4111-8111-111111111111";
const other = "33333333-3333-4333-8333-333333333333";
const sessionId = "22222222-2222-4222-8222-222222222222";
const token = `header.${Buffer.from(JSON.stringify({ sub: owner, session_id: sessionId })).toString("base64url")}.signature`;
const stored = { avatarUrl: null, providerLocale: null, oauthProfileSource: null, userId: owner, displayName: null, createdAt: "2026-10-19T12:00:00Z", updatedAt: "2026-10-21T12:00:00Z" };
function request(body?: unknown, method = "GET") { const f = httpFixture(body, method); f.req.headers.authorization = `Bearer ${token}`; return f; }
async function invoke(body?: unknown, method = "GET") { const f = request(body, method); await handler(f.req, f.res); return f; }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("STACK_ACCOUNT_ENABLED", "true"); vi.stubEnv("SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture-service"); vi.stubEnv("BACKOFFICE_ADMIN_EMAILS", " owner@example.test ");
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc });
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner, email: "owner@example.test", email_confirmed_at: "2026-10-19T12:00:00Z", is_anonymous: false } }, error: null });
  mocks.rpc.mockImplementation(async (name: string, args: { p_display_name?: string }) => ({ data: name === "require_account_session" ? null : { ...stored, ...(name === "update_personal_profile" ? { displayName: args.p_display_name } : {}) }, error: null }));
});
describe("private profile boundary", () => {
  it("returns only verified owner data and server allowlist capability", async () => {
    const f = await invoke(); expect(f.res.statusCode).toBe(200);
    expect(f.body).toEqual({ profile: { ...stored, email: "owner@example.test", emailConfirmed: true, canAccessBackoffice: true } });
    expect(mocks.rpc).toHaveBeenCalledWith("read_personal_profile", { p_owner: owner, p_session: sessionId });
    expect(f.res.getHeader("Cache-Control")).toBe("no-store");
  });
  it.each([{ displayName: " New name " }, { displayName: "  " }, { displayName: null }])("normalizes sole display name field %j", async body => {
    const f = await invoke(body, "PUT"); expect(f.res.statusCode).toBe(200);
    expect(f.body).toMatchObject({ profile: { displayName: body.displayName?.trim() || null } });
  });
  it.each([{}, [], null, { displayName: 1 }, { displayName: "x".repeat(81) }, { displayName: "a\nb" }, { displayName: "a\u007fb" }, { displayName: "\tname" }, { displayName: "name", userId: other }, { displayName: "name", role: "admin" }, { displayName: "name", email: "x@test" }])("rejects invalid or editable identity fields %j", async body => {
    const f = await invoke(body, "PUT"); expect(f.res.statusCode).toBe(400); expect(mocks.rpc.mock.calls.some(([n]) => n === "update_personal_profile")).toBe(false);
  });
  it("keeps unconfirmed email visible without granting confirmed capability or metadata rights", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: owner, email: "owner@example.test", email_confirmed_at: null, is_anonymous: false, user_metadata: { role: "admin", email_confirmed: true } } }, error: null });
    const f = await invoke(); expect(f.body).toMatchObject({ profile: { email: "owner@example.test", emailConfirmed: false, canAccessBackoffice: false } });
    const { requireAccount } = await import("../../api/_account-auth"); expect(await requireAccount(request().req)).toMatchObject({ email: null });
  });
  it("does not infer capability from database payload or user metadata", async () => {
    vi.stubEnv("BACKOFFICE_ADMIN_EMAILS", "another@example.test");
    mocks.rpc.mockResolvedValue({ data: { ...stored, canAccessBackoffice: true, emailConfirmed: true }, error: null });
    expect((await invoke()).body).toMatchObject({ profile: { canAccessBackoffice: false } });
  });
  it.each([null, {}, { ...stored, userId: other }, { ...stored, displayName: 2 }, { ...stored, displayName: " untrimmed " }, { ...stored, createdAt: "invalid" }])("rejects malformed or foreign source %j", async value => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : value, error: null }));
    expect((await invoke()).res.statusCode).toBe(503);
  });
  it.each(["anon", "revoked", "missing"])('refuses %s sessions', async mode => {
    const f = request();
    if (mode === "missing") delete f.req.headers.authorization;
    if (mode === "anon") mocks.getUser.mockResolvedValue({ data: { user: { id: owner, is_anonymous: true } }, error: null });
    if (mode === "revoked") mocks.rpc.mockResolvedValue({ data: null, error: { code: "PT401" } });
    await handler(f.req, f.res); expect(f.res.statusCode).toBe(401); expect(mocks.rpc.mock.calls.some(([n]) => n === "read_personal_profile")).toBe(false);
  });
  it.each(["STACK_ACCOUNT_ENABLED", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"])('missing %s is unavailable', async key => { delete process.env[key]; expect((await invoke()).res.statusCode).toBe(503); });
  it.each([["PT409", 409, "ACCOUNT_DELETING"], ["PT400", 400, "INVALID_ACCOUNT_PROFILE"], ["XX000", 503, "ACCOUNT_PROFILE_UNAVAILABLE"]])("maps RPC %s without source details", async (code, status, expected) => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: null, error: name === "require_account_session" ? null : { code, message: code === "PT409" ? "ACCOUNT_DELETING" : "secret" } }));
    const f = await invoke({ displayName: "name" }, "PUT"); expect(f.res.statusCode).toBe(status); expect(f.body).toEqual({ error: { code: expected } });
  });
  it("enforces 4KiB on content length, raw stream and parsed bodies before auth/parsing", async () => {
    for (const mode of ["length", "stream", "parsed"]) {
      const f = request(mode === "parsed" ? { displayName: "x".repeat(4096) } : undefined, "PUT");
      if (mode !== "parsed") Object.defineProperty(f.req, "body", { get() { throw new Error("lazy parser accessed"); } });
      if (mode === "length") f.req.headers["content-length"] = "4097";
      if (mode === "stream") f.req[Symbol.asyncIterator] = async function* () { yield Buffer.alloc(4096); yield Buffer.from("x"); };
      await handler(f.req, f.res); expect(f.res.statusCode).toBe(413);
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("reads valid bounded raw JSON while bypassing Vercel lazy body parser", async () => {
    const f = request(undefined, "PUT"); Object.defineProperty(f.req, "body", { get() { throw new Error("lazy parser accessed"); } });
    f.req[Symbol.asyncIterator] = async function* () { yield Buffer.from('{"displayName":"Name"}'); };
    await handler(f.req, f.res); expect(f.res.statusCode).toBe(200); expect(f.body).toMatchObject({ profile: { displayName: "Name" } });
  });
  it("accepts exactly 4KiB raw bodies and Unicode names at the character limit", async () => {
    const f = request(undefined, "PUT");
    const raw = JSON.stringify({ displayName: "𐐀".repeat(80) });
    f.req[Symbol.asyncIterator] = async function* () { yield Buffer.from(raw + " ".repeat(4096 - Buffer.byteLength(raw))); };
    await handler(f.req, f.res); expect(f.res.statusCode).toBe(200); expect(f.body).toMatchObject({ profile: { displayName: "𐐀".repeat(80) } });
    expect((await invoke({ displayName: "𐐀".repeat(81) }, "PUT")).res.statusCode).toBe(400);
  });
  it("rejects invalid JSON/content length and unsupported methods", async () => {
    expect((await invoke("{", "PUT")).res.statusCode).toBe(400);
    const f = request({}, "PUT"); f.req.headers["content-length"] = "bad"; await handler(f.req, f.res); expect(f.res.statusCode).toBe(400);
    const badMethod = await invoke(undefined, "POST"); expect(badMethod.res.statusCode).toBe(405); expect(badMethod.res.getHeader("Allow")).toBe("GET, PUT");
  });
});

describe("OAuth import boundary", () => {
 it("imports only the same-owner verified identity on GET and never on PUT", async () => {
  mocks.getUser.mockResolvedValue({data:{user:{id:owner,email:"owner@example.test",email_confirmed_at:null,app_metadata:{provider:"github"},user_metadata:{role:"admin"},identities:[{id:"h",user_id:owner,provider:"github",identity_data:{user_name:"octocat",avatar_url:"https://avatars.githubusercontent.com/u/1?v=4",locale:"en",email:"forged@test",role:"admin"}}]}},error:null});
  expect((await invoke()).res.statusCode).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("import_personal_oauth_profile",{p_owner:owner,p_session:sessionId,p_provider:"github",p_display_name:"octocat",p_avatar_url:"https://avatars.githubusercontent.com/u/1?v=4",p_provider_locale:"en"});
  expect((await invoke()).body).toMatchObject({profile:{canAccessBackoffice:false,emailConfirmed:false}});
  mocks.rpc.mockClear(); expect((await invoke({displayName:null},"PUT")).res.statusCode).toBe(200);
  expect(mocks.rpc.mock.calls.map(([n])=>n)).not.toContain("import_personal_oauth_profile");
 });
 it.each([{providerLocale:"fr-abcdefghi"},{oauthProfileSource:"admin"}])("rejects malformed new DTO source %j",async extra=>{
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{...stored,...extra},error:null}));
  expect((await invoke()).res.statusCode).toBe(503);
 });
});

it("omits an unusable historical image without rewriting the stored profile",async()=>{
 mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{...stored,displayName:"Historical",avatarUrl:"http://legacy.invalid"},error:null}));
 expect((await invoke()).body).toMatchObject({profile:{displayName:"Historical",avatarUrl:null}});
 expect(mocks.rpc.mock.calls.map(([n])=>n)).not.toContain("update_personal_profile");
});
