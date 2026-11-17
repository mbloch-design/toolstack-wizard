import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { useStackPins } from "@/hooks/useStackPins";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Chip, { Chips, chipLinkAttrs } from "@/ds/Chip/Chip";
import Logo from "@/ds/Logo/Logo";
import { CatalogSection, CatalogTitle, EmptyState } from "@/ds/Catalog/Catalog";
import { LinkArrow, linkClass } from "@/ds/Button/Button";
import { AgentCard, AgentCards, FilterGroups, NeedPicker, StackAgents, StartHere, type StackAgentItem } from "@/ds/AgentHub/AgentHub";
import { runCatalogFilter } from "@/hooks/useCatalogStickyToolbar";
import { Plug, SearchCheck } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import mcpIndex from "@/data/agents/mcp_index.json";
import skillsIndex from "@/data/agents/skills_index.json";
import needsData from "@/data/agents/needs.json";
import checkedNone from "@/data/agents/checked_none.json";
import { byLine, cardSentence, guardOf, say, serverFacts, serverName, stackCall, type Lang, type McpCard, type Need, type SkillCard } from "@/lib/agents";

/*
 * The agents section (S1, 16/11/2026; S1 bis, 17/11): the hub /agents starts from the person — what you want
 * your assistant to do, what your stack can plug in, where to start — and keeps the full list at the bottom,
 * for whoever looks for one tool. /mcp (tools to plug in) and /skills (know-how) stay indexes, opening on one
 * sentence that guides. Surface words without jargon; « MCP » stays in the SEO title.
 */
export type AgentsView = "all" | "mcp" | "skills";
const SERVERS = mcpIndex as McpCard[];
const SKILLS = skillsIndex as SkillCard[];
const NEEDS = needsData as Need[];
const CHECKED_NONE = new Set(checkedNone as string[]);

type FilterId = "one_click" | "risky" | "remote" | "local" | "all_plans" | "oauth" | "claude" | "chatgpt" | "gemini" | "copilot";
const ASSISTANT_FILTERS: FilterId[] = ["claude", "chatgpt", "gemini", "copilot"];
const FILTERS: { id: FilterId; fr: string; en: string; test: (card: McpCard) => boolean }[] = [
  { id: "one_click", fr: "En un clic depuis ChatGPT ou Claude", en: "One click from ChatGPT or Claude", test: (c) => c.one_click.includes("claude") || c.one_click.includes("chatgpt") },
  { id: "risky", fr: "Supprime des données ou engage un paiement", en: "Deletes data or makes a payment", test: (c) => c.kinds.includes("delete") || c.kinds.includes("pay") },
  { id: "remote", fr: "En ligne", en: "Online", test: (c) => c.transport === "remote" },
  { id: "local", fr: "Sur l'ordinateur", en: "On your computer", test: (c) => c.transport === "local" },
  { id: "all_plans", fr: "Tous les forfaits", en: "Every plan", test: (c) => c.plan === "all" },
  { id: "oauth", fr: "Connexion à votre compte", en: "Sign in to your account", test: (c) => Boolean(c.auth?.includes("oauth")) },
  { id: "claude", fr: "Claude", en: "Claude", test: (c) => c.one_click.includes("claude") || Boolean(c.clients?.includes("claude")) },
  { id: "chatgpt", fr: "ChatGPT", en: "ChatGPT", test: (c) => c.one_click.includes("chatgpt") || Boolean(c.clients?.includes("chatgpt")) },
  { id: "gemini", fr: "Gemini", en: "Gemini", test: (c) => c.one_click.includes("gemini") || Boolean(c.clients?.includes("gemini")) },
  { id: "copilot", fr: "Copilot", en: "Copilot", test: (c) => c.one_click.includes("copilot") },
];

const TITLES: Record<AgentsView, [string, string]> = { all: ["Agents IA", "AI agents"], mcp: ["Outils à brancher", "Tools to plug in"], skills: ["Savoir-faire", "Know-how"] };
/** SEO titles keep the vendors' words (MCP, skills), in the background. */
const SEO_TITLES: Record<AgentsView, [string, string]> = {
  all: ["Agents IA : brancher vos outils à votre assistant (MCP et skills)", "AI agents: plug your tools into your assistant (MCP and skills)"],
  mcp: ["Serveurs MCP officiels : brancher vos outils à votre assistant IA", "Official MCP servers: plug your tools into your AI assistant"],
  skills: ["Skills officiels : le savoir-faire des éditeurs pour votre assistant IA", "Official skills: vendors' know-how for your AI assistant"],
};
const LEADS: Record<AgentsView, [string, string]> = {
  all: ["Votre assistant IA peut travailler dans vos outils. Dites ce que vous voulez faire : nous vous disons quoi brancher, comment, et avec quelle prudence.", "Your AI assistant can work inside your tools. Say what you want done: we tell you what to plug in, how, and with how much care."],
  mcp: ["Les outils du catalogue qui se branchent officiellement à votre assistant IA, avec ce qu'il pourra y faire. Pas sûr de par où commencer ? Partez d'un besoin sur la page Agents IA.", "The catalogue's tools that officially plug into your AI assistant, with what it can do there. Not sure where to start? Start from a need on the AI agents page."],
  skills: ["Des modes d'emploi publiés par les éditeurs, que votre assistant suit pour mieux travailler dans leur outil. Chacun s'ajoute au branchement de l'outil.", "Instructions published by vendors that your assistant follows to work better in their tool. Each one comes on top of plugging the tool in."],
};
const PATHS: Record<AgentsView, string> = { all: "agents", mcp: "mcp", skills: "skills" };
const GUIDE = { fr: "mcp-freelances-non-developpeurs", en: "mcp-for-non-developer-freelancers" };
/** A tool's lead server: online first (Figma has two). */
const serverOf = (toolSlug: string) => SERVERS.filter((card) => card.host_tool === toolSlug).sort((a, b) => Number(b.transport === "remote") - Number(a.transport === "remote"))[0];

const AgentsIndexPage = ({ view }: { view: AgentsView }) => {
  const { lang: rawLang, prefix, t } = useLang();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
  const { state } = useStackPins();
  const [active, setActive] = useState<FilterId[]>([]);
  const toolOf = (slug: string) => tools.find((tool) => (tool.slug || tool.id) === slug);
  const toolName = (slug: string) => toolOf(slug)?.name ?? SERVERS.find((card) => card.host_tool === slug)?.publisher ?? slug;

  const servers = useMemo(() => SERVERS.filter((card) => active.every((id) => FILTERS.find((f) => f.id === id)!.test(card))), [active]);
  const visibleServerSlugs = new Set(servers.map((card) => card.slug));
  const skills = active.length ? SKILLS.filter((skill) => skill.server && visibleServerSlugs.has(skill.server)) : SKILLS;

  useEffect(() => {
    const title = `${t(...SEO_TITLES[view])} | ToolTrim`;
    const description = t(...LEADS[view]);
    const url = `${SEO_BASE}${prefix}/${PATHS[view]}`;
    setSeoTags({ title, description, url });
    setJsonLd("agents-jsonld", { "@context": "https://schema.org", "@type": "CollectionPage", name: t(...SEO_TITLES[view]), description, url });
    return () => cleanupSeo(["agents-jsonld"]);
  }, [view, prefix, t]);

  // On the hub the list sits at the bottom: its filters stay in place and never send the reader back to the top.
  const hub = view === "all";
  const chip = (filter: (typeof FILTERS)[number]) => <Chip key={filter.id} pressed={active.includes(filter.id)} check onClick={() => toggle(filter.id)}>{t(filter.fr, filter.en)}</Chip>;
  const toggle = (id: FilterId) => {
    const change = () => setActive((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    if (hub) change(); else void runCatalogFilter(change);
  };
  const logo = (slug: string, size: 24 | 40 = 24) => { const tool = toolOf(slug); return tool ? <Logo tool={tool} size={size} /> : <Plug />; };
  const sheetLink = (slug: string, className: string, content: ReactNode, attrs?: Record<string, string>) => <Link to={`${prefix}/mcp/${slug}`} className={className} {...attrs}>{content}</Link>;
  const serverRow = (card: McpCard) => (
    <AgentCard key={card.slug} icon={logo(card.host_tool)} name={serverName(card, toolName(card.host_tool), SERVERS.some((other) => other.host_tool === card.host_tool && other.slug !== card.slug), lang)}
      by={byLine(card.publisher, lang)} summary={card.card ? say(lang, card.card) : cardSentence(say(lang, card.summary))} facts={serverFacts(card, lang)}
      renderLink={(className, content) => sheetLink(card.slug, className, content)} />
  );
  const skillRow = (skill: SkillCard) => (
    <AgentCard key={skill.slug} icon={logo(skill.host_tool)} name={skill.name} by={byLine(skill.publisher, lang)} summary={cardSentence(say(lang, skill.summary))}
      facts={[{ kind: "skill", text: t("Savoir-faire", "Know-how") as string }, { kind: "tool", text: toolName(skill.host_tool) }]}
      renderLink={(className, content) => <Link to={`${prefix}/skills/${skill.slug}`} className={className}>{content}</Link>} />
  );

  // « Avec votre stack »: the same source as Ma stack; a tool not checked yet is left out, never guessed.
  const pinned = state.pinnedToolSlugs;
  const stackItems: StackAgentItem[] | null = pinned.length ? pinned.flatMap((slug) => {
    const card = serverOf(slug);
    const checked = card || CHECKED_NONE.has(slug);
    if (!checked) return [];
    return [{ slug, name: toolName(slug), icon: logo(slug), call: stackCall(card ? guardOf(card) : null), ...(card ? { card } : {}) }];
  }) : null;

  const tabs = (
    <nav aria-label={t("Rubriques", "Sections") as string}>
      <Chips label={t("Rubriques", "Sections") as string}>
        {(["all", "mcp", "skills"] as AgentsView[]).map((tab) => (
          <Link key={tab} to={`${prefix}/${PATHS[tab]}`} {...chipLinkAttrs(tab === view)}>{tab === "all" ? t("Tout", "All") : t(...TITLES[tab])}</Link>
        ))}
      </Chips>
    </nav>
  );
  const list = <>
    {view !== "skills" && (
      <FilterGroups groups={[
        { label: t("Comment", "How") as string, chips: FILTERS.filter((f) => !ASSISTANT_FILTERS.includes(f.id)).map(chip) },
        { label: t("Avec quel assistant", "With which assistant") as string, chips: FILTERS.filter((f) => ASSISTANT_FILTERS.includes(f.id)).map(chip) },
      ]} />
    )}
    {view !== "skills" && (
      <CatalogSection id="agents-servers" title={t("Outils à brancher", "Tools to plug in")} count={servers.length}
        action={view === "all" ? <Link to={`${prefix}/mcp`} className={linkClass()}>{t("Voir tout", "See all")}<LinkArrow /></Link> : undefined}>
        {servers.length ? <AgentCards label={t("Outils à brancher", "Tools to plug in") as string}>{servers.map(serverRow)}</AgentCards>
          : <EmptyState icon={<SearchCheck />} title={t("Aucun outil ne réunit ces filtres.", "No tool matches these filters.") as string}
            action={<Chip onClick={() => setActive([])}>{t("Retirer les filtres", "Clear filters")}</Chip>} />}
      </CatalogSection>
    )}
    {view !== "mcp" && skills.length > 0 && (
      <CatalogSection id="agents-skills" title={t("Savoir-faire des éditeurs", "Vendors' know-how")} count={skills.length}
        action={view === "all" ? <Link to={`${prefix}/skills`} className={linkClass()}>{t("Voir tout", "See all")}<LinkArrow /></Link> : undefined}>
        <AgentCards label={t("Savoir-faire des éditeurs", "Vendors' know-how") as string}>{(view === "all" ? skills.slice(0, 12) : skills).map(skillRow)}</AgentCards>
      </CatalogSection>
    )}
  </>;
  const count = view === "mcp" ? servers.length : view === "skills" ? skills.length : undefined;

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={view === "all"
        ? [{ label: t("Agents IA", "AI agents") as string }]
        : [{ label: t("Agents IA", "AI agents") as string, href: `${prefix}/agents` }, { label: t(...TITLES[view]) as string }]} />
      <CatalogTitle title={t(...TITLES[view]) as string} count={count} countLabel={count === undefined ? undefined : t("fiches", "sheets") as string}
        lead={t(...LEADS[view]) as string} />

      {hub ? <>
        <CatalogSection id="agents-needs" title={t("Que voulez-vous que votre assistant fasse ?", "What do you want your assistant to do?")}>
          <NeedPicker needs={NEEDS} cards={SERVERS} lang={lang} toolName={toolName} logo={logo} renderSheetLink={sheetLink} />
        </CatalogSection>
        <CatalogSection id="agents-stack" title={t("Avec votre stack", "With your stack")}>
          <StackAgents items={stackItems} lang={lang} renderSheetLink={sheetLink}
            renderToolLink={(slug, className, content) => <Link to={`${prefix}/tool/${slug}`} className={className}>{content}</Link>}
            renderStackLink={(className, content, attrs) => <Link to={`${prefix}/ma-stack`} className={className} {...attrs}>{content}</Link>} />
        </CatalogSection>
        <CatalogSection id="agents-start" title={t("Par où commencer", "Where to start")}>
          <StartHere lang={lang} renderGuideLink={(className, content) => <Link to={`${prefix}/guide/${lang === "en" ? GUIDE.en : GUIDE.fr}`} className={className}>{content}</Link>} />
        </CatalogSection>
        <CatalogSection id="agents-all" title={t("Toute la liste", "The full list")}>
          {tabs}
        </CatalogSection>
        {list}
      </> : <>
        {tabs}
        {list}
      </>}
    </Page>
  );
};

export default AgentsIndexPage;
