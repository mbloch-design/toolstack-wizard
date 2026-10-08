import { describe, expect, it } from "vitest";
import { buildGuideToc, renderGuideMarkdown } from "./guideMarkdown";

describe("article heading hierarchy", () => {
  it("preserves a distinct markdown title without creating a second page H1", () => {
    const markdown = "# An editorial heading\n\n## Details\nBody";
    const html = renderGuideMarkdown(markdown, buildGuideToc(markdown), "The page title");
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2>An editorial heading</h2>");
  });
  it("omits the repeated page title", () => {
    expect(renderGuideMarkdown("# The page title", [], "The page title")).toBe("");
  });
});
