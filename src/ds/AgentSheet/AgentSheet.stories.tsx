import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import Logo from "../Logo/Logo";
import { McpSheetView, SkillSheetView } from "./AgentSheet";
import { sheetStates, skillStates } from "./AgentSheet.fixtures";

// The sheet as /mcp/:slug and /skills/:slug show it, in the reading column: a story in chapters.
const meta: Meta<typeof McpSheetView> = {
  title: "Agents/Fiche",
  component: McpSheetView,
  // No reference until Michael validates the agents section (S1 bis).
  tags: ["a-valider"],
  decorators: [(Story) => <div style={{ maxWidth: 880 }}><Story /></div>],
  // The client choice follows the reader from sheet to sheet: every story starts without one.
  beforeEach: () => { try { window.localStorage.removeItem("tooltrim.agents.client"); } catch { /* none */ } },
};
export default meta;

type Story = StoryObj<typeof McpSheetView>;
const REPORT = "/fr/contact?subject=correction";
const server = (name: keyof typeof sheetStates, toolName: string): Story => ({
  render: (_args, context) => <McpSheetView sheet={sheetStates[name]} toolName={toolName} lang={context.globals.lang}
    title={context.globals.lang === "en" ? `Plug ${toolName} into your assistant` : `Brancher ${toolName} à votre assistant`}
    logo={<Logo tool={{ name: toolName, slug: sheetStates[name].host_tool }} size={40} localOnly />}
    pageUrl={`https://tooltrim.com/fr/mcp/${sheetStates[name].slug}`} reportHref={REPORT} />,
});
const chapters = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) => el.dataset.chapter);

/** Count a phrase in the rendered sheet: a fact has one place (17/11). */
const times = (root: HTMLElement, text: RegExp) => ((root.textContent ?? "").match(new RegExp(text.source, "g")) ?? []).length;

/** The head, then plugging, before any technique; each fact said once; the steps for Claude, then Cursor. */
export const Notion: Story = {
  ...server("notion", "Notion"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    // Content contract: the hook and « Brancher » precede the technique.
    await expect(chapters(canvasElement)).toEqual(["head", "change", "plug", "first", "help", "control", "view", "further", "sources"]);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(fr ? "Brancher Notion à votre assistant" : "Plug Notion into your assistant");
    // A fact has one place: the date, « official ». The plan is summed up in the hook and detailed once, on purpose.
    await expect(times(canvasElement, fr ? /16\s+novembre\s+2026/ : /16\s+November\s+2026/)).toBe(1);
    await expect(times(canvasElement, fr ? /Officiel/ : /Official/)).toBe(1);
    await expect(canvas.queryByText(fr ? "Fiche technique" : "Technical sheet")).toBeNull();
    await expect(canvas.getByRole("link", { name: fr ? /voir les étapes/i : /see the steps/i })).toHaveAttribute("href", "#notion-mcp-brancher");
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/notion");
    // The risks in sentences: restoring is no longer filed under deleting.
    await expect(canvas.getByText(fr ? "Il peut mettre à la corbeille des pages, des bases et des commentaires." : "It can move pages, databases and comments to trash.")).toBeVisible();
    await expect(canvas.getByText(fr ? /^Fonctionne sur tous les forfaits Notion\. En plus, sur Business et Enterprise/ : /^Works on every Notion plan\. On top, on Business and Enterprise/)).toBeVisible();
    await expect(canvas.getByText(fr ? /À vérifier : ouvrez la page dans Notion/ : /Check: open the page in Notion/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Cursor" }));
    await expect(canvas.getByRole("button", { name: fr ? "Copier la configuration" : "Copy the configuration" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: fr ? "Autre outil" : "Another tool" }));
    await expect(canvas.getByRole("button", { name: fr ? "Copier l'adresse" : "Copy the address" })).toBeVisible();

    const menu = canvas.getByRole("button", { name: fr ? /copier pour votre assistant/i : /copy for your assistant/i });
    await userEvent.click(menu);
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("button", { name: fr ? /^Copier la fiche en Markdown/ : /^Copy the sheet as Markdown/ })).toBeVisible();
    await expect(canvas.getByRole("button", { name: fr ? /^Commande Claude Code/ : /^Claude Code command/ })).toBeVisible();
    // No empty icon on opening: every logo drawn has loaded, every other mark shows its pictogram.
    const list = canvasElement.querySelector<HTMLElement>("ul[id]")!;
    for (const image of list.querySelectorAll("img")) await expect(image.complete && image.naturalWidth > 0).toBe(true);
    for (const mark of list.querySelectorAll<HTMLElement>("[data-mark]")) await expect(mark.querySelector("img, svg")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    // The primary button follows the pointer (magnetic hover): let it go before the layout invariants run.
    await userEvent.unhover(menu);

    // The documented actions open on click (17/11: it once did not).
    const toggle = canvas.getByRole("button", { name: fr ? /les actions documentées/i : /the documented actions/i });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByRole("region", { name: fr ? "Commentaires et discussions" : "Comments and discussions" })).toBeVisible());
    await expect(canvas.getAllByRole("link", { name: fr ? /liste des outils/i : /list of tools/i })).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: fr ? /signaler une erreur/i : /report an error/i })).toHaveAttribute("href", REPORT);
  },
};
const openActions = async (canvas: Parameters<NonNullable<Story["play"]>>[0]["canvas"], fr: boolean) => {
  await userEvent.click(canvas.getByRole("button", { name: fr ? /les actions documentées/i : /the documented actions/i }));
};

/** The full action list: a risk filter with counts, then one row per action, its tag in an aligned column. */
export const NotionActions: Story = {
  ...server("notion", "Notion"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await openActions(canvas, fr);
    const filters = canvas.getByRole("group", { name: fr ? "Filtrer par risque" : "Filter by risk" });
    await waitFor(() => expect(filters).toBeVisible());
    // Every row carries a tag, reading included.
    const rows = () => [...canvasElement.querySelectorAll<HTMLElement>("li[data-kind]")];
    await waitFor(() => expect(rows().length).toBe(70));
    for (const row of rows()) await expect(row.querySelector("span[data-tone]")).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: fr ? /^Supprime/ : /^Deletes/ }));
    await waitFor(() => expect(rows().every((row) => row.dataset.kind === "delete")).toBe(true));
    await expect(rows().length).toBe(4);
  },
};
/** Reading only: every row says « Lit », and there is no filter to offer. */
export const GoogleAnalyticsReadOnly: Story = {
  ...server("googleAnalytics", "Google Analytics"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await openActions(canvas, fr);
    await expect(canvas.queryByRole("group", { name: fr ? "Filtrer par risque" : "Filter by risk" })).toBeNull();
    await waitFor(() => expect(canvasElement.querySelectorAll("li[data-kind=read]").length).toBe(9));
    await expect(canvas.getByText(fr ? /Votre assistant peut lire vos données Google Analytics, sans rien y modifier\./ : /Your assistant can read your Google Analytics data, without changing anything\./)).toBeVisible();
    await expect(canvas.queryByText(fr ? /À vérifier/ : /Check:/)).toBeNull();
  },
};
/** The vendor gives a directory link: « Ouvrir dans Claude »; paying comes first in control. */
export const StripePays: Story = {
  ...server("stripe", "Stripe"),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/stripe");
    await expect(canvas.getByText(fr ? /^Il peut envoyer ou convertir de l'argent/ : /^It can send or convert money/)).toBeVisible();
    await expect(canvas.getByText(fr ? /attendent votre accord dans le Dashboard Stripe/ : /wait for your approval in the Stripe Dashboard/)).toBeVisible();
  },
};
/** ChatGPT through the server address: where to paste it, from ChatGPT's own documentation. */
export const BufferChatGPT: Story = {
  ...server("buffer", "Buffer"),
  play: async ({ canvas, globals }) => {
    await userEvent.click(canvas.getByRole("button", { name: "ChatGPT" }));
    await expect(canvas.getByRole("button", { name: globals.lang === "en" ? "Copy the address" : "Copier l'adresse" })).toBeVisible();
    await expect(canvas.getByText(/Add custom MCP server/)).toBeVisible();
  },
};
/** Nothing readable from the chosen assistant: the card says so and sends to the vendor's documentation. */
export const MiroNoEntryForGemini: Story = {
  ...server("miro", "Miro"),
  play: async ({ canvas, globals }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Gemini" }));
    await expect(canvas.getByText(globals.lang === "en" ? /Gemini does not document where to paste it/ : /Gemini ne documente pas où la coller/)).toBeVisible();
  },
};
/** No tool list published: the action fold says so instead of showing an empty list; no write request to try. */
export const AhrefsNoToolList = server("ahrefs", "Ahrefs");
/** Installed on the computer: the prerequisite comes first. */
export const FigmaDesktop: Story = {
  ...server("figmaDesktop", "Figma"),
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByText(globals.lang === "en" ? /You need a Figma plan that includes it/ : /Il faut un forfait Figma qui l'inclut/)).toBeVisible();
  },
};
export const SkillFigmaUse: Story = {
  render: (_args, context) => <SkillSheetView skill={skillStates.figmaUse} lang={context.globals.lang} reportHref={REPORT} />,
  play: async ({ canvasElement }) => { await expect(chapters(canvasElement)).toEqual(["change", "plug", "further", "sources"]); },
};
export const SkillNothingToInstall: Story = { render: (_args, context) => <SkillSheetView skill={skillStates.notionSkills} lang={context.globals.lang} reportHref={REPORT} /> };
