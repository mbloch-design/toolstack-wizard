import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Chip, { Chips, chipLinkAttrs } from "@/ds/Chip/Chip";
import Logo from "@/ds/Logo/Logo";
import { CatalogSection, CatalogTitle, EmptyState, FilterBar, LinkRow, LinkRows } from "@/ds/Catalog/Catalog";
import { useCatalogStickyToolbar, runCatalogFilter } from "@/hooks/useCatalogStickyToolbar";
import { Plug, SearchCheck } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import mcpIndex from "@/data/agents/mcp_index.json";
import skillsIndex from "@/data/agents/skills_index.json";
import { TRANSPORT_WORDS, say, type Lang, type McpCard, type SkillCard } from "@/lib/agents";

/*
 * The agents section (S1, 16/11/2026): the hub /agents (everything), /mcp (official MCP servers) and /skills
 * (official skills) of the catalogue's tools. Same page, three views: tabs are links, filters are chips.
 * Facts from the vendors' documentation; the words are ToolTrim's.
 */
export type AgentsView = "all" | "mcp" | "skills";
const SERVERS = mcpIndex as McpCard[];
const SKILLS = skillsIndex as SkillCard[];

type FilterId = "one_click" | "risky" | "remote" | "local" | "all_plans" | "oauth" | "claude" | "chatgpt" | "gemini" | "copilot";
const FILTERS: { id: FilterId; fr: string; en: string; test: (card: McpCard) => boolean }[] = [
  { id: "one_click", fr: "En un clic depuis ChatGPT ou Claude", en: "One click from ChatGPT or Claude", test: (c) => c.one_click.includes("claude") || c.one_click.includes("chatgpt") },
  { id: "risky", fr: "Peut supprimer ou payer", en: "Can delete or pay", test: (c) => c.kinds.includes("delete") || c.kinds.includes("pay") },
  { id: "remote", fr: "À distance", en: "Remote", test: (c) => c.transport === "remote" },
  { id: "local", fr: "Sur l'ordinateur", en: "On your computer", test: (c) => c.transport === "local" },
  { id: "all_plans", fr: "Tous les forfaits", en: "Every plan", test: (c) => c.plan === "all" },
  { id: "oauth", fr: "Connexion au compte", en: "Account sign-in", test: (c) => Boolean(c.auth?.includes("oauth")) },
  { id: "claude", fr: "Claude", en: "Claude", test: (c) => c.one_click.includes("claude") || Boolean(c.clients?.includes("claude")) },
  { id: "chatgpt", fr: "ChatGPT", en: "ChatGPT", test: (c) => c.one_click.includes("chatgpt") || Boolean(c.clients?.includes("chatgpt")) },
  { id: "gemini", fr: "Gemini", en: "Gemini", test: (c) => c.one_click.includes("gemini") || Boolean(c.clients?.includes("gemini")) },
  { id: "copilot", fr: "Copilot", en: "Copilot", test: (c) => c.one_click.includes("copilot") },
];

const TITLES: Record<AgentsView, [string, string]> = { all: ["Agents IA", "AI agents"], mcp: ["Serveurs MCP", "MCP servers"], skills: ["Skills", "Skills"] };
const LEADS: Record<AgentsView, [string, string]> = {
  all: ["Ce que votre assistant IA peut faire dans vos outils : les serveurs MCP et les skills officiels, vérifiés chez l'éditeur, avec le risque et le forfait.", "What your AI assistant can do in your tools: official MCP servers and skills, checked with the vendor, with the risk and the plan."],
  mcp: ["Les serveurs MCP officiels des outils du catalogue : ce que l'assistant peut lire, modifier, supprimer ou payer, et comment le brancher.", "Official MCP servers of the catalogue's tools: what the assistant can read, edit, delete or pay, and how to plug it in."],
  skills: ["Les skills officiels publiés par les éditeurs : des instructions prêtes à l'emploi pour votre agent, à côté de leur serveur.", "Official skills published by vendors: ready-made instructions for your agent, next to their server."],
};
const PATHS: Record<AgentsView, string> = { all: "agents", mcp: "mcp", skills: "skills" };
const AUTH_SHORT = { oauth: ["OAuth", "OAuth"], key: ["clé", "key"], none: ["sans", "none"] } as const;
const firstSentence = (text: string) => text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;

const AgentsIndexPage = ({ view }: { view: AgentsView }) => {
  const { lang: rawLang, prefix, t } = useLang();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
  const [active, setActive] = useState<FilterId[]>([]);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  const toolOf = (slug: string) => tools.find((tool) => (tool.slug || tool.id) === slug);

  const servers = useMemo(() => SERVERS.filter((card) => active.every((id) => FILTERS.find((f) => f.id === id)!.test(card))), [active]);
  const visibleServerSlugs = new Set(servers.map((card) => card.slug));
  const skills = active.length ? SKILLS.filter((skill) => skill.server && visibleServerSlugs.has(skill.server)) : SKILLS;

  useEffect(() => {
    const title = `${t(...TITLES[view])} | ToolTrim`;
    const description = t(...LEADS[view]);
    const url = `${SEO_BASE}${prefix}/${PATHS[view]}`;
    setSeoTags({ title, description, url });
    setJsonLd("agents-jsonld", { "@context": "https://schema.org", "@type": "CollectionPage", name: t(...TITLES[view]), description, url });
    return () => cleanupSeo(["agents-jsonld"]);
  }, [view, prefix, t]);

  const toggle = (id: FilterId) => void runCatalogFilter(() => setActive((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])));
  const logo = (slug: string) => { const tool = toolOf(slug); return tool ? <Logo tool={tool} size={24} /> : <Plug />; };
  const serverRow = (card: McpCard) => (
    <LinkRow key={card.slug} name={card.name} icon={logo(card.host_tool)} detail={firstSentence(say(lang, card.summary))}
      note={[card.transport && say(lang, TRANSPORT_WORDS[card.transport]), card.auth?.map((a) => say(lang, AUTH_SHORT[a])).join(" / ")].filter(Boolean).join(" · ") || undefined}
      renderLink={(className, content) => <Link to={`${prefix}/mcp/${card.slug}`} className={className}>{content}</Link>} />
  );
  const skillRow = (skill: SkillCard) => (
    <LinkRow key={skill.slug} name={skill.name} icon={logo(skill.host_tool)} detail={say(lang, skill.summary)} note={skill.publisher}
      renderLink={(className, content) => <Link to={`${prefix}/skills/${skill.slug}`} className={className}>{content}</Link>} />
  );
  const count = view === "mcp" ? servers.length : view === "skills" ? skills.length : servers.length + skills.length;

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={view === "all"
        ? [{ label: t("Agents IA", "AI agents") as string }]
        : [{ label: t("Agents IA", "AI agents") as string, href: `${prefix}/agents` }, { label: t(...TITLES[view]) as string }]} />
      <CatalogTitle title={t(...TITLES[view]) as string} count={count} countLabel={t("fiches", "sheets") as string}
        lead={t(...LEADS[view]) as string} sentinelRef={toolbarSentinelRef} />

      <nav aria-label={t("Rubriques", "Sections") as string}>
        <Chips label={t("Rubriques", "Sections") as string}>
          {(["all", "mcp", "skills"] as AgentsView[]).map((tab) => (
            <Link key={tab} to={`${prefix}/${PATHS[tab]}`} {...chipLinkAttrs(tab === view)}>{tab === "all" ? t("Tout", "All") : t(...TITLES[tab])}</Link>
          ))}
        </Chips>
      </nav>

      {view !== "skills" && (
        <FilterBar stuck={toolbarStuck} railLabel={t("Filtres", "Filters") as string}
          prevLabel={t("Filtres précédents", "Previous filters") as string} nextLabel={t("Filtres suivants", "Next filters") as string}
          rail={FILTERS.map((filter) => <Chip key={filter.id} pressed={active.includes(filter.id)} check onClick={() => toggle(filter.id)}>{t(filter.fr, filter.en)}</Chip>)} />
      )}

      {view !== "skills" && (
        <CatalogSection id="agents-servers" title={t("Serveurs MCP officiels", "Official MCP servers")} count={servers.length}
          action={view === "all" ? <Link to={`${prefix}/mcp`} {...chipLinkAttrs(false)}>{t("Voir tout", "See all")}</Link> : undefined}>
          {servers.length ? <LinkRows>{servers.map(serverRow)}</LinkRows>
            : <EmptyState icon={<SearchCheck />} title={t("Aucun serveur ne réunit ces filtres.", "No server matches these filters.") as string}
              action={<Chip onClick={() => setActive([])}>{t("Retirer les filtres", "Clear filters")}</Chip>} />}
        </CatalogSection>
      )}

      {view !== "mcp" && skills.length > 0 && (
        <CatalogSection id="agents-skills" title={t("Skills officiels", "Official skills")} count={skills.length}
          action={view === "all" ? <Link to={`${prefix}/skills`} {...chipLinkAttrs(false)}>{t("Voir tout", "See all")}</Link> : undefined}>
          <LinkRows>{(view === "all" ? skills.slice(0, 12) : skills).map(skillRow)}</LinkRows>
        </CatalogSection>
      )}
    </Page>
  );
};

export default AgentsIndexPage;
