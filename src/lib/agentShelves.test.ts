import { describe, expect, it } from "vitest";
import mcpIndex from "@/data/agents/mcp_index.json";
import type { McpCard } from "@/lib/agents";
import { agentShelves } from "./agentShelves";

const CARDS = mcpIndex as McpCard[];

describe("the full list's shelves (step 4)", () => {
  it("ranges the servers in five or six families, never a shelf of one « Autres outils »", () => {
    const shelves = agentShelves(CARDS, "fr");
    expect(shelves.length).toBeGreaterThanOrEqual(5);
    expect(shelves.length).toBeLessThanOrEqual(6);
    const other = shelves.find((shelf) => shelf.id === "other");
    if (other) { expect(other.cards.length).toBeGreaterThan(1); expect(shelves.at(-1)).toBe(other); }
  });

  it("puts Slack with Communication and Stripe with e-commerce", () => {
    const home = (tool: string) => agentShelves(CARDS, "fr").find((shelf) => shelf.cards.some((card) => card.host_tool === tool))!.title;
    expect(home("slack")).toBe("Communication");
    expect(home("stripe")).toBe(home("shopify"));
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
