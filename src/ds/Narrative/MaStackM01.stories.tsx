import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { formatAmount } from "@/lib/currencyRates";
import { Plus } from "@/lib/icons";
import Page from "../Page/Page";
import Logo from "../Logo/Logo";
import Button, { linkClass, LinkArrow } from "../Button/Button";
import Chip, { Chips } from "../Chip/Chip";
import Choice, { Choices } from "../Choice/Choice";
import Decision from "../Decision/Decision";
import MediaCard, { MediaCards } from "../MediaCard/MediaCard";
import { FigureCard, FigureCards } from "../Catalog/Catalog";
import { NoticeRows } from "../Notice/Notice";
import Split from "../Split/Split";
import ToolCard, { ToolCards, ToolGroup, ToolGroups } from "../ToolCard/ToolCard";
import { SearchField } from "../ToolSearch/ToolSearch";
import { Section, SectionHead } from "../Toolbar/Toolbar";
import { Key, StoryHero } from "./Narrative";

/*
 * Mission M01 (docs/missions/M01-ma-stack.md), 14/11/2026: the page reads « constat → compréhension → décision ».
 * A dashboard first (14/11, Michael: « on doit voir des éléments de présentation de ton stack »): the stack in figures,
 * where the budget goes, what to look at, every tool with its role.
 * 3. Un pas à la fois: each finding becomes one decision; the price only shows up there.
 * Built only from the design system; proposal to review, nothing wired to the page yet.
 */
const meta: Meta = { title: "Ma stack/Proposition M01", tags: ["a-valider", "!visual"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);
const tool = (name: string, slug: string) => ({ id: slug, name, slug });
const faces = (...tools: [string, string][]) => <>{tools.map(([name, slug]) => <Logo key={slug} tool={tool(name, slug)} size={24} localOnly />)}</>;
const href = (id: string) => (className: string, content: React.ReactNode) => <a className={className} href={`#${id}`}>{content}</a>;

/** The tools of the example stack, as the dashboard reads them. */
type Item = { name: string; slug: string; monthly: number; area: "create" | "organise" | "talk"; role: [string, string]; overlap?: boolean };
const AREAS = { create: { fr: "Créer", en: "Create", color: "var(--tt-area-2)" }, organise: { fr: "Organiser", en: "Organize", color: "var(--tt-area-1)" }, talk: { fr: "Communiquer", en: "Communicate", color: "var(--tt-area-3)" } };
const STACK: Item[] = [
  { name: "Figma", slug: "figma", monthly: 15, area: "create", role: ["Maquettes et interfaces", "Mock-ups and interfaces"], overlap: true },
  { name: "Canva", slug: "canva", monthly: 11.99, area: "create", role: ["Visuels réseaux sociaux", "Social media visuals"], overlap: true },
  { name: "Notion", slug: "notion", monthly: 0, area: "organise", role: ["Notes, projets et wiki client", "Notes, projects and client wiki"] },
  { name: "Slack", slug: "slack", monthly: 0, area: "talk", role: ["Échanges avec vos clients", "Talking with your clients"] },
];

/** The dashboard: the stack in figures, where the money goes, what to look at, then every tool. */
function Dashboard({ lang, decided }: { lang: Lang; decided: boolean }) {
  const items = decided ? STACK.filter((item) => item.slug !== "canva").map((item) => ({ ...item, overlap: false })) : STACK;
  const monthly = items.reduce((sum, item) => sum + item.monthly, 0);
  const areas = (Object.keys(AREAS) as Item["area"][]).map((id, index) => ({ id, label: t(lang, AREAS[id].fr, AREAS[id].en), color: `var(--tt-area-${index + 1})`,
    tools: items.filter((item) => item.area === id).map((item) => ({ id: item.slug, name: item.name, slug: item.slug, amount: item.monthly })) }))
    .map((area) => ({ ...area, amount: area.tools.reduce((sum, tool) => sum + tool.amount, 0) }));
  const watch = [
    ...(decided ? [] : [{ id: "overlap", label: t(lang, "Figma et Canva font tous deux des visuels", "Figma and Canva both make visuals"), action: <a className={linkClass()} href="#m01-next">{t(lang, "Décider", "Decide")}<LinkArrow /></a> }]),
    { id: "gap", label: t(lang, "Aucun outil pour facturer", "No tool to invoice"), action: <a className={linkClass()} href="#m01-ideas">{t(lang, "Voir des pistes", "See options")}<LinkArrow /></a> },
  ];
  return (
    <Page rhythm="chapters">
      <Page group>
        <StoryHero eyebrow={t(lang, "Ma stack", "My stack")}
          title={lang === "fr" ? <>{items.length} outils, <Key>{money(lang, monthly)}</Key> par mois.</> : <>{items.length} tools, <Key>{money(lang, monthly)}</Key> a month.</>}
          lead={decided ? t(lang, "Un outil par métier. Il reste à couvrir la facturation.", "One tool per trade. Invoicing is still to cover.")
            : t(lang, "Deux outils font la même chose, et rien ne facture.", "Two tools do the same job, and nothing invoices.")}
          aside={<Button variant="raised" icon={<Plus aria-hidden />}>{t(lang, "Ajouter un outil", "Add a tool")}</Button>} />
        <FigureCards label={t(lang, "Votre stack en chiffres", "Your stack in figures")}>
          <FigureCard figure={String(items.length)} name={t(lang, "Outils", "Tools")} detail={t(lang, "3 métiers couverts", "3 trades covered")} renderLink={href("tools")} />
          <FigureCard figure={money(lang, Math.round(monthly))} unit={t(lang, "/mois", "/mo")} name={t(lang, "Budget mensuel", "Monthly budget")} detail={t(lang, `${money(lang, Math.round(monthly * 12))} par an`, `${money(lang, Math.round(monthly * 12))} a year`)} renderLink={href("budget")} />
          <FigureCard figure={decided ? "0" : "1"} name={t(lang, "Doublon possible", "Possible overlap")} detail={decided ? t(lang, "Tout est clair", "All clear") : "Figma · Canva"} renderLink={href("m01-next")} />
          <FigureCard figure="1" name={t(lang, "Métier non couvert", "Trade not covered")} detail={t(lang, "Facturer", "Invoicing")} renderLink={href("m01-ideas")} />
        </FigureCards>
      </Page>

      <Section labelledBy="m01-budget">
        <SectionHead title={t(lang, "Où va votre budget", "Where your budget goes")} titleId="m01-budget" />
        <Split lang={lang} areas={areas} format={(n) => money(lang, n)} unpriced={[]} rateDate={null} localLogosOnly />
      </Section>

      <Section labelledBy="m01-watch">
        <SectionHead title={t(lang, "À regarder", "Worth a look")} titleId="m01-watch" />
        <NoticeRows rows={watch} />
      </Section>

      <Section labelledBy="m01-tools">
        <SectionHead title={t(lang, "Mes outils", "My tools")} titleId="m01-tools" note={t(lang, "Ce que chacun fait pour vous.", "What each one does for you.")} />
        <ToolGroups label={t(lang, "Mes outils", "My tools")} layout="list" grouped editing={false}>
          {(Object.keys(AREAS) as Item["area"][]).map((id) => { const tools = items.filter((item) => item.area === id); return tools.length > 0 &&
            <ToolGroup key={id} label={t(lang, AREAS[id].fr, AREAS[id].en)} color={AREAS[id].color} note={tools.map((item) => `${item.name} : ${t(lang, item.role[0], item.role[1])}`).join(" · ")}>
              <ToolCards layout="list">{tools.map((item) => <ToolCard key={item.slug} lang={lang} tool={{ id: item.slug, name: item.name, slug: item.slug }}
                amount={item.monthly === 0 ? t(lang, "Gratuit", "Free") : money(lang, item.monthly)} monthly={item.monthly > 0} status={item.overlap ? "overlap" : "ok"} onOpen={() => {}} onRemove={() => {}} localLogosOnly />)}</ToolCards>
            </ToolGroup>; })}
        </ToolGroups>
      </Section>

      {!decided && <NextDecision lang={lang} />}
      <Next lang={lang} />
    </Page>
  );
}

/** Un pas à la fois: the finding of the bilan, as one decision; the price helps here and nowhere else. */
function NextDecision({ lang }: { lang: Lang }) {
  return (
    <Section labelledBy="m01-next">
      <SectionHead title={t(lang, "Votre prochaine décision", "Your next decision")} titleId="m01-next" note={t(lang, "Figma et Canva font tous deux des visuels.", "Figma and Canva both make visuals.")} />
      <Decision lang={lang} kind="pair" eyebrow={t(lang, "Créer", "Create")} step={{ current: 1, total: 2 }}
        title={t(lang, "Figma et Canva, vous gardez les deux ?", "Figma and Canva, keep both?")}
        detail={t(lang, "Les deux font des visuels. Figma conçoit des interfaces, Canva produit vite pour les réseaux. Si vous ne faites que l'un des deux, un seul suffit.",
          "Both make visuals. Figma designs interfaces, Canva produces fast for social media. If you only do one of the two, one is enough.")}
        links={[{ label: t(lang, "Plus tard", "Later"), onClick: () => {}, quiet: true }]}>
        <Choices>
          <Choice pair media={<>{faces(["Figma", "figma"], ["Canva", "canva"])}</>} name={t(lang, "Garder les deux", "Keep both")}
            note={t(lang, "Ils font deux métiers différents pour vous", "They do two different jobs for you")} amount={money(lang, 26.99)} unit={t(lang, "/mois", "/mo")} onClick={() => {}} />
          <Choice media={<Logo tool={tool("Figma", "figma")} localOnly />} name={t(lang, "Garder Figma", "Keep Figma")}
            note={t(lang, `Canva sort de la stack · ${money(lang, 11.99)}/mois en moins`, `Canva leaves the stack · ${money(lang, 11.99)}/mo less`)} amount={money(lang, 15)} unit={t(lang, "/mois", "/mo")} onClick={() => {}} />
          <Choice media={<Logo tool={tool("Canva", "canva")} localOnly />} name={t(lang, "Garder Canva", "Keep Canva")}
            note={t(lang, `Figma sort de la stack · ${money(lang, 15)}/mois en moins`, `Figma leaves the stack · ${money(lang, 15)}/mo less`)} amount={money(lang, 11.99)} unit={t(lang, "/mois", "/mo")} onClick={() => {}} />
        </Choices>
      </Decision>
    </Section>
  );
}

/** Et pour la suite: each idea names the gap it fills, never « alternative au catalogue ». */
function Next({ lang }: { lang: Lang }) {
  const ideas: [string, string, string, string][] = [
    ["Tiime", "tiime", "Facturer et suivre vos paiements, gratuitement.", "Invoice and track payments, for free."],
    ["Indy", "indy", "Facturer et tenir votre comptabilité au même endroit.", "Invoice and keep your books in one place."],
    ["Freebe", "freebe", "Facturer et suivre votre temps par client.", "Invoice and track your time per client."],
  ];
  return (
    <Section labelledBy="m01-ideas">
      <SectionHead title={t(lang, "Pour facturer", "To invoice")} titleId="m01-ideas"
        note={t(lang, "Votre stack ne facture pas encore. Trois façons de combler ce trou.", "Your stack doesn't invoice yet. Three ways to fill the gap.")} />
      <MediaCards label={t(lang, "Pistes pour facturer", "Options to invoice")}>
        {ideas.map(([name, slug, fr, en]) => <MediaCard key={slug} lang={lang} tool={tool(name, slug)} category={t(lang, "Facturation", "Invoicing")} reason={t(lang, fr, en)}
          image={<span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Logo tool={tool(name, slug)} size={40} localOnly /></span>}
          renderLink={href(slug)} add={{ state: "idle", onAdd: () => {} }} localLogosOnly />)}
      </MediaCards>
    </Section>
  );
}

/** 1. Vide: the promise, then the shortest way to a first tool; its role shows as soon as it is added. */
function Empty({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const frequent = ["Notion", "Figma", "Canva", "Slack", "Google Workspace", "Trello"];
  return (
    <Page rhythm="chapters">
      <StoryHero eyebrow={t(lang, "Ma stack", "My stack")}
        title={t(lang, "Voyez ce que vos outils font pour vous.", "See what your tools do for you.")}
        lead={t(lang, "Ajoutez ceux que vous utilisez. On vous montre ce que votre stack sait faire, ce qui fait doublon et ce qui manque.",
          "Add the ones you use. We show you what your stack can do, what overlaps and what's missing.")} />
      <Section labelledBy="m01-start">
        <SectionHead title={t(lang, "Vos outils", "Your tools")} titleId="m01-start" />
        <SearchField id="m01-search" value={query} onChange={setQuery} label={t(lang, "Chercher un outil", "Search a tool")}
          placeholder={t(lang, "Notion, Figma, Qonto…", "Notion, Figma, Qonto…")} />
        <Chips label={t(lang, "Outils fréquents", "Frequent tools")}>
          {frequent.map((name) => <Chip key={name}>{name}</Chip>)}
        </Chips>
      </Section>
    </Page>
  );
}

/** 2. Bilan: the dashboard with one overlap and one gap. 3. After the decision: the same dashboard, cleared. */
function Review({ lang }: { lang: Lang }) { return <Dashboard lang={lang} decided={false} />; }
function Decided({ lang }: { lang: Lang }) { return <Dashboard lang={lang} decided />; }

export const Vide: Story = { render: (_a, { globals: { lang } }) => <Empty lang={lang} /> };
export const Bilan: Story = { render: (_a, { globals: { lang } }) => <Review lang={lang} /> };
export const ApresDecision: Story = { name: "Après décision", render: (_a, { globals: { lang } }) => <Decided lang={lang} /> };
