import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const validator = path.resolve("scripts/validate-generated-seo.mjs");
const url = "https://tooltrim.com/fr/tool/notion";
const sitemap = `<urlset><url><loc>${url}</loc></url></urlset>`;
const html = (markup) => `<html><head><title>Notion</title><meta name="description" content="Notion pricing and usage"><link rel="canonical" href="${url}"></head><body><div id="root">${markup}</div></body></html>`;
function validate(xml, content, extra = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tooltrim-seo-test-"));
  try {
    fs.mkdirSync(path.join(directory, "dist/fr/tool/notion"), { recursive: true });
    fs.writeFileSync(path.join(directory, "dist/sitemap.xml"), xml);
    fs.writeFileSync(path.join(directory, "dist/fr/tool/notion/index.html"), content);
    for (const [relative, markup] of Object.entries(extra)) {
      const file = path.join(directory, "dist", relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, markup);
    }
    return spawnSync(process.execPath, [validator], { cwd: directory, encoding: "utf8" });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

describe("generated SEO publication gate", () => {
  it("rejects an empty sitemap instead of passing zero pages", () => {
    const result = validate("<urlset></urlset>", html(""));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("empty sitemap");
  });
  it("rejects metadata-only pages even when their canonical matches", () => {
    const result = validate(sitemap, html(""));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SSR");
  });
  it("rejects a rendered shell with no page heading", () => {
    const result = validate(sitemap, html("<main><p>Navigation content only.</p></main>"));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("H1");
  });
  it("does not count script or noscript fallback as rendered content", () => {
    const result = validate(sitemap, html('<script><h1>Fake page</h1></script><noscript><h1>Fallback</h1></noscript>'));
    expect(result.status).toBe(1);
  });
  it("accepts real prerendered content and self-canonical metadata", () => {
    expect(validate(sitemap, html("<main><h1>Notion</h1><p>Organise documents and projects.</p></main>")).status).toBe(0);
  });
  it("rejects indexable empty routes outside the sitemap", () => {
    const result = validate(sitemap, html("<main><h1>Notion</h1></main>"), {
      "fr/terms/index.html": html("").replaceAll(url, "https://tooltrim.com/fr/terms"),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("fr/terms");
  });
  it("does not hide an empty outside route behind another page canonical", () => {
    const result = validate(sitemap, html("<main><h1>Notion</h1></main>"), { "fr/alias/index.html": html("") });
    expect(result.status).toBe(1);
  });
  it("permits explicitly noindexed client-only routes outside the sitemap", () => {
    const result = validate(sitemap, html("<main><h1>Notion</h1></main>"), {
      "fr/privacy-policy/index.html": html("").replace("</head>", '<meta name="robots" content="noindex, follow"></head>'),
    });
    expect(result.status).toBe(0);
  });
  it("rejects a malformed sitemap URL entry", () => {
    const result = validate("<urlset><url><lastmod>2026-10-07</lastmod></url></urlset>", html(""));
    expect(result.status).toBe(1);
  });
});
