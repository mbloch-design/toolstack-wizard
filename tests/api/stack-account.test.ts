import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
import { normalizePersonalStack } from "../../src/lib/personalStack";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), deleteUser: vi.fn(), rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
import handler from "../../api/stack-account";

const owner = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const jwt = (claims: unknown = { sub: owner, session_id: sessionId }) => `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
function request(body?: unknown, method = "GET", token = jwt()) {
  const fixture = httpFixture(body, method);
  fixture.req.headers.authorization = `Bearer ${token}`;
  return fixture;
}
const state = normalizePersonalStack(null);
const record = { state, revision: 1, updatedAt: "2026-10-19T12:00:00.000Z" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STACK_ACCOUNT_ENABLED", "true");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-fixture");
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser, admin: { deleteUser: mocks.deleteUser } }, rpc: mocks.rpc });
  mocks.deleteUser.mockResolvedValue({ data: null, error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner, email: "owner@example.test", email_confirmed_at: "2026-10-19T12:00:00Z", is_anonymous: false } }, error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "personal_account_has_contributions" ? false : name === "require_account_session" || name === "begin_personal_account_deletion" ? null : record, error: null }));
});

describe("personal stack HTTP boundary", () => {
  it.each([undefined, "false", "1"])("defaults disabled without privileged calls for flag %s", async (flag) => {
    if (flag === undefined) delete process.env.STACK_ACCOUNT_ENABLED;
    else vi.stubEnv("STACK_ACCOUNT_ENABLED", flag);
    const fixture = request();
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("derives owner and verified session solely from the validated token", async () => {
    const fixture = request({ ownerId: "attacker", sessionId: "attacker", expectedRevision: 1, state }, "PUT");
    await handler(fixture.req, fixture.res);
    expect(mocks.getUser).toHaveBeenCalledWith(jwt());
    expect(mocks.rpc).toHaveBeenCalledWith("require_account_session", { p_owner: owner, p_session: sessionId });
    expect(mocks.rpc).toHaveBeenCalledWith("save_personal_stack", { p_owner: owner, p_session: sessionId, p_expected_revision: 1, p_state: state });
    expect(fixture.res.statusCode).toBe(200);
    expect(fixture.body).toEqual({ stack: record });
    expect(fixture.res.getHeader("Cache-Control")).toBe("no-store");
  });

  it("normalizes historical v3 reads without writing them", async () => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : { ...record, state: { ...state.selection, pinnedToolSlugs: ["unknown-json-tool"] } }, error: null }));
    const fixture = request();
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(200);
    expect(fixture.body).toMatchObject({ stack: { state: { version: 4, selection: { pinnedToolSlugs: ["unknown-json-tool"] }, billing: { choices: {} } } } });
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["require_account_session", "read_personal_stack"]);
  });

  it.each([{}, [[]], { version: 3 }, { version: 4, selection: null }, { ...state, selection: {} }, { ...state, billing: null }])("reports corrupt stored source %j as unavailable rather than empty", async storedState => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : { ...record, state: storedState }, error: null }));
    const fixture = request(); await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(503);
    expect(fixture.body).toEqual({ error: { code: "STACK_ACCOUNT_UNAVAILABLE" } });
  });

  it.each([{ version: 3, pinnedToolSlugs: [] }, { pinnedToolSlugs: [] }, state])("retains real empty stored snapshots %j", async storedState => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : { ...record, state: storedState }, error: null }));
    const fixture = request(); await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(200);
    expect(fixture.body).toMatchObject({ stack: { revision: 1, state: { version: 4, selection: { toolEntries: [] } } } });
  });

  it("returns null when no snapshot exists without creating an empty one", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    const fixture = request();
    await handler(fixture.req, fixture.res);
    expect(fixture.body).toEqual({ stack: null });
  });

  it.each([
    ["PT401", "ACCOUNT_SESSION_INVALID", 401],
    ["PT409", "STACK_REVISION_CONFLICT", 409],
    ["PT409", "ACCOUNT_DELETING", 409],
    ["XX000", "internal SQL secrets", 503],
  ])("maps SQL %s/%s without exposing internals", async (code, message, status) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message, details: "secret query" } });
    const fixture = request();
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(status);
    expect(JSON.stringify(fixture.body)).not.toContain("secret");
    expect(JSON.stringify(fixture.body)).not.toContain("SQL");
  });

  it("rejects a revoked session before reading the stack", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "PT401", message: "ACCOUNT_SESSION_INVALID" } });
    const fixture = request();
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(401);
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["require_account_session"]);
  });

  it.each([null, { sub: "different-user", session_id: sessionId }, { sub: owner }, { sub: owner, session_id: "bad" }])("rejects missing/mismatched verified token claims %j", async claims => {
    const fixture = request(undefined, "GET", jwt(claims));
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid auth tokens and anonymous identities", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 401 } });
    const invalid = request();
    await handler(invalid.req, invalid.res);
    expect(invalid.res.statusCode).toBe(401);
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: owner, is_anonymous: true } }, error: null });
    const anonymous = request();
    await handler(anonymous.req, anonymous.res);
    expect(anonymous.res.statusCode).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not confer verified email authority on an unconfirmed email", async () => {
    const { requireAccount } = await import("../../api/_account-auth");
    mocks.getUser.mockResolvedValue({ data: { user: { id: owner, email: "admin@example.test", email_confirmed_at: null, is_anonymous: false } }, error: null });
    expect(await requireAccount(request().req)).toEqual({ userId: owner, sessionId, email: null });
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER, "1"])("rejects invalid expectedRevision %s", async expectedRevision => {
    const fixture = request({ state, expectedRevision }, "PUT");
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(400);
    expect(mocks.rpc.mock.calls.some(([name]) => name === "save_personal_stack")).toBe(false);
  });

  it("rejects nonfinite server amounts before persistence", async () => {
    const invalid = normalizePersonalStack(null);
    invalid.billing.choices.a = { source: "custom", amount: Infinity, currency: "EUR", period: "monthly" };
    const fixture = request({ state: invalid, expectedRevision: 0 }, "PUT");
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(400);
    expect(mocks.rpc.mock.calls.some(([name]) => name === "save_personal_stack")).toBe(false);
  });

  it("rejects oversized content length before accessing the body or auth", async () => {
    const fixture = request(undefined, "PUT");
    fixture.req.headers["content-length"] = String(1024 * 1024 + 1);
    Object.defineProperty(fixture.req, "body", { get() { throw new Error("body must not be accessed"); } });
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(413);
    expect(fixture.body).toEqual({ error: { code: "PAYLOAD_TOO_LARGE" } });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("caps chunked raw bodies before parsing and rejects large parsed fixtures too", async () => {
    const raw = request(undefined, "PUT");
    raw.req[Symbol.asyncIterator] = async function* () { yield Buffer.alloc(1024 * 1024); yield Buffer.from("x"); };
    await handler(raw.req, raw.res);
    expect(raw.res.statusCode).toBe(413);
    const parsed = request({ padding: "x".repeat(1024 * 1024) }, "PUT");
    await handler(parsed.req, parsed.res);
    expect(parsed.res.statusCode).toBe(413);
  });

  it("bypasses Vercel's lazy body getter and caps its restored raw stream before parsing", async () => {
    const fixture = request(undefined, "PUT");
    Object.defineProperty(fixture.req, "body", { get() { throw new Error("lazy parser must not run"); } });
    fixture.req[Symbol.asyncIterator] = async function* () { yield Buffer.alloc(1024 * 1024 + 1); };
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(413);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("accepts a capped valid raw stream without touching the lazy parser", async () => {
    const fixture = request(undefined, "PUT");
    Object.defineProperty(fixture.req, "body", { get() { throw new Error("lazy parser must not run"); } });
    fixture.req[Symbol.asyncIterator] = async function* () { yield Buffer.from(JSON.stringify({ state, expectedRevision: 0 })); };
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("save_personal_stack", expect.objectContaining({ p_expected_revision: 0 }));
  });

  it("deletes an ordinary account only after session verification, barrier and history protection", async () => {
    const fixture = request(undefined, "DELETE");
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(204);
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["require_account_session", "begin_personal_account_deletion", "personal_account_has_contributions"]);
    expect(mocks.deleteUser).toHaveBeenCalledWith(owner);
    expect(mocks.deleteUser.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.rpc.mock.invocationCallOrder[2]);
  });

  it("retains contribution history and never invokes Auth deletion for a referenced account", async () => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "personal_account_has_contributions" ? true : null, error: null }));
    const fixture = request(undefined, "DELETE");
    await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(409);
    expect(fixture.body).toEqual({ error: { code: "ACCOUNT_HAS_CONTRIBUTIONS" } });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("leaves a provider failure resumable and only returns 204 on the successful retry", async () => {
    mocks.deleteUser.mockResolvedValueOnce({ error: { status: 500, message: "provider details secret" } });
    const first = request(undefined, "DELETE");
    await handler(first.req, first.res);
    expect(first.res.statusCode).toBe(503);
    expect(first.body).toEqual({ error: { code: "ACCOUNT_DELETION_FAILED" } });
    const retry = request(undefined, "DELETE"); await handler(retry.req, retry.res);
    expect(retry.res.statusCode).toBe(204);
    expect(mocks.rpc.mock.calls.filter(([name]) => name === "begin_personal_account_deletion")).toHaveLength(2);
    expect(mocks.deleteUser).toHaveBeenCalledTimes(2);
  });

  it("reports a concurrent contribution FK failure without removing history or leaking details", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { code: "23503", message: "private table secret" } });
    const fixture = request(undefined, "DELETE"); await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(409);
    expect(fixture.body).toEqual({ error: { code: "ACCOUNT_HAS_CONTRIBUTIONS" } });
  });

  it("never deletes on history-check failure or revoked session", async () => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: null, error: name === "personal_account_has_contributions" ? { code: "XX000", message: "private DB details" } : null }));
    const fixture = request(undefined, "DELETE"); await handler(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(503);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    const revoked = request(undefined, "DELETE"); await handler(revoked.req, revoked.res);
    expect(revoked.res.statusCode).toBe(401); expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
