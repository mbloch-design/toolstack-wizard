// Bloc « agent » d'une fiche : ce qu'un assistant IA peut faire dans l'outil
// par un serveur MCP officiel (docs/ROADMAP.md, « Axe agentique et MCP »).
//
// Écrit dans research/bundle-editorial/<slug>.json (facts.agent), projeté en
// agentAccess dans src/data/tools_v4.json (scripts/project-agent-access.mjs)
// et en index réduit dans src/data/tools_index.json (gen-tools-index.mjs).
//
// Vocabulaires fermés, comme form_factor (scripts/guard-plugins.mjs) : étendre
// le modèle = ajouter une valeur ICI, et dans le rendu (src/ds/AgentAccess),
// jamais écrire une valeur libre dans un fichier de recherche.
export const AGENT_VOCAB = Object.freeze({
  mcp: ["official", "none"],
  transport: ["remote", "local"],
  auth: ["oauth", "key", "none"],
  access: ["read", "read_write", "docs_only"],
  plan: ["all", "paid", "specific", "unknown"],
  // Au niveau de l'outil (« Mieux que Toolfolio », 16/11) : ce qui décide pour un non-développeur.
  status: ["ga", "beta"],
  capability: ["read", "write", "delete", "send", "pay"],
  assistant: ["claude", "chatgpt", "gemini", "copilot", "other"],
  how: ["connector", "plugin", "url", "local"],
  safeguard: ["human_confirmation", "admin_controls", "scoped_keys", "no_delete"],
});

const BLOCK_KEYS = new Set(["mcp", "verified_on", "sources", "servers", "note", "note_en", "status", "capabilities", "setup", "safeguards"]);
const SERVER_KEYS = new Set(["name", "transport", "auth", "access", "plan", "plan_note", "plan_note_en", "clients", "docs_url"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isUrl = (value) => typeof value === "string" && /^https:\/\/\S+$/.test(value);
const isText = (value) => typeof value === "string" && value.trim().length > 0;

/**
 * Errors of one block, as sentences. Empty when the block holds.
 * catalogSlugs: the catalogue's slugs, for clients (an assistant without a fiche is not listed).
 */
export function validateAgentBlock(block, { catalogSlugs } = {}) {
  const errors = [];
  if (!block || typeof block !== "object") return ["bloc absent ou non objet"];
  for (const key of Object.keys(block)) if (!BLOCK_KEYS.has(key)) errors.push(`clé inconnue : ${key}`);
  if (!AGENT_VOCAB.mcp.includes(block.mcp)) errors.push(`mcp hors vocabulaire : ${block.mcp}`);
  if (!DATE.test(block.verified_on || "") || Number.isNaN(Date.parse(block.verified_on))) errors.push("verified_on manquant ou invalide (AAAA-MM-JJ)");
  if (!Array.isArray(block.sources) || !block.sources.length) errors.push("sources : au moins une source éditeur");
  else block.sources.forEach((source, i) => {
    if (!isText(source?.label) || !isUrl(source?.url)) errors.push(`sources[${i}] : libellé et url https requis`);
  });
  if (Boolean(block.note) !== Boolean(block.note_en)) errors.push("note et note_en vont ensemble");
  if (!Array.isArray(block.servers)) errors.push("servers : tableau requis (vide pour none)");
  else if (block.mcp === "none" && block.servers.length) errors.push("mcp none : servers doit être vide");
  else if (block.mcp === "official" && !block.servers.length) errors.push("mcp official : au moins un serveur");
  // Tool-level fields: each absent when the vendor does not say (the gap is noted, nothing is deduced).
  const toolLevel = ["status", "capabilities", "setup", "safeguards"].filter((key) => key in block);
  if (block.mcp === "none" && toolLevel.length) errors.push(`mcp none : ${toolLevel.join(", ")} sans objet`);
  if ("status" in block && !AGENT_VOCAB.status.includes(block.status)) errors.push(`status hors vocabulaire (${block.status})`);
  if ("capabilities" in block) {
    if (!Array.isArray(block.capabilities) || block.capabilities.length < 1 || block.capabilities.length > 5) errors.push("capabilities : 1 à 5 lignes");
    else block.capabilities.forEach((line, i) => {
      if (!AGENT_VOCAB.capability.includes(line?.kind)) errors.push(`capabilities[${i}] : kind hors vocabulaire (${line?.kind})`);
      if (!isText(line?.fr) || !isText(line?.en)) errors.push(`capabilities[${i}] : fr et en requis`);
      for (const key of Object.keys(line || {})) if (!["kind", "fr", "en"].includes(key)) errors.push(`capabilities[${i}] : clé inconnue ${key}`);
    });
  }
  if ("setup" in block) {
    if (!Array.isArray(block.setup) || !block.setup.length) errors.push("setup : tableau non vide si présent");
    else {
      const seen = new Set();
      block.setup.forEach((way, i) => {
        if (!AGENT_VOCAB.assistant.includes(way?.assistant)) errors.push(`setup[${i}] : assistant hors vocabulaire (${way?.assistant})`);
        if (!AGENT_VOCAB.how.includes(way?.how)) errors.push(`setup[${i}] : how hors vocabulaire (${way?.how})`);
        const key = `${way?.assistant}/${way?.how}`;
        if (seen.has(key)) errors.push(`setup[${i}] : doublon ${key}`);
        seen.add(key);
      });
    }
  }
  if ("safeguards" in block) {
    if (!Array.isArray(block.safeguards)) errors.push("safeguards : tableau ([] si l'éditeur n'en documente aucun)");
    else {
      for (const value of block.safeguards) if (!AGENT_VOCAB.safeguard.includes(value)) errors.push(`safeguards hors vocabulaire (${value})`);
      if (new Set(block.safeguards).size !== block.safeguards.length) errors.push("safeguards : doublon");
    }
  }
  (Array.isArray(block.servers) ? block.servers : []).forEach((server, i) => {
    const at = `servers[${i}]`;
    for (const key of Object.keys(server || {})) if (!SERVER_KEYS.has(key)) errors.push(`${at} : clé inconnue ${key}`);
    if (!isText(server?.name)) errors.push(`${at} : name requis`);
    if (!isUrl(server?.docs_url)) errors.push(`${at} : docs_url https requis`);
    if ("transport" in server && !AGENT_VOCAB.transport.includes(server.transport)) errors.push(`${at} : transport hors vocabulaire (${server.transport})`);
    if ("access" in server && !AGENT_VOCAB.access.includes(server.access)) errors.push(`${at} : access hors vocabulaire (${server.access})`);
    if (!AGENT_VOCAB.plan.includes(server?.plan)) errors.push(`${at} : plan hors vocabulaire (${server?.plan})`);
    if ("auth" in server) {
      if (!Array.isArray(server.auth) || !server.auth.length) errors.push(`${at} : auth, tableau non vide si présent`);
      else for (const value of server.auth) if (!AGENT_VOCAB.auth.includes(value)) errors.push(`${at} : auth hors vocabulaire (${value})`);
    }
    if (Boolean(server.plan_note) !== Boolean(server.plan_note_en)) errors.push(`${at} : plan_note et plan_note_en vont ensemble`);
    if (server.plan === "specific" && !isText(server.plan_note)) errors.push(`${at} : plan specific exige plan_note`);
    if (server.plan_note && !["all", "paid", "specific"].includes(server.plan)) errors.push(`${at} : plan_note seulement avec all, paid ou specific`);
    if ("clients" in server) {
      if (!Array.isArray(server.clients) || !server.clients.length) errors.push(`${at} : clients, tableau non vide si présent (absent = tout client MCP)`);
      else if (catalogSlugs) for (const slug of server.clients) if (!catalogSlugs.has(slug)) errors.push(`${at} : client sans fiche au catalogue (${slug})`);
    }
  });
  return errors;
}

/** The block as the site reads it (tools_v4.json agentAccess), camelCase, absent fields left out. */
export function projectAgentAccess(block, { sheetFor } = {}) {
  return {
    mcp: block.mcp,
    verifiedOn: block.verified_on,
    sources: block.sources.map(({ label, url }) => ({ label, url })),
    servers: block.servers.map((server) => ({
      name: server.name,
      ...(server.transport ? { transport: server.transport } : {}),
      ...(server.auth ? { auth: [...server.auth] } : {}),
      ...(server.access ? { access: server.access } : {}),
      plan: server.plan,
      ...(server.plan_note ? { planNote: server.plan_note, planNoteEn: server.plan_note_en } : {}),
      ...(server.clients ? { clients: [...server.clients] } : {}),
      docsUrl: server.docs_url,
      ...(sheetFor?.(server) ? { mcpSlug: sheetFor(server) } : {}),
    })),
    ...(block.status ? { status: block.status } : {}),
    ...(block.capabilities ? { capabilities: block.capabilities.map(({ kind, fr, en }) => ({ kind, fr, en })) } : {}),
    ...(block.setup ? { setup: block.setup.map(({ assistant, how }) => ({ assistant, how })) } : {}),
    ...(block.safeguards ? { safeguards: [...block.safeguards] } : {}),
    ...(block.note ? { note: block.note, noteEn: block.note_en } : {}),
  };
}

const ACCESS_RANK = { docs_only: 0, read: 1, read_write: 2 };

/**
 * The reduced index (tools_index.json): mcp, transport, access, verifiedOn.
 * Several servers: every transport offered, the widest access exposed.
 */
export function agentAccessIndex(access) {
  if (!access || !AGENT_VOCAB.mcp.includes(access.mcp)) return null;
  const servers = access.servers || [];
  const transport = AGENT_VOCAB.transport.filter((value) => servers.some((server) => server.transport === value));
  const widest = servers.map((server) => server.access).filter(Boolean).sort((a, b) => ACCESS_RANK[b] - ACCESS_RANK[a])[0];
  return {
    mcp: access.mcp,
    ...(transport.length ? { transport } : {}),
    ...(widest ? { access: widest } : {}),
    verifiedOn: access.verifiedOn,
  };
}

// ── Section « agents » (S1) : fiche serveur (research/mcp) et fiche skill (research/skills) ──
const INSTALL_TYPES = ["command", "url", "config", "steps"];
/** A card sentence fits two lines of the narrowest card: a media card in a row of four (step 8d, 18/11); src/lib/agents.ts holds the same 50. */
export const CARD_MAX = 50;

/** A situation's icon (19/11): what the moment is, from a closed list drawn in AgentSheet. */
const SITUATION_ICONS = ["meeting", "week", "invoice", "post", "deck", "feedback", "link", "unpaid"];
/** A situation's pencil scene (19/11, « parfait, go sur ça »), optional: one of the scenes drawn in SituationArt.tsx
 *  (src/lib/agents.ts, SituationScene, holds the same list; TypeScript checks the drawings against it). */
export const SITUATION_SCENES = ["notion-meeting", "notion-week", "notion-invoice", "canva-post", "canva-deck", "canva-feedback", "stripe-invoice", "stripe-link", "stripe-unpaid"];
/** A tip's or a pitfall's own pictogram (19/11, « une variance de picto »), from a closed list drawn in AgentSheet. */
const ADVICE_ICONS = ["title", "database", "approve", "suggest", "click", "guest", "slow", "limit", "rights", "brief", "refine", "copy", "brand", "settings", "draft", "credits", "link", "admin", "sandbox", "amount", "key", "mail", "invoice", "confirm", "blocked", "session"];
const SHEET_KEYS = new Set(["slug", "name", "publisher", "official", "host_tool", "category", "summary", "card", "meta_description", "examples", "for", "not_for", "control", "plan_words", "first_requests", "troubleshoot", "verified_on", "status", "transport", "auth", "access", "plan", "plan_note", "capabilities", "setup", "safeguards", "tools", "tools_note", "install", "clients", "skills", "note", "claude_directory", "docs_url", "sources", "advice"]);
const SKILL_KEYS = new Set(["slug", "name", "publisher", "official", "host_tool", "server", "category", "summary", "agents", "install", "requires", "verified_on", "status", "docs_url", "sources",
  // Step 9 (18/11/2026), from the vendors' pages: what it does for you, a request to try, the search snippet, a readable name.
  "use_case", "example", "meta_description", "display_name"]);
const isPair = (value) => value && isText(value.fr) && isText(value.en);

function validateInstall(rows, at, errors) {
  if (!Array.isArray(rows)) return errors.push(`${at} : install, tableau requis`);
  rows.forEach((row, i) => {
    if (!isText(row?.client)) errors.push(`${at} : install[${i}].client requis`);
    if (!INSTALL_TYPES.includes(row?.type)) errors.push(`${at} : install[${i}].type hors vocabulaire (${row?.type})`);
    // Steps are words for the reader, so in both languages (step 9); every other value is the vendor's own text.
    if (row?.type === "steps" ? !isPair(row?.value) : !isText(row?.value)) errors.push(`${at} : install[${i}].value requis (${row?.type === "steps" ? "étapes fr/en" : "recopié de la doc éditeur"})`);
  });
}

/** Errors of one server sheet. The tool-level fields reuse the agent block's rules. */
export function validateMcpSheet(sheet, { catalogSlugs, skillSlugs } = {}) {
  const at = sheet?.slug || "?";
  const errors = [];
  for (const key of Object.keys(sheet || {})) if (!SHEET_KEYS.has(key)) errors.push(`${at} : clé inconnue ${key}`);
  if (!/^[a-z0-9-]+-mcp(-[a-z0-9]+)?$/.test(sheet?.slug || "")) errors.push(`${at} : slug <outil>-mcp attendu`);
  for (const key of ["name", "publisher", "docs_url"]) if (!isText(sheet?.[key])) errors.push(`${at} : ${key} requis`);
  if (sheet?.official !== true) errors.push(`${at} : seuls les serveurs officiels entrent`);
  if (catalogSlugs && sheet?.host_tool && !catalogSlugs.has(sheet.host_tool)) errors.push(`${at} : host_tool sans fiche (${sheet.host_tool})`);
  if (!isPair(sheet?.summary)) errors.push(`${at} : summary fr/en requis`);
  if (sheet?.plan_note && !isPair(sheet.plan_note)) errors.push(`${at} : plan_note fr/en`);
  if (sheet?.tools_note && !isPair(sheet.tools_note)) errors.push(`${at} : tools_note fr/en`);
  if (sheet?.note && !isPair(sheet.note)) errors.push(`${at} : note fr/en`);
  // Claude's directory page (S1 bis): the link « Ouvrir dans Claude » and the month added, never the tool list.
  if ("claude_directory" in (sheet || {})) {
    const d = sheet.claude_directory;
    if (!/^https:\/\/claude\.ai\/directory\/[a-z0-9-]+$/.test(d?.url || "") || !/^\d{4}-\d{2}$/.test(d?.added || "") || !DATE.test(d?.read_on || "")) errors.push(`${at} : claude_directory { url claude.ai/directory/<slug>, added AAAA-MM, read_on }`);
  }
  // Step 1 of the product analysis (17/11): gestures to stay in control, the plan in plain words, first requests,
  // what to check when it fails. Each from the vendor's documentation; absent rather than empty.
  if ("troubleshoot" in (sheet || {}) && (!Array.isArray(sheet.troubleshoot) || !sheet.troubleshoot.length || !sheet.troubleshoot.every(isPair))) errors.push(`${at} : troubleshoot, phrases fr/en`);
  // A safeguard: a short title, an icon of a closed set, a sentence (« Vos garde-fous », 17/11).
  const CONTROL_ICONS = ["account", "admin", "cut", "confirm", "limit", "read", "cost", "log"];
  if ("control" in (sheet || {}) && (!Array.isArray(sheet.control) || !sheet.control.length
    || !sheet.control.every((item) => isPair(item) && isPair(item?.title) && CONTROL_ICONS.includes(item?.icon)))) errors.push(`${at} : control, { title, icon, fr, en }`);
  if ("plan_words" in (sheet || {}) && (!isPair(sheet.plan_words?.common) || ("advanced" in sheet.plan_words && !isPair(sheet.plan_words.advanced)))) errors.push(`${at} : plan_words { common, advanced? } fr/en`);
  if ("first_requests" in (sheet || {})) {
    const f = sheet.first_requests;
    if (!Array.isArray(f?.read) || !f.read.length || f.read.length > 3 || !f.read.every(isPair)) errors.push(`${at} : first_requests.read, 1 à 3 demandes fr/en`);
    if (f && "write" in f && (!isPair(f.write?.ask) || !isPair(f.write?.check))) errors.push(`${at} : first_requests.write { ask, check } fr/en`);
  }
  // One sentence written for the card (S1 bis; 17/11): whole on two lines in the narrowest card (280 px), so 50 signs (step 8d).
  // Step 9: the server sheet's search snippet, 140 to 155 signs, required.
  if (!isPair(sheet?.meta_description) || [sheet.meta_description.fr, sheet.meta_description.en].some((text) => text.length < 140 || text.length > 155)) errors.push(`${at} : meta_description fr/en, de 140 à 155 signes`);
  if ("card" in (sheet || {}) && (!isPair(sheet.card) || sheet.card.fr.length > CARD_MAX || sheet.card.en.length > CARD_MAX)) errors.push(`${at} : card fr/en, ${CARD_MAX} signes au plus`);
  // ToolTrim's words (S1 bis): 2 or 3 example requests, who it is for and not for. Absent when nothing allows writing them.
  if ("examples" in (sheet || {}) && (!Array.isArray(sheet.examples) || sheet.examples.length < 2 || sheet.examples.length > 3 || !sheet.examples.every(isPair))) errors.push(`${at} : examples, 2 ou 3 demandes fr/en`);
  for (const key of ["for", "not_for"]) if (key in (sheet || {}) && !isPair(sheet[key])) errors.push(`${at} : ${key} fr/en`);
  if (("for" in (sheet || {})) !== ("not_for" in (sheet || {}))) errors.push(`${at} : for et not_for vont ensemble`);
  // A freelancer's advice to another (19/11/2026): a verdict, two or three situations, three to five tips, two to four
  // pitfalls, each tip and pitfall with the public source it comes from (vendor docs or users' accounts, never « tested »).
  if ("advice" in (sheet || {})) {
    const a = sheet.advice, sourced = (item) => isUrl(item?.source) && (item.community === undefined || typeof item.community === "boolean");
    if (!a || !isPair(a.verdict) || !isUrl(a.verdict.source)) errors.push(`${at} : advice.verdict fr/en et sa source`);
    // The peer's voice (19/11): an introduction that sets the scene, and a short title opening every tip and pitfall.
    if (!isPair(a?.intro)) errors.push(`${at} : advice.intro fr/en`);
    for (const item of [...(a?.tips ?? []), ...(a?.pitfalls ?? [])]) if (!isPair(item?.title)) errors.push(`${at} : advice, titre fr/en manquant (${item?.fr?.slice(0, 30)})`);
    for (const item of [...(a?.tips ?? []), ...(a?.pitfalls ?? [])]) if (!ADVICE_ICONS.includes(item?.icon)) errors.push(`${at} : advice, pictogramme hors liste (${item?.fr?.slice(0, 30)})`);
    for (const x of a?.situations ?? []) if (x?.scene !== undefined && !SITUATION_SCENES.includes(x.scene)) errors.push(`${at} : advice.situations, scène hors liste (${x.scene}), parmi ${SITUATION_SCENES.join(", ")}`);
    if (!Array.isArray(a?.situations) || a.situations.length < 2 || a.situations.length > 3
      || !a.situations.every((x) => isPair(x?.title) && isPair(x?.ask) && isPair(x?.gain) && isUrl(x?.source) && SITUATION_ICONS.includes(x?.icon))) errors.push(`${at} : advice.situations, 2 ou 3 (titre, demande, gain, source, icône parmi ${SITUATION_ICONS.join(", ")})`);
    if (!Array.isArray(a?.tips) || a.tips.length < 3 || a.tips.length > 5 || !a.tips.every((x) => isPair(x) && sourced(x))) errors.push(`${at} : advice.tips, 3 à 5 conseils fr/en sourcés`);
    if (!Array.isArray(a?.pitfalls) || a.pitfalls.length < 2 || a.pitfalls.length > 4
      || !a.pitfalls.every((x) => isPair(x) && sourced(x) && (x.workaround === undefined || isPair(x.workaround)))) errors.push(`${at} : advice.pitfalls, 2 à 4 pièges fr/en sourcés`);
    if (!Array.isArray(a?.sources) || !a.sources.length || !a.sources.every((x) => isText(x?.label) && isUrl(x?.url))) errors.push(`${at} : advice.sources requises`);
    const listed = new Set((a?.sources ?? []).map((x) => x.url));
    for (const url of [a?.verdict?.source, ...(a?.situations ?? []).map((x) => x.source), ...(a?.tips ?? []).map((x) => x.source), ...(a?.pitfalls ?? []).map((x) => x.source)])
      if (url && !listed.has(url)) errors.push(`${at} : advice, source non listée ${url}`);
  }
  // Reuse the block rules on the tool-level and server-level fields.
  const block = {
    mcp: "official", verified_on: sheet?.verified_on, sources: sheet?.sources,
    servers: [{ name: sheet?.name, docs_url: sheet?.docs_url, plan: sheet?.plan,
      ...(sheet?.transport ? { transport: sheet.transport } : {}), ...(sheet?.auth ? { auth: sheet.auth } : {}), ...(sheet?.access ? { access: sheet.access } : {}),
      ...(isPair(sheet?.plan_note) ? { plan_note: sheet.plan_note.fr, plan_note_en: sheet.plan_note.en } : {}) }],
    ...Object.fromEntries(["status", "capabilities", "setup", "safeguards"].filter((key) => key in (sheet || {})).map((key) => [key, sheet[key]])),
  };
  errors.push(...validateAgentBlock(block).map((error) => `${at} : ${error}`));
  if ("tools" in (sheet || {})) {
    if (!Array.isArray(sheet.tools)) errors.push(`${at} : tools, tableau`);
    else sheet.tools.forEach((tool, i) => {
      if (!isText(tool?.name)) errors.push(`${at} : tools[${i}].name requis`);
      if (!AGENT_VOCAB.capability.includes(tool?.kind)) errors.push(`${at} : tools[${i}].kind hors vocabulaire (${tool?.kind})`);
      if (!isText(tool?.fr) || !isText(tool?.en)) errors.push(`${at} : tools[${i}] fr/en requis`);
    });
  }
  validateInstall(sheet?.install, at, errors);
  if (skillSlugs) for (const skill of sheet?.skills ?? []) if (!skillSlugs.has(skill)) errors.push(`${at} : skill inconnu (${skill})`);
  return errors;
}

/** Errors of one skill sheet. */
export function validateSkillSheet(skill, { catalogSlugs, serverSlugs } = {}) {
  const at = skill?.slug || "?";
  const errors = [];
  for (const key of Object.keys(skill || {})) if (!SKILL_KEYS.has(key)) errors.push(`${at} : clé inconnue ${key}`);
  for (const key of ["slug", "name", "publisher", "docs_url"]) if (!isText(skill?.[key])) errors.push(`${at} : ${key} requis`);
  if (skill?.official !== true) errors.push(`${at} : seuls les skills officiels entrent`);
  if (!isPair(skill?.summary)) errors.push(`${at} : summary fr/en requis`);
  if (skill?.requires && !isPair(skill.requires)) errors.push(`${at} : requires fr/en`);
  if ("status" in (skill || {}) && !AGENT_VOCAB.status.includes(skill.status)) errors.push(`${at} : status hors vocabulaire`);
  if (!DATE.test(skill?.verified_on || "")) errors.push(`${at} : verified_on requis`);
  if (!Array.isArray(skill?.agents) || !skill.agents.length) errors.push(`${at} : agents attestés requis`);
  if (catalogSlugs && skill?.host_tool && !catalogSlugs.has(skill.host_tool)) errors.push(`${at} : host_tool sans fiche`);
  if (serverSlugs && skill?.server && !serverSlugs.has(skill.server)) errors.push(`${at} : serveur inconnu (${skill.server})`);
  if (!Array.isArray(skill?.sources) || !skill.sources.length) errors.push(`${at} : sources requises`);
  validateInstall(skill?.install, at, errors);
  // Step 9: the sheet's own words (use_case, example) and its search snippet (meta_description, 120 to 155 signs).
  if ("use_case" in (skill || {}) && !isPair(skill.use_case)) errors.push(`${at} : use_case fr/en`);
  if ("example" in (skill || {}) && (!isPair(skill.example) || [skill.example.fr, skill.example.en].some((text) => text.length > 120 || /[«»“”"]/.test(text)))) errors.push(`${at} : example fr/en, 120 signes au plus, sans guillemets`);
  if ("meta_description" in (skill || {}) && (!isPair(skill.meta_description) || [skill.meta_description.fr, skill.meta_description.en].some((text) => text.length < 120 || text.length > 155))) errors.push(`${at} : meta_description fr/en, de 120 à 155 signes`);
  if ("display_name" in (skill || {}) && !isPair(skill.display_name)) errors.push(`${at} : display_name fr/en`);
  return errors;
}

/**
 * Errors of the hub's needs table (research/agents/needs.json): every need leads to a server sheet
 * and quotes one of its example requests; its alternatives are sheets too.
 */
export function validateNeeds(table, servers) {
  const errors = [];
  const bySlug = new Map(servers.map((server) => [server.slug, server]));
  const needs = table?.needs;
  if (!Array.isArray(needs) || needs.length < 6 || needs.length > 8) return ["needs : 6 à 8 besoins attendus"];
  const ids = new Set();
  needs.forEach((need, i) => {
    const at = `needs[${i}] ${need?.id ?? "?"}`;
    if (!/^[a-z-]+$/.test(need?.id || "") || ids.has(need.id)) errors.push(`${at} : id unique requis`);
    ids.add(need?.id);
    if (!isText(need?.fr) || !isText(need?.en)) errors.push(`${at} : fr/en requis`);
    const server = bySlug.get(need?.server);
    if (!server) errors.push(`${at} : fiche serveur inconnue (${need?.server})`);
    else if (!server.examples?.[need.example]) errors.push(`${at} : demande type ${need.example} absente de ${server.slug}`);
    for (const slug of need?.also ?? []) if (!bySlug.has(slug) || slug === need.server) errors.push(`${at} : also, fiche inconnue ou répétée (${slug})`);
  });
  return errors;
}

/**
 * Recipes between two tools (step 6, 18/11/2026): two distinct servers, each with at least one documented tool used,
 * every tool present on its server sheet, a request in both languages. Never a tool the sheet does not list.
 */
export function validateRecipes(table, servers) {
  const errors = [];
  const bySlug = new Map(servers.map((s) => [s.slug, s]));
  const ids = new Set();
  for (const recipe of table?.recipes ?? []) {
    const at = `recette ${recipe?.id ?? "?"}`;
    if (!recipe?.id || ids.has(recipe.id)) errors.push(`${at} : id absent ou en double`);
    ids.add(recipe?.id);
    const pair = recipe?.servers ?? [];
    if (pair.length !== 2 || pair[0] === pair[1]) { errors.push(`${at} : deux serveurs distincts attendus`); continue; }
    for (const slug of pair) {
      const server = bySlug.get(slug);
      if (!server) { errors.push(`${at} : serveur inconnu ${slug}`); continue; }
      const used = recipe.uses?.[slug] ?? [];
      if (!used.length) errors.push(`${at} : aucun outil cité pour ${slug}`);
      const listed = new Set((server.tools ?? []).map((tool) => tool.name));
      for (const name of used) if (!listed.has(name)) errors.push(`${at} : ${name} absent de la fiche ${slug}`);
    }
    for (const slug of Object.keys(recipe.uses ?? {})) if (!pair.includes(slug)) errors.push(`${at} : outils cités pour ${slug}, hors de la paire`);
    if (!isPair(recipe.request)) errors.push(`${at} : request fr/en attendue`);
  }
  return errors;
}
