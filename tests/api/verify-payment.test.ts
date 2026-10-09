import { afterEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
import handler from "../../api/verify-payment";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(["GET","PUT"])("rejects %s before external work",async method=>{const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);const h=httpFixture({},method);await handler(h.req,h.res);expect(h.res.statusCode).toBe(405);expect(fetcher).not.toHaveBeenCalled();});
it("allows local preflight",async()=>{const h=httpFixture({},"OPTIONS","http://localhost:5179");await handler(h.req,h.res);expect(h.res.statusCode).toBe(204);expect(h.res.getHeader("Access-Control-Allow-Origin")).toBe("http://localhost:5179");});
it("rejects missing proof",async()=>{const h=httpFixture({paid:true});await handler(h.req,h.res);expect(h.res.statusCode).toBe(400);});
it("returns only verification status, never provider data or the server key",async()=>{
 vi.stubEnv("CREEM_API_KEY","local-secret");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({id:"ch_local",mode:"prod",status:"completed",product:"prod_2LMoN4zyRhNAb53r3rWpwX",order:{status:"paid"},metadata:{tooltrim_submission_id:"7ec2090a-9157-43c9-9238-f8931667420d",tooltrim_tool_url:"https://example.com/"},customer:{email:"private@example.com"}}))));
 const h=httpFixture({checkoutId:"ch_local",paymentReference:"7ec2090a-9157-43c9-9238-f8931667420d",toolUrl:"https://example.com/"});await handler(h.req,h.res);expect(h.res.statusCode).toBe(200);expect(h.body).toEqual({verified:true});expect(h.res.getHeader("Cache-Control")).toBe("no-store");
});
