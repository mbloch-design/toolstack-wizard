import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import Bento, { Answer, Answers, LogoFan, MiniRing, Question, Tile } from "./Bento";
import Logo from "../Logo/Logo";
import Amount from "../Amount/Amount";
import { TextButton } from "../Button/Button";
import Page from "../Page/Page";
import * as Inventory from "../Inventory/Inventory.stories";

const meta: Meta = { title: "Ma stack/Bento (proposition)", tags: ["a-valider", "!visual"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);

const TOOLS = [{ name: "Notion", slug: "notion" }, { name: "Figma", slug: "figma" }, { name: "Canva", slug: "canva" }, { name: "Airtable", slug: "airtable" }, { name: "Loom", slug: "loom" }, { name: "Slack", slug: "slack" }];
const AREAS = [{ color: "var(--tt-area-1)", share: 0.51 }, { color: "var(--tt-area-2)", share: 0.38 }, { color: "var(--tt-area-3)", share: 0.11 }];
type Q = { tool: { name: string; slug: string }; question: [string, string]; answers: { name: [string, string]; amount?: number }[] };
const DECISIONS: Q[] = [
  { tool: { name: "Canva", slug: "canva" }, question: ["Quelle formule de Canva avez-vous ?", "Which Canva plan do you have?"], answers: [{ name: ["Gratuite", "Free"], amount: 0 }, { name: ["Pro", "Pro"], amount: 9.17 }, { name: ["Pro+", "Pro+"], amount: 14.17 }] },
  { tool: { name: "Airtable", slug: "airtable" }, question: ["Notion et Airtable rangent vos données. Vous gardez lequel ?", "Notion and Airtable both hold your data. Which one stays?"], answers: [{ name: ["Notion", "Notion"], amount: 36 }, { name: ["Airtable", "Airtable"], amount: 24 }, { name: ["Les deux", "Both"] }] },
];
const CARDS = [{ name: "Notion", slug: "notion", cost: 36 }, { name: "Loom", slug: "loom", cost: 15 }];

function LivingBento({ lang, decisions: d0 = 2, cards: c0 = 2 }: { lang: Lang; decisions?: number; cards?: number }) {
  const [decided, setDecided] = useState(DECISIONS.length - d0);
  const [played, setPlayed] = useState(CARDS.length - c0);
  const [leaving, setLeaving] = useState<string | null>(null);
  // The last answer of a tile lets it leave: it fades, then the grid closes up.
  const answer = (kind: "decision" | "usage") => {
    const last = kind === "decision" ? decided === DECISIONS.length - 1 : played === CARDS.length - 1;
    const next = () => (kind === "decision" ? setDecided((n) => n + 1) : setPlayed((n) => n + 1));
    if (!last) return next();
    setLeaving(kind);
    window.setTimeout(() => { setLeaving(null); next(); }, 260);
  };
  const decision = DECISIONS[decided];
  const card = CARDS[played];
  const known = 2 + decided;
  const done = !decision && !card;

  return <Bento label={t(lang, "Ma stack en bref", "My stack at a glance")}>
    <Tile span={done ? 7 : 7} label={t(lang, "Ma stack", "My stack")} art={<LogoFan tools={TOOLS} localOnly />}
      statement={<Amount size="hero" value={money(lang, 78)} unit={t(lang, "/mois", "/mo")} />}
      status={known >= 4 ? { text: t(lang, "Budget renseigné, 939 € par an.", "Budget recorded, €939 a year."), done: true } : { text: t(lang, `${known} outils sur 6 renseignés · 939 € par an`, `${known} of 6 tools priced · €939 a year`) }} />
    <Tile span={5} label={t(lang, "Répartition", "Split")} art={<MiniRing parts={AREAS} />}
      statement={t(lang, "Organiser, 51 %", "Organise, 51%")} status={{ text: t(lang, "Notion pèse plus de la moitié de la note.", "Notion is over half the bill.") }} />

    {decision && <Tile span={card ? 7 : 12} tone="question" leaving={leaving === "decision"} label={t(lang, `Une question · ${decided + 1} sur ${DECISIONS.length}`, `One question · ${decided + 1} of ${DECISIONS.length}`)}
      art={<TextButton tone="quiet" onClick={() => answer("decision")}>{t(lang, "Plus tard", "Later")}</TextButton>}>
      <Question media={<Logo tool={decision.tool} size={40} localOnly />}>{t(lang, ...decision.question)}</Question>
      <Answers label={t(lang, "Votre réponse", "Your answer")}>
        {decision.answers.map((a) => <Answer key={a.name[0]} name={t(lang, ...a.name)} amount={a.amount === undefined ? undefined : a.amount === 0 ? t(lang, "Rien à payer", "Nothing to pay") : `${money(lang, a.amount)}${t(lang, "/mois", "/mo")}`} onClick={() => answer("decision")} />)}
      </Answers>
    </Tile>}
    {card && <Tile span={decision ? 5 : 12} tone="question" leaving={leaving === "usage"} label={t(lang, `Vos usages · ${CARDS.length - played} carte${CARDS.length - played > 1 ? "s" : ""}`, `Your use · ${CARDS.length - played} card${CARDS.length - played > 1 ? "s" : ""}`)}>
      <Question media={<Logo tool={card} size={40} localOnly />}>{t(lang, `${card.name}, vous vous en servez…`, `${card.name}, how often…`)}</Question>
      <Answers label={t(lang, "Votre réponse", "Your answer")}>
        {[["Tous les jours", "Every day"], ["Parfois", "Now and then"], ["Plus du tout", "Not anymore"]].map(([fr, en]) => <Answer key={fr} name={t(lang, fr, en)} onClick={() => answer("usage")} />)}
      </Answers>
    </Tile>}
  </Bento>;
}

const page = (decisions: number, cards: number): Story => ({
  render: (_a, ctx) => <Page rhythm="chapters">
    <LivingBento lang={ctx.globals.lang} decisions={decisions} cards={cards} />
    {Inventory.ByArea.render?.({}, ctx as never)}
  </Page>,
});

/** Questions to refine: they sit under the two facts that always stay. Answer them: the tiles leave and the page gets shorter. */
export const WithQuestions = page(2, 2);
/** One question left: it takes the whole row. */
export const LastQuestion = page(1, 0);
/** Nothing left to ask: two tiles, the inventory comes right after. */
export const AllSettled = page(0, 0);
