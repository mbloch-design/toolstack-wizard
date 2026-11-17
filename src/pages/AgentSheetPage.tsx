import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Logo from "@/ds/Logo/Logo";
import { CatalogSection, CatalogTitle, LinkRow, LinkRows } from "@/ds/Catalog/Catalog";
import { McpSheetView, SkillSheetView } from "@/ds/AgentSheet/AgentSheet";
import { Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import catalog from "@/data/agents/catalog.json";
import { say, type Lang, type McpSheet, type SkillSheet } from "@/lib/agents";
import NotFound from "@/pages/NotFound";

/*
 * A sheet of the agents section: /mcp/:slug (an official MCP server) or /skills/:slug (an official skill).
 * The server sheet lists its skills and the tool's alternatives that also have a server; the skill sheet
 * leads back to its server and to the tool page.
 */
const SERVERS = catalog.servers as McpSheet[];
const SKILLS = catalog.skills as SkillSheet[];
const firstSentence = (text: string) => text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;

const AgentSheetPage = ({ kind }: { kind: "mcp" | "skill" }) => {
  const { slug = "" } = useParams();
  const { lang: rawLang, prefix, t } = useLang();
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
      ? t(`${sheet.name} : serveur MCP officiel de ${hostName}`, `${sheet.name}: ${hostName}'s official MCP server`)
      : t(`${sheet.name} : skill officiel de ${sheet.publisher}`, `${sheet.name}: ${sheet.publisher}'s official skill`);
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

  const logo = (toolSlug: string) => { const tool = tools.find((x) => (x.slug || x.id) === toolSlug); return tool ? <Logo tool={tool} size={24} /> : <Plug />; };
  const toolRow = (toolSlug: string, name: string, detail?: string) => (
    <LinkRow key={`tool-${toolSlug}`} name={name} icon={logo(toolSlug)} detail={detail}
      renderLink={(className, content) => <Link to={`${prefix}/tool/${toolSlug}`} className={className}>{content}</Link>} />
  );
  const serverRow = (s: McpSheet) => (
    <LinkRow key={s.slug} name={s.name} icon={logo(s.host_tool)} detail={firstSentence(say(lang, s.summary))}
      renderLink={(className, content) => <Link to={`${prefix}/mcp/${s.slug}`} className={className}>{content}</Link>} />
  );
  const skillRow = (k: SkillSheet) => (
    <LinkRow key={k.slug} name={k.name} icon={logo(k.host_tool)} detail={say(lang, k.summary)}
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
        <LinkRows>{toolRow(server.host_tool, hostName, t(`Prix, avis et alternatives de ${hostName}`, `${hostName}'s pricing, reviews and alternatives`))}{siblings.map(serverRow)}</LinkRows>
      </CatalogSection>
      {skills.length > 0 && <CatalogSection id="agent-skills" title={t("Ses skills officiels", "Its official skills")} count={skills.length}><LinkRows>{skills.map(skillRow)}</LinkRows></CatalogSection>}
      {alternatives.length > 0 && <CatalogSection id="agent-alternatives" title={t("Alternatives qui ont aussi un serveur", "Alternatives that also have a server")} count={alternatives.length}><LinkRows>{alternatives.map(serverRow)}</LinkRows></CatalogSection>}
    </>;
  } else if (skill) {
    const parent = SERVERS.find((s) => s.slug === skill.server);
    const others = SKILLS.filter((k) => k.server === skill.server && k.slug !== skill.slug).slice(0, 8);
    related = <>
      <CatalogSection id="agent-server" title={t("Son serveur et son outil", "Its server and tool")}>
        <LinkRows>{parent && serverRow(parent)}{toolRow(skill.host_tool, hostName, t(`Prix, avis et alternatives de ${hostName}`, `${hostName}'s pricing, reviews and alternatives`))}</LinkRows>
      </CatalogSection>
      {others.length > 0 && <CatalogSection id="agent-siblings" title={t(`Autres skills de ${skill.publisher}`, `Other ${skill.publisher} skills`)} count={others.length}><LinkRows>{others.map(skillRow)}</LinkRows></CatalogSection>}
    </>;
  }

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={[
        { label: t("Agents IA", "AI agents") as string, href: `${prefix}/agents` },
        kind === "mcp" ? { label: t("Serveurs MCP", "MCP servers") as string, href: `${prefix}/mcp` } : { label: "Skills", href: `${prefix}/skills` },
        { label: sheet.name },
      ]} />
      <CatalogTitle title={sheet.name}
        lead={kind === "mcp" ? t(`Serveur MCP officiel de ${sheet.publisher}.`, `${sheet.publisher}'s official MCP server.`) as string : t(`Skill officiel de ${sheet.publisher}.`, `${sheet.publisher}'s official skill.`) as string} />
      {server ? <McpSheetView sheet={server} lang={lang} related={related} /> : <SkillSheetView skill={skill!} lang={lang} related={related} />}
    </Page>
  );
};

export default AgentSheetPage;
