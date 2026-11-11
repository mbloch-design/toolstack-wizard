import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import { Moon, Rocket, Zap } from "@/lib/icons";
import Page, { Chapter, Pair } from "./Page";
import Budget, { BudgetTrust } from "../Budget/Budget";
import { budgetStates } from "../Budget/Budget.fixtures";
import Split from "../Split/Split";
import { splitStates } from "../Split/Split.fixtures";
import Decision from "../Decision/Decision";
import Choice, { Choices, IconTile } from "../Choice/Choice";
import Logo from "../Logo/Logo";
import UsagePlay from "../UsagePlay/UsagePlay";
import { buttonAttrs } from "../Button/Button";
import * as Inventory from "../Inventory/Inventory.stories";
import * as Discovery from "../MediaCard/MediaCard.stories";

const meta: Meta = { title: "Ma stack/Page (proposition)", tags: ["a-valider", "!visual"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);

/*
 * The page in five beats of different density, so it has a rhythm:
 * 1. the verdict, airy, no box: the figure leads, the stack under it, the rare action at the end of its row;
 * 2. the action, dense: how far the figure is known opens it; one decision (wide) and the card game (narrow);
 * 3. the understanding, wide and boxless: where the money goes;
 * 4. the inventory, a regular grid;
 * 5. the discovery, pictures.
 * Four distances only: item 8, group 24, head 48, chapter 96.
 */
function Proposal({ lang }: { lang: Lang }) {
  const ctx = { globals: { lang } } as never;
  return (
    <Page rhythm="chapters">
      <Budget {...budgetStates.partial(lang)} variant="hero" localLogosOnly
        greeting={<>{t(lang, "Bonjour", "Hello")} <span aria-hidden="true">👋</span></>}
        aside={<a {...buttonAttrs()} href="#explorer">{t(lang, "Explorer autour de ma stack", "Explore around my stack")}</a>} />

      <Chapter label={t(lang, "À décider", "To decide")} title={t(lang, "3 petites décisions vous attendent.", "3 small decisions are waiting.")} lead={t(lang, "Promis, aucune ne mord.", "None of them bite.")}
        aside={<BudgetTrust lang={lang} known={2} total={5} left={t(lang, "2 prix et 1 formule", "2 prices and 1 plan")} onConfirmNext={() => {}} />}>
        <Pair
          main={<Decision lang={lang} kind="freemium" label={t(lang, "Prochaine décision", "Next decision")} eyebrow={t(lang, "Votre décision", "Your decision")} step={{ current: 1, total: 3 }}
            media={<Logo tool={{ name: "Canva", slug: "canva" }} size={40} localOnly />} title={t(lang, "Quelle formule de Canva avez-vous ?", "Which Canva plan do you have?")}
            detail={t(lang, "Gratuite ou payante, on ne juge pas. Ça complète juste votre budget.", "Free or paid, no judgement. It just completes your budget.")}
            links={[{ label: t(lang, "Plus tard", "Later"), onClick: () => {}, quiet: true }]} preview={{ label: t(lang, "Budget partiel", "Partial budget"), value: money(lang, 51), unit: t(lang, "/mois", "/mo") }}>
            <Choices radio label={t(lang, "Votre formule", "Your plan")}>
              <Choice role="radio" media={<IconTile><Moon /></IconTile>} name={t(lang, "Version gratuite", "Free plan")} note={t(lang, "Rien à payer", "Nothing to pay")} amount={t(lang, "Gratuit", "Free")} onClick={() => {}} />
              <Choice role="radio" media={<IconTile><Zap /></IconTile>} name="Canva Pro" note={t(lang, "par mois", "a month")} amount={money(lang, 9.17)} unit={t(lang, "/mois", "/mo")} onClick={() => {}} />
              <Choice role="radio" media={<IconTile><Rocket /></IconTile>} name="Canva Pro+" note={t(lang, "par utilisateur", "per user")} amount={money(lang, 14.17)} unit={t(lang, "/mois", "/mo")} onClick={() => {}} />
            </Choices>
          </Decision>}
          side={<UsagePlay rows={[["Notion", "notion", 36], ["Loom", "loom", 15]].map(([name, slug, cost]) => ({ tool: { id: slug as string, name: name as string, slug: slug as string }, cost: cost as number, setUsage: () => {} }))}
            lang={lang} format={(n) => money(lang, n)} onReviewTools={() => {}} localLogosOnly />} />
      </Chapter>

      <Split {...splitStates.threeAreas(lang)} bare localLogosOnly />

      {Inventory.ByArea.render?.({}, ctx)}
      {Discovery.Discover.render?.({}, ctx)}
    </Page>
  );
}

export const Proposition: Story = { render: (_a, { globals: { lang } }) => <Proposal lang={lang} /> };
