import { describe, expect, it } from "vitest";
import { assertSsrRenderers, inspectSsrContent, projectToolBootstrap } from "./ssr-contract.mjs";

describe("SSR renderer contract", () => {
  it("requires every page-family renderer before prerender can start", () => {
    expect(() => assertSsrRenderers({ renderToolPage() {} }, ["renderToolPage", "renderHomePage"])).toThrow("renderHomePage");
  });
  it("rejects non-callable renderer exports", () => {
    expect(() => assertSsrRenderers({ renderToolPage: "metadata only" }, ["renderToolPage"])).toThrow("renderToolPage");
  });
  it("accepts a complete callable module", () => {
    expect(() => assertSsrRenderers({ renderToolPage() {}, renderHomePage() {} }, ["renderToolPage", "renderHomePage"])).not.toThrow();
  });
  it("does not count comments or fallback scripts as content", () => {
    expect(inspectSsrContent('<div id="root"><!-- <h1>hidden</h1> --></div><noscript><h1>fallback</h1></noscript>')).not.toEqual([]);
  });
  it("checks the balanced root without accepting a heading outside it", () => {
    expect(inspectSsrContent('<div id="root"><div>Header</div></div><h1>outside</h1>')).toEqual(["SSR page must contain exactly one non-empty H1"]);
  });
  it("does not accept a commented heading beside rendered navigation", () => {
    expect(inspectSsrContent('<div id="root"><p>Navigation</p><!-- <h1>hidden</h1> --></div>')).toEqual(["SSR page must contain exactly one non-empty H1"]);
  });
  it("accepts nested primary content", () => {
    expect(inspectSsrContent('<div id="root"><div><main><h1>Page</h1><p>Content</p></main></div></div>')).toEqual([]);
  });
});

describe("tool bootstrap projection", () => {
  it("omits historical transport fields without changing catalogue facts or its source", () => {
    const tool = {
      id: "fixture", slug: "fixture", description: "legacy", research: { archived: true },
      lifecycle: "archived", website: "old.example", verdictFr: "legacy verdict",
      pivot_integration_source: "legacy", relevantForEn: true,
      websiteUrl: "https://official.example", shortDescription: "Description FR",
      shortDescriptionEn: "Description EN", pricing: { free: "Gratuit", paid: "Sur devis" },
      pricingEn: { free: "Free", paid: "Custom pricing" },
      verdict: { threshold: "FR" }, verdictEn: { threshold: "EN" },
      pros: ["preuve"], cons: ["limite"], research_v2: { status: "verified" },
    };
    const original = structuredClone(tool);
    const bootstrap = JSON.parse(JSON.stringify(projectToolBootstrap(tool)));
    expect(bootstrap).toEqual({
      id: "fixture", slug: "fixture", websiteUrl: "https://official.example",
      shortDescription: "Description FR", shortDescriptionEn: "Description EN",
      pricing: { free: "Gratuit", paid: "Sur devis" }, pricingEn: { free: "Free", paid: "Custom pricing" },
      verdict: { threshold: "FR" }, verdictEn: { threshold: "EN" },
      pros: ["preuve"], cons: ["limite"], research_v2: { status: "verified" },
    });
    expect(tool).toEqual(original);
  });
});
