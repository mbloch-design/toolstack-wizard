import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import { Moon, Rocket, Zap } from "@/lib/icons";
import Board from "./Board";
import Budget from "../Budget/Budget";
import { budgetStates } from "../Budget/Budget.fixtures";
import Split from "../Split/Split";
import { splitStates } from "../Split/Split.fixtures";
import Decision, { DecisionRest } from "../Decision/Decision";
import Choice, { Choices, IconTile } from "../Choice/Choice";
import Logo from "../Logo/Logo";
import UsagePlay from "../UsagePlay/UsagePlay";
import Starter from "../Starter/Starter";

const meta: Meta = { title: "Ma stack/Tableau", tags: ["a-valider"], parameters: { layout: "fullscreen" }, decorators: [(Story) => <div style={{ padding: 16 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";

const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);
const usageRows = (lang: Lang) => [["Notion", "notion", 36], ["Figma", "figma", 15], ["Canva", "canva", 12]].map(([name, slug, cost]) => ({ tool: { id: slug as string, name: name as string, slug: slug as string }, cost: cost as number, setUsage: () => {} }));

const decision = (lang: Lang) => <Decision lang={lang} kind="freemium" label={t(lang, "Prochaine décision", "Next decision")} eyebrow={t(lang, "Votre décision", "Your decision")} step={{ current: 1, total: 4 }}
  media={<Logo tool={{ name: "Canva", slug: "canva" }} size={40} localOnly />} title={t(lang, "Quelle formule de Canva avez-vous ?", "Which Canva plan do you have?")}
  detail={t(lang, "Gratuite ou payante, on ne juge pas. Ça complète juste votre budget.", "Free or paid, no judgement. It just completes your budget.")}
  links={[{ label: t(lang, "Plus tard", "Later"), onClick: () => {}, quiet: true }]} preview={{ label: t(lang, "Budget partiel", "Partial budget"), value: <>{money(lang, 51)}<small>{t(lang, "/mois", "/mo")}</small></> }}>
  <Choices radio label={t(lang, "Votre formule", "Your plan")}>
    <Choice role="radio" media={<IconTile><Moon /></IconTile>} name={t(lang, "Version gratuite", "Free plan")} note={t(lang, "Rien à payer", "Nothing to pay")} amount={t(lang, "Gratuit", "Free")} onClick={() => {}} />
    <Choice role="radio" media={<IconTile><Zap /></IconTile>} name="Canva Pro" note={t(lang, "par mois", "a month")} amount={<>{money(lang, 9.17)}<small>{t(lang, "/mois", "/mo")}</small></>} onClick={() => {}} />
    <Choice role="radio" media={<IconTile><Rocket /></IconTile>} name="Canva Pro+" note={t(lang, "par utilisateur", "per user")} amount={<>{money(lang, 14.17)}<small>{t(lang, "/mois", "/mo")}</small></>} onClick={() => {}} />
  </Choices>
</Decision>;

const board = (parts: { action?: "decision" | "rest" | "starter"; usage?: boolean; split?: boolean }, width?: number): Story => ({
  decorators: width ? [(Story) => <div style={{ maxWidth: width }}><Story /></div>] : [],
  render: (_args, { globals: { lang } }) => <Board label={t(lang, "Ma stack en bref", "My stack at a glance")}
    budget={<Budget {...(parts.action === "starter" ? budgetStates.one(lang) : budgetStates.partial(lang))} localLogosOnly />}
    action={parts.action === "decision" ? decision(lang) : parts.action === "rest" ? <DecisionRest lang={lang} onAddTool={() => {}} /> : parts.action === "starter" ? <Starter lang={lang} tool={{ name: "Vercel", slug: "vercel" }} onAddTool={() => {}} localLogosOnly /> : undefined}
    usage={parts.usage ? <UsagePlay rows={usageRows(lang)} lang={lang} format={(n) => money(lang, n)} onReviewTools={() => {}} localLogosOnly /> : undefined}
    split={parts.split ? <Split {...splitStates.threeAreas(lang)} localLogosOnly /> : undefined} />,
});

export const Full = board({ action: "decision", usage: true, split: true });
export const FullMidWidth = board({ action: "decision", usage: true, split: true }, 980);
export const AtRest = board({ action: "rest", usage: true, split: true });
export const NoSplit = board({ action: "decision", usage: true });
export const OneTool = board({ action: "starter" });
