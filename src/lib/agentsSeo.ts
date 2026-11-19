/*
 * The agents section's SEO, one source (step 9, 19/11/2026): the prerender (vite.config.ts, under Node) and the pages
 * (after hydration) read the same titles, descriptions, breadcrumb trails and JSON-LD. Before, the two wrote different
 * ones and the client's titles ran past 80 signs. Pure: no React, no DOM, no alias import at runtime.
 */
import { fitBrandedTitle, TITLE_MAX_CHARS } from "./seoTitle";
import type { Lang, McpSheet, Pair, SkillSheet } from "./agents";

export const AGENTS_SEO_BASE = "https://tooltrim.com";
export type AgentsView = "all" | "mcp" | "skills";
export const AGENTS_PATHS: Record<AgentsView, string> = { all: "agents", mcp: "mcp", skills: "skills" };
/** The script ids the prerender writes and the pages replace. */
export const AGENTS_JSONLD_ID = "agents-jsonld";
export const AGENT_SHEET_JSONLD_ID = "agent-sheet-jsonld";

const pick = (lang: Lang, pair: Pair) => (lang === "en" ? pair.en : pair.fr);
const two = (lang: Lang, fr: string, en: string) => (lang === "en" ? en : fr);

/** The section's names: the H1 of each index and its step in the breadcrumb trail. */
export const AGENTS_LABELS: Record<AgentsView, Pair> = {
  all: { fr: "Outils pour l'IA", en: "Tools for AI" },
  mcp: { fr: "Serveurs MCP officiels", en: "Official MCP servers" },
  skills: { fr: "Savoir-faire pour développeurs", en: "Know-how for developers" },
};

/** « de Notion », « d'Ahrefs »: French elision before a vowel or a mute h. */
export const deName = (name: string) => (/^[aeiouyhâàéèêîïôûAEIOUYHÂÀÉÈÊÎÏÔÛ]/.test(name) ? `d'${name}` : `de ${name}`);

/** The first candidate that fits the 60 signs, branded when the brand still fits. */
const firstFit = (candidates: string[]) => {
  for (const core of candidates) if (core.length <= TITLE_MAX_CHARS) return fitBrandedTitle(core);
  return fitBrandedTitle(candidates[candidates.length - 1]);
};

type IndexData = { servers: Pick<McpSheet, "slug" | "name" | "host_tool" | "host_name">[]; skills: Pick<SkillSheet, "slug" | "name" | "display_name">[] };

const INDEX_TITLES: Record<AgentsView, (n: number) => Pair> = {
  all: () => ({ fr: "Outils pour l'IA : serveurs MCP et skills officiels", en: "Tools for AI: official MCP servers and skills" }),
  mcp: (n) => ({ fr: `Serveurs MCP officiels : ${n} outils comparés`, en: `Official MCP servers: ${n} tools compared` }),
  skills: () => ({ fr: "Skills officiels des éditeurs pour agents IA", en: "Official vendor skills for AI agents" }),
};
const INDEX_DESCRIPTIONS: Record<AgentsView, (n: number) => Pair> = {
  all: () => ({
    fr: "Les outils qui se branchent officiellement à Claude, ChatGPT ou Gemini : ce que l'assistant peut y lire, modifier ou payer, et comment le brancher.",
    en: "The tools that officially plug into Claude, ChatGPT or Gemini: what the assistant can read, change or pay in them, and how to plug each one in.",
  }),
  mcp: (n) => ({
    fr: `${n} serveurs MCP officiels comparés : lecture, écriture, suppression, paiement, forfait requis et assistants compatibles, vérifiés chez l'éditeur.`,
    en: `${n} official MCP servers compared: read, write, delete, pay, required plan and supported assistants, each checked against the vendor's own docs.`,
  }),
  skills: (n) => ({
    fr: `${n} skills officiels publiés par les éditeurs : des modes d'emploi que Claude Code, Cursor ou Codex suivent pour mieux travailler dans leur outil.`,
    en: `${n} official skills published by vendors: instructions that Claude Code, Cursor or Codex follow to work better in their tool, with how to add each.`,
  }),
};

/** A step of the breadcrumb trail: `path` without the language prefix, absent on the page itself. */
export type TrailStep = { label: string; path?: string };

export function agentsTrail(lang: Lang, view: AgentsView, leaf?: string): TrailStep[] {
  const hub = { label: pick(lang, AGENTS_LABELS.all), path: "/agents" };
  if (view === "all") return [{ label: hub.label }];
  const index = { label: pick(lang, AGENTS_LABELS[view]), path: `/${AGENTS_PATHS[view]}` };
  return leaf ? [hub, index, { label: leaf }] : [hub, { label: index.label }];
}

const breadcrumbLd = (lang: Lang, trail: TrailStep[], here: string) => {
  const steps = [{ label: two(lang, "Accueil", "Home"), path: "" }, ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, i) => ({
      "@type": "ListItem", position: i + 1, name: step.label,
      item: step.path !== undefined ? `${AGENTS_SEO_BASE}/${lang}${step.path}` : here,
    })),
  };
};

export type AgentsSeo = { title: string; description: string; url: string; jsonLd: Record<string, unknown>; ogImage?: string; trail: TrailStep[] };

export function agentsIndexSeo(view: AgentsView, lang: Lang, data: IndexData): AgentsSeo {
  const count = view === "skills" ? data.skills.length : data.servers.length;
  const title = fitBrandedTitle(pick(lang, INDEX_TITLES[view](count)));
  const description = pick(lang, INDEX_DESCRIPTIONS[view](count));
  const url = `${AGENTS_SEO_BASE}/${lang}/${AGENTS_PATHS[view]}`;
  const items = view === "skills"
    ? data.skills.map((k) => ({ name: k.display_name ? pick(lang, k.display_name) : k.name, url: `${AGENTS_SEO_BASE}/${lang}/skills/${k.slug}` }))
    : data.servers.map((s) => ({ name: s.name, url: `${AGENTS_SEO_BASE}/${lang}/mcp/${s.slug}` }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", name: pick(lang, AGENTS_LABELS[view]), description, url, inLanguage: lang,
        mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: item.url })) },
      },
      breadcrumbLd(lang, agentsTrail(lang, view), url),
    ],
  };
  return { title, description, url, jsonLd, trail: agentsTrail(lang, view) };
}

const ASSISTANT_ORDER = ["chatgpt", "claude", "gemini", "copilot"] as const;
const ASSISTANT_NAMES: Record<(typeof ASSISTANT_ORDER)[number], string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", copilot: "Copilot" };

/** « ChatGPT ou Claude »: the first two assistants the sheet can serve directly; « votre assistant IA » when none. */
export function assistantsPhrase(sheet: Pick<McpSheet, "setup">, lang: Lang) {
  const served = ASSISTANT_ORDER.filter((a) => (sheet.setup ?? []).some((w) => w.assistant === a)).slice(0, 2).map((a) => ASSISTANT_NAMES[a]);
  if (!served.length) return two(lang, "votre assistant IA", "your AI assistant");
  return served.join(two(lang, " ou ", " or "));
}

type ServerInput = Pick<McpSheet, "slug" | "name" | "publisher" | "host_tool" | "host_name" | "og_image" | "transport" | "setup" | "meta_description" | "verified_on" | "capabilities" | "plan_words" | "plan_note" | "control" | "advice">;

/** The tool's name for this server: « Figma », or « Figma » with « (MCP de bureau) » when it has a remote sibling. */
export function serverSeo(sheet: ServerInput, lang: Lang, hasSibling: boolean): AgentsSeo {
  const tool = sheet.host_name ?? sheet.publisher;
  const asst = assistantsPhrase(sheet, lang);
  const desktop = hasSibling && sheet.transport === "local";
  const official = desktop ? two(lang, "(MCP de bureau)", "(desktop MCP)") : two(lang, "(MCP officiel)", "(official MCP)");
  const title = firstFit(lang === "en"
    ? [`Connect ${tool} to ${asst} ${official}`, `Connect ${tool} to ${asst} (MCP)`, `${tool} ${official}`]
    : [`Brancher ${tool} à ${asst} ${official}`, `Brancher ${tool} à ${asst} (MCP)`, `${tool} ${official}`]);
  const description = pick(lang, sheet.meta_description);
  const url = `${AGENTS_SEO_BASE}/${lang}/mcp/${sheet.slug}`;
  const leaf = desktop ? two(lang, `${tool}, application de bureau`, `${tool}, desktop app`) : tool;
  const trail = agentsTrail(lang, "mcp", leaf);

  // The FAQ answers only what the sheet shows: the freelancer's verdict and situations (R2, 19/11/2026), what it can
  // do, the plan, how to stay in control, then the advice's tips and pitfalls. FAQPage, not HowTo: Google shows neither
  // as a rich result any more (HowTo since 2023, FAQ since 7 May 2026), but FAQPage stays valid schema.org that Bing
  // and AI assistants read, and the sheet's advice is already questions a freelancer asks.
  const faq: { q: string; a: string }[] = [];
  const advice = sheet.advice;
  const sentence = (text: string) => (/[.!?…»”]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
  if (advice) {
    faq.push({ q: two(lang, `Faut-il brancher ${tool} à votre assistant IA ?`, `Should you plug ${tool} into your AI assistant?`), a: pick(lang, advice.verdict) });
    if (advice.situations.length) faq.push({
      q: two(lang, `À quoi ${tool} sert-il au quotidien dans votre assistant ?`, `What does ${tool} do for you day to day in your assistant?`),
      a: advice.situations.map((s) => `${sentence(pick(lang, s.title))} ${sentence(pick(lang, s.gain))} ${two(lang, `Demandez : « ${pick(lang, s.ask)} »`, `Ask: “${pick(lang, s.ask)}”`)}`).join(" "),
    });
  }
  if (sheet.capabilities?.length) faq.push({
    q: two(lang, `Que peut faire votre assistant dans ${tool} ?`, `What can your assistant do in ${tool}?`),
    a: `${sheet.capabilities.map((c, i) => (i ? pick(lang, c).charAt(0).toLowerCase() + pick(lang, c).slice(1) : pick(lang, c))).join(two(lang, " ; ", "; "))}.`,
  });
  const plan = sheet.plan_words ? [sheet.plan_words.common, sheet.plan_words.advanced].filter(Boolean).map((p) => pick(lang, p as Pair)).join(" ") : sheet.plan_note ? pick(lang, sheet.plan_note) : "";
  if (plan) faq.push({ q: two(lang, `Faut-il un forfait ${tool} payant ?`, `Do you need a paid ${tool} plan?`), a: plan });
  if (sheet.control?.length) faq.push({
    q: two(lang, "Comment garder la main ?", "How do you stay in control?"),
    a: sheet.control.map((c) => `${pick(lang, c.title)} ${pick(lang, c)}`).join(" "),
  });

  if (advice?.tips.length) faq.push({
    q: two(lang, `Quels conseils pour bien utiliser ${tool} avec votre assistant ?`, `What tips help you use ${tool} with your assistant?`),
    a: advice.tips.map((t) => `${sentence(pick(lang, t.title))} ${sentence(pick(lang, t))}`).join(" "),
  });
  if (advice?.pitfalls.length) faq.push({
    q: two(lang, `Quels pièges éviter avec ${tool} dans votre assistant ?`, `Which pitfalls should you avoid with ${tool} in your assistant?`),
    a: advice.pitfalls.map((p) => [sentence(pick(lang, p.title)), sentence(pick(lang, p)), p.workaround ? sentence(pick(lang, p.workaround)) : ""].filter(Boolean).join(" ")).join(" "),
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication", name: sheet.name, description, url, inLanguage: lang,
        applicationCategory: "DeveloperApplication", operatingSystem: sheet.transport === "local" ? "Windows, macOS" : "Web",
        publisher: { "@type": "Organization", name: sheet.publisher }, dateModified: sheet.verified_on,
      },
      breadcrumbLd(lang, trail, url),
      ...(faq.length ? [{
        "@type": "FAQPage", inLanguage: lang,
        mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
      }] : []),
    ],
  };
  return { title, description, url, jsonLd, trail, ...(sheet.og_image ? { ogImage: `${AGENTS_SEO_BASE}${sheet.og_image}` } : {}) };
}

type SkillInput = Pick<SkillSheet, "slug" | "name" | "publisher" | "display_name" | "meta_description" | "summary">;

/** Cut at a word under `max` signs, with an ellipsis. */
const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[ ,;:.]+$/, "")}…`;
};

export function skillSeo(skill: SkillInput, lang: Lang): AgentsSeo {
  const name = skill.display_name ? pick(lang, skill.display_name) : skill.name;
  const title = firstFit(lang === "en"
    ? [`${name}: official ${skill.publisher} skill`, `${name}: ${skill.publisher} skill`, name]
    : [`${name} : skill officiel ${skill.publisher}`, `${name} : skill ${skill.publisher}`, name]);
  // Without its own snippet, a template from the summary, kept within 120 to 155 signs.
  let description = skill.meta_description ? pick(lang, skill.meta_description) : "";
  if (!description) {
    const lead = two(lang, `Skill officiel ${deName(skill.publisher)} : `, `Official ${skill.publisher} skill: `);
    const summary = pick(lang, skill.summary);
    description = clip(`${lead}${summary.charAt(0).toLowerCase()}${summary.slice(1)}`, 155);
    if (description.length < 120) description = clip(`${description} ${two(lang, "Installation, assistants compatibles et sources.", "How to add it, supported assistants and sources.")}`, 155);
  }
  const url = `${AGENTS_SEO_BASE}/${lang}/skills/${skill.slug}`;
  const trail = agentsTrail(lang, "skills", name);
  const jsonLd = { "@context": "https://schema.org", "@graph": [breadcrumbLd(lang, trail, url)] };
  return { title, description, url, jsonLd, trail };
}
