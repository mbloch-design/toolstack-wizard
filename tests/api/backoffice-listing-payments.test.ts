import { afterEach,beforeEach,expect,it,vi } from "vitest";
import { httpFixture } from "./http";
const deps=vi.hoisted(()=>({rpc:vi.fn(),requireAccount:vi.fn(),proof:vi.fn()}));
vi.mock("../../api/_account-auth.js",async original=>({...await original<typeof import("../../api/_account-auth.js")>(),
  getAccountServiceClient:()=>({rpc:deps.rpc}),requireAccount:deps.requireAccount}));
vi.mock("../../api/_cms-commercial-creem.js",async original=>({...await original<typeof import("../../api/_cms-commercial-creem.js")>(),readHistoricalListingReceipt:deps.proof}));
import handler from "../../api/backoffice-listing-payments";
const listingId="00000000-0000-4000-8000-000000000001";
const input={listingId,checkoutId:"ch_old",paymentReference:"00000000-0000-4000-8000-000000000002",reviewNote:"Verified representative and matched original purchaser."};
beforeEach(()=>{
  vi.stubEnv("PUBLISHER_CMS_ENABLED","true");
  deps.requireAccount.mockReset().mockResolvedValue({userId:"admin",sessionId:"session",emailConfirmed:true});
  deps.rpc.mockReset().mockResolvedValue({data:{listingId,websiteUrl:"https://tool.example/"},error:null});
  deps.proof.mockReset().mockResolvedValue({checkoutId:"ch_old",orderId:"ord_old",transactionId:"tran_old",paidAt:"2026-11-17T00:00:00Z",amountPaidMinor:3509,currency:"USD",state:"paid"});
});
afterEach(()=>vi.unstubAllEnvs());
it("refuses non-admin before reading the provider or exposing application details",async()=>{
  deps.rpc.mockResolvedValueOnce({data:null,error:{code:"PT403",message:"CMS_ACCESS_DENIED"}});
  const result=httpFixture(input);await handler(result.req,result.res);
  expect(result.res.statusCode).toBe(403);expect(deps.proof).not.toHaveBeenCalled();
});
it("only attaches provider-verified proof to the exact application website",async()=>{
  const result=httpFixture(input);await handler(result.req,result.res);
  expect(result.res.statusCode).toBe(200);
  expect(deps.proof).toHaveBeenCalledWith("ch_old",input.paymentReference,"https://tool.example/");
  expect(deps.rpc).toHaveBeenLastCalledWith("cms_admin_listing_payment",expect.objectContaining({p_actor:"admin",p_listing:listingId,p_action:"attach",
    p_proof:expect.objectContaining({amountPaidMinor:3509,currency:"USD",reviewNote:input.reviewNote})}));
});
it("does not accept an admin/browser assertion of payment or amount",async()=>{
  const result=httpFixture({...input,paid:true,amountPaidMinor:1});await handler(result.req,result.res);
  expect(result.res.statusCode).toBe(400);expect(deps.proof).not.toHaveBeenCalled();
});
