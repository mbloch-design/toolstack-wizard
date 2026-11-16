import { describe, expect, it } from "vitest";
import { agentVerdict, leadServer } from "./agentVerdict";
import { agentAccessStates } from "./AgentAccess.fixtures";

describe("agent verdict", () => {
  it("says where from, what it can do, on which plan and what holds it back, from the fields only", () => {
    expect(agentVerdict(agentAccessStates.calendly, "fr")).toBe("Depuis Claude ou ChatGPT en un clic, votre assistant peut lire, modifier et supprimer, sur tous les forfaits ; aucun garde-fou documenté par l'éditeur.");
    expect(agentVerdict(agentAccessStates.calendly, "en")).toBe("From Claude or ChatGPT in one click, your assistant can read, edit and delete, on every plan; no safeguard documented by the vendor.");
  });

  it("says money, beta and the confirmation", () => {
    expect(agentVerdict(agentAccessStates.stripe, "fr")).toBe("Depuis Claude ou ChatGPT en un clic, votre assistant peut lire, modifier et payer, en bêta ; confirmation demandée avant certaines actions.");
  });

  it("speaks for the widest server and counts the others", () => {
    expect(leadServer(agentAccessStates.figma.servers).name).toBe("Figma MCP server (remote)");
    expect(agentVerdict(agentAccessStates.figma, "fr")).toMatch(/Deux serveurs officiels\.$/);
  });

  it("leaves out what the vendor does not say", () => {
    expect(agentVerdict(agentAccessStates.canva, "fr")).toBe("Votre assistant peut lire et modifier, sur tous les forfaits, depuis certains assistants seulement.");
    expect(agentVerdict(agentAccessStates.googleAnalytics, "fr")).toBe("Une fois installé sur votre ordinateur, votre assistant peut seulement lire.");
  });

  it("says « none » with its date", () => {
    expect(agentVerdict(agentAccessStates.hotjar, "fr")).toBe("Pas de serveur MCP officiel au 16/11.");
    expect(agentVerdict(agentAccessStates.hotjar, "en")).toBe("No official MCP server as of 16 November.");
  });
});
