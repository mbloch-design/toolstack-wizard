import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import Button from "../Button/Button";
import Segmented from "../Segmented/Segmented";
import Chapter, { Chapters } from "../Chapter/Chapter";
import { byLine, cardLine, say, type Advice } from "@/lib/agents";
import { agentShelves } from "@/lib/agentShelves";
import { HUB_ASSISTANTS, checkedTools, isPlugged, reportRows, reportVerdict, serverFoot, type HubAssistant } from "@/lib/agentReport";
import advice from "@/data/agents/advice.json";
import { AgentCard, AgentCards, AgentShelf, HubQuestion, HubQuestions, StackReport, ToolChecklist, type ReportItem } from "./AgentHub";
import { STACK, cards, links, logo, toolName } from "./AgentHub.fixtures";

// The hub /agents as a report (step 4): your assistant, your tools, one sentence, one row per tool.
const meta: Meta<typeof StackReport> = {
  title: "Agents/Hub",
  component: StackReport,
  // No reference until Michael validates the agents section.
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 1080 }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof StackReport>;

const ADVICE = advice as Record<string, Advice>;
const LABELS: Record<HubAssistant, string> = { claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot", other: "Autre" };

/** The hub as the page composes it, from the real data: the questions, then the report as a chapter. */
function Hub({ stack, start, lang }: { stack: string[]; start: HubAssistant; lang: "fr" | "en" }) {
  const [assistant, setAssistant] = useState(start);
  const [picks, setPicks] = useState<string[]>([]);
  const slugs = stack.length ? stack : picks;
  const rows = reportRows(slugs, assistant);
  const items: ReportItem[] = rows.map((row) => {
    const example = row.card ? ADVICE[row.card.slug]?.examples?.[0] : undefined;
    return {
      slug: row.slug, name: toolName(row.slug), logo: logo(row.slug), status: row.status,
      ...(row.card ? { sheet: row.card.slug } : {}), ...(row.gravest ? { gravest: row.gravest } : {}),
      ...(example && row.status !== "elsewhere" ? { request: lang === "en" ? example.en : example.fr } : {}),
      ...(row.slug === "milanote" ? { alternative: { slug: "notion", name: "Notion", logo: logo("notion") } } : {}),
    };
  });
  return (
    <Chapters>
      <Chapter chapter="questions" width="wide">
        <HubQuestions>
          <HubQuestion title={lang === "en" ? "Your assistant" : "Votre assistant"}>
            <Segmented compact label={lang === "en" ? "Your assistant" : "Votre assistant"} value={assistant} onChange={setAssistant} options={HUB_ASSISTANTS.map((value) => ({ value, label: LABELS[value] }))} />
          </HubQuestion>
          <HubQuestion title={lang === "en" ? "Your tools" : "Vos outils"} note={stack.length ? (lang === "en" ? `The ${stack.length} tools in My stack.` : `Les ${stack.length} outils de Ma stack.`) : (lang === "en" ? "Tick the ones you use." : "Cochez ceux que vous utilisez.")}>
            {!stack.length && <ToolChecklist tools={checkedTools().map((slug) => ({ slug, name: toolName(slug), logo: logo(slug) }))} selected={picks}
              onToggle={(slug) => setPicks((list) => (list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug]))} lang={lang} />}
          </HubQuestion>
        </HubQuestions>
      </Chapter>
      {rows.length > 0 && (
        <Chapter chapter="report" width="wide" title={reportVerdict(rows, assistant, lang)}>
          <StackReport items={items} assistant={assistant === "other" ? null : LABELS[assistant]} lang={lang} {...links} />
        </Chapter>
      )}
    </Chapters>
  );
}

/**
 * Contract: the sentence and the rows agree (as many plugged rows as the sentence says, as many one-click rows), and
 * no tool is classed without data (a tool with no server and no check is « not checked »).
 */
const agrees = async (root: HTMLElement, assistant: HubAssistant, stack: string[]) => {
  const rows = reportRows(stack, assistant);
  const title = root.querySelector("[data-chapter=report] h2")!.textContent!.replace(/\s/g, " ");
  const plugged = rows.filter(isPlugged).length;
  await expect(title).toContain(plugged ? `${plugged} de vos ${stack.length} outils` : `Aucun de vos ${stack.length} outils`);
  const shown = [...root.querySelectorAll<HTMLElement>("[data-status]")];
  await expect(shown.filter((row) => ["one_click", "configure"].includes(row.dataset.status!)).length).toBe(plugged);
  await expect(shown.map((row) => row.dataset.status)).toEqual(rows.map((row) => row.status));
  await expect(root.querySelector("[data-status=unchecked]")?.textContent).toContain("Trello");
};

/** No stack: the checked tools to tick; ticking two of them makes the report. */
export const SansStack: Story = {
  render: (_args, { globals }) => <Hub stack={[]} start="claude" lang={globals.lang} />,
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvasElement.querySelector("[data-chapter=report]")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Notion" }));
    await userEvent.click(canvas.getByRole("button", { name: "Hotjar" }));
    await expect(canvas.getByRole("heading", { level: 2, name: fr ? /^1\sde vos 2\soutils se branche à Claude, en un clic/ : /^1\sof your 2\stools plugs into Claude, in one click/ })).toBeVisible();
  },
};

/** Nine tools, every status, with Claude: « 4 de vos 9 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement. » */
export const StackDeNeuf: Story = {
  render: (_args, { globals }) => <Hub stack={STACK} start="claude" lang={globals.lang} />,
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    if (fr) await expect(canvas.getByRole("heading", { level: 2, name: /^4\sde vos 9\soutils se branchent à Claude, dont 3\sen un clic\. 1\speut engager un paiement\.$/ })).toBeVisible();
    if (fr) await agrees(canvasElement, "claude", STACK);
    // A request to copy and « Brancher → » on a plugged row; a report link on the unchecked one.
    const stripe = within(canvasElement.querySelector<HTMLElement>("[data-status=one_click]")!);
    await expect(stripe.getByRole("button", { name: fr ? "Copier la demande" : "Copy the request" })).toBeVisible();
    await expect(stripe.getByRole("link", { name: fr ? /^Brancher/ : /^Plug in/ })).toHaveAttribute("href", "/fr/mcp/stripe-mcp");
    await expect(canvas.getByRole("link", { name: fr ? /Signaler cet outil/ : /Report this tool/ })).toBeVisible();
  },
};

/** With ChatGPT: fewer tools in one click, the sentence follows the rows. */
export const AvecChatGPT: Story = {
  render: (_args, { globals }) => <Hub stack={STACK} start="chatgpt" lang={globals.lang} />,
  play: async ({ canvasElement, globals }) => {
    if (globals.lang !== "en") await agrees(canvasElement, "chatgpt", STACK);
  },
};

/** « Autre »: only what the vendors document for any client, never « one click ». */
export const AvecAutre: Story = {
  render: (_args, { globals }) => <Hub stack={STACK} start="other" lang={globals.lang} />,
  play: async ({ canvasElement, globals }) => {
    await expect(canvasElement.querySelector("[data-status=one_click]")).toBeNull();
    if (globals.lang !== "en") await agrees(canvasElement, "other", STACK);
  },
};

/** The full list in a few families (Explorer's need universes): Slack with Communication, Stripe with e-commerce, no shelf of one. */
export const ParFamille: Story = {
  render: (_args, { globals }) => <div style={{ display: "grid", gap: 48 }}>
    {agentShelves(cards, globals.lang).map((shelf) => (
      <AgentShelf key={shelf.id} title={shelf.title} count={shelf.cards.length}>
        <AgentCards flat label={shelf.title}>
          {shelf.cards.map((card) => (
            <AgentCard key={card.slug} icon={logo(card.host_tool)} name={toolName(card.host_tool)} by={byLine(card.publisher, globals.lang)} summary={card.card ? say(globals.lang, card.card) : cardLine(say(globals.lang, card.summary))}
              facts={serverFoot(card, "claude", globals.lang)} renderLink={(className, content) => <a className={className} href={`/fr/mcp/${card.slug}`}>{content}</a>} />
          ))}
        </AgentCards>
      </AgentShelf>
    ))}
  </div>,
  play: async ({ canvas, globals }) => {
    const shelves = canvas.getAllByRole("heading", { level: 3 });
    await expect(shelves.length).toBeLessThanOrEqual(6);
    // Slack sits with Communication; no shelf of one « Autres outils ».
    await expect(shelves.some((shelf) => /^(Communication)/.test(shelf.textContent ?? "") && shelf.parentElement!.textContent!.includes("Slack"))).toBe(true);
    await expect(canvas.queryByRole("heading", { level: 3, name: globals.lang === "en" ? /^Other tools/ : /^Autres outils/ })).toBeNull();
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
        <AgentCard key={card.slug} icon={logo(card.host_tool)} name={card.name} by={byLine(card.publisher, globals.lang)} summary={card.card ? say(globals.lang, card.card) : cardLine(say(globals.lang, card.summary))}
          facts={serverFoot(card, "claude", globals.lang)} renderLink={(className, content) => <a className={className} href={`/fr/mcp/${card.slug}`}>{content}</a>} />
      ))}
    </AgentCards>
  ),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getAllByText(fr ? "Par Notion · Officiel" : "By Notion · Official")[0]).toBeVisible();
    // The foot says how it plugs into Claude and the gravest consequence, never « En ligne » or « Votre compte ».
    await expect(canvas.getAllByText(fr ? "En un clic avec Claude" : "One click with Claude").length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(fr ? "Engage un paiement" : "Makes a payment").length).toBe(1);
    await expect(canvas.queryByText(fr ? "En ligne" : "Online")).toBeNull();
    await expect(canvas.queryByText(fr ? "Votre compte" : "Your account")).toBeNull();
    await expect(canvas.getByRole("button", { name: globals.lang === "en" ? "Add to my stack" : "Ajouter à ma stack" })).toBeVisible();
  },
};
