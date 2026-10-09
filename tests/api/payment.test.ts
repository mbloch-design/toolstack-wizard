import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
const emails = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send: emails }; } }));
vi.mock('../../api/_submission-store',()=>({getSubmission:vi.fn().mockResolvedValue(null),reserveSubmission:vi.fn().mockImplementation(async record=>({status:'created',record}))}));
import contact from "../../api/contact";
const proof = { checkoutId: "ch_local123", paymentReference: "7ec2090a-9157-43c9-9238-f8931667420d", toolUrl: "https://example.com/" };
const body = { ...proof, name: "Ada", email: "ada@example.com", subject: "Submission", message: "A useful tool", toolName: "Sample", submitterRole: "founder", submissionType: "tool", paid: true };
const checkout = { id: "ch_local123", mode: "prod", object:"checkout", status: "completed", product: { id: "prod_2LMoN4zyRhNAb53r3rWpwX" }, order: {id:"ord_local",status:"paid",mode:"prod"}, customer: {id:"cus_local",email:"different-payer@example.com"}, metadata: { tooltrim_submission_id: "7ec2090a-9157-43c9-9238-f8931667420d", tooltrim_tool_url: "https://example.com/" } };
const provider = vi.fn<typeof fetch>();
beforeEach(() => { vi.stubEnv("CREEM_API_KEY", "local-server-only-key"); vi.stubGlobal("fetch", provider); provider.mockReset().mockResolvedValue(new Response(JSON.stringify(checkout))); emails.mockReset().mockResolvedValue({ data:{id:"local-email"},error:null }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("accepts provider-verified payment even when the payer email differs", async () => {
 const h=httpFixture(body); await contact(h.req,h.res); expect(h.res.statusCode).toBe(200); expect(emails).toHaveBeenCalledTimes(2);
 expect(provider.mock.calls[0][0]).toBe("https://api.creem.io/v1/checkouts?checkout_id=ch_local123");
 expect(provider.mock.calls[0][1]?.headers).toEqual({"x-api-key":"local-server-only-key"});
});
it.each([
 {status:"pending"}, {order:{status:"pending"}}, {order:{status:"refunded"}}, {order:null}, {mode:"test"}, {id:"ch_other"}, {product:"prod_other"},
 {metadata:{}}, {metadata:{...checkout.metadata,tooltrim_submission_id:"other"}},
 {metadata:{...checkout.metadata,tooltrim_tool_url:"https://other.example/"}},
])("rejects mismatched provider evidence before email: %j", async patch => {
 provider.mockResolvedValue(new Response(JSON.stringify({...checkout,...patch})));
 const h=httpFixture(body); await contact(h.req,h.res); expect(h.res.statusCode).toBe(400); expect(emails).not.toHaveBeenCalled();
});
it.each(["true",1,{},[1]])("rejects non-boolean paid flags: %j", async paid => { const h=httpFixture({...body,paid});await contact(h.req,h.res);expect(h.res.statusCode).toBe(400);expect(emails).not.toHaveBeenCalled(); });
it.each([{checkoutId:"https://evil.example"},{checkoutId:""},{paymentReference:""},{paymentReference:123}])("rejects malformed proof without contacting Creem: %j",async patch=>{const h=httpFixture({...body,...patch});await contact(h.req,h.res);expect(h.res.statusCode).toBe(400);expect(provider).not.toHaveBeenCalled();expect(emails).not.toHaveBeenCalled();});
it("does not fall back to trusting the client when configuration is missing",async()=>{vi.stubEnv("CREEM_API_KEY","");const h=httpFixture(body);await contact(h.req,h.res);expect(h.res.statusCode).toBe(503);expect(emails).not.toHaveBeenCalled();});
it.each([401,429,500])("returns a recoverable error for provider HTTP %i",async status=>{provider.mockResolvedValue(new Response("private provider detail",{status}));const h=httpFixture(body);await contact(h.req,h.res);expect(h.res.statusCode).toBe(503);expect(h.body).toEqual({error:"payment_verification_unavailable"});expect(emails).not.toHaveBeenCalled();});
it("returns a recoverable error for provider network failure",async()=>{provider.mockRejectedValue(new Error("private secret"));const h=httpFixture(body);await contact(h.req,h.res);expect(h.res.statusCode).toBe(503);expect(emails).not.toHaveBeenCalled();});
it("returns a recoverable error for malformed provider data",async()=>{provider.mockResolvedValue(new Response("not JSON"));const h=httpFixture(body);await contact(h.req,h.res);expect(h.res.statusCode).toBe(503);expect(emails).not.toHaveBeenCalled();});
