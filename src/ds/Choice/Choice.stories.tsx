import type { Meta, StoryObj } from "@storybook/react-vite";
import { Moon, Rocket, Zap } from "@/lib/icons";
import { formatAmount } from "@/lib/currencyRates";
import Logo from "../Logo/Logo";
import Choice, { Choices, IconTile } from "./Choice";

const meta: Meta = { title: "Molécules/Choix", tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 560 }}><Story /></div>] };
export default meta;
type Story = StoryObj;

const tool = (name: string, slug?: string) => ({ id: slug ?? name, name, slug });
const t = (lang: string, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: string, n: number) => formatAmount(n, "EUR", lang);
const per = (lang: string) => <small>{t(lang, "/mois", "/mo")}</small>;

/** A duplicate: keep one, keep the other, or keep both. Each says what it does to the budget. */
const duel = (state?: 0 | 1 | 2): Story => ({
  render: (_args, { globals: { lang } }) => <Choices>
    <Choice media={<Logo tool={tool("Notion", "notion")} localOnly />} name={t(lang, "Garder Notion", "Keep Notion")} tag={t(lang, "Le moins cher", "Cheaper")}
      note={t(lang, `Airtable quitte la stack · seul, ${money(lang, 10)}/mois`, `Airtable leaves the stack · alone, ${money(lang, 10)}/mo`)}
      amount={<>−{money(lang, 24)}{per(lang)}</>} saving state={state === undefined ? undefined : state === 0 ? "kept" : "gone"} checked={state === 0} onClick={() => {}} />
    <Choice media={<Logo tool={tool("Airtable", "airtable")} localOnly />} name={t(lang, "Garder Airtable", "Keep Airtable")}
      note={t(lang, `Notion quitte la stack · seul, ${money(lang, 24)}/mois`, `Notion leaves the stack · alone, ${money(lang, 24)}/mo`)}
      amount={<>−{money(lang, 10)}{per(lang)}</>} saving state={state === undefined ? undefined : state === 1 ? "kept" : "gone"} checked={state === 1} onClick={() => {}} />
    <Choice pair media={<><Logo tool={tool("Notion", "notion")} size={32} localOnly /><Logo tool={tool("Airtable", "airtable")} size={32} localOnly /></>} name={t(lang, "Garder les deux", "Keep both")}
      note={t(lang, `Les deux restent · ${money(lang, 34)}/mois`, `Both stay · ${money(lang, 34)}/mo`)} amount={t(lang, "Inchangé", "Unchanged")}
      state={state === undefined ? undefined : state === 2 ? "kept" : "gone"} checked={state === 2} onClick={() => {}} />
  </Choices>,
});

export const Duplicate = duel();
export const DuplicateKept = duel(0);

/** A plan question: one row per plan, the price on the right. */
export const Plans: Story = {
  render: (_args, { globals: { lang } }) => <Choices radio label={t(lang, "Votre formule", "Your plan")}>
    <Choice role="radio" data-plan="free" media={<IconTile><Moon /></IconTile>} name={t(lang, "Version gratuite", "Free plan")} note={t(lang, "Rien à payer", "Nothing to pay")} amount={t(lang, "Gratuit", "Free")} onClick={() => {}} />
    <Choice role="radio" data-plan="pro" media={<IconTile><Zap /></IconTile>} name="Canva Pro" note={t(lang, "par mois", "a month")} amount={<>{money(lang, 9.17)}{per(lang)}</>} onClick={() => {}} />
    <Choice role="radio" data-plan="pro+" media={<IconTile><Rocket /></IconTile>} name="Canva Pro+" note={t(lang, "par utilisateur", "per user")} amount={<>{money(lang, 14.17)}{per(lang)}</>} onClick={() => {}} />
  </Choices>,
};

/** A long name and a long note on a narrow card: the amount moves under the text. */
export const NarrowLongName: Story = {
  decorators: [(Story) => <div style={{ maxWidth: 340 }}><Story /></div>],
  render: (_args, { globals: { lang } }) => <Choices>
    <Choice media={<Logo tool={tool("Microsoft Dynamics 365 Finance and Operations")} localOnly />} name={t(lang, "Garder Microsoft Dynamics 365 Finance and Operations", "Keep Microsoft Dynamics 365 Finance and Operations")}
      tag={t(lang, "Le moins cher", "Cheaper")} note={t(lang, `CallTrackingMetrics quitte la stack · seul, ${money(lang, 1100)}/mois`, `CallTrackingMetrics leaves the stack · alone, ${money(lang, 1100)}/mo`)}
      amount={<>−{money(lang, 79)}{per(lang)}</>} saving onClick={() => {}} />
  </Choices>,
};
