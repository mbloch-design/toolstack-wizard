import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { editorialRecord, editorialUrls, toolRecords } from "../../scripts/lib/llms-catalogue.mjs";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("generated llms files", () => {
  const tools = JSON.parse(read("src/data/tools_index.json")) as Array<{ slug: string; pricing?: unknown }>;
  const llms = read("public/llms.txt");
  const llmsFull = read("public/llms-full.txt");
  const catalogue = JSON.parse(llmsFull.slice(llmsFull.indexOf("["))) as Array<{
    slug: string;
    url_fr: string;
    url_en: string;
    pricing?: unknown;
  }>;

  it("contains every canonical tool exactly once", () => {
    expect(catalogue).toHaveLength(tools.length);
    expect(new Set(catalogue.map(({ slug }) => slug)).size).toBe(tools.length);
  });

  it("uses canonical localized tool URLs", () => {
    for (const tool of catalogue) {
      expect(tool.url_fr).toBe(`https://tooltrim.com/fr/tool/${tool.slug}`);
      expect(tool.url_en).toBe(`https://tooltrim.com/en/tool/${tool.slug}`);
    }
  });

  it("does not advertise stale routes or catalogue counts", () => {
    expect(llms).toContain(`${tools.length} canonical tool records`);
    expect(llms).not.toContain("/fr/categories");
    expect(llms).not.toContain("314 tools");
    expect(llms).not.toContain("Last full pricing audit");
  });

  it("preserves source pricing without inferred monthly EUR amounts", () => {
    for (const tool of catalogue) {
      expect(tool).not.toHaveProperty("monthly_price_eur");
      expect(tool.pricing).toEqual(tools.find(({ slug }) => slug === tool.slug)?.pricing);
    }
    for (const slug of ["pdf-agile", "b12", "flexclip", "blender"]) {
      expect(catalogue.find((tool) => tool.slug === slug)).toBeDefined();
    }
  });

  it("includes localized editorial records and every featured comparison", () => {
    const text = read("public/llms-editorial.txt");
    const records = JSON.parse(text.slice(text.indexOf("[")));
    const urls = records.map((record: { url: string }) => record.url);
    expect(new Set(urls).size).toBe(records.length);
    expect(llms).toContain("https://tooltrim.com/llms-editorial.txt");
    for (const record of records) {
      expect(["fr", "en"]).toContain(record.language);
      expect(["guide", "comparison"]).toContain(record.type);
      expect(record.title.trim().length).toBeGreaterThan(0);
      const segment = record.type === "guide" ? "guide" : "comparatif";
      expect(record.url).toBe(`https://tooltrim.com/${record.language}/${segment}/${record.slug}`);
    }
    expect(records.filter(({ type }: { type: string }) => type === "comparison")).toHaveLength(FEATURED_COMPARISONS.length * 2);
    for (const lang of ["fr", "en"]) {
      for (const comparison of FEATURED_COMPARISONS) {
        expect(urls).toContain(`https://tooltrim.com/${lang}/comparatif/${comparison.slugPair}`);
      }
      for (const route of ["comparatif/b12-vs-wix", "comparatif/pixlr-vs-photopea", "guide/creer-video-produit-sans-montage", "guide/choisir-outil-premiere-newsletter"]) {
        expect(urls).toContain(`https://tooltrim.com/${lang}/${route}`);
      }
    }
  });

  it("advertises accurate editorial counts", () => {
    const text = read("public/llms-editorial.txt");
    const records = JSON.parse(text.slice(text.indexOf("[")));
    const guides = records.filter(({ type }: { type: string }) => type === "guide").length;
    expect(llms).toContain(`${guides} localized guide pages and ${records.length - guides} localized comparison pages`);
  });
});

describe("LLM export safeguards", () => {
  it("does not turn absent, zero or legacy numeric prices into a monthly offer", () => {
    for (const price of [undefined, null, 0, 99, NaN, "10"]) {
      const [record] = toolRecords([{ slug: "example", defaultMonthlyPrice: price }]);
      expect(record).not.toHaveProperty("monthly_price_eur");
      expect(record.pricing).toBeUndefined();
    }
    const pricing = { free: "Free plan", paid: "119 USD lifetime, one-time payment" };
    expect(toolRecords([{ slug: "example", pricing }])[0].pricing).toEqual(pricing);
  });

  it("does not label a French fallback as an English description", () => {
    expect(toolRecords([{ slug: "example", shortDescription: "Texte français" }])[0].description_en).toBeUndefined();
  });

  it("rejects missing and duplicate tool identities", () => {
    expect(() => toolRecords([{}])).toThrow();
    expect(() => toolRecords([{ slug: "same" }, { slug: "same" }])).toThrow();
  });

  const url = "https://tooltrim.com/en/guide/example";
  const html = `<title>Example &amp; test &#39;one&#39;</title><link href="${url}" rel="canonical"><meta content="Read &quot;this&quot; &#x26; more" name="description">`;

  it("decodes editorial text and accepts reordered HTML attributes", () => {
    expect(editorialRecord(url, html)).toMatchObject({
      type: "guide", language: "en", title: "Example & test 'one'", summary: 'Read "this" & more',
    });
  });

  it("rejects non-canonical, noindex and incomplete pages", () => {
    expect(() => editorialRecord(url, html.replace(url, "https://tooltrim.com/en"))).toThrow();
    expect(() => editorialRecord(url, `${html}<meta name="robots" content="noindex,follow">`)).toThrow();
    expect(() => editorialRecord(url, html.replace(/<title>.*?<\/title>/, ""))).toThrow();
    expect(editorialRecord(url, html.replace(/<meta.*?>/, "")).summary).toBeUndefined();
  });

  it("automatically discovers new editorial routes without including navigation states", () => {
    const xml = `<urlset><url><loc>${url}</loc></url><url><loc>https://tooltrim.com/fr/comparatif/new-vs-other</loc></url><url><loc>https://tooltrim.com/fr/guides</loc></url><url><loc>${url}?draft=1</loc></url></urlset>`;
    expect(editorialUrls(xml)).toEqual([url, "https://tooltrim.com/fr/comparatif/new-vs-other"]);
    expect(() => editorialUrls(xml + `<loc>${url}</loc>`)).toThrow();
    expect(() => editorialUrls("<urlset/>")).toThrow();
  });
});
