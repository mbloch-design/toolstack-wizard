import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({getSession:vi.fn(),fetch:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{getSession:mocks.getSession}}}));
import { loadAccountDetail, loadAccountsDashboard } from "./backofficeAccountsApi";
const value={totals:{accounts:26,accountsWithStack:0,nonemptyStacks:0},topTools:[],accounts:[],page:1,pageSize:25,total:26,updatedAt:"2026-10-20T12:00:00Z"};
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal("fetch",mocks.fetch);mocks.getSession.mockResolvedValue({data:{session:{access_token:"user-access-token"}},error:null});mocks.fetch.mockResolvedValue({ok:true,status:200,json:async()=>value});});
afterEach(()=>vi.unstubAllGlobals());
describe("back-office accounts client",()=>{
 it("uses the current SDK session and a same-origin GET without storing privileged credentials",async()=>{
  expect(await loadAccountsDashboard({search:"person+tag@example.test",page:2,pageSize:25})).toEqual(value);
  expect(mocks.fetch).toHaveBeenCalledWith("/api/backoffice-accounts?search=person%2Btag%40example.test&page=2&pageSize=25",{method:"GET",cache:"no-store",headers:{Authorization:"Bearer user-access-token"}});
 });
 it("rejects missing sessions before a request",async()=>{mocks.getSession.mockResolvedValue({data:{session:null}});await expect(loadAccountsDashboard()).rejects.toMatchObject({status:401});expect(mocks.fetch).not.toHaveBeenCalled();});
 it("parses detail wrappers and keeps an absent account distinct from failure",async()=>{mocks.fetch.mockResolvedValue({ok:true,status:200,json:async()=>({account:null})});expect(await loadAccountDetail("id")).toBeNull();});
 it.each([{}, {version:4,selection:null}])("rejects corrupt detail source %j even in a successful HTTP response",async state=>{
  mocks.fetch.mockResolvedValue({ok:true,status:200,json:async()=>({account:{userId:"id",email:null,displayName:null,createdAt:null,stack:{state,revision:1,updatedAt:"2026-10-20T12:00:00Z"}}})});
  await expect(loadAccountDetail("id")).rejects.toMatchObject({status:503,code:"BACKOFFICE_UNAVAILABLE"});
 });
 it("does not convert source failure or malformed totals into a zero result",async()=>{
  mocks.fetch.mockResolvedValueOnce({ok:false,status:503,json:async()=>({error:{code:"secret SQL"}})}).mockResolvedValueOnce({ok:true,status:200,json:async()=>({accounts:[]})});
  await expect(loadAccountsDashboard()).rejects.toMatchObject({status:503,code:"BACKOFFICE_UNAVAILABLE"});await expect(loadAccountsDashboard()).rejects.toMatchObject({status:503});
 });
});

it('preserves enriched user summaries and rejects malformed counters',async()=>{
 const insights={usedTools:2,wishlistTools:1,boards:3,trade:'designer',hasDailyRate:true,amounts:1,usage:2,decisions:0};
 const account={userId:'id',email:null,displayName:null,createdAt:null,hasStack:true,stackUpdatedAt:null,insights};
 mocks.fetch.mockResolvedValue({ok:true,status:200,json:async()=>({...value,accounts:[account]})});
 expect((await loadAccountsDashboard()).accounts[0]).toMatchObject({insights});
 mocks.fetch.mockResolvedValue({ok:true,status:200,json:async()=>({...value,accounts:[{...account,insights:{...insights,usedTools:-1}}]})});
 await expect(loadAccountsDashboard()).rejects.toMatchObject({status:503});
});
