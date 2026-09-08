import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SITEWIDE_LINK_SOURCES = [
  "src/components/Footer.tsx",
  "src/components/Navbar.tsx",
  "src/components/tool/StickyDecisionCard.tsx",
  "src/pages/AboutPage.tsx",
  "src/pages/ComparePage.tsx",
  "src/pages/ContactPage.tsx",
  "src/pages/HomePageV2.tsx",
  "src/pages/TransparencyPage.tsx",
];

describe("canonical discovery surfaces", () => {
  it("does not link to the redirected methodology alias", () => {
    const offenders = SITEWIDE_LINK_SOURCES.filter((file) =>
      fs.readFileSync(path.resolve(process.cwd(), file), "utf8").includes("${prefix}/methodology"),
    );

    expect(offenders).toEqual([]);
  });
});
