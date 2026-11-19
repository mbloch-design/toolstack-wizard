import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import Logo from "../Logo/Logo";
import { CONSEQUENCE, say } from "@/lib/agents";
import { CatalogSection } from "../Catalog/Catalog";
import MediaCard, { MediaCards } from "../MediaCard/MediaCard";
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

/** A consequence's head row in the actions table (« Supprime des données · 4 »), its label and count in separate spans. */
const sectionHead = (root: HTMLElement, text: string) => [...root.querySelectorAll<HTMLElement>("th[scope=rowgroup]")].find((head) => norm(head.textContent!).includes(norm(text)))!;
const norm = (text: string) => text.replace(/\s+/g, " ").replace(/ ?· ?/g, " · ");
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
    // Content contract (19/11): the verdict leads, the situations, a freelancer's advice, then « Brancher » before the technique.
    await expect(chapters(canvasElement)).toEqual(["head", "ask", "advice", "plug", "control", "view", "annex"]);
    await expect(canvasElement.querySelector("[data-chapter=head] [data-verdict]")).not.toBeNull();
    await expect(canvasElement.querySelectorAll("[data-chapter=ask] [data-situation]").length).toBeGreaterThanOrEqual(2);
    const advice = canvasElement.querySelector<HTMLElement>("[data-chapter=advice]")!;
    await expect(advice.querySelectorAll("[data-column=tips] h3 ~ div > *").length).toBeGreaterThanOrEqual(3);
    // Every pitfall says its way around; the advice says where it comes from.
    const pitfalls = advice.querySelectorAll("[data-column=pitfalls] h3 ~ div > *");
    await expect(pitfalls.length).toBeGreaterThanOrEqual(2);
    for (const pitfall of pitfalls) await expect(pitfall.textContent).toMatch(fr ? /La parade/ : /The way around/);
    await expect(canvasElement.querySelector("[data-chapter=annex]")!.textContent).toMatch(fr ? /Nos conseils viennent de/ : /Our advice comes from/);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(fr ? "Brancher Notion à votre assistant" : "Plug Notion into your assistant");
    // A fact has one place: the date, « official ». The plan is summed up in the hook and detailed once, on purpose.
    await expect(times(canvasElement, fr ? /16\s+novembre\s+2026/ : /16\s+November\s+2026/)).toBe(1);
    await expect(times(canvasElement, fr ? /Officiel/ : /Official/)).toBe(1);
    await expect(canvas.queryByText(fr ? "Fiche technique" : "Technical sheet")).toBeNull();
    // One action in the head: no « Voir les étapes » (17/11).
    await expect(canvas.queryByRole("link", { name: fr ? /voir les étapes/i : /see the steps/i })).toBeNull();
    // Every action that deletes, pays or sends is in view without a click.
    for (const row of canvasElement.querySelectorAll<HTMLElement>("tr[data-kind=delete]:not(tbody[hidden] tr), tr[data-kind=pay]:not(tbody[hidden] tr), tr[data-kind=send]:not(tbody[hidden] tr)")) await expect(row).toBeVisible();
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/notion");
    // One fact in one place: a short section shows its list, not a sentence that repeats it; a long one sums up what is folded.
    await expect(canvas.queryByText(fr ? "Mettre à la corbeille des pages, des bases et des commentaires." : "Move pages, databases and comments to trash.")).toBeNull();
    // No sentence listing what is folded (step 8c): the fold is the table's last row and counts the hidden rows only.
    await expect(canvas.queryByText(fr ? /^Et aussi\s:/ : /^And also:/)).toBeNull();
    await expect(canvas.getByRole("button", { name: fr ? /^Voir les 20 autres actions/ : /^Show the 20 other actions/ }).closest("table")).not.toBeNull();
    await expect(canvas.getByText(fr ? /Sur Business et Enterprise/ : /On Business and Enterprise/)).toBeVisible();
    // Each situation says what it gains (19/11), in place of the first requests and their check.
    // A situation card reads in one order: its title (h3), then what you gain, then the request; no step number.
    for (const card of canvasElement.querySelectorAll("[data-situation]")) {
      await expect(card.firstElementChild!.tagName).toBe("H3");
      await expect(card.querySelector("[class*='stepNumber']")).toBeNull();
    }
    // Tabs (step 8c): the assistants, then « Outil de code ▾ » and its menu.
    await expect(canvas.getByRole("tab", { name: /Claude/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(canvas.getByRole("tab", { name: fr ? /Outil de code/ : /Coding tool/ }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Cursor" }));
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    // A direct link is the step's main action; the copy goes just under it.
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Cursor" : "Open in Cursor" })).toHaveAttribute("href", expect.stringMatching(/^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install/));
    await expect(canvas.getByRole("button", { name: fr ? "ou copier la configuration" : "or copy the configuration" })).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: /Cursor/ }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: fr ? "Adresse du serveur (autre outil)" : "Server address (another tool)" }));
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    await expect(canvas.getByRole("button", { name: fr ? "Copier l'adresse" : "Copy the address" })).toBeVisible();

    const menu = canvas.getByRole("button", { name: fr ? /copier pour votre assistant/i : /copy for your assistant/i });
    await userEvent.click(menu);
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    // On a phone the menu is the system's sheet, outside the canvas: search the document.
    await expect(await screen.findByRole("button", { name: fr ? /^Copier la fiche en Markdown/ : /^Copy the sheet as Markdown/ })).toBeVisible();
    await expect(screen.getByRole("button", { name: fr ? /^Commande Claude Code/ : /^Claude Code command/ })).toBeVisible();
    const list = screen.getByRole("button", { name: fr ? /^Copier la fiche en Markdown/ : /^Copy the sheet as Markdown/ }).closest("ul")!;
    // No empty icon on opening: every logo drawn has loaded, every other mark shows its pictogram.
    // (A drawn logo may still be decoding under a loaded run: wait for it, never accept one that fails.)
    await waitFor(() => { for (const image of list.querySelectorAll("img")) expect(image.complete && image.naturalWidth > 0).toBe(true); });
    for (const mark of list.querySelectorAll<HTMLElement>("[data-mark]")) await expect(mark.querySelector("img, svg")).not.toBeNull();
    // The menu stays inside the content area, never under the sidebar or off screen.
    if (list.dataset.menu !== undefined) {
      const box = list.getBoundingClientRect(), area = canvasElement.querySelector<HTMLElement>("[data-agent-sheet]")!.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(area.left - 1);
      await expect(box.right).toBeLessThanOrEqual(area.right + 1);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(menu).toHaveAttribute("aria-expanded", "false"));
    // The phone sheet (a modal) frees the page's pointer once it has closed.
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
    // The primary button follows the pointer (magnetic hover): let it go before the layout invariants run.
    await userEvent.unhover(menu);

    // Editing past six and reading fold out in place.
    await expect(canvas.getByRole("button", { name: fr ? /^Voir les 20 autres actions/ : /^Show the 20 other actions/ })).toBeVisible();
    await expect(canvas.getByRole("button", { name: fr ? /^Voir les 32 autres actions/ : /^Show the 32 other actions/ })).toBeVisible();
    await expect(canvas.getAllByRole("link", { name: fr ? /liste des outils/i : /list of tools/i })).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: fr ? /signaler une erreur/i : /report an error/i })).toHaveAttribute("href", REPORT);
  },
};
/** The actions inside « Garder la main », gravest first: deleting and sending in view, editing past 6 and reading folded. */
export const NotionActions: Story = {
  ...server("notion", "Notion"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    const control = canvasElement.querySelector<HTMLElement>("[data-chapter=control]")!;
    await expect(control.querySelectorAll("tr[data-kind]").length).toBe(70);
    await expect(sectionHead(canvasElement, fr ? "Supprime des données · 4" : "Deletes data · 4")).toBeVisible();
    await expect(sectionHead(canvasElement, fr ? "Envoie en votre nom · 2" : "Sends in your name · 2")).toBeVisible();
    await expect(sectionHead(canvasElement, fr ? "Modifie vos données · 26" : "Edits your data · 26")).toBeVisible();
    await expect(sectionHead(canvasElement, fr ? "Lecture seule · 38" : "Read only · 38")).toBeVisible();
    await expect(control.querySelectorAll("tr[data-kind=write]:not(tbody[hidden] tr)").length).toBe(6);
    await userEvent.click(canvas.getByRole("button", { name: fr ? /^Voir les 20 autres actions/ : /^Show the 20 other actions/ }));
    await waitFor(() => expect(control.querySelectorAll("tr[data-kind=write]:not(tbody[hidden] tr)").length).toBe(26));
    // Opened in place: the foot now folds it back, the topics head their rows (more than 12 rows).
    await expect(canvas.getAllByRole("button", { name: fr ? /^Réduire/ : /^Show less/ })[0]).toHaveAttribute("aria-expanded", "true");
    await expect(control.querySelectorAll("th[scope=rowgroup]").length).toBeGreaterThan(0);
    await userEvent.click(canvas.getAllByRole("button", { name: fr ? /^Réduire/ : /^Show less/ })[0]);
    await expect(control.querySelectorAll("tr[data-kind=write]:not(tbody[hidden] tr)").length).toBe(6);
    await expect(canvasElement.querySelector("[data-chapter=annex] tr[data-kind]")).toBeNull();
  },
};
/** A payment: « Engage un paiement » with its actions in view, its icon in the alert colour. */
export const StripeActions: Story = {
  ...server("stripe", "Stripe"),
  play: async ({ canvas, canvasElement, globals }) => {
    await expect(sectionHead(canvasElement, globals.lang === "en" ? "Makes a payment · 3" : "Engage un paiement · 3")).toBeVisible();
    for (const row of canvasElement.querySelectorAll<HTMLElement>("tr[data-kind=pay]:not(tbody[hidden] tr)")) await expect(row).toBeVisible();
  },
};
/** Reading only: « Lecture seule · 9 », « Sans effet sur vos données », the actions folded. */
export const GoogleAnalyticsReadOnly: Story = {
  ...server("googleAnalytics", "Google Analytics"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    // « Sans effet sur vos données » sits in the section's head, at the label's right (step 8d).
    await expect(sectionHead(canvasElement, fr ? "Lecture seule · 9" : "Read only · 9").textContent).toContain(fr ? "Sans effet sur vos données" : "No effect on your data");
    await expect(canvas.getByRole("button", { name: fr ? /^Voir les 3 autres actions/ : /^Show the 3 other actions/ })).toBeVisible();
    await expect(canvas.getByText(fr ? /Votre assistant peut lire vos données Google Analytics, sans rien y modifier\./ : /Your assistant can read your Google Analytics data, without changing anything\./)).toBeVisible();
    await expect(canvas.queryByText(fr ? /À vérifier/ : /Check:/)).toBeNull();
  },
};
/** The vendor gives a directory link: « Ouvrir dans Claude »; paying comes first in control. */
export const StripePays: Story = {
  ...server("stripe", "Stripe"),
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByRole("link", { name: fr ? "Ouvrir dans Claude" : "Open in Claude" })).toHaveAttribute("href", "https://claude.ai/directory/stripe");
    for (const row of canvasElement.querySelectorAll<HTMLElement>("[data-chapter=control] tr[data-kind=pay]:not(tbody[hidden] tr)")) await expect(row).toBeVisible();
    await expect(canvas.getByText(fr ? /attendent votre accord dans le Dashboard Stripe/ : /wait for your approval in the Stripe Dashboard/)).toBeVisible();
  },
};
/** ChatGPT through the server address: where to paste it, from ChatGPT's own documentation. */
export const BufferChatGPT: Story = {
  ...server("buffer", "Buffer"),
  play: async ({ canvas, globals }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /ChatGPT/ }));
    await expect(canvas.getByRole("button", { name: globals.lang === "en" ? "Copy the address" : "Copier l'adresse" })).toBeVisible();
    await expect(canvas.getByText(/Add custom MCP server/)).toBeVisible();
  },
};
/** Nothing readable from the chosen assistant: the card says so and sends to the vendor's documentation. */
export const MiroNoEntryForGemini: Story = {
  ...server("miro", "Miro"),
  play: async ({ canvas, globals }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /Gemini/ }));
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
/** A skill through a coding tool: « pour développeurs » in the title and the hook; the step 1 bis chapters. */
export const SkillFigmaUse: Story = {
  render: (_args, context) => <SkillSheetView skill={skillStates.figmaUse} lang={context.globals.lang} reportHref={REPORT}
    logo={<Logo tool={{ name: "Figma", slug: "figma" }} size={40} localOnly />} />,
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(chapters(canvasElement)).toEqual(["head", "teach", "plug", "annex"]);
    await expect(canvas.getByRole("heading", { level: 1, name: fr ? /, pour développeurs$/ : /, for developers$/ })).toBeVisible();
    await expect(canvas.getByText(fr ? /^Pour développeurs\s:/ : /^For developers:/)).toBeVisible();
  },
};
/** A skill that ships with the server (Notion Skills): nothing to install, no « pour développeurs ». */
export const SkillNothingToInstall: Story = {
  render: (_args, context) => <SkillSheetView skill={skillStates.notionSkills} lang={context.globals.lang} reportHref={REPORT} />,
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.queryByText(fr ? /pour développeurs/i : /for developers/i)).toBeNull();
    await expect(canvas.getByText(fr ? /^Rien à installer/ : /^Nothing to install/)).toBeVisible();
  },
};

/** The whole Notion sheet as Michael reviews it (step 1 bis), at 1440 and 375: six chapters on alternating bands. */
export const FicheComplete: Story = {
  render: (_args, { globals }) => {
    const lang = globals.lang;
    const alt = sheetStates.buffer;
    return <McpSheetView sheet={sheetStates.notion} toolName="Notion" lang={lang}
      title={lang === "en" ? "Plug Notion into your assistant" : "Brancher Notion à votre assistant"}
      logo={<Logo tool={{ name: "Notion", slug: "notion" }} size={40} localOnly />}
      pageUrl="https://tooltrim.com/fr/mcp/notion-mcp" reportHref={REPORT}
      related={<CatalogSection as="h3" id="story-further" title={lang === "en" ? "Going further" : "Pour aller plus loin"}>
        <MediaCards size="s" label={lang === "en" ? "Going further" : "Pour aller plus loin"}>
          <MediaCard size="s" lang={lang} localLogosOnly tool={{ name: "Notion", slug: "notion" }} category={lang === "en" ? "The tool's page" : "La fiche de l'outil"}
            reason={lang === "en" ? "Notes, docs, wikis and databases." : "Notes, docs, wikis et bases de données."}
            add={{ state: "idle", onAdd: () => {} }} renderLink={(className, content) => <a className={className} href="/fr/tool/notion">{content}</a>} />
          <MediaCard size="s" lang={lang} localLogosOnly tool={{ name: "Buffer", slug: "buffer" }} category={lang === "en" ? "Plugs in too" : "Se branche aussi"}
            reason={alt.card ? say(lang, alt.card) : undefined} renderLink={(className, content) => <a className={className} href="/fr/mcp/buffer-mcp">{content}</a>} />
          <MediaCard size="s" lang={lang} localLogosOnly tool={{ name: "Notion Skills", slug: "notion" }} category={lang === "en" ? "Know-how" : "Savoir-faire"}
            renderLink={(className, content) => <a className={className} href="/fr/skills/notion-skills">{content}</a>} />
        </MediaCards>
      </CatalogSection>} />;
  },
  play: async ({ canvasElement }) => {
    // Content contract: six chapters on the white sheet, then the annexes as footnotes.
    await expect(chapters(canvasElement)).toEqual(["head", "ask", "advice", "plug", "control", "view", "annex"]);
    const tones = [...canvasElement.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) => el.dataset.tone);
    await expect(tones).toEqual(["white", "white", "white", "white", "white", "white", "notes"]);
    // One vocabulary of consequence: no « Lit / Modifie / Supprime / Envoie / Paie » tag left anywhere.
    const words = new Set(Object.values(CONSEQUENCE).flatMap((pair) => [...pair]));
    for (const tag of canvasElement.querySelectorAll("span[data-tone]")) await expect(words.has((tag.textContent ?? "").trim())).toBe(true);
    // No orphan card: the row under our view holds three of the catalogue's media cards (step 8b), the tool with its add button.
    await expect(canvasElement.querySelectorAll("[data-chapter=view] [data-discovery-tool], [data-chapter=view] ul > li").length).toBe(3);
    await expect(canvasElement.querySelectorAll("[data-chapter=view] [data-media-add]").length).toBe(1);
  },
};

/** The step holds its action: « Copier l'adresse » in step 1 copies the value, and « Copié » shows. */
export const CopierDepuisLEtape: Story = {
  ...server("notion", "Notion"),
  beforeEach: () => {
    try { window.localStorage.removeItem("tooltrim.agents.client"); } catch { /* none */ }
    const writeText = fn(async (_value: string) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    (globalThis as { __writeText?: typeof writeText }).__writeText = writeText;
  },
  play: async ({ canvas, globals }) => {
    const fr = globals.lang !== "en";
    await userEvent.click(canvas.getByRole("tab", { name: fr ? /Outil de code/ : /Coding tool/ }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: fr ? "Adresse du serveur (autre outil)" : "Server address (another tool)" }));
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: fr ? "Copier l'adresse" : "Copy the address" }));
    const writeText = (globalThis as { __writeText?: ReturnType<typeof fn> }).__writeText!;
    await expect(writeText).toHaveBeenCalledWith("https://mcp.notion.com/mcp");
    await waitFor(() => expect(canvas.getByRole("button", { name: fr ? "Copié" : "Copied" })).toBeVisible());
    // The request in « Vérifiez » has its own copy button.
    await expect(canvas.getAllByRole("button", { name: fr ? "Copier la demande" : "Copy the request" }).length).toBeGreaterThan(0);
    // The address under the steps and every action identifier copy themselves; the French label does not.
    await expect(canvas.getByRole("button", { name: fr ? "Copier https://mcp.notion.com/mcp" : "Copy https://mcp.notion.com/mcp" })).toBeVisible();
    const id = canvas.getByRole("button", { name: fr ? "Copier notion-delete-pages" : "Copy notion-delete-pages" });
    await userEvent.click(id);
    await expect(writeText).toHaveBeenLastCalledWith("notion-delete-pages");
    await waitFor(() => expect(id).toHaveAttribute("data-copied"));
  },
};
