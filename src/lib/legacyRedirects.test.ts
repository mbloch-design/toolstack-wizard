import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Redirect = { source: string; destination: string; permanent: boolean };

const config = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"),
) as { redirects: Redirect[] };

const redirectMap = new Map(config.redirects.map((redirect) => [redirect.source, redirect]));

describe("legacy article redirects", () => {
  it("redirects generic article and blog routes directly to guides", () => {
    expect(redirectMap.get("/article/:slug")?.destination).toBe("/fr/guide/:slug");
    expect(redirectMap.get("/:lang/article/:slug")?.destination).toBe("/:lang/guide/:slug");
    expect(redirectMap.get("/blog/:slug")?.destination).toBe("/fr/guide/:slug");
  });

  it("maps known renamed slugs directly to their canonical destination", () => {
    expect(redirectMap.get("/fr/article/chatgpt-plus-utile")?.destination).toBe(
      "/fr/guide/chatgpt-plus-utile-ou-inutile",
    );
    expect(redirectMap.get("/en/article/minimal-freelance-stack-2026")?.destination).toBe(
      "/en/guide/minimalist-saas-stack-freelancer-2026-under-50-euros",
    );
  });

  it("keeps every legacy redirect permanent", () => {
    const legacyRedirects = config.redirects.filter(({ source }) =>
      source.includes("/article/") || source.startsWith("/blog/"),
    );
    expect(legacyRedirects.length).toBeGreaterThan(0);
    expect(legacyRedirects.every(({ permanent }) => permanent)).toBe(true);
  });

  it("keeps redirected audit landing aliases out of sitemap sources", () => {
    const sitemapSources = ["vite.config.ts", "supabase/functions/sitemap/index.ts"]
      .map((file) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8"))
      .join("\n");

    expect(sitemapSources).not.toContain('addUrl(`${BASE}/fr/audit-saas-gratuit`');
    expect(sitemapSources).not.toContain('addUrl(`${BASE}/en/free-saas-audit`');
    expect(sitemapSources).not.toContain('fr: "/fr/audit-saas-gratuit"');
    expect(sitemapSources).not.toContain('path: "/fr/audit-saas-gratuit"');
    expect(sitemapSources).not.toContain('path: "/en/free-saas-audit"');
  });
});
