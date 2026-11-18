import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Logo from "@/ds/Logo/Logo";
import { McpSheetView, SkillSheetView } from "@/ds/AgentSheet/AgentSheet";
import MediaCard, { MediaCards } from "@/ds/MediaCard/MediaCard";
import { toolTagline } from "@/data/toolTaglines";
import ToolMediaCard from "@/components/tool/ToolMediaCard";
import { AgentRowNote } from "@/ds/AgentHub/AgentHub";
import { CatalogSection } from "@/ds/Catalog/Catalog";
import { ToolRow, ToolRows } from "@/ds/ToolSheet/ToolSheet";
import { Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import catalog from "@/data/agents/catalog.json";
import { cardLine, cardSentence, clientName, forEveryone, say, serverName, skillFoot, type Lang, type McpSheet, type SkillSheet } from "@/lib/agents";
import NotFound from "@/pages/NotFound";
import { useAgentAssistant } from "@/hooks/useAgentAssistant";
import { serverFoot } from "@/lib/agentReport";

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
  const [assistant] = useAgentAssistant();
  const lang: Lang = rawLang === "en" ? "en" : "fr";
  const { tools } = useToolSummaries();
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
  // Step 8 (18/11/2026): the skill sheet's related sheets are the catalogue's rows, one line of meta, no « Par X · Officiel ».
  const rowLogo = (toolSlug: string) => { const tool = toolOf(toolSlug); return tool ? <Logo tool={tool} size={40} /> : <Plug />; };
  const toolCard = (toolSlug: string, name: string) => (
    <ToolRow key={`tool-${toolSlug}`} logo={rowLogo(toolSlug)} name={name}
      note={<AgentRowNote lang={lang} summary={cardLine((lang === "en" ? toolOf(toolSlug)?.shortDescriptionEn : undefined) ?? toolOf(toolSlug)?.shortDescription)} meta={{ kind: "tool", text: t("Prix, avis et alternatives", "Pricing, reviews and alternatives") as string }} />}
      renderMain={(className, content) => <Link to={`${prefix}/tool/${toolSlug}`} className={className}>{content}</Link>} />
  );
  const serverCard = (s: McpSheet) => (
    <ToolRow key={s.slug} logo={rowLogo(s.host_tool)} name={nameOf(s)}
      note={<AgentRowNote lang={lang} assistant={assistant === "other" ? null : ({ claude: "Claude", chatgpt: "ChatGPT", gemini: "Gemini", copilot: "Copilot" } as const)[assistant]} summary={s.card ? say(lang, s.card) : cardLine(say(lang, s.summary))} status={serverFoot({ setup: s.setup, kinds: [] }, assistant, lang)[0].kind as "one_click" | "configure" | "elsewhere"} />}
      renderMain={(className, content) => <Link to={`${prefix}/mcp/${s.slug}`} className={className}>{content}</Link>} />
  );
  const skillCard = (k: SkillSheet) => (
    <ToolRow key={k.slug} logo={rowLogo(k.host_tool)} name={k.name}
      note={<AgentRowNote lang={lang} summary={cardLine(say(lang, k.summary))} meta={skillFoot(k, lang)[0]} />}
      renderMain={(className, content) => <Link to={`${prefix}/skills/${k.slug}`} className={className}>{content}</Link>} />
  );

  let related;
  if (server) {
    // A know-how is offered here only when a non-developer can use it: nothing to install (step 5, 17/11).
    const skills = SKILLS.filter((k) => server.skills?.includes(k.slug) && forEveryone(k));
    const siblings = SERVERS.filter((s) => s.host_tool === server.host_tool && s.slug !== server.slug);
    const alternatives = ((host as { alternatives?: string[] } | undefined)?.alternatives ?? [])
      .flatMap((alt) => SERVERS.filter((s) => s.host_tool === alt)).slice(0, 6);
    // « Pour aller plus loin »: the tool, an alternative that plugs in, a know-how of the vendor, on one card template;
    // empty places take other alternatives, then the tool's other server. Sentences are written for cards, never cut.
    const short = (text?: string) => { if (!text) return undefined; const first = cardSentence(text); return text.length <= 110 ? text : first.length <= 110 ? first : undefined; };
    // Step 8b (18/11/2026): the catalogue's media cards, as on /fr/tools — the tag says what the card is, the tool's card
    // carries the system's « Ajouter à ma stack » (bookmark, its states); no local type, no local action.
    const media = (toolSlug: string, name: string, category: string, reason: string | undefined, href: string) => {
      const tool = toolOf(toolSlug);
      if (!tool) return null;
      return <ToolMediaCard key={href} size="s" lang={lang} tool={{ ...tool, name }} dataTool={toolSlug} category={category} {...(reason ? { reason } : {})}
        renderLink={(className, content) => <Link to={href} className={className}>{content}</Link>} />;
    };
    const hostTool = toolOf(server.host_tool);
    const toolRelated = media(server.host_tool, hostName, t("La fiche de l'outil", "The tool's page") as string,
      toolTagline(server.host_tool, lang) || short((lang === "en" ? hostTool?.shortDescriptionEn : undefined) ?? hostTool?.shortDescription), `${prefix}/tool/${server.host_tool}`);
    const altRelated = (s: McpSheet) => media(s.host_tool, nameOf(s), t("Se branche aussi", "Plugs in too") as string, s.card ? say(lang, s.card) : short(say(lang, s.summary)), `${prefix}/mcp/${s.slug}`);
    // A know-how is not a tool to add: the system's plain media card, its vendor's mark on a raised tile, no bookmark.
    const skillRelated = (k: SkillSheet) => {
      const tool = toolOf(k.host_tool);
      const reason = short(say(lang, k.summary));
      return tool ? <MediaCard key={k.slug} size="s" lang={lang} tool={{ ...tool, name: k.name }} category={t("Savoir-faire", "Know-how") as string} {...(reason ? { reason } : {})}
        renderLink={(className, content) => <Link to={`${prefix}/skills/${k.slug}`} className={className}>{content}</Link>} /> : null;
    };
    const row = [toolRelated, ...alternatives.slice(0, 1).map(altRelated), ...(skills.length ? [skillRelated(skills[0])] : []),
      ...alternatives.slice(1).map(altRelated), ...siblings.map(altRelated)].filter(Boolean).slice(0, 3);
    related = <CatalogSection as="h3" id="sheet-further-title" title={t("Pour aller plus loin", "Going further")}>
      <MediaCards size="s" label={t("Pour aller plus loin", "Going further") as string}>{row}</MediaCards>
    </CatalogSection>;
  } else if (skill) {
    const parent = SERVERS.find((s) => s.slug === skill.server);
    const others = SKILLS.filter((k) => k.server === skill.server && k.slug !== skill.slug).slice(0, 8);
    related = <>
      <ToolRows>{parent && serverCard(parent)}{toolCard(skill.host_tool, hostName)}</ToolRows>
      {others.length > 0 && (
        <CatalogSection id="skill-others-title" title={t(`Autres savoir-faire de ${skill.publisher}`, `Other ${skill.publisher} know-how`) as string} count={others.length}>
          <ToolRows>{others.map(skillCard)}</ToolRows>
        </CatalogSection>
      )}
    </>;
  }

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={[
        { label: t("Outils pour l'IA", "Tools for AI") as string, href: `${prefix}/agents` },
        kind === "mcp" ? { label: t("Outils à brancher", "Tools to plug in") as string, href: `${prefix}/mcp` } : { label: t("Savoir-faire", "Know-how") as string, href: `${prefix}/skills` },
        { label: kind === "mcp" && siblingCount === 0 ? hostName : sheet.name },
      ]} />
      {server
        ? <McpSheetView sheet={server} logo={host ? <Logo tool={host} size={40} /> : undefined} title={t(`Brancher ${hostName} à votre assistant`, `Plug ${hostName} into your assistant`) as string} toolName={hostName} lang={lang} pageUrl={url} reportHref={reportHref} related={related} />
        : <SkillSheetView skill={skill!} lang={lang} logo={host ? <Logo tool={host} size={40} /> : undefined} reportHref={reportHref} related={related} />}
    </Page>
  );
};

export default AgentSheetPage;
