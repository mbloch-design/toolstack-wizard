import { describe, expect, it } from "vitest";
import catalog from "@/data/agents/catalog.json";
import type { McpSheet } from "@/lib/agents";
import { clientsOf, cursorInstallLink, plugCard, vsCodeInstallLink } from "@/lib/agentClients";
import { hookSentence, sheetMarkdown, sourceLinks, toolTopics, toolsSummary } from "@/lib/agentSheet";

const servers = catalog.servers as McpSheet[];
const notion = servers.find((s) => s.slug === "notion-mcp")!;

describe("plugging card (S1 bis)", () => {
  it("gives every client of every sheet one card of 1 to 4 steps", () => {
    for (const sheet of servers) for (const client of clientsOf(sheet)) for (const lang of ["fr", "en"] as const) {
      const steps = plugCard(sheet, client, sheet.publisher, lang);
      expect(steps.length, `${sheet.slug} ${client}`).toBeGreaterThan(0);
      expect(steps.length, `${sheet.slug} ${client}`).toBeLessThanOrEqual(4);
    }
  });

  it("opens a vendor directory link, names what it copies, and never guesses a paste location", () => {
    const stripe = servers.find((s) => s.slug === "stripe-mcp")!;
    expect(plugCard(stripe, "claude", "Stripe", "fr").find((s) => s.action)?.action).toMatchObject({ kind: "open", label: "Ouvrir dans Claude" });
    const cursor = plugCard(notion, "cursor", "Notion", "fr");
    // Cursor documents a direct install link: it is the step's action, the copy goes under it.
    expect(cursor.find((s) => s.action)?.action).toMatchObject({ kind: "open", label: "Ouvrir dans Cursor" });
    expect(cursor.find((s) => s.secondary)?.secondary).toMatchObject({ kind: "copy", label: "Copier la configuration", type: "config" });
    // Where to paste comes from Cursor's own documentation.
    expect(cursor.map((s) => s.text).join(" ")).toContain("~/.cursor/mcp.json");
    // Gemini documents nothing we could read: the step says so and sends to the vendor's documentation.
    const miro = servers.find((s) => s.slug === "miro-mcp")!;
    expect(plugCard(miro, "gemini", "Miro", "fr").map((s) => s.text).join(" ")).toContain("Gemini ne documente pas où la coller");
    expect(plugCard(notion, "claude", "Notion", "fr").at(-1)?.prompt?.fr).toContain("Résume mes notes de réunion");
    // Claude's directory page, read on 17/11/2026, is the one-click way in.
    expect(plugCard(notion, "claude", "Notion", "fr")[0].action).toMatchObject({ kind: "open", href: "https://claude.ai/directory/notion" });
  });

  it("builds VS Code's documented install link from the server address", () => {
    const link = vsCodeInstallLink(notion)!;
    expect(link.startsWith("vscode:mcp/install?")).toBe(true);
    expect(JSON.parse(decodeURIComponent(link.slice("vscode:mcp/install?".length)))).toEqual({ name: "notion", type: "http", url: "https://mcp.notion.com/mcp" });
    expect(vsCodeInstallLink(servers.find((s) => s.slug === "figma-mcp-desktop")!)).toBeNull();
    const cursor = new URL(cursorInstallLink(notion)!.replace("cursor://", "https://"));
    expect(cursor.pathname).toBe("/mcp/install");
    expect(JSON.parse(atob(cursor.searchParams.get("config")!))).toEqual({ url: "https://mcp.notion.com/mcp" });
  });
});

describe("technical sheet and sources", () => {
  it("files Notion's skill upload under skills and its folder edit under pages", () => {
    const topicOf = (name: string) => toolTopics(notion.tools!).find((topic) => topic.tools.some((tool) => tool.name === name))!.id;
    expect(topicOf("notion-upload-skill")).toBe("skills");
    expect(topicOf("notion-update-folder")).toBe("pages");
  });

  it("files every tool under one topic and says the riskiest count", () => {
    for (const sheet of servers) {
      const tools = sheet.tools ?? [];
      expect(toolTopics(tools).reduce((n, topic) => n + topic.tools.length, 0)).toBe(tools.length);
    }
    expect(toolsSummary(notion.tools!, "fr")).toBe("70 actions\u00a0: 4 suppriment des données, 2 envoient en votre nom, 26 modifient, 38 en lecture seule");
  });

  it("merges near-duplicate sources and labels them shortly", () => {
    const links = sourceLinks(notion.sources, "fr");
    expect(links.map((l) => l.label)).toEqual(["Présentation", "Connexion et forfaits", "Liste des outils", "Répertoire Claude"]);
    expect(links[0].domain).toBe("developers.notion.com");
  });

  it("writes the whole sheet as Markdown with its address", () => {
    const md = sheetMarkdown(notion, { toolName: "Notion", url: "https://tooltrim.com/fr/mcp/notion-mcp", lang: "fr" });
    expect(md).toContain("# Brancher Notion à votre assistant IA");
    expect(md).toContain("https://tooltrim.com/fr/mcp/notion-mcp");
    expect(md).toContain("## Sources");
  });
});

describe("the sheet's hook (step 1, 17/11)", () => {
  const sheet = (slug: string) => servers.find((s) => s.slug === slug)!;
  it("says what it can do, the plan and the easiest way in, from the data only", () => {
    // Every sentence has its subject and its verb, every verb its object (proofreading, 19/11).
    expect(hookSentence(notion, "Notion", "fr")).toBe("Dans Notion, votre assistant peut lire, modifier et supprimer vos données. Côté forfait : fonctionne sur tous les forfaits Notion. Le branchement se fait en un clic depuis Claude, ChatGPT ou Gemini.");
    expect(hookSentence(sheet("google-analytics-mcp"), "Google Analytics", "fr")).toMatch(/^Dans Google Analytics, votre assistant peut lire vos données, sans rien y modifier\..* Le serveur tourne sur votre ordinateur\.$/);
    expect(hookSentence(sheet("stripe-mcp"), "Stripe", "fr")).toBe("Dans Stripe, votre assistant peut lire et modifier vos données et engager des paiements. Le branchement se fait en un clic depuis Claude ou ChatGPT.");
  });
});
