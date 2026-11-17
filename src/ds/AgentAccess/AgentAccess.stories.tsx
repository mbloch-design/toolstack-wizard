import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import AgentAccess from "./AgentAccess";
import { agentAccessStates } from "./AgentAccess.fixtures";

// The gateway as the tool page shows it, in the reading column: the detail lives on the server sheet.
const meta: Meta<typeof AgentAccess> = {
  title: "Fiche outil/Assistant IA",
  component: AgentAccess,
  decorators: [(Story) => <div style={{ maxWidth: 760 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof AgentAccess>;
const state = (name: keyof typeof agentAccessStates): Story => ({
  render: (_args, context) => <AgentAccess access={agentAccessStates[name]} lang={context.globals.lang} />,
});

/** One sentence, three facts, the link to the server sheet. */
export const Notion: Story = {
  ...state("notion"),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "Depuis Claude, ChatGPT ou Gemini en un clic, votre assistant peut lire, modifier et supprimer, sur tous les forfaits." : "From Claude, ChatGPT or Gemini in one click, your assistant can read, edit and delete, on every plan.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? /outils, installation et sources/i : /tools, install and sources/i })).toHaveAttribute("href", `/${fr ? "fr" : "en"}/mcp/notion-mcp`);
  },
};
/** Two servers: two sheets; no client logo anywhere. */
export const FigmaTwoServers: Story = {
  ...state("figma"),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};
export const AhrefsPaid = state("ahrefs");
/** « No safeguard documented » is said, not hidden. */
export const CalendlyNoSafeguard: Story = {
  ...state("calendly"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByText(globals.lang === "en" ? "None documented by the vendor" : "Aucun documenté par l'éditeur")).toBeVisible();
  },
};
export const StripePays = state("stripe");
/** Safeguards not read on the vendor's site: the row is left out, never guessed. */
export const CanvaGaps: Story = {
  ...state("canva"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.queryByText(globals.lang === "en" ? "Safeguards" : "Garde-fous")).toBeNull();
  },
};
/** Checked, no official server: the block still says so, with the date and where we looked. */
export const HotjarNone: Story = {
  ...state("hotjar"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByText(globals.lang === "en" ? "No official MCP server as of 16 November." : "Pas de serveur MCP officiel au 16/11.")).toBeVisible();
  },
};
export const GoogleAnalyticsLocal = state("googleAnalytics");
