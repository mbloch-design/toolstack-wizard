import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const robots = fs.readFileSync(path.join(root, "public/robots.txt"), "utf8");
const dynamicCanonical = fs.readFileSync(
  path.join(root, "src/components/DynamicCanonical.tsx"),
  "utf8",
);
const appRoutes = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const seoSource = fs.readFileSync(path.join(root, "src/lib/seo.ts"), "utf8");

describe("robots SEO policy", () => {
  it("keeps private API routes blocked", () => {
    expect(robots).toContain("Disallow: /api/");
  });

  it("lets crawlers read directives on noindex and tracking variants", () => {
    expect(robots).not.toMatch(/Disallow:.*\/(selector|diagnostic)/);
    expect(robots).not.toMatch(/Disallow:.*utm_(source|medium|campaign)/);
    expect(dynamicCanonical).toContain(
      "const canonical = `${SEO_BASE}${canonicalPath}`;",
    );
    expect(dynamicCanonical).not.toContain("location.search");
  });

  it("redirects retired selector and diagnostic URL families to Ma Stack", () => {
    expect(appRoutes).toContain(
      '<Route path="diagnostic/*" element={<Navigate to="../ma-stack" replace />} />',
    );
    expect(appRoutes).toContain(
      '<Route path="selector/*" element={<Navigate to="../ma-stack" replace />} />',
    );
    expect(appRoutes).not.toContain('import("@/pages/SelectorPage")');
    expect(appRoutes).not.toContain('import("@/pages/ResultsPage")');
  });

  it("maps the Adobe Podcast guide to its real English alternate", () => {
    expect(seoSource).toContain(
      '"adobe-podcast-ai-gratuit-alternatives-2026": "adobe-podcast-ai-free-limits-alternatives-2026"',
    );
  });
});
