import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: dns.lookup }));
import { containsVisibleLinkedBadge, safePublicUrl, verifyBadgeOnPage } from "../../api/_badge-verification";
const badgeHtml = '<a href="https://tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg" /></a>';
const fetchPage = vi.fn<typeof fetch>();
beforeEach(() => {
  dns.lookup.mockReset().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  fetchPage.mockReset().mockImplementation(async () => new Response(badgeHtml, { headers: { "content-type": "text/html" } }));
  vi.stubGlobal("fetch", fetchPage);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("public badge URLs", () => {
  it.each([
    ["http://example.com", "https_required"],
    ["https://user:password@example.com", "invalid_url"],
    ["https://example.com:8443", "invalid_url"],
    ["https://localhost", "private_url"],
    ["https://127.0.0.1", "private_url"],
    ["https://10.0.0.1", "private_url"],
    ["https://192.168.1.1", "private_url"],
  ])("rejects %s before downloading", async (url, reason) => {
    await expect(safePublicUrl(url)).rejects.toThrow(reason); expect(fetchPage).not.toHaveBeenCalled();
  });
  it.each([[], [{ address: "127.0.0.1", family: 4 }], [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }], [{ address: "::1", family: 6 }]].map(addresses => ({ addresses })))("rejects DNS answers with no exclusively public destination: %j", async ({ addresses }) => {
    dns.lookup.mockResolvedValueOnce(addresses);
    await expect(safePublicUrl("https://example.com")).rejects.toThrow("private_url");
    expect(fetchPage).not.toHaveBeenCalled();
  });
  it("accepts an HTTPS public URL without rewriting its path", async () => {
    expect((await safePublicUrl("https://example.com/badge?q=1")).toString()).toBe("https://example.com/badge?q=1");
  });
});

describe("badge markup", () => {
  it.each([badgeHtml, '<a href="https://www.tooltrim.com/fr"><img src="https://tooltrim.com/tooltrim-badge-dark.svg" /></a>'])("accepts a linked light/dark badge", html => {
    expect(containsVisibleLinkedBadge(html, new URL("https://example.com"))).toBe(true);
  });
  it.each([
    '<img src="https://tooltrim.com/tooltrim-badge.svg" />',
    '<a href="https://other.example"><img src="https://tooltrim.com/tooltrim-badge.svg" /></a>',
    '<a href="https://tooltrim.com"><img src="https://other.example/tooltrim-badge.svg" /></a>',
    '<a style="display:none" href="https://tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg" /></a>',
    '<a href="https://tooltrim.com"><img style="opacity:0" src="https://tooltrim.com/tooltrim-badge.svg" /></a>',
  ])("rejects absent, unlinked, foreign or inline-hidden badge: %s", html => {
    expect(containsVisibleLinkedBadge(html, new URL("https://example.com"))).toBe(false);
  });
});

describe("badge downloads", () => {
  it("accepts a badge from a tool subdomain", async () => {
    const result = await verifyBadgeOnPage("https://docs.example.com/badge", "https://example.com");
    expect(result.finalUrl.toString()).toBe("https://docs.example.com/badge"); expect(fetchPage).toHaveBeenCalledTimes(1);
  });
  it("rejects a similar but unrelated domain before fetching", async () => {
    await expect(verifyBadgeOnPage("https://notexample.com/badge", "https://example.com")).rejects.toThrow("badge_wrong_domain");
    expect(fetchPage).not.toHaveBeenCalled();
  });
  it("follows a same-site redirect and preserves the resolved page URL", async () => {
    fetchPage.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "/badges/current" } }));
    const result = await verifyBadgeOnPage("https://example.com/badge", "https://example.com");
    expect(result.finalUrl.toString()).toBe("https://example.com/badges/current"); expect(fetchPage).toHaveBeenCalledTimes(2);
  });
  it.each([["https://other.example/badge", "badge_wrong_domain"], ["https://127.0.0.1/badge", "private_url"]])("rejects unsafe redirect to %s", async (location, reason) => {
    fetchPage.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location } }));
    await expect(verifyBadgeOnPage("https://example.com/badge", "https://example.com")).rejects.toThrow(reason);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
  it("stops a redirect loop after three redirects", async () => {
    fetchPage.mockImplementation(async () => new Response(null, { status: 302, headers: { location: "/loop" } }));
    await expect(verifyBadgeOnPage("https://example.com/badge", "https://example.com")).rejects.toThrow("page_unreachable");
    expect(fetchPage).toHaveBeenCalledTimes(4);
  });
  it.each([
    [404, "text/html", badgeHtml, "page_unreachable"],
    [200, "application/json", badgeHtml, "not_html"],
    [200, "text/html", "<html>No badge</html>", "badge_not_found"],
  ])("rejects unusable page response %s/%s", async (status, contentType, body, reason) => {
    fetchPage.mockResolvedValueOnce(new Response(body, { status, headers: { "content-type": contentType } }));
    await expect(verifyBadgeOnPage("https://example.com/badge", "https://example.com")).rejects.toThrow(reason);
  });
});
