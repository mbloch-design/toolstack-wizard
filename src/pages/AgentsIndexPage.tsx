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
import { applyAgentsSeo, cleanupSeo } from "@/lib/seo";
import { AGENTS_JSONLD_ID, AGENTS_LABELS, agentsIndexSeo, agentsTrail, type AgentsView } from "@/lib/agentsSeo";
import { atoms } from "@/ds/atoms";
import { CompareMark, CompareTable } from "@/ds/Table/Table";
import { agentShelves } from "@/lib/agentShelves";
import { SERVERS, featuredServers, hasVerdict, recipesFor, reportRows, serverFoot, stackHeadline, type HubAssistant } from "@/lib/agentReport";
import { runCatalogFilter } from "@/hooks/useCatalogStickyToolbar";
import skillsIndex from "@/data/agents/skills_index.json";
import { PLAN_WORDS, cardLine, skillTitle, say, serverName, skillFoot, typo, type Lang, type McpCard, type SkillCard } from "@/lib/agents";

/*
 * The agents section on the hubs' template (step 8, 18/11/2026; Michael: « cette page n'utilise pas encore les codes
 * du hub »). Like Outils, Stacks and Comparatifs: the catalogue title, the sticky CatalogToolbar (Tout and the shelves,
 * the assistant at its right where the others have « Filtres » or « Trier »), « À la une » in the catalogue's media
 * cards, then the shelves as the catalogue's compact rows. The report on your stack lives in Ma stack: here, one line
 * that leads there. /mcp is the same page without « À la une ». /skills stays an index. « MCP » stays in the SEO titles.
 */
export type { AgentsView };
const SKILLS = skillsIndex as SkillCard[];

// The names are the SEO module's, so that the H1, the breadcrumb and the JSON-LD say the same (step 9).
const TITLES = Object.fromEntries((["all", "mcp", "skills"] as const).map((view) => [view, [AGENTS_LABELS[view].fr, AGENTS_LABELS[view].en]])) as Record<AgentsView, [string, string]>;
const LEADS: Record<AgentsView, [string, string]> = {
  all: ["Les outils qui se branchent officiellement à votre assistant, et ce qu'il peut y faire.", "The tools that officially plug into your assistant, and what it can do there."],
  mcp: ["Les serveurs officiels que les éditeurs du catalogue ouvrent à votre assistant IA, côte à côte : ce qu'il peut y faire, le forfait demandé, les assistants qui le branchent directement.", "The official servers the catalogue's vendors open to your AI assistant, side by side: what it can do there, the plan it needs, the assistants that plug it in directly."],
  skills: ["Pour développeurs : des modes d'emploi publiés par les éditeurs, que votre assistant de code suit pour mieux travailler dans leur outil. Ceux de Notion et de Zapier s'utilisent sans rien installer.", "For developers: instructions published by vendors that your coding assistant follows to work better in their tool. Notion's and Zapier's need nothing installed."],
};
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
    applyAgentsSeo(agentsIndexSeo(view, lang, { servers: SERVERS, skills: SKILLS }), AGENTS_JSONLD_ID, lang);
    return () => cleanupSeo([AGENTS_JSONLD_ID]);
  }, [view, lang]);
  const trail = agentsTrail(lang, view).map((step) => ({ label: step.label, ...(step.path ? { href: `${prefix}${step.path}` } : {}) }));

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
        note={<AgentRowNote lang={lang} status={status} assistant={assistantName} summary={card.card ? say(lang, card.card) : cardLine(say(lang, card.summary))} {...(gravest ? { gravest } : {})} />}
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
    return <ToolRow key={skill.slug} logo={tool ? <Logo tool={tool} size={40} /> : <Plug />} name={skillTitle(skill, lang)}
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
        <Breadcrumb includeSchema={false} items={trail} />
        <CatalogTitle title={t(...TITLES.skills) as string} count={SKILLS.length} countLabel={t("fiches", "sheets") as string} lead={t(...LEADS.skills) as string} />
        {skillShelves.map((shelf) => (
          <CatalogSection key={shelf.tool} id={`skills-shelf-${shelf.tool}`} title={shelf.name} count={shelf.skills.length}>
            <ToolRows>{shelf.skills.map(skillRow)}</ToolRows>
          </CatalogSection>
        ))}
      </Page>
    );
  }

  if (view === "mcp") {
    // /mcp, the official servers compared (step 9; Michael, 18/11: option b): one row per server, what the assistant can
    // do there, the plan, the assistants that plug it in directly; then how to read it and where to start.
    const KIND_COLUMNS = [["read", "Lit", "Reads"], ["write", "Modifie", "Edits"], ["delete", "Supprime", "Deletes"], ["send", "Envoie ou publie", "Sends or posts"], ["pay", "Paie", "Pays"]] as const;
    const direct = (card: McpCard) => (["claude", "chatgpt", "gemini", "copilot"] as const).filter((a) => (card.setup ?? []).some((w) => w.assistant === a)).map((a) => ASSISTANT_LABELS[a][0]);
    const sorted = [...SERVERS].sort((a, b) => toolName(a.host_tool).localeCompare(toolName(b.host_tool)) || a.slug.localeCompare(b.slug));
    const p = (fr: string, en: string) => <p className={atoms.text}>{t(fr, en)}</p>;
    return (
      <Page>
        <Breadcrumb includeSchema={false} items={trail} />
        <CatalogTitle title={t(...TITLES.mcp) as string} lead={t(...LEADS.mcp) as string} />
        <CatalogSection id="mcp-compare-title" title={t(`Les ${SERVERS.length} serveurs côte à côte`, `The ${SERVERS.length} servers side by side`)}>
          <CompareTable labelledBy="mcp-compare-title" headLabel={t("Outil", "Tool") as string}
            columns={[...KIND_COLUMNS.map(([key, fr, en]) => ({ key, label: t(fr, en) as string, marks: true })),
              { key: "plan", label: t("Forfait", "Plan") as string }, { key: "assistants", label: t("Se branche directement à", "Plugs straight into") as string }]}
            rows={sorted.map((card) => {
              const tool = toolOf(card.host_tool);
              const names = direct(card);
              return {
                key: card.slug, logo: tool ? <Logo tool={tool} size={24} /> : <Plug />,
                head: <Link to={`${prefix}/mcp/${card.slug}`} className={linkClass()}>{serverName(card, toolName(card.host_tool), SERVERS.some((other) => other.host_tool === card.host_tool && other.slug !== card.slug), lang)}</Link>,
                cells: {
                  ...Object.fromEntries(KIND_COLUMNS.map(([key]) => [key, <CompareMark key={key} on={card.capability_kinds.includes(key)} label={t(card.capability_kinds.includes(key) ? "Oui" : "Non", card.capability_kinds.includes(key) ? "Yes" : "No") as string} />])),
                  plan: t(PLAN_WORDS[card.plan][0], PLAN_WORDS[card.plan][1]),
                  assistants: names.length ? names.join(", ") : t("Par une adresse ou une installation", "Through an address or an install"),
                },
              };
            })} />
        </CatalogSection>
        <CatalogSection id="mcp-read-title" title={t("Comment lire ce tableau", "How to read this table")}>
          {p("Un serveur MCP est la prise qu'un éditeur ouvre pour que votre assistant IA, Claude, ChatGPT, Gemini ou Copilot, travaille dans son outil à votre place. Chaque ligne résume la fiche du serveur, vérifiée dans la documentation de l'éditeur à la date indiquée sur la fiche.",
            "An MCP server is the socket a vendor opens so that your AI assistant, Claude, ChatGPT, Gemini or Copilot, can work in its tool for you. Each row sums up the server's sheet, checked against the vendor's documentation on the date the sheet gives.")}
          {p("Les colonnes d'actions disent ce que l'assistant peut faire une fois branché : lire vos données, les modifier, les supprimer, envoyer ou publier en votre nom, payer. Une coche ne veut pas dire qu'il le fera seul : plusieurs serveurs demandent une confirmation, et la connexion permet souvent de limiter l'accès.",
            "The action columns say what the assistant can do once plugged in: read your data, change it, delete it, send or post in your name, pay. A tick does not mean it will act alone: several servers ask for a confirmation, and the connection often lets you limit access.")}
          {p("La colonne Forfait dit si le serveur marche sur l'offre gratuite ou demande un abonnement. La dernière colonne cite les assistants qui le branchent sans configuration ; les autres passent par une adresse à coller ou une installation, détaillée sur chaque fiche.",
            "The Plan column says whether the server works on the free offer or needs a subscription. The last column names the assistants that plug it in with no setup; the others go through an address to paste or an install, explained on each sheet.")}
        </CatalogSection>
        <CatalogSection id="mcp-start-title" title={t("Par où commencer", "Where to start")}>
          {p("Commencez par un outil que vous ouvrez tous les jours et par des demandes de lecture : résumer, retrouver, lister. Gardez pour plus tard ce qui supprime, envoie ou paie, et regardez sur la fiche comment couper l'accès.",
            "Start with a tool you open every day and with reading requests: summarise, find, list. Keep what deletes, sends or pays for later, and check on the sheet how to cut access.")}
          <p className={atoms.text}><Link to={`${prefix}/guide/${lang === "en" ? GUIDE.en : GUIDE.fr}`} className={linkClass()}>{t("Le guide pour freelances non développeurs", "The guide for non-developer freelancers")}<LinkArrow shown /></Link></p>
          <p className={atoms.text}><Link to={`${prefix}/agents`} className={linkClass()}>{t("Choisir par besoin, avec votre stack", "Choose by need, with your stack")}<LinkArrow shown /></Link></p>
          <p className={atoms.text}><Link to={`${prefix}/skills`} className={linkClass()}>{t("Les skills officiels, pour développeurs", "Official skills, for developers")}<LinkArrow shown /></Link></p>
        </CatalogSection>
      </Page>
    );
  }

  const assistantLabel = (assistantName ? t(`Avec ${assistantName}`, `With ${assistantName}`) : t("Votre assistant", "Your assistant")) as string;
  return (
    <div className="tt-catalog-page" data-catalog="" data-agents-hub={view}>
      <Page>
        <Breadcrumb includeSchema={false} items={trail} />
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

        {/* Your stack in plain words (step 8d): its report in Ma stack when ToolTrim has looked at one of its tools,
            otherwise a way to tell us which tools to look at — there is no report to see. */}
        {pinned.length > 0 && (
          <Notice tone="line" name="agents-stack" icon={<Plug />} title={typo(stackHeadline(rows, assistant, lang, toolName))}
            actions={hasVerdict(rows)
              ? <Link to={`${prefix}/ma-stack#assistant`} className={linkClass()}>{t("Voir le bilan", "See the report")}<LinkArrow shown /></Link>
              : <Link to={`${prefix}/contact?subject=${encodeURIComponent(t(`Outils à regarder pour les assistants IA : ${pinned.map(toolName).join(", ")}`, `Tools to look at for AI assistants: ${pinned.map(toolName).join(", ")}`) as string)}`} className={linkClass()}>{t("Nous le signaler", "Tell us")}<LinkArrow shown /></Link>} />
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

        {/* The section's other pages (step 9): the servers compared, the skills, the guide. */}
        <p className={atoms.text}><Link to={`${prefix}/guide/${lang === "en" ? GUIDE.en : GUIDE.fr}`} className={linkClass()}>{t("Le guide pour bien commencer", "The guide to get started")}<LinkArrow shown /></Link></p>
        <p className={atoms.text}><Link to={`${prefix}/mcp`} className={linkClass()}>{t(`Comparer les ${SERVERS.length} serveurs MCP officiels`, `Compare the ${SERVERS.length} official MCP servers`)}<LinkArrow shown /></Link></p>
        <p className={atoms.text}><Link to={`${prefix}/skills`} className={linkClass()}>{t("Les skills officiels, pour développeurs", "Official skills, for developers")}<LinkArrow shown /></Link></p>
      </Page>
    </div>
  );
};

export default AgentsIndexPage;
