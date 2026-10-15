import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpFixture } from "./http";

const fakes = vi.hoisted(() => ({ send: vi.fn(), redis: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send: fakes.send }; } }));
vi.mock("../../api/_submission-store", () => ({ redisCommand: fakes.redis }));
import inviteVisit from "../../api/invite-visit";

const body = { tool: "GenCode", site: "https://genspark.ai", lang: "en" };

beforeEach(() => {
  fakes.send.mockReset().mockResolvedValue({ data: { id: "local-email" }, error: null });
  fakes.redis.mockReset().mockImplementation(async (command: (string | number)[]) => (command[0] === "SET" ? "OK" : 1));
  vi.stubEnv("RESEND_API_KEY", "local-test-key");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("invite-visit", () => {
  it("rejects GET before any external work", async () => {
    const h = httpFixture(undefined, "GET"); await inviteVisit(h.req, h.res);
    expect(h.res.statusCode).toBe(405); expect(fakes.redis).not.toHaveBeenCalled(); expect(fakes.send).not.toHaveBeenCalled();
  });

  it("rejects an unfilled merge tag or an oversized name", async () => {
    for (const tool of ["{{tool}}", "", "x".repeat(61)]) {
      const h = httpFixture({ ...body, tool }); await inviteVisit(h.req, h.res);
      expect(h.res.statusCode).toBe(400);
    }
    expect(fakes.send).not.toHaveBeenCalled();
  });

  it("emails the first visit with the escaped tool name and site", async () => {
    const h = httpFixture({ ...body, tool: "Gen<b>Code" }); await inviteVisit(h.req, h.res);
    expect(h.res.statusCode).toBe(200);
    expect(fakes.send).toHaveBeenCalledTimes(1);
    const mail = fakes.send.mock.calls[0][0];
    expect(mail.to).toBe("contact@tooltrim.com");
    expect(mail.subject).toContain("Gen<b>Code");
    expect(mail.html).toContain("Gen&lt;b&gt;Code");
    expect(mail.html).toContain("https://genspark.ai");
    expect(fakes.redis.mock.calls[0][0]).toEqual(expect.arrayContaining(["SET", "NX", "EX"]));
  });

  it("stays silent for a tool already seen in the last 30 days", async () => {
    fakes.redis.mockImplementation(async (command: (string | number)[]) => (command[0] === "SET" ? null : 1));
    const h = httpFixture(body); await inviteVisit(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(fakes.send).not.toHaveBeenCalled();
  });

  it("stops emailing beyond the daily cap", async () => {
    fakes.redis.mockImplementation(async (command: (string | number)[]) => (command[0] === "SET" ? "OK" : command[0] === "INCR" ? 51 : 1));
    const h = httpFixture(body); await inviteVisit(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(fakes.send).not.toHaveBeenCalled();
  });

  it("sends nothing when the store is unavailable", async () => {
    fakes.redis.mockRejectedValue(new Error("down"));
    const h = httpFixture(body); await inviteVisit(h.req, h.res);
    expect(h.res.statusCode).toBe(200); expect(fakes.send).not.toHaveBeenCalled();
  });
});
