import { describe, expect, it } from "vitest";
import mcpIndex from "@/data/agents/mcp_index.json";
import { CARD_MAX, type McpCard } from "@/lib/agents";
import { serverFoot } from "./agentReport";

const CARDS = mcpIndex as McpCard[];

describe("server cards (step 4)", () => {
  it("say one whole sentence that fits two lines of the narrowest card", () => {
    for (const card of CARDS) {
      expect(card.card, card.slug).toBeTruthy();
      expect(card.card!.fr.length, `${card.slug} fr`).toBeLessThanOrEqual(CARD_MAX);
      expect(card.card!.en.length, `${card.slug} en`).toBeLessThanOrEqual(CARD_MAX);
      expect(card.card!.fr, card.slug).toMatch(/[.!?]$/);
    }
  });

  it("end on how it plugs into your assistant and the gravest consequence", () => {
    const stripe = CARDS.find((card) => card.slug === "stripe-mcp")!;
    expect(serverFoot(stripe, "claude", "fr")).toEqual([{ kind: "one_click", text: "En un clic avec Claude" }, { kind: "pay", text: "Engage un paiement" }]);
    const ga = CARDS.find((card) => card.slug === "google-analytics-mcp")!;
    expect(serverFoot(ga, "claude", "fr")[0]).toEqual({ kind: "configure", text: "À configurer" });
    expect(serverFoot(ga, "gemini", "fr")[0].kind).toBe("elsewhere");
  });
});
