import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const robots = fs.readFileSync(path.join(root, "public/robots.txt"), "utf8");
const dynamicCanonical = fs.readFileSync(
  path.join(root, "src/components/DynamicCanonical.tsx"),
  "utf8",
);

describe("robots SEO policy", () => {
  it("keeps private and diagnostic routes blocked", () => {
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /fr/selector");
    expect(robots).toContain("Disallow: /en/selector");
    expect(robots).toContain("Disallow: /fr/diagnostic");
    expect(robots).toContain("Disallow: /en/diagnostic");
  });

  it("lets crawlers read canonical tags on tracking variants", () => {
    expect(robots).not.toMatch(/Disallow:.*utm_(source|medium|campaign)/);
    expect(dynamicCanonical).toContain(
      "const canonical = `${SEO_BASE}${canonicalPath}`;",
    );
    expect(dynamicCanonical).not.toContain("location.search");
  });
});
