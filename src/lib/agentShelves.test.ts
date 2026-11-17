import { describe, expect, it } from "vitest";
import mcpIndex from "@/data/agents/mcp_index.json";
import type { McpCard } from "@/lib/agents";
import { agentShelves } from "./agentShelves";

const CARDS = mcpIndex as McpCard[];

describe("the full list's shelves (step 4)", () => {
  it("ranges the servers in five or six families, « Autres outils » last", () => {
    const shelves = agentShelves(CARDS, "fr");
    expect(shelves.length).toBeGreaterThanOrEqual(5);
    expect(shelves.length).toBeLessThanOrEqual(6);
    expect(shelves.at(-1)!.title).toBe("Autres outils");
  });

  it("loses no server and shows each once", () => {
    const listed = agentShelves(CARDS, "fr").flatMap((shelf) => shelf.cards.map((card) => card.slug));
    expect(listed.sort()).toEqual(CARDS.map((card) => card.slug).sort());
  });

  it("puts Design and Content creation on one shelf", () => {
    const shelf = agentShelves(CARDS, "fr").find((s) => s.cards.some((card) => card.host_tool === "canva"))!;
    expect(shelf.cards.map((card) => card.host_tool)).toContain("figma");
  });
});
