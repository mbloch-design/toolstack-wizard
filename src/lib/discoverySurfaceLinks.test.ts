import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SITEWIDE_LINK_SOURCES = [
  "src/components/Footer.tsx",
  "src/components/home/FinalCTA.tsx",
  "src/components/home/HeroSection.tsx",
  "src/components/home/PersonaSavings.tsx",
  "src/components/Navbar.tsx",
  "src/components/tool/StickyDecisionCard.tsx",
  "src/pages/AboutPage.tsx",
  "src/pages/ComparePage.tsx",
  "src/pages/ContactPage.tsx",
  "src/pages/HomePageV2.tsx",
  "src/pages/HomePage.tsx",
  "src/pages/TransparencyPage.tsx",
];

describe("canonical discovery surfaces", () => {
  it("does not link to the redirected methodology alias", () => {
    const offenders = SITEWIDE_LINK_SOURCES.filter((file) =>
      fs.readFileSync(path.resolve(process.cwd(), file), "utf8").includes("${prefix}/methodology"),
    );

    expect(offenders).toEqual([]);
  });

  it("does not expose the retired selector from sitewide surfaces", () => {
    const offenders = SITEWIDE_LINK_SOURCES.filter((file) =>
      fs.readFileSync(path.resolve(process.cwd(), file), "utf8").includes("/selector"),
    );

    expect(offenders).toEqual([]);
  });

  it("uses canonical category and tool slugs on generated discovery surfaces", () => {
    const homepage = fs.readFileSync(path.resolve(process.cwd(), "src/pages/HomePageV2.tsx"), "utf8");
    const categories = fs.readFileSync(path.resolve(process.cwd(), "src/data/categories_index.json"), "utf8");
    const stacks = fs.readFileSync(path.resolve(process.cwd(), "src/data/stacks.ts"), "utf8");
    const categoryPage = fs.readFileSync(path.resolve(process.cwd(), "src/pages/CategoryPage.tsx"), "utf8");
    const catalogueHook = fs.readFileSync(path.resolve(process.cwd(), "src/hooks/useSupabaseData.ts"), "utf8");

    expect(homepage).not.toContain("/category/ai-general");
    expect(homepage).not.toContain("/category/automation");
    expect(categories).not.toContain('"anthropic"');
    expect(stacks).not.toContain('"slug": "anthropic"');
    expect(stacks).not.toContain('"slug": "convertkit"');
    expect(stacks).not.toContain('"slug": "docsend"');
    expect(stacks).not.toContain('"slug": "visible"');
    expect(stacks).toContain('"slug": "kit"');
    expect(categoryPage).toContain('REDIRECTED_TOOL_SLUGS = new Set(["anthropic"])');
    expect(catalogueHook).toMatch(/DEPRECATED_TOOL_SLUGS[\s\S]*"anthropic"/);
  });
});
