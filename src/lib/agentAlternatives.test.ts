import { describe, expect, it } from "vitest";
import index from "@/data/tools_index.json";
import { resolveToolAlternatives } from "@/lib/toolSchema";
import { pluggedAlternatives } from "./agentAlternatives";

const tools = (Array.isArray(index) ? index : (index as { tools: unknown[] }).tools) as { slug?: string; id: string }[];
const plugged = (slug: string) => pluggedAlternatives(resolveToolAlternatives(tools.find((tool) => tool.slug === slug), tools)).map((tool) => tool.slug);

describe("alternatives that plug in, for a tool that does not", () => {
  it("never offers a tool of another trade: Hotjar gets no Ahrefs, and no list when none of its alternatives plugs in", () => {
    expect(plugged("hotjar")).not.toContain("ahrefs");
    expect(plugged("hotjar")).toEqual([]);
  });

  it("keeps the tool's own alternatives that plug in, in their order, three at most", () => {
    expect(plugged("milanote")).toEqual(["notion", "figma", "miro"]);
  });
});
