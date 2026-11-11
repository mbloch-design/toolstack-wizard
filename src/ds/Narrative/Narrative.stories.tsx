import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import Page from "../Page/Page";
import Amount from "../Amount/Amount";
import { buttonAttrs, linkClass } from "../Button/Button";
import { Compass } from "@/lib/icons";
import Split from "../Split/Split";
import { splitStates } from "../Split/Split.fixtures";
import Decision from "../Decision/Decision";
import Choice, { Choices } from "../Choice/Choice";
import Logo from "../Logo/Logo";
import UsagePlay from "../UsagePlay/UsagePlay";
import MediaCard, { MediaCards } from "../MediaCard/MediaCard";
import * as Inventory from "../Inventory/Inventory.stories";
import { Ending, Key, StoryHero } from "./Narrative";
import { Section, SectionHead } from "../Toolbar/Toolbar";
import Bento, { Answer, Answers, BentoRow, MiniRing, Question, Tile } from "../Bento/Bento";
import { useState } from "react";

const meta: Meta = { title: "Ma stack/Page", tags: ["a-valider", "!visual"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);
const per = (lang: Lang) => t(lang, "/mois", "/mo");

type State = { decision: boolean; usage: boolean; saved: number | null; known: number };

/*
 * The page as one story. Each chapter opens with a sentence that takes up a figure of the one before
 * (78 € → 46 % → the two tools → the dust → 24 €), and the thread comes back before each of them.
 * A chapter with nothing to say leaves, and the story closes up.
 */
function Told({ lang, state }: { lang: Lang; state: State }) {
  const ctx = { globals: { lang } } as never;
  return (
    <Page rhythm="chapters">
      <Page group>
      <StoryHero greeting={t(lang, "Bonjour Camille", "Hi Camille")} eyebrow={t(lang, "Ma stack", "My stack")}
        title={<>{t(lang, "8 outils, ", "8 tools, ")}<Key>{money(lang, 78)}</Key>{t(lang, " par mois.", " a month.")}</>}
        lead={state.known < 8
          ? t(lang, `Soit 939 € par an, d’après ${state.known} prix sur 8. On affine en chemin.`, `That's €939 a year, from ${state.known} of 8 prices. We refine as we go.`)
          : t(lang, "Soit 939 € par an. Tous les prix sont renseignés.", "That's €939 a year. Every price is known.")}
        aside={<a {...buttonAttrs("raised")} href="#explorer"><Compass aria-hidden />{t(lang, "Explorer autour de ma stack", "Explore around my stack")}</a>} />

      <StoryBento lang={lang} state={state} />
      </Page>

      {Inventory.ByArea.render?.({ note: t(lang, "Les voici, rangés par domaine : 8 outils, 78 €/mois, 5 prix encore à préciser.", "Here they are, by area: 8 tools, €78/mo, 5 prices still to confirm.") } as never, ctx)}

      <Section labelledBy="story-next">
        <SectionHead title={t(lang, "Et pour la suite ?", "And next?")} titleId="story-next" note={t(lang, "D’autres approches autour de vos outils. La prochaine bonne pioche est peut-être ici.", "Fresh approaches around your tools. Your next good find could be here.")} />
        <MediaCards label={t(lang, "Idées à découvrir", "Ideas to discover")}>
          {[["Loom", "loom", ["Vidéo", "Video"], ["Montrer plutôt qu’écrire.", "Show instead of write."]], ["Make", "make", ["Automatisation", "Automation"], ["Pour relier vos outils sans code.", "To connect your tools without code."]], ["Airtable", "airtable", ["Bases de données", "Databases"], ["Pour structurer ce que Notion range en pages.", "To structure what Notion keeps as pages."]]].map(([name, slug, cat, why]) =>
            <MediaCard key={slug as string} lang={lang} tool={{ name: name as string, slug: slug as string }} image={<span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Logo tool={{ name: name as string, slug: slug as string }} size={40} localOnly /></span>}
              category={lang === "fr" ? (cat as string[])[0] : (cat as string[])[1]} reason={lang === "fr" ? (why as string[])[0] : (why as string[])[1]}
              renderLink={(className, content) => <a className={className} href={`#${slug}`}>{content}</a>} add={{ state: "idle", onAdd: () => {} }} localLogosOnly />)}
        </MediaCards>
      </Section>
    </Page>
  );
}

/*
 * The bento is the story: each tile is a chapter, its label names the moment (where the money goes,
 * what overlaps, what really serves, the result), its statement is the sentence. Read left to right,
 * top to bottom; a question tile leaves once answered, the result comes with the first saving.
 */
function StoryBento({ lang, state }: { lang: Lang; state: State }) {
  const [open, setOpen] = useState<string | null>(null);
  const more = (id: string, row: string[]) => ({ open: open === id, condensed: !!open && open !== id && row.includes(open), onToggle: () => setOpen((v) => (v === id ? null : id)),
    moreLabel: t(lang, "Voir le détail", "See the detail"), lessLabel: t(lang, "Réduire", "Collapse") });
  const tiles: { id: string; node: (row: string[]) => React.ReactNode }[] = [
    { id: "split", node: (row) => <Tile key="split" span={5} label={t(lang, "Où va l’argent", "Where the money goes")} art={<MiniRing parts={[{ color: "var(--tt-area-1)", share: 0.46 }, { color: "var(--tt-area-2)", share: 0.38 }, { color: "var(--tt-area-3)", share: 0.16 }]} />}
      statement={<Key>46&nbsp;%</Key>}
      status={{ text: t(lang, "pour vous organiser. Notion pèse le plus lourd.", "to get organised. Notion weighs the most.") }}
      detail={<Split {...splitStates.threeAreas(lang)} dense localLogosOnly />} {...more("split", row)} /> },
  ];
  if (state.decision) tiles.push({ id: "decision", node: (row) => <Tile key="decision" span={7} tone="question" label={t(lang, "Ce qui se recoupe · 1 sur 3", "What overlaps · 1 of 3")}
    art={<a className={linkClass()} href="#compare">{t(lang, "Comparer", "Compare")}</a>} condensed={!!open && open !== "decision" && row.includes(open)}>
    <Question media={<><Logo tool={{ name: "Notion", slug: "notion" }} size={32} localOnly /></>}>{<>{t(lang, "Et ", "And ")}<Key tone="overlap">{t(lang, "deux outils", "two tools")}</Key>{t(lang, " font le même travail. Lequel gardez-vous ?", " do the same job. Which one stays?")}</>}</Question>
    <Choices label={t(lang, "Votre réponse", "Your answer")}>
      <Choice media={<Logo tool={{ name: "Notion", slug: "notion" }} size={32} localOnly />} name={t(lang, "Garder Notion", "Keep Notion")} amount={`−${money(lang, 24)}`} unit={per(lang)} saving onClick={() => {}} />
      <Choice media={<Logo tool={{ name: "Airtable", slug: "airtable" }} size={32} localOnly />} name={t(lang, "Garder Airtable", "Keep Airtable")} amount={`−${money(lang, 36)}`} unit={per(lang)} saving onClick={() => {}} />
      <Choice pair media={<><Logo tool={{ name: "Notion", slug: "notion" }} size={24} localOnly /><Logo tool={{ name: "Airtable", slug: "airtable" }} size={24} localOnly /></>} name={t(lang, "Garder les deux", "Keep both")} amount={t(lang, "Inchangé", "Unchanged")} onClick={() => {}} />
    </Choices>
  </Tile> });
  if (state.usage) tiles.push({ id: "usage", node: (row) => <Tile key="usage" span={row.length === 1 ? 12 : 5} tone="question" label={t(lang, "Ce qui sert vraiment · 2 cartes", "What really serves · 2 cards")}
    detail={<UsagePlay rows={[["Notion", "notion", 36], ["Loom", "loom", 15]].map(([name, slug, cost]) => ({ tool: { id: slug as string, name: name as string, slug: slug as string }, cost: cost as number, setUsage: () => {} }))} lang={lang} format={(n) => money(lang, n)} onReviewTools={() => {}} dense localLogosOnly />}
    {...more("usage", row)}>
    <Question media={<Logo tool={{ name: "Notion", slug: "notion" }} size={40} localOnly />}>{t(lang, "Notion, vous vous en servez vraiment ?", "Notion, do you really use it?")}</Question>
    <Answers label={t(lang, "Votre réponse", "Your answer")}>
      {[["Tous les jours", "Every day"], ["Parfois", "Sometimes"], ["Prend la poussière", "Gathers dust"]].map(([a, b], i) => <Answer key={a} name={t(lang, a, b)} tone={i === 2 ? "cut" : "ink"} onClick={() => {}} />)}
    </Answers>
  </Tile> });
  if (state.saved !== null) tiles.push({ id: "result", node: (row) => <Tile key="result" span={row.length === 1 ? 12 : 7} label={t(lang, "Résultat", "Result")}
    statement={<Ending figure={<Amount size="figure" tone="ink" value={`−${money(lang, state.saved!)}`} unit={per(lang)} />} />}
    status={{ text: t(lang, "Soit 288 € par an de gardés. Airtable a quitté la stack, sans regret.", "That's €288 a year kept. Airtable left the stack, no regrets."), done: true }} /> });
  // Two tiles a row, in the order of the story.
  const rows = [tiles.slice(0, 2), tiles.slice(2, 4)].filter((row) => row.length > 0);
  return <Bento label={t(lang, "Ma stack en bref", "My stack at a glance")}>
    {rows.map((row) => <BentoRow key={row.map((x) => x.id).join("-")}>{row.map((tile) => tile.node(row.map((x) => x.id)))}</BentoRow>)}
  </Bento>;
}

/** Much to decide: the story goes through every chapter. */
export const MuchToDecide: Story = { render: (_a, { globals: { lang } }) => <Told lang={lang} state={{ decision: true, usage: true, saved: null, known: 3 }} /> };
/** One question left: the decision chapter has left, the usage game remains, the first saving shows. */
export const OneLeft: Story = { render: (_a, { globals: { lang } }) => <Told lang={lang} state={{ decision: false, usage: true, saved: 24, known: 6 }} /> };
/** Everything settled: premise, split, ending. The story is short because there is nothing left to ask. */
export const Settled: Story = { render: (_a, { globals: { lang } }) => <Told lang={lang} state={{ decision: false, usage: false, saved: 24, known: 8 }} /> };
