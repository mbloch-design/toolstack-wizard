import { describe, expect, it } from "vitest";
import { agentVerdict, leadServer } from "./agentVerdict";
import { agentAccessStates } from "./AgentAccess.fixtures";

describe("agent verdict (step 2, consequence vocabulary)", () => {
  it("says where it plugs in and the gravest thing it can do", () => {
    expect(agentVerdict(agentAccessStates.notion, "fr")).toBe("Se branche en un clic à Claude, ChatGPT et Gemini. Peut supprimer des données.");
    expect(agentVerdict(agentAccessStates.notion, "en")).toBe("Plugs into Claude, ChatGPT and Gemini in one click. Can delete data.");
  });

  it("puts a payment before anything else", () => {
    expect(agentVerdict(agentAccessStates.stripe, "fr")).toBe("Se branche en un clic à Claude et ChatGPT. Peut engager un paiement.");
  });

  it("says the plan only when it restricts access", () => {
    expect(agentVerdict(agentAccessStates.ahrefs, "fr")).toMatch(/Forfait payant requis\.$/);
    expect(agentVerdict(agentAccessStates.notion, "fr")).not.toMatch(/forfait/i);
  });

  it("speaks for the widest server", () => {
    expect(leadServer(agentAccessStates.figma.servers).name).toBe("Figma MCP server (remote)");
  });

  it("says reading only and a local install in plain words", () => {
    expect(agentVerdict(agentAccessStates.googleAnalytics, "fr")).toBe("S'installe sur votre ordinateur pour votre assistant. En lecture seule : sans effet sur vos données.");
  });

  it("says « none » without a date", () => {
    expect(agentVerdict(agentAccessStates.hotjar, "fr")).toBe("Ne se branche pas à un assistant IA.");
  });
});
