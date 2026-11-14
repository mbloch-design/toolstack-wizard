import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { formatAmount } from "@/lib/currencyRates";
import { FolderKanban, MessagesSquare, Palette, Receipt } from "@/lib/icons";
import Page from "../Page/Page";
import Logo from "../Logo/Logo";
import { linkClass, LinkArrow } from "../Button/Button";
import Chip, { Chips } from "../Chip/Chip";
import Choice, { Choices } from "../Choice/Choice";
import Decision from "../Decision/Decision";
import MediaCard, { MediaCards } from "../MediaCard/MediaCard";
import { PlaceTile, PlaceTiles } from "../Catalog/Catalog";
import { SearchField } from "../ToolSearch/ToolSearch";
import { Section, SectionHead } from "../Toolbar/Toolbar";
import { Key, StoryHero } from "./Narrative";

/*
 * Mission M01 (docs/missions/M01-ma-stack.md), 14/11/2026: the page reads « constat → compréhension → décision ».
 * 1. Le bilan: one sentence that says what the stack does well and where it falls short.
 * 2. La carte: the stack by trade, each tool's role, the empty trades in plain sight.
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

/** La carte: one tile per trade; a trade nobody covers stays on the map, so the gap is seen. */
function Map({ lang, decided }: { lang: Lang; decided: boolean }) {
  return (
    <Section labelledBy="m01-map">
      <SectionHead title={t(lang, "Ce que votre stack sait faire", "What your stack can do")} titleId="m01-map"
        note={t(lang, "Vos outils rangés par métier, avec ce que chacun fait pour vous.", "Your tools by trade, with what each one does for you.")} />
      <PlaceTiles label={t(lang, "Vos métiers", "Your trades")}>
        <PlaceTile icon={<Palette />} name={t(lang, "Créer", "Create")} faces={decided ? faces(["Figma", "figma"]) : faces(["Figma", "figma"], ["Canva", "canva"])}
          detail={decided ? t(lang, "Figma : maquettes et interfaces", "Figma: mock-ups and interfaces") : t(lang, "Figma : maquettes · Canva : visuels réseaux", "Figma: mock-ups · Canva: social visuals")}
          note={decided ? undefined : t(lang, "Deux outils pour la même tâche ?", "Two tools for one job?")} renderLink={href("create")} />
        <PlaceTile icon={<FolderKanban />} name={t(lang, "Organiser", "Organise")} faces={faces(["Notion", "notion"])}
          detail={t(lang, "Notion : notes, projets et wiki client", "Notion: notes, projects and client wiki")} renderLink={href("organise")} />
        <PlaceTile icon={<MessagesSquare />} name={t(lang, "Communiquer", "Communicate")} faces={faces(["Slack", "slack"])}
          detail={t(lang, "Slack : échanges avec vos clients", "Slack: talking with your clients")} renderLink={href("communicate")} />
        <PlaceTile icon={<Receipt />} name={t(lang, "Facturer", "Invoice")}
          detail={t(lang, "Aucun outil pour l'instant", "No tool yet")} note={t(lang, "Voir des pistes", "See options")} renderLink={href("invoice")} />
      </PlaceTiles>
    </Section>
  );
}

/** Un pas à la fois: the finding of the bilan, as one decision; the price helps here and nowhere else. */
function NextDecision({ lang }: { lang: Lang }) {
  return (
    <Section labelledBy="m01-next">
      <SectionHead title={t(lang, "Votre prochaine décision", "Your next decision")} titleId="m01-next" />
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

/** 2. Bilan: the finding first, the map that proves it, the one decision that follows. */
function Review({ lang }: { lang: Lang }) {
  return (
    <Page rhythm="chapters">
      <StoryHero eyebrow={t(lang, "Ma stack · le bilan", "My stack · the review")}
        title={lang === "fr"
          ? <>4 outils. <Key tone="overlap">Deux font la même chose</Key>, et <Key>rien ne facture</Key>.</>
          : <>4 tools. <Key tone="overlap">Two do the same job</Key>, and <Key>nothing invoices</Key>.</>}
        lead={t(lang, "Voici ce que votre stack sait faire, et les deux points à regarder.", "Here's what your stack can do, and the two things to look at.")}
        aside={<a className={linkClass()} href="#m01-next">{t(lang, "Voir la décision", "See the decision")}<LinkArrow /></a>} />
      <Map lang={lang} decided={false} />
      <NextDecision lang={lang} />
      <Next lang={lang} />
    </Page>
  );
}

/** 3. Après décision: the review says what changed; the remaining gap leads on. */
function Decided({ lang }: { lang: Lang }) {
  return (
    <Page rhythm="chapters">
      <StoryHero eyebrow={t(lang, "Ma stack · le bilan", "My stack · the review")}
        title={lang === "fr"
          ? <>3 outils, <Key tone="gain">un par métier</Key>. Il reste à <Key>facturer</Key>.</>
          : <>3 tools, <Key tone="gain">one per trade</Key>. Invoicing is left.</>}
        lead={t(lang, `Vous avez gardé Figma : ${money(lang, 11.99)} de moins par mois. Décision modifiable à tout moment.`,
          `You kept Figma: ${money(lang, 11.99)} less a month. You can change this decision anytime.`)} />
      <Map lang={lang} decided />
      <Next lang={lang} />
    </Page>
  );
}

export const Vide: Story = { render: (_a, { globals: { lang } }) => <Empty lang={lang} /> };
export const Bilan: Story = { render: (_a, { globals: { lang } }) => <Review lang={lang} /> };
export const ApresDecision: Story = { name: "Après décision", render: (_a, { globals: { lang } }) => <Decided lang={lang} /> };
