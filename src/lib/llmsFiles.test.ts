import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("generated llms files", () => {
  const tools = JSON.parse(read("src/data/tools_index.json")) as Array<{ slug: string }>;
  const llms = read("public/llms.txt");
  const llmsFull = read("public/llms-full.txt");
  const catalogue = JSON.parse(llmsFull.slice(llmsFull.indexOf("["))) as Array<{
    slug: string;
    url_fr: string;
    url_en: string;
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
});
