/*
 * Where you use AI, and how a server gets there (S1 bis, 17/11/2026). One table per client, written once and
 * sourced on the client's own documentation (read on 17/11/2026); the server sheets only give their install rows.
 * A client whose documentation could not be read says nothing it cannot back: the step sends to the vendor's page.
 *
 * Read on 17/11/2026:
 *   Claude (custom connector)  https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp
 *   Claude Code                https://code.claude.com/docs/en/mcp
 *   VS Code                    https://code.visualstudio.com/docs/copilot/chat/mcp-servers, https://code.visualstudio.com/api/extension-guides/ai/mcp
 *   Codex                      https://learn.chatgpt.com/docs/extend/mcp?surface=cli
 *   Cursor                     https://cursor.com/docs/context/mcp, https://cursor.com/docs/context/mcp/install-links
 *   ChatGPT (custom server)    https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
 * Not readable that day: Gemini's help on adding a server, so nothing is said about it. No prefilled-question link
 * is documented by ChatGPT or Claude: the sheet does not offer « open in ChatGPT / Claude with a question ».
 */
import { isCopyRow, typo, type InstallRow, type Lang, type McpSheet, type Pair } from "@/lib/agents";

export type ClientId = "claude" | "chatgpt" | "gemini" | "copilot" | "claude-code" | "cursor" | "vs-code" | "codex" | "any";
export type ClientGroup = "assistant" | "dev" | "other";

interface ClientEntry {
  name: Pair;
  group: ClientGroup;
  /** Where a copied block goes, by type; absent when the client's documentation was not read. */
  paste?: Partial<Record<InstallRow["type"], Pair>>;
  /** The client's page that backs `paste`. */
  source?: string;
}

const P = (fr: string, en: string): Pair => ({ fr, en });

export const CLIENTS: Record<ClientId, ClientEntry> = {
  claude: {
    name: P("Claude", "Claude"), group: "assistant",
    paste: { url: P("Dans Claude, ouvrez Personnaliser > Connecteurs, cliquez sur « + Ajouter » puis « Ajouter un connecteur personnalisé », et collez l'adresse telle quelle.", "In Claude, open Customize > Connectors, click “+ Add” then “Add custom connector”, and paste the address as is.") },
    source: "https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp",
  },
  chatgpt: {
    name: P("ChatGPT", "ChatGPT"), group: "assistant",
    paste: { url: P("Sur chatgpt.com/plugins, cliquez sur « + » puis « Add custom MCP server », collez l'adresse sous « Connection », puis choisissez « Create as a plugin ».", "On chatgpt.com/plugins, click \u201c+\u201d then \u201cAdd custom MCP server\u201d, paste the address under \u201cConnection\u201d, then choose \u201cCreate as a plugin\u201d.") },
    source: "https://developers.openai.com/apps-sdk/deploy/connect-chatgpt",
  },
  gemini: { name: P("Gemini", "Gemini"), group: "assistant" },
  copilot: { name: P("Copilot", "Copilot"), group: "assistant" },
  "claude-code": {
    name: P("Claude Code", "Claude Code"), group: "dev",
    paste: { command: P("Collez-la dans votre terminal et validez : Claude Code enregistre le serveur.", "Paste it in your terminal and run it: Claude Code registers the server.") },
    source: "https://code.claude.com/docs/en/mcp",
  },
  cursor: {
    name: P("Cursor", "Cursor"), group: "dev",
    paste: {
      config: P("Collez-la dans le fichier ~/.cursor/mcp.json pour tous vos projets, ou .cursor/mcp.json pour un seul, sous la clé « mcpServers ».", "Paste it in the ~/.cursor/mcp.json file for all your projects, or .cursor/mcp.json for one, under the \u201cmcpServers\u201d key."),
      command: P("Collez-la dans votre terminal et validez.", "Paste it in your terminal and run it."),
    },
    source: "https://cursor.com/docs/context/mcp",
  },
  "vs-code": {
    name: P("VS Code", "VS Code"), group: "dev",
    paste: {
      config: P("Dans VS Code, lancez la commande « MCP: Open User Configuration » et collez la configuration dans le fichier qui s'ouvre.", "In VS Code, run the “MCP: Open User Configuration” command and paste the configuration in the file that opens."),
      command: P("Collez-la dans votre terminal et validez.", "Paste it in your terminal and run it."),
    },
    source: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  },
  codex: {
    name: P("Codex", "Codex"), group: "dev",
    paste: {
      command: P("Collez-la dans votre terminal et validez : Codex l'ajoute à sa configuration.", "Paste it in your terminal and run it: Codex adds it to its configuration."),
      config: P("Ajoutez-la au fichier ~/.codex/config.toml, puis relancez Codex.", "Add it to the ~/.codex/config.toml file, then restart Codex."),
    },
    source: "https://learn.chatgpt.com/docs/extend/mcp?surface=cli",
  },
  any: {
    name: P("Autre outil", "Another tool"), group: "other",
    paste: {
      url: P("Collez cette adresse là où votre outil ajoute un serveur MCP distant.", "Paste this address where your tool adds a remote MCP server."),
      config: P("Collez cette configuration dans le fichier MCP de votre outil.", "Paste this configuration in your tool's MCP file."),
      command: P("Collez-la dans votre terminal et validez.", "Paste it in your terminal and run it."),
    },
  },
};

/** The logo of each place, for the small marks (sheet facts, copy menu). */
export const CLIENT_MARKS: Partial<Record<ClientId, { name: string; slug: string; websiteUrl: string }>> = {
  claude: { name: "Claude", slug: "claude", websiteUrl: "https://claude.ai" },
  "claude-code": { name: "Claude", slug: "claude", websiteUrl: "https://claude.ai" },
  chatgpt: { name: "ChatGPT", slug: "chatgpt", websiteUrl: "https://chatgpt.com" },
  gemini: { name: "Gemini", slug: "gemini", websiteUrl: "https://gemini.google.com" },
  copilot: { name: "Copilot", slug: "copilot", websiteUrl: "https://copilot.microsoft.com" },
  cursor: { name: "Cursor", slug: "cursor", websiteUrl: "https://cursor.com" },
  "vs-code": { name: "VS Code", slug: "vs-code", websiteUrl: "https://code.visualstudio.com" },
  // Codex is OpenAI's: it takes OpenAI's mark, the one ChatGPT carries (a local file).
  codex: { name: "Codex", slug: "chatgpt", websiteUrl: "https://chatgpt.com" },
};

const ORDER: ClientId[] = ["claude", "chatgpt", "gemini", "copilot", "claude-code", "cursor", "vs-code", "codex", "any"];
const ASSISTANTS = new Set<ClientId>(["claude", "chatgpt", "gemini", "copilot"]);

/** The documented VS Code install link: vscode:mcp/install?{url-encoded JSON with name}. */
export function vsCodeInstallLink(sheet: Pick<McpSheet, "slug" | "transport" | "install">) {
  const address = sheet.install.find((row) => row.client === "any" && row.type === "url")?.value;
  if (sheet.transport !== "remote" || !address) return null;
  const name = sheet.slug.replace(/-mcp.*$/, "");
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, type: "http", url: address }))}`;
}

/** Cursor's documented install link: name, and the server entry as base64 JSON (install-links page, 17/11/2026). */
export function cursorInstallLink(sheet: Pick<McpSheet, "slug" | "transport" | "install">) {
  const address = sheet.install.find((row) => row.client === "any" && row.type === "url")?.value;
  if (sheet.transport !== "remote" || !address) return null;
  const config = typeof btoa === "function" ? btoa(JSON.stringify({ url: address })) : Buffer.from(JSON.stringify({ url: address })).toString("base64");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(sheet.slug.replace(/-mcp.*$/, ""))}&config=${encodeURIComponent(config)}`;
}

/** The clients a sheet can serve: install rows, a documented way in `setup`, or a link we can build. */
export function clientsOf(sheet: Pick<McpSheet, "slug" | "transport" | "install" | "setup">): ClientId[] {
  return ORDER.filter((client) => {
    if (sheet.install.some((row) => row.client === client)) return true;
    if (ASSISTANTS.has(client) && sheet.setup?.some((way) => way.assistant === client)) return true;
    if (client === "any") return Boolean(sheet.setup?.some((way) => way.assistant === "other"));
    if (client === "vs-code") return Boolean(vsCodeInstallLink(sheet));
    if (client === "cursor") return Boolean(cursorInstallLink(sheet));
    return false;
  });
}
export const clientGroup = (client: ClientId) => CLIENTS[client].group;
export const clientLabel = (client: ClientId, lang: Lang) => (lang === "en" ? CLIENTS[client].name.en : CLIENTS[client].name.fr);

/** One step of the card: words, and at most one action. */
export type CopyAction = { kind: "copy"; value: string; label: string; type: InstallRow["type"] };
export type PlugAction = { kind: "open"; href: string; label: string } | CopyAction;
/**
 * A step: its words, its own action (the step holds its action, 17/11), a secondary copy under a direct link
 * (« ou copier la configuration »), and a request to copy for the assistant (« Vérifiez en lui demandant : »).
 */
export interface PlugStep { text: string; action?: PlugAction; secondary?: CopyAction; prompt?: Pair }

const PRIMARY: InstallRow["type"][] = ["url", "command", "config", "steps"];
const isAddress = (value: string) => /^https:\/\/[^\s]+$/.test(value) && /mcp|sse/i.test(value);

/**
 * The card for one sheet and one client: a prerequisite, the action (open a link or copy a named block),
 * where to paste it (from the client table), then the sign-in and a request to check it works. Never more than 4.
 */
export function plugCard(sheet: McpSheet, client: ClientId, toolName: string, lang: Lang): PlugStep[] {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const who = clientLabel(client, lang);
  const rows = sheet.install.filter(isCopyRow).filter((row) => row.client === client);
  const row = PRIMARY.map((type) => rows.find((r) => r.type === type)).find(Boolean);
  const way = sheet.setup?.find((w) => w.assistant === (client === "any" ? "other" : client));
  const steps: PlugStep[] = [];

  // 1. A prerequisite, in one line.
  const anyValue = row?.value ?? "";
  if (sheet.plan === "paid") steps.push({ text: t(`Il faut un forfait payant ${toolName}.`, `You need a paid ${toolName} plan.`) });
  else if (sheet.plan === "specific") steps.push({ text: t(`Il faut un forfait ${toolName} qui l'inclut (détail plus bas).`, `You need a ${toolName} plan that includes it (details below).`) });
  else if (/\bnpx\b/.test(anyValue)) steps.push({ text: t("Node.js doit être installé sur votre ordinateur.", "Node.js must be installed on your computer.") });
  else if (sheet.transport === "local") steps.push({ text: t(`Il fonctionne sur votre ordinateur : gardez ${toolName} ouvert pendant que vous l'utilisez.`, `It runs on your computer: keep ${toolName} open while you use it.`) });

  // 2. The action, and 3. where it goes.
  const paste = (type: InstallRow["type"]) => CLIENTS[client].paste?.[type];
  if (client === "claude" && sheet.claude_directory) {
    // Claude's own directory page (read on 17/11/2026): one click to add it from Claude.
    steps.push({ text: t(`Ouvrez la page de ${toolName} dans le répertoire de Claude et ajoutez le connecteur.`, `Open ${toolName}'s page in Claude's directory and add the connector.`), action: { kind: "open", href: sheet.claude_directory.url, label: t("Ouvrir dans Claude", "Open in Claude") } });
  } else if (row?.type === "url" && !(client === "any" || (client === "claude" && isAddress(row.value)))) {
    steps.push({ text: t(`Ouvrez la page de ${toolName} dans ${who} et acceptez l'ajout.`, `Open ${toolName}'s page in ${who} and accept.`), action: { kind: "open", href: row.value, label: t(`Ouvrir dans ${who}`, `Open in ${who}`) } });
  } else if (row) {
    const label = { url: t("Copier l'adresse", "Copy the address"), command: t("Copier la commande", "Copy the command"), config: t("Copier la configuration", "Copy the configuration"), steps: "" }[row.type];
    const what = { url: t("l'adresse du serveur", "the server address"), command: t("la commande", "the command"), config: t("la configuration", "the configuration"), steps: "" }[row.type];
    const copy: CopyAction = { kind: "copy", value: row.value, label, type: row.type };
    // A direct install link documented by the client (VS Code, Cursor) is the step's main action; the copy goes under it.
    const direct = client === "vs-code" ? vsCodeInstallLink(sheet) : client === "cursor" ? cursorInstallLink(sheet) : null;
    steps.push(direct
      ? { text: t(`Ouvrez le lien dans ${who} et confirmez l'installation de ${toolName}.`, `Open the link in ${who} and confirm installing ${toolName}.`), action: { kind: "open", href: direct, label: t(`Ouvrir dans ${who}`, `Open in ${who}`) }, secondary: copy }
      : { text: t(`Copiez ${what}.`, `Copy ${what}.`), action: copy });
    const where = paste(row.type);
    const docs = CLIENTS[client].source;
    steps.push(where ? { text: say(where, lang) }
      : docs ? { text: t(`Pour savoir où la coller, ouvrez la documentation de ${who}.`, `To know where to paste it, open ${who}'s documentation.`), action: { kind: "open", href: docs, label: t(`Documentation de ${who}`, `${who} documentation`) } }
      : { text: t(`${who} ne documente pas où la coller : suivez la documentation de ${toolName}, en lien dans les sources.`, `${who} does not document where to paste it: follow ${toolName}'s documentation, linked in the sources.`) });
  } else if (client === "cursor" && cursorInstallLink(sheet)) {
    steps.push({ text: t(`Ouvrez le lien dans Cursor et confirmez l'installation de ${toolName}.`, `Open the link in Cursor and confirm installing ${toolName}.`), action: { kind: "open", href: cursorInstallLink(sheet)!, label: t("Ouvrir dans Cursor", "Open in Cursor") } });
  } else if (client === "vs-code" && vsCodeInstallLink(sheet)) {
    steps.push({ text: t(`Ouvrez le lien dans VS Code et confirmez l'installation de ${toolName}.`, `Open the link in VS Code and confirm installing ${toolName}.`), action: { kind: "open", href: vsCodeInstallLink(sheet)!, label: t("Ouvrir dans VS Code", "Open in VS Code") } });
  } else if (way && (way.how === "connector" || way.how === "plugin")) {
    steps.push({ text: way.how === "connector"
      ? t(`Dans ${who}, ouvrez la liste des connecteurs et choisissez ${toolName}.`, `In ${who}, open the list of connectors and pick ${toolName}.`)
      : t(`Dans ${who}, ajoutez l'application ${toolName} depuis la liste des applications.`, `In ${who}, add the ${toolName} app from the list of apps.`) });
  } else {
    const address = sheet.install.filter(isCopyRow).find((r) => r.client === "any" && r.type === "url");
    if (address && paste("url")) {
      steps.push({ text: t("Copiez l'adresse du serveur.", "Copy the server address."), action: { kind: "copy", value: address.value, label: t("Copier l'adresse", "Copy the address"), type: "url" } });
      steps.push({ text: say(paste("url")!, lang) });
    } else {
      steps.push({ text: t(`${toolName} ne détaille pas ce branchement pour ${who} : suivez sa documentation, en lien dans les sources.`, `${toolName} does not detail this setup for ${who}: follow its documentation, linked in the sources.`) });
    }
  }

  // 4. Sign in, then check with a request of the sheet, which the reader can copy (17/11).
  const example = sheet.examples?.[0];
  const auth = sheet.auth ?? [];
  const sign = auth.includes("oauth")
    ? t(`Connectez votre compte ${toolName} et lisez les accès demandés.`, `Connect your ${toolName} account and read the access requested.`)
    : auth.includes("key") ? t(`Créez une clé d'accès dans ${toolName} et donnez-la quand elle est demandée.`, `Create an access key in ${toolName} and give it when asked.`) : "";
  const check: PlugStep | null = example ? { text: t("Vérifiez en lui demandant :", "Check it by asking:"), prompt: example } : null;
  if (sign && check && steps.length + 2 > 4) steps.push({ ...check, text: `${sign} ${check.text}` });
  else {
    if (sign) steps.push({ text: sign });
    if (check) steps.push(check);
  }
  return steps.slice(0, 4).map((step) => ({ ...step, text: typo(step.text) }));
}

const say = (pair: Pair, lang: Lang) => (lang === "en" ? pair.en : pair.fr);
