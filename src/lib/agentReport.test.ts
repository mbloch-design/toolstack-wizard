import { describe, expect, it } from "vitest";
import { GRAVITY, SERVERS, STATUS_ORDER, featuredServers, hasVerdict, stackHeadline, fromStoredClient, isPlugged, reportRows, reportVerdict as verdictNbsp, toStoredClient, toolStatus, type HubAssistant } from "./agentReport";

/** The sentence with plain spaces: the non-breaking ones are typography, checked apart. */
const reportVerdict = (...args: Parameters<typeof verdictNbsp>) => verdictNbsp(...args).replace(/\u00a0/g, " ");

const STACK = ["notion", "stripe", "hotjar", "slack", "canva", "google-analytics", "milanote", "trello", "figma"];
const ASSISTANTS: HubAssistant[] = ["claude", "chatgpt", "gemini", "copilot", "other"];

describe("the hub's report (step 4)", () => {
  it("says the stack in one sentence for Claude", () => {
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "fr")).toBe("4 de vos 9 outils se branchent à Claude, dont 3 en un clic ; nous n'avons pas encore regardé 1 autre outil. 1 peut engager un paiement.");
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "en")).toBe("4 of your 9 tools plug into Claude, 3 of them in one click; we have not looked at 1 other tool yet. 1 can make a payment.");
    // With the tools' names, the one not looked at yet is named (one or two of them).
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "fr", (slug) => (slug === "trello" ? "Trello" : slug))).toContain("nous n'avons pas encore regardé Trello.");
  });

  it("agrees with its rows, for every assistant: the counts in the sentence are the rows' counts", () => {
    for (const assistant of ASSISTANTS) {
      const rows = reportRows(STACK, assistant);
      const sentence = reportVerdict(rows, assistant, "fr");
      const plugged = rows.filter(isPlugged);
      if (plugged.length) expect(sentence).toMatch(new RegExp(`^${plugged.length} de vos ${rows.length} outils`));
      else expect(sentence).toMatch(/^Aucun de vos/);
      const oneClick = rows.filter((row) => row.status === "one_click").length;
      if (oneClick && oneClick < plugged.length) expect(sentence).toContain(`dont ${oneClick} en un clic`);
      const gravest = GRAVITY.find((kind) => plugged.some((row) => row.gravest === kind));
      if (gravest) expect(sentence).toMatch(new RegExp(`\\. ${plugged.filter((row) => row.gravest === gravest).length} peu`));
    }
  });

  it("classes no tool without data: unknown is « not checked », checked without server is « none »", () => {
    expect(toolStatus("trello", "claude").status).toBe("unchecked");
    expect(toolStatus("hotjar", "claude").status).toBe("none");
    expect(toolStatus("hotjar", "claude").card).toBeUndefined();
  });

  it("orders the rows: one click, to set up, elsewhere, none, not checked", () => {
    const order = reportRows(STACK, "claude").map((row) => STATUS_ORDER.indexOf(row.status));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("shares the server sheet's stored choice", () => {
    expect(fromStoredClient("chatgpt")).toBe("chatgpt");
    expect(fromStoredClient("cursor")).toBe("other");
    expect(fromStoredClient(null)).toBeNull();
    expect(toStoredClient("other")).toBe("any");
  });

  it("never leaves a figure alone at a line's end", () => {
    expect(verdictNbsp(reportRows(STACK, "claude"), "claude", "fr")).toContain("1\u00a0peut engager");
  });

  // Plain words (step 8d): never « vérifié » as a state; the tools not looked at yet are named, or counted past two.
  const NAMES: Record<string, string> = { notion: "Notion", trello: "Trello", asana: "Asana", "google-sheets": "Google Sheets", hotjar: "Hotjar" };
  const nameOf = (slug: string) => NAMES[slug] ?? slug;
  it("names the tools it has not looked at yet", () => {
    expect(reportVerdict(reportRows(["notion", "trello", "asana"], "claude"), "claude", "fr", nameOf)).toBe("1 de vos 3 outils se branche à Claude, en un clic ; nous n'avons pas encore regardé Trello et Asana. 1 peut supprimer des données.");
    expect(reportVerdict(reportRows(["google-sheets", "asana"], "claude"), "claude", "fr", nameOf)).toBe("Nous n'avons pas encore vérifié si Google Sheets et Asana se branchent à Claude.");
    expect(reportVerdict(reportRows(["google-sheets", "asana", "trello"], "claude"), "claude", "fr", nameOf)).toBe("Nous n'avons pas encore vérifié si vos 3 outils se branchent à Claude.");
    expect(hasVerdict(reportRows(["google-sheets", "asana"], "claude"))).toBe(false);
    expect(hasVerdict(reportRows(["notion", "asana"], "claude"))).toBe(true);
  });

  it("says when nothing plugs in", () => {
    expect(reportVerdict(reportRows(["hotjar", "trello"], "claude"), "claude", "fr", nameOf)).toBe("Aucun de vos 2 outils ne se branche encore à Claude ; nous n'avons pas encore regardé Trello.");
  });

  it("gives the hub's line without the details", () => {
    expect(stackHeadline(reportRows(["notion", "asana"], "claude"), "claude", "fr", nameOf).replace(/\u00a0/g, " ")).toBe("1 de vos 2 outils se branche à Claude ; nous n'avons pas encore regardé Asana");
  });
});

describe("recipes between two tools (step 6)", () => {
  it("offers only pairs whose two tools are in the stack and plugged into the assistant, three at most", async () => {
    const { recipesFor, isPlugged, toolStatus } = await import("./agentReport");
    for (const assistant of ASSISTANTS) {
      const recipes = recipesFor(STACK, assistant);
      expect(recipes.length).toBeLessThanOrEqual(3);
      for (const recipe of recipes) for (const side of recipe.sides) {
        expect(STACK).toContain(side.host_tool);
        expect(isPlugged(toolStatus(side.host_tool, assistant))).toBe(true);
      }
    }
    expect(recipesFor(STACK, "claude").map((recipe) => recipe.id)).toEqual(["figma-notion-handoff", "stripe-notion-monthly", "analytics-notion-figures"]);
    expect(recipesFor(["notion"], "claude")).toEqual([]);
  });
});

describe("the comparison line « Avec votre assistant » (step 7)", () => {
  it("says each side and the difference, in the consequence vocabulary", async () => {
    const { compareAssistant } = await import("./agentReport");
    const notion = { slug: "notion", name: "Notion" }, clickup = { slug: "clickup", name: "ClickUp" };
    expect(compareAssistant(notion, clickup, "claude", "fr")).toEqual({ a: "En un clic avec Claude · Supprime des données", b: "À configurer · Supprime des données", takeaway: "Seul Notion se branche en un clic à Claude." });
    expect(compareAssistant({ slug: "make", name: "Make" }, { slug: "zapier", name: "Zapier" }, "claude", "fr")?.takeaway).toBe("Zapier peut aussi supprimer des données.");
    expect(compareAssistant({ slug: "hotjar", name: "Hotjar" }, { slug: "google-analytics", name: "Google Analytics" }, "claude", "fr")?.takeaway).toBe("Seul Google Analytics se branche à Claude.");
  });

  it("gives no line when either tool has no data", async () => {
    const { compareAssistant } = await import("./agentReport");
    expect(compareAssistant({ slug: "notion", name: "Notion" }, { slug: "trello", name: "Trello" }, "claude", "fr")).toBeNull();
  });
});

// « À la une » (step 8d): a full row of four, one click first, then to set up, each by presence in the catalogue's stacks.
describe("featuredServers", () => {
  it("fills the row to four, one click before to set up", () => {
    for (const assistant of ["claude", "chatgpt", "gemini", "copilot"] as const) {
      const cards = featuredServers(assistant);
      const documented = new Set(SERVERS.filter((card) => card.one_click.includes(assistant) || card.setup?.some((way) => way.assistant === assistant)).map((card) => card.host_tool));
      expect(cards.length).toBe(Math.min(4, documented.size));
      const ranks = cards.map((card) => (card.one_click.includes(assistant) ? 0 : 1));
      expect([...ranks].sort()).toEqual(ranks);
    }
  });
  it("never shows a tool twice (Figma has two servers)", () => {
    const tools = featuredServers("other", 19).map((card) => card.host_tool);
    expect(new Set(tools).size).toBe(tools.length);
  });
});
