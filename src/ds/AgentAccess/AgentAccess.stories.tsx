import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import AgentAccess from "./AgentAccess";
import { agentAccessStates, clientNames } from "./AgentAccess.fixtures";

// The block as the tool page shows it, in the reading column.
const meta: Meta<typeof AgentAccess> = {
  title: "Fiche outil/Assistant IA",
  component: AgentAccess,
  decorators: [(Story) => <div style={{ maxWidth: 760 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof AgentAccess>;
const state = (name: keyof typeof agentAccessStates, toolName: string): Story => ({
  render: (_args, context) => <AgentAccess access={agentAccessStates[name]} toolName={toolName} lang={context.globals.lang} clientName={(slug) => clientNames[slug] ?? slug} />,
});

/** One remote server, every plan, three kinds of action: the verdict says it in one sentence, the facts follow. */
export const Notion: Story = {
  ...state("notion", "Notion"),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "Depuis Claude, ChatGPT ou Gemini en un clic, votre assistant peut lire, modifier et supprimer, sur tous les forfaits." : "From Claude, ChatGPT or Gemini in one click, your assistant can read, edit and delete, on every plan.")).toBeVisible();
    await expect(canvas.getByText(fr ? "Supprimer" : "Delete")).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? /documentation de l'éditeur/i : /vendor documentation/i })).toHaveAttribute("href", "https://developers.notion.com/guides/mcp/get-started-with-mcp");
  },
};
/** Two servers, each with its own facts and documentation; clients named in words, never as logos. */
export const FigmaTwoServers: Story = {
  ...state("figma", "Figma"),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};
/** Paid plans; no safeguard documented. */
export const AhrefsPaid = state("ahrefs", "Ahrefs");
/** Can cancel meetings; « no safeguard documented » is said, not hidden. */
export const CalendlyNoSafeguard: Story = {
  ...state("calendly", "Calendly"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByText(globals.lang === "en" ? "None documented by the vendor" : "Aucun documenté par l'éditeur")).toBeVisible();
  },
};
/** Can move money, with human confirmation; beta. */
export const StripePays = state("stripe", "Stripe");
/** Setup and safeguards not read on the vendor's site: the rows are left out, never guessed. */
export const CanvaGaps: Story = {
  ...state("canva", "Canva"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.queryByText(globals.lang === "en" ? "Setup" : "Branchement")).toBeNull();
  },
};
/** Checked, no official server: the block still says so, with the date and where we looked. */
export const HotjarNone: Story = {
  ...state("hotjar", "Hotjar"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByText(globals.lang === "en" ? "No official MCP server as of 16 November." : "Pas de serveur MCP officiel au 16/11.")).toBeVisible();
  },
};
/** Local only, read-only, plan unknown: the most technical case. */
export const GoogleAnalyticsLocal = state("googleAnalytics", "Google Analytics");
/** Restricted to a few assistants. */
export const SlackClients = state("slack", "Slack");
