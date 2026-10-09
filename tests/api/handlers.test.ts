import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { httpFixture } from "./http";

const fakes = vi.hoisted(() => ({ send: vi.fn(), lookup: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send: fakes.send }; } }));
vi.mock("node:dns/promises", () => ({ lookup: fakes.lookup }));
const registry=vi.hoisted(()=>({record:null as import('../../api/_submission-contract').SubmissionRecord|null}));
vi.mock('../../api/_submission-store',()=>({
 getSubmission:vi.fn().mockResolvedValue(null),
 reserveSubmission:vi.fn().mockImplementation(async record=>{registry.record=record;return {status:'created',record};}),
 claimMail:vi.fn().mockImplementation(async (_id,kind:'internal'|'confirmation',owner)=>{const job=registry.record?.jobs[kind];return job?{...job,owner}:null;}),
 finishMail:vi.fn().mockResolvedValue(true),
}));
import contact from "../../api/contact";
import progress from "../../api/submission-progress";
import verifyBadge from "../../api/verify-badge";

const badgeHtml = '<a href="https://tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg" /></a>';
const contactBody = { name: "Ada", email: "ada@example.com", subject: "Question", message: "Hello" };
const toolBody = { ...contactBody, submissionId:'7ec2090a-9157-43c9-9238-f8931667420d', submissionType: "tool", toolName: "Sample", toolUrl: "https://example.com/", submitterRole: "Founder", lang: "en" };
const progressBody = { submissionId:'7ec2090a-9157-43c9-9238-f8931667420d', progressStep: 1, toolName: "Sample", toolUrl: "https://example.com/", email: "ada@example.com", lang: "fr" };
const secret = "local-test-secret";
const fetchPage = vi.fn<typeof fetch>();

beforeEach(() => {
  fakes.send.mockReset().mockResolvedValue({ data: { id: "local-email" }, error: null });
  fakes.lookup.mockReset().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  fetchPage.mockReset().mockImplementation(async () => new Response(badgeHtml, { headers: { "content-type": "text/html" } }));
  vi.stubGlobal("fetch", fetchPage);
  vi.stubEnv("BADGE_VERIFICATION_SECRET", secret);
  vi.stubEnv("RESEND_API_KEY", "local-test-key");
  vi.stubEnv("CREEM_API_KEY", "local-test-key");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

for (const [name, handler] of [["contact", contact], ["submission-progress", progress], ["verify-badge", verifyBadge]] as const) {
  describe(name + " HTTP contract", () => {
    it("rejects GET before any external work", async () => {
      const h = httpFixture(undefined, "GET"); await handler(h.req, h.res);
      expect(h.res.statusCode).toBe(405); expect(h.body).toEqual({ error: "Method not allowed" });
      expect(fakes.send).not.toHaveBeenCalled(); expect(fetchPage).not.toHaveBeenCalled();
    });
    it.each(["http://localhost:5179", "http://127.0.0.1:8080"])("ends local preflight with CORS for %s", async origin => {
      const h = httpFixture(undefined, "OPTIONS", origin); await handler(h.req, h.res);
      expect(h.res.statusCode).toBe(204); expect(h.res.writableEnded).toBe(true); expect(h.body).toBeUndefined();
      expect(h.res.getHeader("Access-Control-Allow-Origin")).toBe(origin);
      expect(h.res.getHeader("Vary")).toBe("Origin");
      expect(h.res.getHeader("Access-Control-Allow-Headers")).toBe("Content-Type");
      expect(h.res.getHeader("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
      expect(fakes.send).not.toHaveBeenCalled(); expect(fetchPage).not.toHaveBeenCalled();
    });
    it.each(["https://untrusted.example", "http://localhost.evil.example:8080"])("does not grant CORS to %s", async origin => {
      const h = httpFixture(undefined, "OPTIONS", origin); await handler(h.req, h.res);
      expect(h.res.statusCode).toBe(204); expect(h.res.getHeader("Access-Control-Allow-Origin")).toBeUndefined();
    });
  });
}

describe("contact", () => {
  it("never sends a paid confirmation based on a client flag alone", async () => {
    const h = httpFixture({ ...toolBody, paid: true }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400);
    expect(fakes.send).not.toHaveBeenCalled();
  });

  it.each([undefined, {}, { ...contactBody, email: "invalid" }, { ...contactBody, message: "" }])("rejects missing or invalid contact fields: %j", async body => {
    const h = httpFixture(body); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Missing required fields" });
    expect(fakes.send).not.toHaveBeenCalled();
  });
  it("rejects oversized fields without sending email", async () => {
    const h = httpFixture({ ...contactBody, message: "x".repeat(2001) }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Field too long" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it("accepts a contact and escapes email HTML and subject newlines", async () => {
    const h = httpFixture({ ...contactBody, name: "<Ada>", subject: "Question\r\nInjected", message: "<script>\n&hello" });
    await contact(h.req, h.res); expect(h.body).toEqual({ success: true }); expect(h.res.statusCode).toBe(200);
    expect(fakes.send).toHaveBeenCalledTimes(1);
    const email = fakes.send.mock.calls[0][0];
    expect(email.to).toBe("contact@tooltrim.com"); expect(email.replyTo).toBe("ada@example.com");
    expect(email.subject).not.toMatch(/[\r\n]/); expect(email.html).toContain("&lt;Ada&gt;");
    expect(email.html).toContain("&lt;script&gt;<br>&amp;hello"); expect(email.html).not.toContain("<script>");
  });
  it.each([{ toolUrl: "javascript:alert(1)" }, { toolName: "" }, { submitterRole: "" }])("rejects incomplete tool submission: %j", async patch => {
    const h = httpFixture({ ...toolBody, ...patch }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Invalid tool submission" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each([undefined, false, null, "", 0])("enforces the free badge when the client sends badgeReview=%j", async badgeReview => {
    const h = httpFixture({ ...toolBody, badgeReview }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each([undefined, false])("rechecks a removed badge even without the client opt-in: %j", async badgeReview => {
    const badgeUrl = "https://example.com/badge";
    const v = httpFixture({ badgeUrl, toolUrl: toolBody.toolUrl }); await verifyBadge(v.req, v.res);
    fetchPage.mockResolvedValueOnce(new Response("<html>No badge</html>", { headers: { "content-type": "text/html" } }));
    const h = httpFixture({ ...toolBody, badgeReview, badgeUrl, verificationToken: (v.body as { token: string }).token }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(fakes.send).not.toHaveBeenCalled();
  });
  it("requires a valid URL before verifying a badge", async () => {
    const h = httpFixture({ ...toolBody, badgeReview: true, badgeUrl: "invalid" }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Invalid badge URL" }); expect(fetchPage).not.toHaveBeenCalled(); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each(["missing", "tampered", "expired", "wrong-badge-url", "wrong-tool-url"])("rejects %s badge authorization", async kind => {
    const badgeUrl = "https://example.com/badge";
    const payload = Buffer.from(JSON.stringify({ badgeUrl: kind === "wrong-badge-url" ? "https://example.com/other" : badgeUrl, toolUrl: kind === "wrong-tool-url" ? "https://another.example/" : toolBody.toolUrl, exp: Date.now() + (kind === "expired" ? -1000 : 60000) })).toString("base64url");
    const token = kind === "missing" ? undefined : `${payload}.${createHmac("sha256", kind === "tampered" ? "wrong-secret" : secret).update(payload).digest("base64url")}`;
    const h = httpFixture({ ...toolBody, badgeReview: true, badgeUrl, verificationToken: token }); await contact(h.req, h.res);
    expect(h.body).toEqual({ error: "Badge verification required" }); expect(h.res.statusCode).toBe(400);
    expect(fetchPage).not.toHaveBeenCalled(); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each([true, false, undefined])("accepts a verified free submission regardless of client badgeReview=%j", async badgeReview => {
    const badgeUrl = "https://example.com/badge";
    const v = httpFixture({ badgeUrl, toolUrl: toolBody.toolUrl }); await verifyBadge(v.req, v.res);
    const token = (v.body as { token: string }).token;
    const h = httpFixture({ ...toolBody, badgeReview, badgeUrl, verificationToken: token }); await contact(h.req, h.res);
    expect(h.body).toEqual({ success: true }); expect(h.res.statusCode).toBe(200);
    expect(fetchPage).toHaveBeenCalledTimes(2); expect(fakes.send).toHaveBeenCalledTimes(2);
    expect(fakes.send.mock.calls[1][0]).toMatchObject({ to: "ada@example.com", subject: "Request registered — Sample" });
  });
  it("rejects a badge removed after token issuance", async () => {
    const badgeUrl = "https://example.com/badge";
    const v = httpFixture({ badgeUrl, toolUrl: toolBody.toolUrl }); await verifyBadge(v.req, v.res);
    fetchPage.mockResolvedValueOnce(new Response("<html>No badge</html>", { headers: { "content-type": "text/html" } }));
    const h = httpFixture({ ...toolBody, badgeReview: true, badgeUrl, verificationToken: (v.body as { token: string }).token }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Badge must still be installed when the submission is sent" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each(["fr", "en"])("sends paid submission confirmation in %s", async lang => {
    fetchPage.mockResolvedValue(new Response(JSON.stringify({ id: "ch_local", mode: "prod", status: "completed", product: "prod_2LMoN4zyRhNAb53r3rWpwX", order:{status:"paid"}, metadata: { tooltrim_submission_id: "7ec2090a-9157-43c9-9238-f8931667420d", tooltrim_tool_url: "https://example.com/" } })));
    const h = httpFixture({ ...toolBody, paid: true, lang, checkoutId: "ch_local", paymentReference: "7ec2090a-9157-43c9-9238-f8931667420d" }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(h.body).toEqual({ success: true }); expect(fakes.send).toHaveBeenCalledTimes(2);
    expect(fakes.send.mock.calls[1][0].subject).toBe(lang === "fr" ? "Création de ta fiche lancée — Sample" : "Your listing creation has started — Sample");
  });
  it("keeps the persisted submission when internal delivery fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakes.send.mockResolvedValueOnce({ data: null, error: { message: "delivery unavailable" } });
    const badgeUrl = "https://example.com/badge";
    const v = httpFixture({ badgeUrl, toolUrl: toolBody.toolUrl }); await verifyBadge(v.req, v.res);
    const h = httpFixture({ ...toolBody, badgeUrl, verificationToken: (v.body as { token: string }).token }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(h.body).toEqual({ success: true }); expect(fakes.send).toHaveBeenCalledTimes(2);
  });
  it("keeps the accepted submission when confirmation delivery fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakes.send.mockResolvedValueOnce({ data: { id: "accepted" }, error: null }).mockResolvedValueOnce({ data: null, error: { message: "confirmation unavailable" } });
    const badgeUrl = "https://example.com/badge";
    const v = httpFixture({ badgeUrl, toolUrl: toolBody.toolUrl }); await verifyBadge(v.req, v.res);
    const h = httpFixture({ ...toolBody, badgeUrl, verificationToken: (v.body as { token: string }).token }); await contact(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(h.body).toEqual({ success: true });
  });
});

describe("submission-progress", () => {
  it.each([undefined, {}, { ...progressBody, progressStep: 3 }, { ...progressBody, toolUrl: "http://example.com" }, { ...progressBody, email: "invalid" }])("rejects invalid progress: %j", async body => {
    const h = httpFixture(body); await progress(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Invalid submission progress" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it("rejects oversized tool names", async () => {
    const h = httpFixture({ ...progressBody, toolName: "x".repeat(301) }); await progress(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Field too long" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it("requires an HTTPS badge at the free second step", async () => {
    const h = httpFixture({ ...progressBody, progressStep: 2, badgeUrl: "http://example.com/badge" }); await progress(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "Invalid badge URL" }); expect(fakes.send).not.toHaveBeenCalled();
  });
  it.each([{ progressStep: 1 }, { progressStep: 2, badgeUrl: "https://example.com/badge" }, { progressStep: 2, paid: true }])("accepts valid funnel step: %j", async patch => {
    const h = httpFixture({ ...progressBody, ...patch }); await progress(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(h.body).toEqual({ success: true, progressStep: patch.progressStep }); expect(fakes.send).toHaveBeenCalledTimes(1);
    expect(fakes.send.mock.calls[0][0]).toMatchObject({ to: "contact@tooltrim.com", replyTo: "ada@example.com" });
  });
  it("returns 500 when progress delivery fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakes.send.mockResolvedValueOnce({ data: null, error: { message: "delivery unavailable" } });
    const h = httpFixture(progressBody); await progress(h.req, h.res);
    expect(h.res.statusCode).toBe(500); expect(h.body).toEqual({ error: "delivery unavailable" });
  });
});

describe("verify-badge", () => {
  it("returns a signed, URL-bound token valid for 30 minutes", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1791528000000);
    const h = httpFixture({ badgeUrl: "https://example.com/badge", toolUrl: "https://example.com" }); await verifyBadge(h.req, h.res);
    expect(h.res.statusCode).toBe(200);
    const body = h.body as { verified: boolean; url: string; token: string };
    expect(body.verified).toBe(true); expect(body.url).toBe("https://example.com/badge");
    const [payload, signature] = body.token.split(".");
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({ badgeUrl: "https://example.com/badge", toolUrl: "https://example.com/", exp: 1791529800000 });
    expect(signature).toBe(createHmac("sha256", secret).update(payload).digest("base64url"));
  });
  it("returns 500 when no signing secret is configured", async () => {
    vi.stubEnv("BADGE_VERIFICATION_SECRET", ""); vi.stubEnv("RESEND_API_KEY", "");
    const h = httpFixture({ badgeUrl: "https://example.com/badge", toolUrl: "https://example.com" }); await verifyBadge(h.req, h.res);
    expect(h.res.statusCode).toBe(500); expect(h.body).toEqual({ error: "verification_unavailable" });
  });
  it.each([
    [{ badgeUrl: "http://example.com/badge", toolUrl: "https://example.com" }, "https_required"],
    [{ badgeUrl: "https://example.com/badge", toolUrl: "https://other.example" }, "badge_wrong_domain"],
    [{ badgeUrl: "https://localhost/badge", toolUrl: "https://example.com" }, "private_url"],
    [undefined, "verification_failed"],
  ] as const)("maps invalid requests to safe errors: %j", async (body, error) => {
    const h = httpFixture(body); await verifyBadge(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error }); expect(fetchPage).not.toHaveBeenCalled();
  });
  it("does not expose internal fetch errors", async () => {
    fetchPage.mockRejectedValueOnce(new Error("secret internal detail"));
    const h = httpFixture({ badgeUrl: "https://example.com/badge", toolUrl: "https://example.com" }); await verifyBadge(h.req, h.res);
    expect(h.res.statusCode).toBe(400); expect(h.body).toEqual({ error: "verification_failed" });
  });
});
it('progress retries use a stable provider key without storing unverified drafts',async()=>{
 for(let i=0;i<2;i++){const h=httpFixture({...progressBody,submissionId:'7ec2090a-9157-43c9-9238-f8931667420d'});await progress(h.req,h.res);expect(h.res.statusCode).toBe(200);}
 expect(fakes.send.mock.calls[0][1]?.idempotencyKey).toMatch(/^tt-progress\/v1\//);expect(fakes.send.mock.calls[0][1]?.idempotencyKey).toBe(fakes.send.mock.calls[1][1]?.idempotencyKey);expect(fetchPage).not.toHaveBeenCalled();
});
it.each(['true',1,{}])('progress rejects non-boolean option flag %j',async paid=>{const h=httpFixture({...progressBody,paid});await progress(h.req,h.res);expect(h.res.statusCode).toBe(400);expect(fakes.send).not.toHaveBeenCalled();});
