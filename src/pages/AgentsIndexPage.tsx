import { useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { useStackPins } from "@/hooks/useStackPins";
import { useAgentAssistant } from "@/hooks/useAgentAssistant";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import Breadcrumb from "@/components/Breadcrumb";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import ToolMediaCard from "@/components/tool/ToolMediaCard";
import Page from "@/ds/Page/Page";
import Logo from "@/ds/Logo/Logo";
import { CatalogSection, CatalogTitle } from "@/ds/Catalog/Catalog";
import { MediaCards } from "@/ds/MediaCard/MediaCard";
import { Notice } from "@/ds/Notice/Notice";
import { ToolRow, ToolRows } from "@/ds/ToolSheet/ToolSheet";
import { LinkArrow, TextButton, linkClass } from "@/ds/Button/Button";
import { AgentRowNote, RecipeCards, type RecipeItem } from "@/ds/AgentHub/AgentHub";
import { ClientMark } from "@/ds/AgentSheet/AgentSheet";
import Tabs from "@/ds/Tabs/Tabs";
import { Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { agentShelves } from "@/lib/agentShelves";
import { SERVERS, featuredServers, recipesFor, reportRows, serverFoot, stackHeadline, type HubAssistant } from "@/lib/agentReport";
import { runCatalogFilter } from "@/hooks/useCatalogStickyToolbar";
import skillsIndex from "@/data/agents/skills_index.json";
import { cardLine, say, serverName, skillFoot, typo, type Lang, type McpCard, type SkillCard } from "@/lib/agents";

/*
 * The agents section on the hubs' template (step 8, 18/11/2026; Michael: « cette page n'utilise pas encore les codes
 * du hub »). Like Outils, Stacks and Comparatifs: the catalogue title, the sticky CatalogToolbar (Tout and the shelves,
 * the assistant at its right where the others have « Filtres » or « Trier »), « À la une » in the catalogue's media
 * cards, then the shelves as the catalogue's compact rows. The report on your stack lives in Ma stack: here, one line
 * that leads there. /mcp is the same page without « À la une ». /skills stays an index. « MCP » stays in the SEO titles.
 */
export type AgentsView = "all" | "mcp" | "skills";
const SKILLS = skillsIndex as SkillCard[];

const TITLES: Record<AgentsView, [string, string]> = { all: ["Votre assistant IA", "Your AI assistant"], mcp: ["Outils à brancher", "Tools to plug in"], skills: ["Savoir-faire pour développeurs", "Know-how for developers"] };
const SEO_TITLES: Record<AgentsView, [string, string]> = {
  all: ["Votre assistant IA : ce qu'il peut faire dans vos outils (MCP)", "Your AI assistant: what it can do in your tools (MCP)"],
  mcp: ["Serveurs MCP officiels : brancher vos outils à votre assistant IA", "Official MCP servers: plug your tools into your AI assistant"],
  skills: ["Skills officiels : le savoir-faire des éditeurs pour votre assistant IA", "Official skills: vendors' know-how for your AI assistant"],
};
const LEADS: Record<AgentsView, [string, string]> = {
  all: ["Les outils qui se branchent officiellement à votre assistant, et ce qu'il peut y faire.", "The tools that officially plug into your assistant, and what it can do there."],
  mcp: ["Tous les outils du catalogue qui se branchent officiellement à votre assistant IA.", "Every catalogue tool that officially plugs into your AI assistant."],
  skills: ["Pour développeurs : des modes d'emploi publiés par les éditeurs, que votre assistant de code suit pour mieux travailler dans leur outil. Ceux de Notion et de Zapier s'utilisent sans rien installer.", "For developers: instructions published by vendors that your coding assistant follows to work better in their tool. Notion's and Zapier's need nothing installed."],
};
const PATHS: Record<AgentsView, string> = { all: "agents", mcp: "mcp", skills: "skills" };
const GUIDE = { fr: "mcp-freelances-non-developpeurs", en: "mcp-for-non-developer-freelancers" };
const ASSISTANT_LABELS: Record<HubAssistant, [string, string]> = { claude: ["Claude", "Claude"], chatgpt: ["ChatGPT", "ChatGPT"], gemini: ["Gemini", "Gemini"], copilot: ["Copilot", "Copilot"], other: ["Autre", "Other"] };
/** Rows a shelf shows before « Voir tout »: two rows of three on a computer. */
const SHELF_ROWS = 6;

const AgentsIndexPage = ({ view }: { view: AgentsView }) => {
  const { lang: rawLang, prefix, t } = useLang();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
  const { state } = useStackPins();
  const [assistant, setAssistant] = useAgentAssistant();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

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

  // Your stack, read only (Ma stack composes it): one line that leads to its report, and the recipes of two of its tools.
  const pinned = state.pinnedToolSlugs;
  const rows = useMemo(() => reportRows(pinned, assistant), [pinned, assistant]);
  const recipes: RecipeItem[] = recipesFor(pinned, assistant).map((recipe) => ({
    id: recipe.id, request: lang === "en" ? recipe.request.en : recipe.request.fr,
    sides: recipe.sides.map((side) => ({ name: toolName(side.host_tool), logo: logo(side.host_tool), ...(side.gravest ? { gravest: side.gravest } : {}) })),
  }));

  // The shelves (Explorer's need universes) and the chip that filters them, kept in the address like the other hubs.
  const shelves = agentShelves(SERVERS, lang);
  const shelfId = shelves.some((shelf) => shelf.id === searchParams.get("rayon")) ? searchParams.get("rayon")! : "all";
  const setShelf = (id: string) => setSearchParams((params) => { const next = new URLSearchParams(params); if (id === "all") next.delete("rayon"); else next.set("rayon", id); return next; }, { replace: true, preventScrollReset: true });
  const shown = shelfId === "all" ? shelves : shelves.filter((shelf) => shelf.id === shelfId);

  const sheetLink = (slug: string, className: string, content: ReactNode) => <Link to={`${prefix}/mcp/${slug}`} className={className}>{content}</Link>;
  const serverRow = (card: McpCard) => {
    const tool = toolOf(card.host_tool);
    const status = serverFoot(card, assistant, lang)[0].kind as "one_click" | "configure" | "elsewhere";
    const gravest = (["pay", "delete", "send", "write", "read"] as const).find((kind) => card.kinds.includes(kind));
    return (
      <ToolRow key={card.slug} logo={tool ? <Logo tool={tool} size={40} /> : <Plug />}
        name={serverName(card, toolName(card.host_tool), SERVERS.some((other) => other.host_tool === card.host_tool && other.slug !== card.slug), lang)}
        note={<AgentRowNote lang={lang} status={status} summary={card.card ? say(lang, card.card) : cardLine(say(lang, card.summary))} {...(gravest ? { gravest } : {})} />}
        renderMain={(className, content) => sheetLink(card.slug, className, content)} />
    );
  };

  const featured = view === "all" && shelfId === "all" ? featuredServers(assistant) : [];
  const featuredCard = (card: McpCard) => {
    const tool = toolOf(card.host_tool);
    if (!tool) return null;
    return <ToolMediaCard key={card.slug} priority lang={lang} tool={tool} dataTool={card.host_tool}
      category={shelves.find((shelf) => shelf.cards.includes(card))?.short}
      reason={card.card ? say(lang, card.card) : cardLine(say(lang, card.summary))}
      renderLink={(className, content) => sheetLink(card.slug, className, content)} />;
  };

  const skillRow = (skill: SkillCard) => {
    const tool = toolOf(skill.host_tool);
    return <ToolRow key={skill.slug} logo={tool ? <Logo tool={tool} size={40} /> : <Plug />} name={skill.name}
      note={<AgentRowNote lang={lang} summary={cardLine(say(lang, skill.summary))} meta={skillFoot(skill, lang)[0]} />}
      renderMain={(className, content) => <Link to={`${prefix}/skills/${skill.slug}`} className={className}>{content}</Link>} />;
  };

  if (view === "skills") {
    // /skills by tool: those that need nothing installed first (Notion, Zapier), then the others by size.
    const skillShelves = [...new Set(SKILLS.map((skill) => skill.host_tool))]
      .map((tool) => ({ tool, name: toolName(tool), skills: SKILLS.filter((skill) => skill.host_tool === tool) }))
      .sort((a, b) => Number(b.skills.some((k) => k.everyone)) - Number(a.skills.some((k) => k.everyone)) || b.skills.length - a.skills.length);
    return (
      <Page>
        <Breadcrumb includeSchema={false} items={[{ label: t(...TITLES.all) as string, href: `${prefix}/agents` }, { label: t(...TITLES.skills) as string }]} />
        <CatalogTitle title={t(...TITLES.skills) as string} count={SKILLS.length} countLabel={t("fiches", "sheets") as string} lead={t(...LEADS.skills) as string} />
        {skillShelves.map((shelf) => (
          <CatalogSection key={shelf.tool} id={`skills-shelf-${shelf.tool}`} title={shelf.name} count={shelf.skills.length}>
            <ToolRows>{shelf.skills.map(skillRow)}</ToolRows>
          </CatalogSection>
        ))}
      </Page>
    );
  }

  const assistantLabel = (assistantName ? t(`Avec ${assistantName}`, `With ${assistantName}`) : t("Votre assistant", "Your assistant")) as string;
  return (
    <div className="tt-catalog-page" data-catalog="" data-agents-hub={view}>
      <Page>
        <Breadcrumb includeSchema={false} items={view === "all"
          ? [{ label: t(...TITLES.all) as string }]
          : [{ label: t(...TITLES.all) as string, href: `${prefix}/agents` }, { label: t(...TITLES.mcp) as string }]} />
        <CatalogTitle sentinelRef={toolbarSentinelRef} title={t(...TITLES[view]) as string} lead={t(...LEADS[view]) as string} />
        <CatalogToolbar
          stuck={toolbarStuck}
          navLabel={t("Filtrer par famille", "Filter by family") as string}
          pills={[{ id: "all", label: t("Tout", "All") as string, active: shelfId === "all", onClick: () => setShelf("all") },
            ...shelves.map((shelf) => ({ id: shelf.id, label: shelf.short, active: shelfId === shelf.id, onClick: () => setShelf(shelf.id) }))]}
          panelTitle={t("Votre assistant", "Your assistant") as string}
          moreLabel={assistantLabel}
          closeLabel={t("Fermer", "Close") as string}
          panel={<Tabs label={t("Quel assistant utilisez-vous ?", "Which assistant do you use?") as string} value={assistant} onChange={(value) => setAssistant(value)}
            tabs={(["claude", "chatgpt", "gemini"] as const).map((value) => ({ value, label: ASSISTANT_LABELS[value][lang === "en" ? 1 : 0], icon: <ClientMark client={value} size={20} /> }))}
            more={{ label: t("Autre", "Other") as string, icon: <ClientMark client="any" size={20} />, menuLabel: t("Autre assistant", "Another assistant") as string, closeLabel: t("Fermer", "Close") as string,
              options: [{ value: "copilot" as const, label: "Copilot", icon: <ClientMark client="copilot" size={20} /> },
                { value: "other" as const, label: t("Un autre assistant", "Another assistant") as string, icon: <ClientMark client="any" size={20} /> }] }} />} />

        {pinned.length > 0 && (
          <Notice tone="line" name="agents-stack" icon={<Plug />} title={typo(stackHeadline(rows, assistant, lang))}
            actions={<Link to={`${prefix}/ma-stack#assistant`} className={linkClass()}>{t("Voir le bilan", "See the report")}<LinkArrow shown /></Link>} />
        )}

        {featured.length > 0 && (
          <CatalogSection id="agents-featured-title" title={t("À la une", "Featured")}>
            <MediaCards label={t("À la une", "Featured") as string}>{featured.map(featuredCard)}</MediaCards>
          </CatalogSection>
        )}

        {/* Recipes (step 6): two tools of your stack, both plugged into this assistant; only with a stack. */}
        {view === "all" && shelfId === "all" && recipes.length > 0 && (
          <CatalogSection id="agents-recipes-title" title={t("Avec deux de vos outils", "With two of your tools")}>
            <RecipeCards lang={lang} items={recipes} />
          </CatalogSection>
        )}

        {shown.map((shelf) => {
          const all = shelfId !== "all" || shelf.cards.length <= SHELF_ROWS;
          return (
            <CatalogSection key={shelf.id} id={`agents-shelf-${shelf.id}`} title={shelf.title} count={shelf.cards.length}
              action={all ? undefined : <TextButton arrow onClick={() => { void runCatalogFilter(() => setShelf(shelf.id)); }}>{t("Voir tout", "See all")}</TextButton>}>
              <ToolRows>{(all ? shelf.cards : shelf.cards.slice(0, SHELF_ROWS)).map(serverRow)}</ToolRows>
            </CatalogSection>
          );
        })}

        <p><Link to={`${prefix}/guide/${lang === "en" ? GUIDE.en : GUIDE.fr}`} className={linkClass()}>{t("Le guide pour bien commencer", "The guide to get started")}<LinkArrow shown /></Link></p>
      </Page>
    </div>
  );
};

export default AgentsIndexPage;
