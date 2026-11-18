import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { useStackPins } from "@/hooks/useStackPins";
import { useAgentAssistant } from "@/hooks/useAgentAssistant";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Chip, { Chips } from "@/ds/Chip/Chip";
import Logo from "@/ds/Logo/Logo";
import Segmented from "@/ds/Segmented/Segmented";
import Chapter, { Chapters } from "@/ds/Chapter/Chapter";
import { CatalogTitle } from "@/ds/Catalog/Catalog";
import { LinkArrow, TextButton, linkClass } from "@/ds/Button/Button";
import { AgentCard, AgentCards, AgentShelf, HubQuestion, HubQuestions, StackReport, ToolChecklist, type ReportItem } from "@/ds/AgentHub/AgentHub";
import { Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { resolveToolAlternatives } from "@/lib/toolSchema";
import { pluggedAlternatives } from "@/lib/agentAlternatives";
import { agentShelves } from "@/lib/agentShelves";
import { HUB_ASSISTANTS, SERVERS, checkedTools, isPlugged, reportRows, reportVerdict, serverFoot, toolStatus, type HubAssistant } from "@/lib/agentReport";
import skillsIndex from "@/data/agents/skills_index.json";
import adviceData from "@/data/agents/advice.json";
import { byLine, cardLine, say, serverName, type Advice, type Lang, type McpCard, type SkillCard } from "@/lib/agents";

/*
 * The agents section, step 4 (17/11/2026): the hub /agents is a report on your stack from your assistant's side.
 * Two questions (your assistant, your tools), one sentence that sums it up, one row per tool, then every tool that
 * plugs in by family (need universes). /mcp is that full list on its own page. /skills stays an index until step 5.
 * « MCP » stays in the SEO titles only.
 */
export type AgentsView = "all" | "mcp" | "skills";
const SKILLS = skillsIndex as SkillCard[];
const ADVICE = adviceData as Record<string, Advice>;
/** The tools ticked without a stack, for this visitor only: never written to Ma stack. */
const PICKS_KEY = "tooltrim.agents.tools";

const TITLES: Record<AgentsView, [string, string]> = { all: ["Votre assistant IA", "Your AI assistant"], mcp: ["Outils à brancher", "Tools to plug in"], skills: ["Savoir-faire pour développeurs", "Know-how for developers"] };
const SEO_TITLES: Record<AgentsView, [string, string]> = {
  all: ["Votre assistant IA : ce qu'il peut faire dans vos outils (MCP)", "Your AI assistant: what it can do in your tools (MCP)"],
  mcp: ["Serveurs MCP officiels : brancher vos outils à votre assistant IA", "Official MCP servers: plug your tools into your AI assistant"],
  skills: ["Skills officiels : le savoir-faire des éditeurs pour votre assistant IA", "Official skills: vendors' know-how for your AI assistant"],
};
const LEADS: Record<AgentsView, [string, string]> = {
  all: ["Ce que votre assistant peut faire dans vos outils, et avec quelle prudence.", "What your assistant can do in your tools, and with how much care."],
  mcp: ["Les outils du catalogue qui se branchent officiellement à votre assistant IA, rangés par famille.", "The catalogue's tools that officially plug into your AI assistant, by family."],
  skills: ["Pour développeurs : des modes d'emploi publiés par les éditeurs, que votre assistant de code suit pour mieux travailler dans leur outil. Ceux de Notion et de Zapier s'utilisent sans rien installer.", "For developers: instructions published by vendors that your coding assistant follows to work better in their tool. Notion's and Zapier's need nothing installed."],
};
const PATHS: Record<AgentsView, string> = { all: "agents", mcp: "mcp", skills: "skills" };
const GUIDE = { fr: "mcp-freelances-non-developpeurs", en: "mcp-for-non-developer-freelancers" };
const ASSISTANT_LABELS: Record<HubAssistant, [string, string]> = { claude: ["Claude", "Claude"], chatgpt: ["ChatGPT", "ChatGPT"], gemini: ["Gemini", "Gemini"], copilot: ["Copilot", "Copilot"], other: ["Autre", "Other"] };

const read = (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { window.localStorage.setItem(key, value); } catch { /* the page works without it */ } };

const AgentsIndexPage = ({ view }: { view: AgentsView }) => {
  const { lang: rawLang, prefix, t } = useLang();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
  const { state, pinTool } = useStackPins();
  const [assistant, setAssistant] = useAgentAssistant();
  const [picks, setPicks] = useState<string[]>([]);
  const [withMine, setWithMine] = useState(false);
  useEffect(() => { try { const stored = JSON.parse(read(PICKS_KEY) ?? "[]"); if (Array.isArray(stored)) setPicks(stored.filter((slug) => typeof slug === "string")); } catch { /* none */ } }, []);

  const toolOf = (slug: string) => tools.find((tool) => (tool.slug || tool.id) === slug);
  const toolName = (slug: string) => toolOf(slug)?.name ?? SERVERS.find((card) => card.host_tool === slug)?.publisher ?? slug;
  const logo = (slug: string, size: 24 | 40 = 24) => { const tool = toolOf(slug); return tool ? <Logo tool={tool} size={size} /> : <Plug />; };
  const assistantName = assistant === "other" ? null : ASSISTANT_LABELS[assistant][0];

  useEffect(() => {
    const title = `${t(...SEO_TITLES[view])} | ToolTrim`;
    const description = t(...LEADS[view]);
    const url = `${SEO_BASE}${prefix}/${PATHS[view]}`;
    setSeoTags({ title, description, url });
    setJsonLd("agents-jsonld", { "@context": "https://schema.org", "@type": "CollectionPage", name: t(...SEO_TITLES[view]), description, url });
    return () => cleanupSeo(["agents-jsonld"]);
  }, [view, prefix, t]);

  // Your tools: Ma stack when there is one (read only), otherwise what you ticked here.
  const pinned = state.pinnedToolSlugs;
  const fromStack = pinned.length > 0;
  const slugs = fromStack ? pinned : picks;
  const rows = useMemo(() => reportRows(slugs, assistant), [slugs, assistant]);
  const items: ReportItem[] = rows.map((row) => {
    const tool = toolOf(row.slug);
    const alternative = row.status === "none" && tool ? pluggedAlternatives(resolveToolAlternatives(tool, tools))[0] : undefined;
    const example = row.card ? ADVICE[row.card.slug]?.examples?.[0] : undefined;
    return {
      slug: row.slug, name: toolName(row.slug), logo: logo(row.slug), status: row.status,
      ...(row.card ? { sheet: row.card.slug } : {}),
      ...(row.gravest ? { gravest: row.gravest } : {}),
      ...(example && row.status !== "elsewhere" ? { request: lang === "en" ? example.en : example.fr } : {}),
      ...(alternative ? { alternative: { slug: alternative.slug || alternative.id, name: alternative.name, logo: logo(alternative.slug || alternative.id) } } : {}),
    };
  });
  const toggle = (slug: string) => setPicks((list) => {
    const next = list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug];
    write(PICKS_KEY, JSON.stringify(next));
    return next;
  });
  const checked = checkedTools();
  const checklist = checked.map((slug) => ({ slug, name: toolName(slug), logo: logo(slug) })).sort((a, b) => a.name.localeCompare(b.name));
  const catalogue = tools.filter((tool) => !checked.includes(tool.slug || tool.id)).map((tool) => ({ slug: tool.slug || tool.id, name: tool.name, logo: <Logo tool={tool} size={24} /> }));

  const sheetLink = (slug: string, className: string, content: ReactNode) => <Link to={`${prefix}/mcp/${slug}`} className={className}>{content}</Link>;
  const toolLink = (slug: string, className: string, content: ReactNode) => <Link to={`${prefix}/tool/${slug}`} className={className}>{content}</Link>;
  const reportLink = (name: string, className: string, content: ReactNode) => (
    <Link to={`${prefix}/contact?subject=${encodeURIComponent(t(`Outil à vérifier pour les assistants IA : ${name}`, `Tool to check for AI assistants: ${name}`) as string)}`} className={className}>{content}</Link>
  );

  // Every tool that plugs in, by family; « avec mon assistant » keeps those that plug into it.
  const serverRow = (card: McpCard) => (
    <AgentCard key={card.slug} icon={logo(card.host_tool)} name={serverName(card, toolName(card.host_tool), SERVERS.some((other) => other.host_tool === card.host_tool && other.slug !== card.slug), lang)}
      by={byLine(card.publisher, lang)} summary={card.card ? say(lang, card.card) : cardLine(say(lang, card.summary))} facts={serverFoot(card, assistant, lang)}
      renderLink={(className, content) => sheetLink(card.slug, className, content)} />
  );
  const listed = SERVERS.filter((card) => !withMine || isPlugged(toolStatus(card.host_tool, assistant)));
  // A few families from Explorer's need universes, not a shelf per fine category (step 4, 17/11).
  const shelves = agentShelves(listed, lang);
  const fullList = <>
    <Chips label={t("Filtrer", "Filter") as string}>
      <Chip pressed={withMine} check onClick={() => setWithMine((on) => !on)}>{assistantName ? t(`Avec ${assistantName}`, `With ${assistantName}`) : t("Avec mon assistant", "With my assistant")}</Chip>
    </Chips>
    {shelves.map((shelf) => (
      <AgentShelf key={shelf.id} title={shelf.title} count={shelf.cards.length}>
        <AgentCards flat label={shelf.title}>{shelf.cards.map(serverRow)}</AgentCards>
      </AgentShelf>
    ))}
    <Link to={`${prefix}/guide/${lang === "en" ? GUIDE.en : GUIDE.fr}`} className={linkClass()}>{t("Le guide pour bien commencer", "The guide to get started")}<LinkArrow shown /></Link>
  </>;

  const skillRow = (skill: SkillCard) => (
    <AgentCard key={skill.slug} icon={logo(skill.host_tool)} name={skill.name} by={byLine(skill.publisher, lang)} summary={cardLine(say(lang, skill.summary))}
      facts={[{ kind: "skill", text: t("Savoir-faire", "Know-how") as string }, { kind: "tool", text: toolName(skill.host_tool) }]}
      renderLink={(className, content) => <Link to={`${prefix}/skills/${skill.slug}`} className={className}>{content}</Link>} />
  );

  // /skills by tool: those that need nothing installed first (Notion, Zapier), then the others by size.
  const skillShelves = [...new Set(SKILLS.map((skill) => skill.host_tool))]
    .map((tool) => ({ tool, name: toolName(tool), skills: SKILLS.filter((skill) => skill.host_tool === tool) }))
    .sort((a, b) => Number(b.skills.some((k) => k.everyone)) - Number(a.skills.some((k) => k.everyone)) || b.skills.length - a.skills.length);
  const assistantChoice = (
    <Segmented compact label={t("Votre assistant", "Your assistant") as string} value={assistant} onChange={setAssistant}
      options={HUB_ASSISTANTS.map((value) => ({ value, label: lang === "en" ? ASSISTANT_LABELS[value][1] : ASSISTANT_LABELS[value][0] }))} />
  );

  if (view !== "all") {
    return (
      <Page>
        <Breadcrumb includeSchema={false} items={[{ label: t(...TITLES.all) as string, href: `${prefix}/agents` }, { label: t(...TITLES[view]) as string }]} />
        <CatalogTitle title={t(...TITLES[view]) as string} count={view === "mcp" ? SERVERS.length : SKILLS.length} countLabel={t("fiches", "sheets") as string} lead={t(...LEADS[view]) as string} />
        <Chapters>
          <Chapter chapter="list" width="wide">
            {view === "mcp" ? fullList : skillShelves.map((shelf) => (
              <AgentShelf key={shelf.tool} title={shelf.name} count={shelf.skills.length}>
                <AgentCards flat label={shelf.name}>{shelf.skills.map(skillRow)}</AgentCards>
              </AgentShelf>
            ))}
          </Chapter>
        </Chapters>
      </Page>
    );
  }

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={[{ label: t(...TITLES.all) as string }]} />
      <CatalogTitle title={t(...TITLES.all) as string} lead={t(...LEADS.all) as string} />
      <Chapters>
        <Chapter chapter="questions" width="wide">
          <HubQuestions>
            <HubQuestion title={t("Votre assistant", "Your assistant") as string}>{assistantChoice}</HubQuestion>
            <HubQuestion title={t("Vos outils", "Your tools") as string}
              note={fromStack
                ? <>{t(`Les ${pinned.length} outils de Ma stack.`, `The ${pinned.length} tools in My stack.`)} <Link to={`${prefix}/ma-stack`} className={linkClass("inline")}>{t("Modifier", "Edit")}</Link></>
                : t("Cochez ceux que vous utilisez.", "Tick the ones you use.")}>
              {!fromStack && <ToolChecklist tools={checklist} catalogue={catalogue} selected={picks} onToggle={toggle} lang={lang} />}
              {!fromStack && picks.length > 0 && (
                <div><TextButton arrow onClick={() => picks.forEach((slug) => pinTool(slug))}>{t("Enregistrer dans Ma stack", "Save to My stack")}</TextButton></div>
              )}
            </HubQuestion>
          </HubQuestions>
        </Chapter>
        {rows.length > 0 && (
          <Chapter id="bilan" chapter="report" width="wide" title={reportVerdict(rows, assistant, lang)}>
            <StackReport items={items} assistant={assistantName} lang={lang} renderSheetLink={sheetLink} renderToolLink={toolLink} renderReportLink={reportLink} />
          </Chapter>
        )}
        <Chapter id="tous" chapter="list" width="wide" title={t("Tous les outils qui se branchent", "Every tool that plugs in") as string}>
          {fullList}
        </Chapter>
      </Chapters>
    </Page>
  );
};

export default AgentsIndexPage;
