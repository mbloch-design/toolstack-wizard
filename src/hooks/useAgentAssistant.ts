import { useEffect, useState } from "react";
import { fromStoredClient, toStoredClient, type HubAssistant } from "@/lib/agentReport";

/** The same key as the server sheet's « Où utilisez-vous l'IA ? » (AgentSheet). */
const CLIENT_KEY = "tooltrim.agents.client";

/**
 * The assistant you use, shared by the hub, /mcp, the server sheet and every server card (17/11/2026): read once
 * after hydration (Claude until then), written on change. Storage refused: the page works with Claude.
 */
export function useAgentAssistant(): [HubAssistant, (next: HubAssistant) => void] {
  const [assistant, setAssistant] = useState<HubAssistant>("claude");
  useEffect(() => {
    try { const stored = fromStoredClient(window.localStorage.getItem(CLIENT_KEY)); if (stored) setAssistant(stored); } catch { /* none */ }
  }, []);
  return [assistant, (next) => {
    setAssistant(next);
    try { window.localStorage.setItem(CLIENT_KEY, toStoredClient(next)); } catch { /* the page works without it */ }
  }];
}
