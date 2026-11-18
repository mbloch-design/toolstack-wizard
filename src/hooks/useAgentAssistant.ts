import { useEffect, useState } from "react";
import { fromStoredClient, toStoredClient, type HubAssistant } from "@/lib/agentReport";

/** The same key as the server sheet's « Où utilisez-vous l'IA ? » (AgentSheet). */
const CLIENT_KEY = "tooltrim.agents.client";

/**
 * The assistant you use, shared by the hub, /mcp, the server sheet, every server card and Ma stack (17-18/11/2026):
 * read once after hydration (Claude until then), written on change. The third value says whether the person has
 * chosen (Ma stack asks the question until then). Storage refused: the page works with Claude.
 */
export function useAgentAssistant(): [HubAssistant, (next: HubAssistant) => void, boolean] {
  const [assistant, setAssistant] = useState<HubAssistant>("claude");
  const [chosen, setChosen] = useState(false);
  useEffect(() => {
    try { const stored = fromStoredClient(window.localStorage.getItem(CLIENT_KEY)); if (stored) { setAssistant(stored); setChosen(true); } } catch { /* none */ }
  }, []);
  return [assistant, (next) => {
    setAssistant(next);
    setChosen(true);
    try { window.localStorage.setItem(CLIENT_KEY, toStoredClient(next)); } catch { /* the page works without it */ }
  }, chosen];
}
