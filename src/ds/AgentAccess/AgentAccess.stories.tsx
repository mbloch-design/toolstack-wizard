import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import AgentAccess from "./AgentAccess";
import { agentAccessStates } from "./AgentAccess.fixtures";
import advice from "@/data/agents/advice.json";
import type { Advice } from "@/lib/agents";
import Logo from "../Logo/Logo";

// The gateway as the tool page shows it, in the reading column: a verdict, a request, the way to the server sheet.
const meta: Meta<typeof AgentAccess> = {
  title: "Fiche outil/Assistant IA",
  component: AgentAccess,
  // No reference until Michael validates the agents section (S1 bis).
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 760 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof AgentAccess>;
const NAMES = { notion: "Notion", figma: "Figma", ahrefs: "Ahrefs", hotjar: "Hotjar", calendly: "Calendly", stripe: "Stripe", googleAnalytics: "Google Analytics", canva: "Canva" } as const;
const ADVICE = advice as Record<string, Advice>;
const state = (name: keyof typeof agentAccessStates, extra: Partial<Parameters<typeof AgentAccess>[0]> = {}): Story => ({
  render: (_args, context) => {
    const access = agentAccessStates[name];
    const lead = access.servers.find((s) => s.mcpSlug)?.mcpSlug;
    return <AgentAccess access={access} toolName={NAMES[name]} advice={lead ? ADVICE[lead] : undefined} lang={context.globals.lang} {...extra} />;
  },
});

/**
 * Contract: the block repeats no fact of the tool page. No date, no « Notre avis », no plan unless it restricts
 * access, no column of labels in capitals, no card.
 */
const repeatsNothing = async (root: HTMLElement, fr: boolean) => {
  const text = root.textContent ?? "";
  for (const word of fr ? ["Vérifié le", "Notre avis", "Garde-fous", "tous les forfaits", "MCP"] : ["Checked on", "Our view", "Safeguards", "every plan", "MCP"]) await expect(text).not.toContain(word);
  await expect(root.querySelector("dl")).toBeNull();
};

/** Notion: plugs in one click, can delete; a request to copy; the way to its sheet. After « Les IA qui comptent ici ». */
export const Notion: Story = {
  ...state("notion", { after: true }),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? /^Et votre propre assistant\s\?/ : /^And your own assistant\?/)).toBeVisible();
    await expect(canvas.getByText(fr ? /^Se branche en un clic à Claude, ChatGPT et Gemini\. Peut supprimer des données\.$/ : "Plugs into Claude, ChatGPT and Gemini in one click. Can delete data.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: fr ? "Copier la demande" : "Copy the request" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? /brancher Notion à votre assistant/i : /plug Notion into your assistant/i })).toHaveAttribute("href", `/${fr ? "fr" : "en"}/mcp/notion-mcp`);
    // An action link: its arrow is there at rest.
    await expect(canvas.getByRole("link", { name: fr ? /brancher Notion/i : /plug Notion/i }).querySelector("[data-shown]")).not.toBeNull();
    await repeatsNothing(canvasElement, fr);
  },
};
/** A payment is the gravest consequence: said first. */
export const StripePays: Story = {
  ...state("stripe"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? /Peut engager un paiement\./ : /Can make a payment\./)).toBeVisible();
    await repeatsNothing(canvasElement, fr);
  },
};
/** The plan is said only when it restricts access. */
export const AhrefsPaid: Story = {
  ...state("ahrefs"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? /Forfait payant requis\.$/ : /Paid plan required\.$/)).toBeVisible();
    await repeatsNothing(canvasElement, fr);
  },
};
/** Two servers: two sheets. */
export const FigmaTwoServers: Story = {
  ...state("figma"),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
  },
};
/** Checked, no official server, and none of its own alternatives plugs in: the sentence alone, no list by category. */
export const HotjarNone: Story = {
  ...state("hotjar"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "Hotjar ne se branche pas à un assistant IA." : "Hotjar does not plug into an AI assistant.")).toBeVisible();
    await expect(canvas.queryByRole("list")).toBeNull();
    await expect(canvas.queryByText(fr ? /pas encore vérifié/i : /not checked yet/i)).toBeNull();
    await repeatsNothing(canvasElement, fr);
  },
};
/** Milanote: its own alternatives that plug in (Notion, Figma, Miro), with their logo, to their tool page. */
export const MilanoteAlternatives: Story = {
  ...state("hotjar", {
    toolName: "Milanote",
    alternatives: (["notion", "figma", "miro"] as const).map((slug) => ({ slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), logo: <Logo tool={{ name: slug, slug }} size={24} localOnly /> })),
  }),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "Milanote ne se branche pas à un assistant IA." : "Milanote does not plug into an AI assistant.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Figma" })).toHaveAttribute("href", `/${fr ? "fr" : "en"}/tool/figma`);
    await expect(canvas.getAllByRole("link")).toHaveLength(3);
  },
};
export const GoogleAnalyticsLocal = state("googleAnalytics");
