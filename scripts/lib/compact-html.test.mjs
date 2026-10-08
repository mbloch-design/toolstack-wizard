import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { compactHtml, assertHtmlEquivalent } from "./compact-html.mjs";

const comment = " Explain the font preload used by the production template. ";
const comments = new Set([comment]);
const body = '<body><main><h1>Prix &amp; usages</h1><p>Keep <em>this</em> space.</p><!-- -->Prix<!-- --> : 9 €<!--$--><span>Ready</span><!--/$--></main><script id="__SSR_TOOL__" type="application/json">{ "pricing_v5": { "price": 9 }, "pricing_v5En": { "price": 9 } }</script></body>';
const head = `<head>\n <!--verification-token-->\n <!--${comment}-->\n <title> Notion : prix </title>\n <meta name="description" content="A > B, and  two spaces">\n <link rel="canonical" href="https://tooltrim.com/fr/tool/notion">\n <script type="application/ld+json">{\n "@type": "WebPage", "name": "Keep  these spaces", "n": 9\n }</script>\n <style>pre { white-space: pre; }\n</style>\n <script>const spaces = "  ";\n// Keep this newline\nwindow.ready = true;</script>\n <noscript><link rel="stylesheet" href="/fallback.css"></noscript>\n</head>`;
const html = `<!doctype html><html lang="fr">${head}${body}</html>`;

describe("generated HTML compaction", () => {
  it("reduces bytes while retaining visible text, attributes, scripts and hydration markers", () => {
    const result = compactHtml(html, comments);
    expect(Buffer.byteLength(result)).toBeLessThan(Buffer.byteLength(html) - 60);
    expect(result).not.toContain(`<!--${comment}-->`);
    expect(result).toContain("<!--verification-token-->");
    expect(result.slice(result.indexOf("<body>"))).toBe(body + "</html>");
    const before = new JSDOM(html).window.document;
    const after = new JSDOM(result).window.document;
    expect(after.title).toBe(before.title);
    expect(after.querySelector('meta[name="description"]').content).toBe("A > B, and  two spaces");
    expect(after.querySelector('link[rel="canonical"]').href).toBe("https://tooltrim.com/fr/tool/notion");
    expect(after.querySelector("style").textContent).toBe(before.querySelector("style").textContent);
    expect(after.querySelector("script:not([type])").textContent).toBe(before.querySelector("script:not([type])").textContent);
    expect(result).toBe(compactHtml(result, comments));
  });

  it("compacts structured data without injecting a closing script or losing string contents", () => {
    const input = '<html><head><script type="application/ld+json">{ "text": "<\\/script><img src=x>", "spaced": "A  B" }</script></head><body><h1>Test</h1></body></html>';
    const result = compactHtml(input);
    expect(result).not.toContain('{ "text"');
    const doc = new JSDOM(result).window.document;
    expect(doc.querySelectorAll("script")).toHaveLength(1);
    expect(doc.querySelector("img")).toBeNull();
    expect(JSON.parse(doc.querySelector("script").textContent)).toEqual({ text: "</script><img src=x>", spaced: "A  B" });
  });

  it("rejects malformed structured data instead of publishing an altered document", () => {
    expect(() => compactHtml('<html><head><script type="application/ld+json">{ broken }</script></head><body></body></html>')).toThrow();
  });

  it("permits only the approved whitespace, comment and JSON formatting changes", () => {
    expect(() => assertHtmlEquivalent(html, compactHtml(html, comments), comments)).not.toThrow();
    for (const changed of [
      html.replace("<h1>Prix", "<h1>Changed"),
      html.replace("/fr/tool/notion", "/en/tool/notion"),
      html.replace('"n": 9', '"n": 0'),
      html.replace("<!-- -->", ""),
      html.replace("<!--verification-token-->", ""),
      html.replace('"pricing_v5En": { "price": 9 }', '"pricing_v5En": null'),
      html.replace('window.ready = true', 'window.ready = false'),
    ]) expect(() => assertHtmlEquivalent(html, changed, comments)).toThrow();
  });

  it("the build stage compacts a real artifact and remains idempotent", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tooltrim-compact-"));
    try {
      fs.writeFileSync(path.join(directory, "index.html"), '<!-- Cookieless analytics — loaded globally on every route -->');
      fs.mkdirSync(path.join(directory, "dist/fr/tool/notion"), { recursive: true });
      const file = path.join(directory, "dist/fr/tool/notion/index.html");
      fs.writeFileSync(file, html.replace(`<!--${comment}-->`, '<!-- Cookieless analytics — loaded globally on every route -->'));
      const command = () => spawnSync(process.execPath, [path.resolve("scripts/compact-generated-html.mjs")], { cwd: directory, encoding: "utf8" });
      const first = command();
      expect(first.status, first.stderr).toBe(0);
      const result = fs.readFileSync(file, "utf8");
      expect(result).not.toContain("Cookieless analytics");
      expect(result).toContain("<!--verification-token-->");
      expect(command().status).toBe(0);
      expect(fs.readFileSync(file, "utf8")).toBe(result);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });

  it("the build stage fails on an empty artifact", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tooltrim-compact-empty-"));
    try {
      fs.writeFileSync(path.join(directory, "index.html"), "<html></html>");
      fs.mkdirSync(path.join(directory, "dist"));
      const result = spawnSync(process.execPath, [path.resolve("scripts/compact-generated-html.mjs")], { cwd: directory, encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("no generated HTML");
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
});
