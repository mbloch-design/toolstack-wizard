import { describe, expect, it } from "vitest";
import { GRAVITY, STATUS_ORDER, fromStoredClient, isPlugged, reportRows, reportVerdict as verdictNbsp, toStoredClient, toolStatus, type HubAssistant } from "./agentReport";

/** The sentence with plain spaces: the non-breaking ones are typography, checked apart. */
const reportVerdict = (...args: Parameters<typeof verdictNbsp>) => verdictNbsp(...args).replace(/\u00a0/g, " ");

const STACK = ["notion", "stripe", "hotjar", "slack", "canva", "google-analytics", "milanote", "trello", "figma"];
const ASSISTANTS: HubAssistant[] = ["claude", "chatgpt", "gemini", "copilot", "other"];

describe("the hub's report (step 4)", () => {
  it("says the stack in one sentence for Claude", () => {
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "fr")).toBe("4 de vos 8 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement. 1 outil pas encore vérifié.");
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "en")).toBe("4 of your 8 tools plug into Claude, 3 of them in one click. 1 can make a payment. 1 tool not checked yet.");
  });

  it("agrees with its rows, for every assistant: the counts in the sentence are the rows' counts", () => {
    for (const assistant of ASSISTANTS) {
      const rows = reportRows(STACK, assistant);
      const sentence = reportVerdict(rows, assistant, "fr");
      const plugged = rows.filter(isPlugged);
      const checked = rows.filter((row) => row.status !== "unchecked").length;
      if (plugged.length) expect(sentence).toMatch(new RegExp(`^${plugged.length} de vos ${checked} outils`));
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

  it("never counts a tool not checked yet, and says how many are left aside", () => {
    expect(reportVerdict(reportRows(["notion", "trello", "asana"], "claude"), "claude", "fr")).toBe("Votre outil se branche à Claude, en un clic. 1 peut supprimer des données. 2 outils pas encore vérifiés.");
    expect(reportVerdict(reportRows(["trello"], "claude"), "claude", "fr")).toBe("Aucun de vos outils n'est encore vérifié.");
  });

  it("says when nothing plugs in", () => {
    expect(reportVerdict(reportRows(["hotjar", "trello"], "claude"), "claude", "fr")).toBe("Votre outil ne se branche pas encore à Claude. 1 outil pas encore vérifié.");
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
