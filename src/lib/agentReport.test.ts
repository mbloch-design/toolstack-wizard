import { describe, expect, it } from "vitest";
import { GRAVITY, STATUS_ORDER, fromStoredClient, isPlugged, reportRows, reportVerdict as verdictNbsp, toStoredClient, toolStatus, type HubAssistant } from "./agentReport";

/** The sentence with plain spaces: the non-breaking ones are typography, checked apart. */
const reportVerdict = (...args: Parameters<typeof verdictNbsp>) => verdictNbsp(...args).replace(/\u00a0/g, " ");

const STACK = ["notion", "stripe", "hotjar", "slack", "canva", "google-analytics", "milanote", "trello", "figma"];
const ASSISTANTS: HubAssistant[] = ["claude", "chatgpt", "gemini", "copilot", "other"];

describe("the hub's report (step 4)", () => {
  it("says the stack in one sentence for Claude", () => {
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "fr")).toBe("4 de vos 9 outils se branchent à Claude, dont 3 en un clic. 1 peut engager un paiement.");
    expect(reportVerdict(reportRows(STACK, "claude"), "claude", "en")).toBe("4 of your 9 tools plug into Claude, 3 of them in one click. 1 can make a payment.");
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

  it("says when nothing plugs in", () => {
    expect(reportVerdict(reportRows(["hotjar", "trello"], "claude"), "claude", "fr")).toBe("Aucun de vos 2 outils ne se branche encore à Claude.");
  });
});
