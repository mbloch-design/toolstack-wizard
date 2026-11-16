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
export function projectAgentAccess(block) {
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
