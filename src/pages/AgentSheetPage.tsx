import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Logo from "@/ds/Logo/Logo";
import { CatalogSection, CatalogTitle } from "@/ds/Catalog/Catalog";
import { McpSheetView, SkillSheetView } from "@/ds/AgentSheet/AgentSheet";
import { AgentCard, AgentCards } from "@/ds/AgentHub/AgentHub";
import Button from "@/ds/Button/Button";
import { useAddToStack } from "@/hooks/useAddToStack";
import { useStackPins } from "@/hooks/useStackPins";
import { Check, Plus, Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import catalog from "@/data/agents/catalog.json";
import { byLine, cardSentence, clientName, say, serverFacts, serverName, type Lang, type McpSheet, type SkillSheet } from "@/lib/agents";
import NotFound from "@/pages/NotFound";

/*
 * A sheet of the agents section: /mcp/:slug (an official MCP server, « brancher Notion à votre assistant ») or
 * /skills/:slug (an official skill, « savoir-faire »). The sheet tells a story in chapters (S1 bis); « MCP » stays
 * in the SEO title.
 * The server sheet lists its skills and the tool's alternatives that also have a server; the skill sheet
 * leads back to its server and to the tool page.
 */
const SERVERS = catalog.servers as McpSheet[];
const SKILLS = catalog.skills as SkillSheet[];

const AgentSheetPage = ({ kind }: { kind: "mcp" | "skill" }) => {
  const { slug = "" } = useParams();
  const { lang: rawLang, prefix, t } = useLang();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
  const { state } = useStackPins();
  const { addToStack, flyingSlug } = useAddToStack();
  const server = kind === "mcp" ? SERVERS.find((s) => s.slug === slug) : undefined;
  const skill = kind === "skill" ? SKILLS.find((s) => s.slug === slug) : undefined;
  const sheet = server ?? skill;
  const host = sheet ? tools.find((tool) => (tool.slug || tool.id) === sheet.host_tool) : undefined;
  const hostName = host?.name ?? sheet?.publisher ?? "";

  useEffect(() => {
    if (!sheet) return;
    const title = kind === "mcp"
      ? t(`Brancher ${hostName} à votre assistant IA : ${sheet.name}, serveur MCP officiel`, `Plug ${hostName} into your AI assistant: ${sheet.name}, official MCP server`)
      : t(`${sheet.name} : skill officiel de ${sheet.publisher} pour votre assistant IA`, `${sheet.name}: ${sheet.publisher}'s official skill for your AI assistant`);
    const description = say(lang, sheet.summary);
    const url = `${SEO_BASE}${prefix}/${kind === "mcp" ? "mcp" : "skills"}/${sheet.slug}`;
    setSeoTags({ title: `${title} | ToolTrim`, description, url });
    setJsonLd("agent-sheet-jsonld", {
      "@context": "https://schema.org", "@type": "SoftwareApplication", name: sheet.name, description, url,
      applicationCategory: kind === "mcp" ? "MCP server" : "Agent skill", publisher: { "@type": "Organization", name: sheet.publisher },
      dateModified: sheet.verified_on,
    });
    return () => cleanupSeo(["agent-sheet-jsonld"]);
  }, [sheet, kind, lang, prefix, t, hostName]);

  if (!sheet) return <NotFound />;
  const siblingCount = SERVERS.filter((s) => s.host_tool === sheet.host_tool && s.slug !== sheet.slug).length;

  const url = `${SEO_BASE}${prefix}/${kind === "mcp" ? "mcp" : "skills"}/${sheet.slug}`;
  const reportHref = `${prefix}/contact?subject=${encodeURIComponent(t(`Correction de fiche : ${sheet.name} (${url})`, `Page correction: ${sheet.name} (${url})`) as string)}`;
  const toolOf = (toolSlug: string) => tools.find((x) => (x.slug || x.id) === toolSlug);
  const logo = (toolSlug: string) => { const tool = toolOf(toolSlug); return tool ? <Logo tool={tool} size={24} /> : <Plug />; };
  const nameOf = (s: McpSheet) => serverName(s, toolOf(s.host_tool)?.name ?? s.publisher, SERVERS.some((o) => o.host_tool === s.host_tool && o.slug !== s.slug), lang);
  const inStack = state.pinnedToolSlugs.includes(sheet.host_tool);
  const toolCard = (toolSlug: string, name: string) => (
    <AgentCard key={`tool-${toolSlug}`} icon={logo(toolSlug)} name={name} by={t("Fiche outil ToolTrim", "ToolTrim tool page") as string}
      summary={(lang === "en" ? toolOf(toolSlug)?.shortDescriptionEn : undefined) ?? toolOf(toolSlug)?.shortDescription}
      facts={[{ kind: "tool", text: t("Prix, avis et alternatives", "Pricing, reviews and alternatives") as string }]}
      renderLink={(className, content) => <Link to={`${prefix}/tool/${toolSlug}`} className={className}>{content}</Link>}
      action={<Button variant="secondary" icon={inStack ? <Check /> : <Plus />} disabled={inStack || flyingSlug === toolSlug}
        onClick={(event) => addToStack(toolSlug, name, { origin: event.currentTarget })}>
        {inStack ? t("Dans ma stack", "In my stack") : t("Ajouter à ma stack", "Add to my stack")}
      </Button>} />
  );
  const serverCard = (s: McpSheet) => (
    <AgentCard key={s.slug} icon={logo(s.host_tool)} name={nameOf(s)} by={byLine(s.publisher, lang)} summary={s.card ? say(lang, s.card) : cardSentence(say(lang, s.summary))} facts={serverFacts(s, lang)}
      renderLink={(className, content) => <Link to={`${prefix}/mcp/${s.slug}`} className={className}>{content}</Link>} />
  );
  const skillCard = (k: SkillSheet) => (
    <AgentCard key={k.slug} icon={logo(k.host_tool)} name={k.name} by={byLine(k.publisher, lang)} summary={cardSentence(say(lang, k.summary))}
      facts={[{ kind: "skill", text: t("Savoir-faire", "Know-how") as string }, { kind: "assistant", text: k.agents.length > 3 ? t(`${k.agents.length} assistants`, `${k.agents.length} assistants`) as string : k.agents.map((a) => clientName(a, lang)).join(", ") }]}
      renderLink={(className, content) => <Link to={`${prefix}/skills/${k.slug}`} className={className}>{content}</Link>} />
  );

  let related;
  if (server) {
    const skills = SKILLS.filter((k) => server.skills?.includes(k.slug));
    const siblings = SERVERS.filter((s) => s.host_tool === server.host_tool && s.slug !== server.slug);
    const alternatives = ((host as { alternatives?: string[] } | undefined)?.alternatives ?? [])
      .flatMap((alt) => SERVERS.filter((s) => s.host_tool === alt)).slice(0, 6);
    related = <>
      <CatalogSection id="agent-tool" title={t("L'outil", "The tool")}>
        <AgentCards label={t("L'outil", "The tool") as string}>{toolCard(server.host_tool, hostName)}{siblings.map(serverCard)}</AgentCards>
      </CatalogSection>
      {skills.length > 0 && <CatalogSection id="agent-skills" title={t("Ses savoir-faire officiels", "Its official know-how")} count={skills.length}><AgentCards label={t("Savoir-faire", "Know-how") as string}>{skills.map(skillCard)}</AgentCards></CatalogSection>}
      {alternatives.length > 0 && <CatalogSection id="agent-alternatives" title={t("Alternatives qui se branchent aussi", "Alternatives that also plug in")} count={alternatives.length}><AgentCards label={t("Alternatives", "Alternatives") as string}>{alternatives.map(serverCard)}</AgentCards></CatalogSection>}
    </>;
  } else if (skill) {
    const parent = SERVERS.find((s) => s.slug === skill.server);
    const others = SKILLS.filter((k) => k.server === skill.server && k.slug !== skill.slug).slice(0, 8);
    related = <>
      <CatalogSection id="agent-server" title={t("Le branchement et l'outil", "The connection and the tool")}>
        <AgentCards label={t("Le branchement et l'outil", "The connection and the tool") as string}>{parent && serverCard(parent)}{toolCard(skill.host_tool, hostName)}</AgentCards>
      </CatalogSection>
      {others.length > 0 && <CatalogSection id="agent-siblings" title={t(`Autres savoir-faire de ${skill.publisher}`, `Other ${skill.publisher} know-how`)} count={others.length}><AgentCards label={t("Savoir-faire", "Know-how") as string}>{others.map(skillCard)}</AgentCards></CatalogSection>}
    </>;
  }

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={[
        { label: t("Agents IA", "AI agents") as string, href: `${prefix}/agents` },
        kind === "mcp" ? { label: t("Outils à brancher", "Tools to plug in") as string, href: `${prefix}/mcp` } : { label: t("Savoir-faire", "Know-how") as string, href: `${prefix}/skills` },
        { label: kind === "mcp" && siblingCount === 0 ? hostName : sheet.name },
      ]} />
      {server
        ? <McpSheetView sheet={server} logo={host ? <Logo tool={host} size={48} /> : undefined} title={t(`Brancher ${hostName} à votre assistant`, `Plug ${hostName} into your assistant`) as string} toolName={hostName} lang={lang} pageUrl={url} reportHref={reportHref} related={related} />
        : <>
          <CatalogTitle title={sheet.name} lead={t(`Un savoir-faire officiel de ${sheet.publisher} pour votre assistant.`, `Official know-how from ${sheet.publisher} for your assistant.`) as string} />
          <SkillSheetView skill={skill!} lang={lang} reportHref={reportHref} related={related} />
        </>}
    </Page>
  );
};

export default AgentSheetPage;
