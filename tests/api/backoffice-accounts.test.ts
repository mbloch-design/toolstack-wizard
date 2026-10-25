import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), createClient: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
import handler from "../../api/backoffice-accounts";

const owner = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const target = "33333333-3333-4333-8333-333333333333";
const jwt = `header.${Buffer.from(JSON.stringify({ sub: owner, session_id: sessionId })).toString("base64url")}.signature`;
const at = "2026-10-20T08:00:00.000Z";
const account = { userId: target, email: "person@example.test", displayName: null, createdAt: at, hasStack: true, stackUpdatedAt: at };
const dashboard = { totals: { accounts: 26, accountsWithStack: 1, nonemptyStacks: 1 }, topTools: [{ toolSlug: "tapstitch", usedAccounts: 1, wishlistAccounts: 0 }], accounts: Array.from({ length: 25 }, (_, index) => ({ ...account, hasStack: index === 0, stackUpdatedAt: index === 0 ? at : null, userId: `${String(index + 10).padStart(8,"0")}-3333-4333-8333-333333333333` })), page: 1, pageSize: 25, total: 26, updatedAt: at };
function request(query: Record<string, string | string[]> = {}, token: string | null = jwt) {
  const fixture = httpFixture(undefined, "GET"); fixture.req.query = query;
  if (token) fixture.req.headers.authorization = `Bearer ${token}`;
  return fixture;
}
function user(email = "admin@example.test", extra = {}) {
  return { id: owner, email, email_confirmed_at: at, is_anonymous: false, ...extra };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STACK_ACCOUNT_ENABLED", "true"); vi.stubEnv("SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-test-only");
  vi.stubEnv("BACKOFFICE_ADMIN_EMAILS", " other@example.test, ADMIN@example.test ");
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc, from: mocks.from });
  mocks.from.mockReturnValue({select:mocks.select}); mocks.select.mockReturnValue({eq:mocks.eq}); mocks.eq.mockReturnValue({maybeSingle:mocks.maybeSingle});
  mocks.maybeSingle.mockResolvedValue({data:{id:target,avatar_url:null,provider_locale:null,oauth_profile_source:null},error:null});
  mocks.getUser.mockResolvedValue({ data: { user: user() }, error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : dashboard, error: null }));
});
describe("accounts back-office HTTP boundary", () => {
  it("denies a visitor without invoking privileged operations", async () => {
    const f = request({}, null); await handler(f.req,f.res); expect(f.res.statusCode).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["ordinary", "editor"])("denies %s despite claimed metadata and header authority", async role => {
    mocks.getUser.mockResolvedValue({ data: { user: user("member@example.test", { user_metadata: { role: "admin" }, app_metadata: { role } }) }, error: null });
    const f = request({ role: "admin", admin: owner }); f.req.headers["x-admin-key"]="server-test-only";
    await handler(f.req,f.res); expect(f.res.statusCode).toBe(403); expect(f.body).toEqual({ error: { code: "BACKOFFICE_FORBIDDEN" } });
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["require_account_session"]);
  });
  it("requires confirmed email authority even for an allowlisted email string", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: user("admin@example.test", { email_confirmed_at: null }) }, error: null });
    const f=request(); await handler(f.req,f.res); expect(f.res.statusCode).toBe(403);
  });
  it("uses verified identity, current session and server allowlist with exact pagination", async () => {
    const f=request(); await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(200); expect(f.body).toEqual(dashboard);
    expect(mocks.rpc).toHaveBeenCalledWith("accounts_dashboard", { p_admin: owner,p_session:sessionId,p_query:{ mode:"list",search:"",page:1,pageSize:25 } });
    expect(f.res.getHeader("Cache-Control")).toBe("no-store");
  });
  it("does not derive global totals from the 25 visible accounts", async () => {
    const f=request(); await handler(f.req,f.res);
    expect(f.body).toMatchObject({ totals:{accounts:26},total:26,accounts:expect.arrayContaining([dashboard.accounts[0]]) });
    expect((f.body as typeof dashboard).accounts).toHaveLength(25);
  });
  it("passes literal search and later-page requests without scanning Auth pages", async () => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name==="require_account_session"?null:{...dashboard,page:2,accounts:[account]}, error:null }));
    const f=request({search:"person%",page:"2",pageSize:"25"}); await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(200); expect(mocks.rpc).toHaveBeenLastCalledWith("accounts_dashboard", {p_admin:owner,p_session:sessionId,p_query:{mode:"list",search:"person%",page:2,pageSize:25}});
  });
  it("normalizes historical v3 detail read-only and keeps missing JSON references", async () => {
    const detail={userId:target,email:account.email,displayName:null,createdAt:at,stack:{state:{version:3,pinnedToolSlugs:["json-only-reference"]},revision:2,updatedAt:at}};
    mocks.rpc.mockImplementation(async (name:string)=>({data:name==="require_account_session"?null:detail,error:null}));
    const f=request({mode:"detail",userId:target}); await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(200); expect(f.body).toMatchObject({account:{userId:target,stack:{state:{version:4,selection:{pinnedToolSlugs:["json-only-reference"]},billing:{choices:{}},decisions:{}}}}});
    expect(mocks.rpc).toHaveBeenLastCalledWith("accounts_dashboard", {p_admin:owner,p_session:sessionId,p_query:{mode:"detail",userId:target}});
  });
  it.each([{}, { version: 3 }, { version: 4, selection: null }, { version: 4, selection: {} }])("rejects corrupted stored detail %j as source unavailable", async state => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "require_account_session" ? null : { userId:target,email:account.email,displayName:null,createdAt:at,stack:{state,revision:1,updatedAt:at} }, error:null }));
    const f=request({mode:"detail",userId:target});await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(503);expect(f.body).toEqual({error:{code:"BACKOFFICE_UNAVAILABLE"}});
  });
  it.each([{version:3,pinnedToolSlugs:[]},{pinnedToolSlugs:[]},{version:4,selection:{version:3,needs:[],toolEntries:[],pinnedToolSlugs:[]},billing:{paid:[],reviewed:[],choices:{}},decisions:{}}])("returns genuine empty stored detail %j as a record",async state=>{
    mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{userId:target,email:account.email,displayName:null,createdAt:at,stack:{state,revision:1,updatedAt:at}},error:null}));
    const f=request({mode:"detail",userId:target});await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(200);expect(f.body).toMatchObject({account:{stack:{revision:1,state:{version:4,selection:{toolEntries:[]}}}}});
  });
  it("distinguishes a missing account from source failure", async () => {
    mocks.rpc.mockResolvedValue({data:null,error:null}); const f=request({mode:"detail",userId:target}); await handler(f.req,f.res);
    expect(f.res.statusCode).toBe(200); expect(f.body).toEqual({account:null});
  });
  it.each<Record<string, string | string[]>>([{page:"0"},{pageSize:"101"},{page:"1.5"},{page:["1","2"]},{mode:"detail",userId:"wrong"},{mode:"write"}])("rejects invalid query %j",async query=>{
    const f=request(query); await handler(f.req,f.res); expect(f.res.statusCode).toBe(400);
    expect(mocks.rpc.mock.calls.map(([name])=>name)).toEqual(["require_account_session"]);
  });
  it("fails closed when the allowlist or feature configuration is absent",async()=>{
    delete process.env.BACKOFFICE_ADMIN_EMAILS; const f=request(); await handler(f.req,f.res); expect(f.res.statusCode).toBe(503);
    vi.stubEnv("STACK_ACCOUNT_ENABLED","false"); mocks.rpc.mockClear(); const disabled=request(); await handler(disabled.req,disabled.res);
    expect(disabled.res.statusCode).toBe(503); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("maps revoked sessions and source errors without SQL details",async()=>{
    mocks.rpc.mockResolvedValueOnce({data:null,error:{code:"PT401",message:"invalid"}});
    const revoked=request(); await handler(revoked.req,revoked.res); expect(revoked.res.statusCode).toBe(401);
    mocks.rpc.mockImplementation(async(name:string)=>({data:null,error:name==="require_account_session"?null:{code:"XX001",message:"secret SQL"}}));
    const unavailable=request(); await handler(unavailable.req,unavailable.res); expect(unavailable.res.statusCode).toBe(503); expect(JSON.stringify(unavailable.body)).not.toContain("secret");
  });
  it("rejects malformed source responses instead of showing zero accounts",async()=>{
    mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{accounts:[]},error:null}));
    const f=request(); await handler(f.req,f.res); expect(f.res.statusCode).toBe(503);
  });
  it("rejects writes",async()=>{const f=request();f.req.method="POST";await handler(f.req,f.res);expect(f.res.statusCode).toBe(405);expect(mocks.rpc).not.toHaveBeenCalled();});
});

describe("cosmetic detail projection",()=>{
 it("reads only display profile fields after admin and owner checks; list stays one RPC",async()=>{
  const detail={userId:target,email:account.email,displayName:"Custom",createdAt:at,stack:null};
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:detail,error:null}));
  mocks.maybeSingle.mockResolvedValue({data:{id:target,avatar_url:"https://avatars.githubusercontent.com/u/1",provider_locale:"en",oauth_profile_source:"github"},error:null});
  const f=request({mode:"detail",userId:target});await handler(f.req,f.res);
  expect(f.res.statusCode).toBe(200);expect(f.body).toMatchObject({account:{avatarUrl:"https://avatars.githubusercontent.com/u/1",providerLocale:"en",oauthProfileSource:"github",displayName:"Custom"}});
  expect(mocks.select).toHaveBeenCalledWith("id, avatar_url, provider_locale, oauth_profile_source, locale");expect(mocks.eq).toHaveBeenCalledWith("id",target);
 });
 it("rejects mismatching owners before lookup and mismatching returned profile owners",async()=>{
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{userId:owner,email:null,displayName:null,createdAt:at,stack:null},error:null}));
  const f=request({mode:"detail",userId:target});await handler(f.req,f.res);expect(f.res.statusCode).toBe(503);expect(mocks.from).not.toHaveBeenCalled();
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{userId:target,email:null,displayName:null,createdAt:at,stack:null},error:null}));
  mocks.maybeSingle.mockResolvedValue({data:{id:owner,avatar_url:null,provider_locale:null,oauth_profile_source:null},error:null});
  const g=request({mode:"detail",userId:target});await handler(g.req,g.res);expect(g.res.statusCode).toBe(503);
 });
 it("keeps missing profile rows and historical unsafe images neutral",async()=>{
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="require_account_session"?null:{userId:target,email:null,displayName:null,createdAt:at,stack:null},error:null}));
  for(const value of [null,{id:target,avatar_url:"http://legacy.invalid",provider_locale:null,oauth_profile_source:null}]){
   mocks.maybeSingle.mockResolvedValue({data:value,error:null});const f=request({mode:"detail",userId:target});await handler(f.req,f.res);expect(f.res.statusCode).toBe(200);expect(f.body).toMatchObject({account:{avatarUrl:null,providerLocale:null,oauthProfileSource:null}});
  }
 });
 it("never queries profiles for denied admin or list",async()=>{
  const f=request();await handler(f.req,f.res);expect(mocks.from).not.toHaveBeenCalled();
  mocks.getUser.mockResolvedValue({data:{user:user("member@example.test")},error:null});const g=request({mode:"detail",userId:target});await handler(g.req,g.res);expect(g.res.statusCode).toBe(403);expect(mocks.from).not.toHaveBeenCalled();
 });
});

describe('workspace projections',()=>{
 it('returns bounded per-user summaries without leaking raw snapshots',async()=>{
  const selected={...account};
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==='require_account_session'?null:{...dashboard,accounts:[selected]},error:null}));
  const inQuery=vi.fn().mockResolvedValue({data:[{owner_id:target,state:{version:4,selection:{version:3,needs:[{id:'custom',labelFr:'Mon tableau',labelEn:'My board',source:'custom',order:1}],toolEntries:[{toolSlug:'tapstitch',intent:'stack',needIds:['custom'],assignmentMode:'manual',addedAt:at},{toolSlug:'missing',intent:'wishlist',needIds:[],assignmentMode:'pending',addedAt:at}],pinnedToolSlugs:['tapstitch','missing']},billing:{paid:['tapstitch'],reviewed:['tapstitch'],choices:{tapstitch:{source:'custom',amount:0,currency:'EUR',period:'monthly'}}},decisions:{},trade:'designer',dailyRate:{amount:400,currency:'EUR'},usage:{tapstitch:4}}}],error:null});
  mocks.select.mockReturnValue({in:inQuery});
  const f=request({include:'insights'});await handler(f.req,f.res);
  expect(f.res.statusCode).toBe(200);expect(inQuery).toHaveBeenCalledWith('owner_id',[target]);
  expect(f.body).toMatchObject({accounts:[{insights:{usedTools:1,wishlistTools:1,boards:9,trade:'designer',hasDailyRate:true,amounts:1,usage:1,decisions:0}}]});
  expect(JSON.stringify(f.body)).not.toContain('Mon tableau');expect(JSON.stringify(f.body)).not.toContain('dailyRate');
 });
 it.each(['missing','unexpected','corrupt'])('fails closed for %s snapshot projection',async(kind)=>{
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==='require_account_session'?null:{...dashboard,accounts:[account]},error:null}));
  mocks.select.mockReturnValue({in:vi.fn().mockResolvedValue({data:kind==='missing'?[]:[{owner_id:kind==='unexpected'?owner:target,state:{}}],error:null})});
  const f=request({include:'insights'});await handler(f.req,f.res);expect(f.res.statusCode).toBe(503);
 });
 it('never reads snapshots when the user is not an administrator',async()=>{
  mocks.getUser.mockResolvedValue({data:{user:user('member@example.test')},error:null});
  const f=request({include:'insights'});await handler(f.req,f.res);expect(f.res.statusCode).toBe(403);expect(mocks.from).not.toHaveBeenCalled();
 });
 it('projects verified identity dates only in explicitly requested detail',async()=>{
  const getUserById=vi.fn().mockResolvedValue({data:{user:{id:target,last_sign_in_at:at,email_confirmed_at:at}},error:null});
  mocks.createClient.mockReturnValue({auth:{getUser:mocks.getUser,admin:{getUserById}},rpc:mocks.rpc,from:mocks.from});
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==='require_account_session'?null:{userId:target,email:account.email,displayName:null,createdAt:at,stack:null},error:null}));
  mocks.maybeSingle.mockResolvedValue({data:{id:target,avatar_url:null,provider_locale:null,oauth_profile_source:null,locale:'fr'},error:null});
  const f=request({mode:'detail',userId:target,include:'identity'});await handler(f.req,f.res);
  expect(f.res.statusCode).toBe(200);expect(f.body).toMatchObject({account:{identity:{lastSignInAt:at,emailConfirmedAt:at,locale:'fr'}}});expect(getUserById).toHaveBeenCalledWith(target);
 });
});
