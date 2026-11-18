import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import Breadcrumb from "@/components/Breadcrumb";
import Page from "@/ds/Page/Page";
import Logo from "@/ds/Logo/Logo";
import { McpSheetView, RelatedCard, RelatedCards, SkillSheetView } from "@/ds/AgentSheet/AgentSheet";
import { AgentCard, AgentCards, AgentShelf } from "@/ds/AgentHub/AgentHub";
import Button, { TextButton } from "@/ds/Button/Button";
import { useAddToStack } from "@/hooks/useAddToStack";
import { useStackPins } from "@/hooks/useStackPins";
import { Check, Plus, Plug } from "@/lib/icons";
import { setSeoTags, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import catalog from "@/data/agents/catalog.json";
import { byLine, cardLine, cardSentence, clientName, forEveryone, say, serverName, skillFoot, type Lang, type McpSheet, type SkillSheet } from "@/lib/agents";
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
      summary={cardLine((lang === "en" ? toolOf(toolSlug)?.shortDescriptionEn : undefined) ?? toolOf(toolSlug)?.shortDescription)}
      facts={[{ kind: "tool", text: t("Prix, avis et alternatives", "Pricing, reviews and alternatives") as string }]}
      renderLink={(className, content) => <Link to={`${prefix}/tool/${toolSlug}`} className={className}>{content}</Link>}
      action={<Button variant="secondary" icon={inStack ? <Check /> : <Plus />} disabled={inStack || flyingSlug === toolSlug}
        onClick={(event) => addToStack(toolSlug, name, { origin: event.currentTarget })}>
        {inStack ? t("Dans ma stack", "In my stack") : t("Ajouter à ma stack", "Add to my stack")}
      </Button>} />
  );
  const serverCard = (s: McpSheet) => (
    <AgentCard key={s.slug} icon={logo(s.host_tool)} name={nameOf(s)} by={byLine(s.publisher, lang)} summary={s.card ? say(lang, s.card) : cardLine(say(lang, s.summary))} facts={serverFoot({ setup: s.setup, kinds: [...new Set([...(s.tools ?? []).map((tool) => tool.kind), ...(s.capabilities ?? []).map((line) => line.kind)])] }, assistant, lang)}
      renderLink={(className, content) => <Link to={`${prefix}/mcp/${s.slug}`} className={className}>{content}</Link>} />
  );
  const skillCard = (k: SkillSheet) => (
    <AgentCard key={k.slug} icon={logo(k.host_tool)} name={k.name} by={byLine(k.publisher, lang)} summary={cardLine(say(lang, k.summary))}
      facts={skillFoot(k, lang)}
      renderLink={(className, content) => <Link to={`${prefix}/skills/${k.slug}`} className={className}>{content}</Link>} />
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
    const big = (toolSlug: string) => { const tool = toolOf(toolSlug); return tool ? <Logo tool={tool} size={40} /> : <Plug />; };
    const hostTool = toolOf(server.host_tool);
    const toolRelated = (
      <RelatedCard key="tool" logo={big(server.host_tool)} role={t("La fiche de l'outil", "The tool's page") as string} name={hostName}
        sentence={short((lang === "en" ? hostTool?.shortDescriptionEn : undefined) ?? hostTool?.shortDescription)}
        cta={t("Prix, avis et alternatives", "Pricing, reviews and alternatives") as string}
        renderLink={(className, content) => <Link to={`${prefix}/tool/${server.host_tool}`} className={className}>{content}</Link>}
        extra={inStack ? undefined : <TextButton tone="quiet" disabled={flyingSlug === server.host_tool} onClick={(event) => addToStack(server.host_tool, hostName, { origin: event.currentTarget })}>{t("Ajouter à ma stack", "Add to my stack")}</TextButton>} />
    );
    const altRelated = (s: McpSheet) => (
      <RelatedCard key={s.slug} logo={big(s.host_tool)} role={t("Une alternative qui se branche", "An alternative that plugs in") as string} name={nameOf(s)}
        sentence={s.card ? say(lang, s.card) : short(say(lang, s.summary))} cta={t("Voir la fiche", "See the page") as string}
        renderLink={(className, content) => <Link to={`${prefix}/mcp/${s.slug}`} className={className}>{content}</Link>} />
    );
    const skillRelated = (k: SkillSheet) => (
      <RelatedCard key={k.slug} logo={big(k.host_tool)} role={t(`Un savoir-faire de ${k.publisher}`, `A know-how from ${k.publisher}`) as string} name={k.name}
        sentence={short(say(lang, k.summary))} cta={t("Voir le savoir-faire", "See the know-how") as string}
        renderLink={(className, content) => <Link to={`${prefix}/skills/${k.slug}`} className={className}>{content}</Link>} />
    );
    const row = [toolRelated, ...alternatives.slice(0, 1).map(altRelated), ...(skills.length ? [skillRelated(skills[0])] : []),
      ...alternatives.slice(1).map(altRelated), ...siblings.map(altRelated)].slice(0, 3);
    related = <RelatedCards label={t("Pour aller plus loin", "Going further") as string}>{row}</RelatedCards>;
  } else if (skill) {
    const parent = SERVERS.find((s) => s.slug === skill.server);
    const others = SKILLS.filter((k) => k.server === skill.server && k.slug !== skill.slug).slice(0, 8);
    related = <>
      <AgentCards flat label={t("Le branchement et l'outil", "The connection and the tool") as string}>{parent && serverCard(parent)}{toolCard(skill.host_tool, hostName)}</AgentCards>
      {others.length > 0 && (
        <AgentShelf title={t(`Autres savoir-faire de ${skill.publisher}`, `Other ${skill.publisher} know-how`) as string} count={others.length}>
          <AgentCards flat label={t("Savoir-faire", "Know-how") as string}>{others.map(skillCard)}</AgentCards>
        </AgentShelf>
      )}
    </>;
  }

  return (
    <Page>
      <Breadcrumb includeSchema={false} items={[
        { label: t("Votre assistant IA", "Your AI assistant") as string, href: `${prefix}/agents` },
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
