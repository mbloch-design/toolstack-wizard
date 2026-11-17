import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import Button from "../Button/Button";
import { byLine, cardSentence, say, serverFacts } from "@/lib/agents";
import Chip from "../Chip/Chip";
import { AgentCard, AgentCards, FilterGroups, NeedPicker, StackAgents, StartHere } from "./AgentHub";
import { cards, links, logo, needs, stackItems, toolName } from "./AgentHub.fixtures";

// The hub /agents in its reading order: a need, the stack, where to start.
const meta: Meta<typeof NeedPicker> = {
  title: "Agents/Hub",
  component: NeedPicker,
  // No reference until Michael validates the agents section (S1 bis).
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 880, display: "grid", gap: 48 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof NeedPicker>;

const hub = (withStack: boolean): Story => ({
  render: (_args, { globals }) => <>
    <NeedPicker needs={needs} cards={cards} lang={globals.lang} toolName={toolName} logo={logo} renderSheetLink={links.renderSheetLink} />
    <StackAgents items={withStack ? stackItems : null} lang={globals.lang} {...links} />
    <StartHere lang={globals.lang} renderGuideLink={links.renderGuideLink} />
  </>,
});

/** A need picked: its tool, the request to type, the risk, our view, three steps and the sheet. */
export const ParBesoin: Story = {
  ...hub(true),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    // Every need leads to a sheet: the first one opens on Calendly.
    await expect(canvas.getByRole("link", { name: fr ? /brancher Calendly/i : /plug in Calendly/i })).toHaveAttribute("href", "/fr/mcp/calendly-mcp");
    const payments = canvas.getByRole("button", { name: fr ? "Suivre mes paiements" : "Follow my payments" });
    await userEvent.click(payments);
    await expect(payments).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("heading", { name: "Stripe" })).toBeVisible();
    await expect(canvas.getByText(fr ? /après votre confirmation/ : /after your confirmation/)).toBeVisible();
  },
};

/** Ma stack holds five tools: our call on each, plugged ones first, Hotjar « not yet ». */
export const AvecStack: Story = {
  ...hub(true),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByText(fr ? "4 de vos 5 outils se branchent à votre assistant." : "4 of your 5 tools plug into your assistant.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: /Hotjar/ })).toHaveAttribute("href", "/fr/tool/hotjar");
  },
};

/** No stack yet: a short invitation, not an empty block. */
export const SansStack: Story = {
  ...hub(false),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByRole("link", { name: globals.lang === "en" ? /build my stack/i : /composer ma stack/i })).toHaveAttribute("href", "/fr/ma-stack");
  },
};


/** Cards of sheets (hub list, related sheets): logo, name, « Par Notion · Officiel », summary, two facts; the host tool with « Ajouter à ma stack ». */
export const Cartes: Story = {
  render: (_args, { globals }) => (
    <AgentCards label="Cartes">
      <AgentCard icon={logo("notion")} name="Notion" facts={[{ kind: "tool", text: globals.lang === "en" ? "Pricing, reviews and alternatives" : "Prix, avis et alternatives" }]} by={globals.lang === "en" ? "ToolTrim tool page" : "Fiche outil ToolTrim"} summary={globals.lang === "en" ? "Notes, docs, wikis and databases." : "Notes, docs, wikis et bases de données."}
        renderLink={(className, content) => <a className={className} href="/fr/tool/notion">{content}</a>}
        action={<Button variant="secondary">{globals.lang === "en" ? "Add to my stack" : "Ajouter à ma stack"}</Button>} />
      {cards.filter((c) => ["notion-mcp", "figma-mcp-desktop", "stripe-mcp"].includes(c.slug)).map((card) => (
        <AgentCard key={card.slug} icon={logo(card.host_tool)} name={card.name} by={byLine(card.publisher, globals.lang)} summary={card.card ? say(globals.lang, card.card) : cardSentence(say(globals.lang, card.summary))}
          facts={serverFacts(card, globals.lang)} renderLink={(className, content) => <a className={className} href={`/fr/mcp/${card.slug}`}>{content}</a>} />
      ))}
    </AgentCards>
  ),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getAllByText(globals.lang === "en" ? "By Notion · Official" : "Par Notion · Officiel")[0]).toBeVisible();
    await expect(canvas.getByRole("button", { name: globals.lang === "en" ? "Add to my stack" : "Ajouter à ma stack" })).toBeVisible();
  },
};

/** The list's filters in two labelled groups that wrap: no rail overflows at any width. */
export const Filtres: Story = {
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    const chips = (labels: string[]) => labels.map((label, i) => <Chip key={label} check pressed={i === 0}>{label}</Chip>);
    return <FilterGroups groups={[
      { label: fr ? "Comment" : "How", chips: chips(fr ? ["En un clic depuis ChatGPT ou Claude", "Supprime des données ou engage un paiement", "En ligne", "Sur l'ordinateur", "Tous les forfaits", "Connexion à votre compte"] : ["One click from ChatGPT or Claude", "Deletes data or makes a payment", "Online", "On your computer", "Every plan", "Sign in to your account"]) },
      { label: fr ? "Avec quel assistant" : "With which assistant", chips: chips(["Claude", "ChatGPT", "Gemini", "Copilot"]) },
    ]} />;
  },
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByRole("group", { name: globals.lang === "en" ? "With which assistant" : "Avec quel assistant" })).toBeVisible();
  },
};
