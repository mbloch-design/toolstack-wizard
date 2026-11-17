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
    logo={<Logo tool={{ name: toolName, slug: sheetStates[name].host_tool }} size={48} localOnly />}
    pageUrl={`https://tooltrim.com/fr/mcp/${sheetStates[name].slug}`} reportHref={REPORT} />,
});
const chapters = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) => el.dataset.chapter);

/** The story in order; plugging for Claude, then Cursor; the copy menu; the technical sheet by topic; the sources. */
export const Notion: Story = {
  ...server("notion", "Notion"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    // Content contract: our view and the plugging precede the technique.
    await expect(chapters(canvasElement)).toEqual(["change", "view", "plug", "control", "tech", "further", "sources"]);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(fr ? "Brancher Notion à votre assistant" : "Plug Notion into your assistant");
    await expect(canvas.getByRole("heading", { name: fr ? "Brancher Notion" : "Plug in Notion" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/notion");
    // The technical sheet is always in view; only the action list folds.
    await expect(canvas.getByText(fr ? "Adresse du serveur" : "Server address")).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? /^Ajouté en novembre\s2025$/ : /^Added in November\s2025$/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Cursor" }));
    await expect(canvas.getByRole("button", { name: fr ? "Copier la configuration" : "Copy the configuration" })).toBeVisible();
    await expect(canvas.getAllByRole("listitem").filter((li) => li.closest("ol")).length).toBeLessThanOrEqual(4);

    const menu = canvas.getByRole("button", { name: fr ? /copier pour votre assistant/i : /copy for your assistant/i });
    await userEvent.click(menu);
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("button", { name: fr ? /^Copier la fiche en Markdown/ : /^Copy the sheet as Markdown/ })).toBeVisible();
    await expect(canvas.getByRole("button", { name: fr ? /^Commande Claude Code/ : /^Claude Code command/ })).toBeVisible();
    // No empty icon on opening: every logo drawn has loaded, every other mark shows its pictogram.
    const list = canvasElement.querySelector<HTMLElement>("ul[id]")!;
    for (const image of list.querySelectorAll("img")) await expect(image.complete && image.naturalWidth > 0).toBe(true);
    for (const mark of list.querySelectorAll<HTMLElement>("[data-mark]")) await expect(mark.querySelector("img, svg")).not.toBeNull();
    await expect(canvas.getByRole("link", { name: fr ? /brancher à vs code/i : /plug into vs code/i })).toHaveAttribute("href", expect.stringMatching(/^vscode:mcp\/install\?/));
    await userEvent.keyboard("{Escape}");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    // The primary button follows the pointer (magnetic hover): let it go before the layout invariants run.
    await userEvent.unhover(menu);

    // The technical sheet opens on click (17/11: it once did not).
    const toggle = canvas.getByRole("button", { name: fr ? /les actions documentées/i : /the documented actions/i });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(fr ? /70 actions, dont 4 qui suppriment/ : /70 actions, 4 of which delete/)).toBeVisible();
    await waitFor(() => expect(canvas.getByRole("region", { name: fr ? "Commentaires et discussions" : "Comments and discussions" })).toBeVisible());
    await expect(canvas.getAllByRole("link", { name: fr ? /liste des outils/i : /list of tools/i })).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: fr ? /signaler une erreur/i : /report an error/i })).toHaveAttribute("href", REPORT);
  },
};
/** The vendor gives a directory link: « Ouvrir dans Claude »; paying comes first in control. */
export const StripePays: Story = {
  ...server("stripe", "Stripe"),
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/stripe");
    await expect(canvas.getByText(fr ? /Peut déplacer de l'argent, après votre confirmation/ : /Can move money, after your confirmation/)).toBeVisible();
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
/** No tool list published: the technical sheet says so instead of showing an empty list. */
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
