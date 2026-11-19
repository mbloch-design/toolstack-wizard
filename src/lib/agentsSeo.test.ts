import { describe, expect, it } from "vitest";
import catalog from "@/data/agents/catalog.json";
import { agentsIndexSeo, deName, serverSeo, skillSeo } from "./agentsSeo";
import type { McpSheet, SkillSheet } from "./agents";

const servers = catalog.servers as unknown as McpSheet[];
const skills = catalog.skills as unknown as SkillSheet[];
const sibling = (s: McpSheet) => servers.some((o) => o.host_tool === s.host_tool && o.slug !== s.slug);

describe("the agents section's SEO, one source (step 9)", () => {
  it("keeps every title within 60 signs and every description within 120 to 155", () => {
    for (const lang of ["fr", "en"] as const) {
      const pages = [
        ...(["all", "mcp", "skills"] as const).map((view) => agentsIndexSeo(view, lang, { servers, skills })),
        ...servers.map((s) => serverSeo(s, lang, sibling(s))),
        ...skills.map((k) => skillSeo(k, lang)),
      ];
      for (const page of pages) {
        expect(page.title.length, page.title).toBeLessThanOrEqual(60);
        expect(page.description.length, page.description).toBeGreaterThanOrEqual(120);
        expect(page.description.length, page.description).toBeLessThanOrEqual(155);
      }
      expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    }
  });

  it("says the server sheet as a request: plug the tool into the assistants it serves", () => {
    const notion = servers.find((s) => s.slug === "notion-mcp")!;
    expect(serverSeo(notion, "fr", false).title).toBe("Brancher Notion à ChatGPT ou Claude (MCP officiel)");
    expect(serverSeo(notion, "en", false).title).toBe("Connect Notion to ChatGPT or Claude (official MCP)");
    const desktop = servers.find((s) => s.slug === "figma-mcp-desktop")!;
    expect(serverSeo(desktop, "fr", true).title).toContain("(MCP de bureau)");
  });

  it("elides before a vowel and never writes an English possessive", () => {
    expect(deName("Ahrefs")).toBe("d'Ahrefs");
    expect(deName("Notion")).toBe("de Notion");
    for (const k of skills) expect(skillSeo(k, "en").title).not.toMatch(/'s? /);
  });

  it("gives the server sheet its application, its trail and its FAQ, and the index its list", () => {
    const graph = (serverSeo(servers[0], "fr", false).jsonLd["@graph"] as { "@type": string }[]).map((node) => node["@type"]);
    expect(graph).toEqual(["SoftwareApplication", "BreadcrumbList", "FAQPage"]);
    const index = agentsIndexSeo("mcp", "fr", { servers, skills }).jsonLd["@graph"] as { "@type": string; mainEntity?: { numberOfItems: number } }[];
    expect(index[0]["@type"]).toBe("CollectionPage");
    expect(index[0].mainEntity?.numberOfItems).toBe(servers.length);
  });
});
