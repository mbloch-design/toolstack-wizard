/*
 * The agents section of the llms files (R2, 19/11/2026): the official MCP server sheets and their freelancer's
 * advice (verdict, situations, tips, pitfalls), so answer engines read the advice rather than the old set-up summary.
 *
 * The advice goes in llms-full.txt BEFORE the tool catalogue: api/tool-md.ts, the post-deploy check and the tests
 * parse the catalogue from the file's first « [ » to its end. So this block must hold no square bracket at all
 * (no Markdown link, no JSON array), which `assertNoBracket` enforces.
 */

const BASE = "https://tooltrim.com";
const LANGS = ["en", "fr"];
const LABEL = {
  en: { verdict: "Verdict", situations: "Situations", ask: "Ask", tips: "Tips", pitfalls: "Pitfalls", workaround: "Workaround", sources: "Sources", community: "user feedback" },
  fr: { verdict: "Verdict", situations: "Situations", ask: "Demandez", tips: "Conseils", pitfalls: "Pièges", workaround: "Parade", sources: "Sources", community: "retour d'utilisateurs" },
};

/** The MCP server sheets the sitemap publishes in both languages, in catalogue order. */
export function publishedServers(catalog, sitemap) {
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  return catalog.servers.filter((s) => s.advice && LANGS.every((lang) => locs.has(`${BASE}/${lang}/mcp/${s.slug}`)));
}

const one = (text) => String(text).replace(/\s+/g, " ").trim();
const tool = (s) => s.host_name ?? s.publisher;

/** One server's advice, in both languages: plain Markdown with no link syntax. */
export function serverAdvice(s) {
  const lines = [`### ${s.name} (${tool(s)})`, "", `- Sheet: ${BASE}/en/mcp/${s.slug} · ${BASE}/fr/mcp/${s.slug}`, `- Publisher: ${s.publisher} · checked on ${s.verified_on}`];
  for (const lang of LANGS) {
    const t = LABEL[lang];
    const a = s.advice;
    // French typography: a space before the colon, « » around a quote; English: “ ”.
    const c = lang === "fr" ? " :" : ":";
    const q = (text) => (lang === "fr" ? `« ${one(text)} »` : `“${one(text)}”`);
    lines.push("", `#### ${lang.toUpperCase()}`, "", `${t.verdict}${c} ${one(a.verdict[lang])}`, "", `${t.situations}${c}`);
    for (const x of a.situations) lines.push(`- ${one(x.title[lang])}${c} ${one(x.gain[lang])} ${t.ask}${c} ${q(x.ask[lang])}`);
    lines.push("", `${t.tips}${c}`);
    for (const x of a.tips) lines.push(`- ${one(x.title[lang])}${c} ${one(x[lang])}${x.community ? ` (${t.community})` : ""}`);
    lines.push("", `${t.pitfalls}${c}`);
    for (const x of a.pitfalls) lines.push(`- ${one(x.title[lang])}${c} ${one(x[lang])}${x.workaround ? ` ${t.workaround}${c} ${one(x.workaround[lang])}` : ""}${x.community ? ` (${t.community})` : ""}`);
  }
  lines.push("", "Sources:", ...[...new Set(s.advice.sources.map((x) => x.url))].map((url) => `- ${url}`));
  return lines.join("\n");
}

export function assertNoBracket(text, where) {
  const at = text.search(/[[\]]/);
  if (at >= 0) throw new Error(`${where} : crochet interdit avant le catalogue (« ${text.slice(Math.max(0, at - 40), at + 40)} »)`);
  return text;
}

/** The block llms-full.txt carries before its tool catalogue. */
export function agentsAdviceBlock(servers) {
  return assertNoBracket(`## Official MCP servers: a freelancer's advice

${servers.length} official MCP server sheets, each with a peer's advice to a freelancer: verdict, everyday situations with a request to try, tips and pitfalls, every item sourced from the vendor's own pages (or flagged as user feedback). Hub: ${BASE}/en/mcp · ${BASE}/fr/mcp

${servers.map(serverAdvice).join("\n\n")}

## Tool catalogue
`, "llms-full agents");
}

/** The section llms.txt carries: where the agents pages live and what each MCP sheet says. */
export function agentsIndexSection(servers, skillCount) {
  return `## AI Agents: MCP Servers and Skills

- [AI tools hub (FR)](${BASE}/fr/agents) · [EN](${BASE}/en/agents)
- [Official MCP servers (FR)](${BASE}/fr/mcp) · [EN](${BASE}/en/mcp) — ${servers.length} sheets, each with a freelancer's advice: verdict, situations, tips and pitfalls.
- [Official skills (FR)](${BASE}/fr/skills) · [EN](${BASE}/en/skills) — ${skillCount} sheets.
- MCP server sheet: \`${BASE}/{lang}/mcp/{slug}\`
- Skill sheet: \`${BASE}/{lang}/skills/{slug}\`
- The full advice of every MCP sheet, in English and French, is at the top of https://tooltrim.com/llms-full.txt, before the tool catalogue.

${servers.map((s) => `- [${s.name}](${BASE}/en/mcp/${s.slug}): ${one(s.advice.verdict.en)}`).join("\n")}
`;
}
