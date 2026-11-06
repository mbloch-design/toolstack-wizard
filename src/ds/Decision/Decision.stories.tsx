import type { Meta, StoryObj } from "@storybook/react-vite";
import { Moon, Rocket, Zap } from "@/lib/icons";
import { formatAmount } from "@/lib/currencyRates";
import Logo from "../Logo/Logo";
import Choice, { Choices, IconTile } from "../Choice/Choice";
import Decision, { DecisionRest } from "./Decision";

const meta: Meta<typeof Decision> = { title: "Ma stack/Décision", component: Decision, tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Decision>;

const tool = (name: string, slug?: string) => ({ id: slug ?? name, name, slug });
const t = (lang: string, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: string, n: number) => formatAmount(n, "EUR", lang);
const per = (lang: string) => <small>{t(lang, "/mois", "/mo")}</small>;
const later = (lang: string) => ({ label: t(lang, "Plus tard", "Later"), onClick: () => {}, quiet: true });

/** A duplicate: three answers, each with what it does to the budget. */
export const Duplicate: Story = {
  render: (_args, { globals: { lang } }) => <Decision lang={lang} kind="pair" eyebrow={t(lang, "Votre décision", "Your decision")} step={{ current: 1, total: 3 }}
    title={t(lang, "Notion ou Airtable ?", "Notion or Airtable?")} detail={t(lang, "Les deux rangent vos projets. Gardez celui qui travaille vraiment.", "Both organise your projects. Keep the one that does the work.")}
    links={[later(lang)]} preview={{ label: t(lang, "Budget estimé", "Estimated budget"), value: <>{money(lang, 70.74)}{per(lang)}</> }}>
    <Choices>
      <Choice media={<Logo tool={tool("Notion", "notion")} localOnly />} name={t(lang, "Garder Notion", "Keep Notion")} tag={t(lang, "Le moins cher", "Cheaper")} note={t(lang, `Airtable quitte la stack · seul, ${money(lang, 10)}/mois`, `Airtable leaves the stack · alone, ${money(lang, 10)}/mo`)} amount={<>−{money(lang, 24)}{per(lang)}</>} saving onClick={() => {}} />
      <Choice media={<Logo tool={tool("Airtable", "airtable")} localOnly />} name={t(lang, "Garder Airtable", "Keep Airtable")} note={t(lang, `Notion quitte la stack · seul, ${money(lang, 24)}/mois`, `Notion leaves the stack · alone, ${money(lang, 24)}/mo`)} amount={<>−{money(lang, 10)}{per(lang)}</>} saving onClick={() => {}} />
      <Choice pair media={<><Logo tool={tool("Notion", "notion")} size={32} localOnly /><Logo tool={tool("Airtable", "airtable")} size={32} localOnly /></>} name={t(lang, "Garder les deux", "Keep both")} note={t(lang, `Les deux restent · ${money(lang, 34)}/mois`, `Both stay · ${money(lang, 34)}/mo`)} amount={t(lang, "Inchangé", "Unchanged")} onClick={() => {}} />
    </Choices>
  </Decision>,
};

/** A plan question, with the budget the hovered answer leads to. */
export const PlanWithPreview: Story = {
  render: (_args, { globals: { lang } }) => <Decision lang={lang} kind="freemium" eyebrow={t(lang, "Votre décision", "Your decision")} step={{ current: 1, total: 6 }}
    media={<Logo tool={tool("Canva", "canva")} size={40} localOnly />} title={t(lang, "Quelle formule de Canva avez-vous ?", "Which Canva plan do you have?")}
    detail={t(lang, "Gratuite ou payante, on ne juge pas. Ça complète juste votre budget.", "Free or paid, no judgement. It just completes your budget.")}
    links={[{ label: t(lang, "Aucun n’est payant (3)", "None is paid (3)"), onClick: () => {} }, later(lang)]}
    preview={{ label: t(lang, "Budget partiel", "Partial budget"), value: <>{money(lang, 79.91)}{per(lang)}</>, delta: { text: `+${money(lang, 9.17)}`, down: false } }}>
    <Choices radio label={t(lang, "Votre formule", "Your plan")}>
      <Choice role="radio" media={<IconTile><Moon /></IconTile>} name={t(lang, "Version gratuite", "Free plan")} note={t(lang, "Rien à payer", "Nothing to pay")} amount={t(lang, "Gratuit", "Free")} onClick={() => {}} />
      <Choice role="radio" media={<IconTile><Zap /></IconTile>} name="Canva Pro" note={t(lang, "par mois", "a month")} amount={<>{money(lang, 9.17)}{per(lang)}</>} onClick={() => {}} />
      <Choice role="radio" media={<IconTile><Rocket /></IconTile>} name="Canva Pro+" note={t(lang, "par utilisateur", "per user")} amount={<>{money(lang, 14.17)}{per(lang)}</>} onClick={() => {}} />
    </Choices>
  </Decision>,
};

/** A long run (no track past eight steps) and a long tool name in the question. */
export const LongRunLongName: Story = {
  render: (_args, { globals: { lang } }) => <Decision lang={lang} kind="price" eyebrow={t(lang, "Étape suivante", "Next step")} step={{ current: 3, total: 12 }}
    media={<Logo tool={tool("Microsoft Dynamics 365 Finance and Operations")} size={40} localOnly />}
    title={t(lang, "Combien vous coûte Microsoft Dynamics 365 Finance and Operations par mois ?", "How much does Microsoft Dynamics 365 Finance and Operations cost you a month?")}
    detail={t(lang, "Pour un budget juste, dites-nous laquelle vous payez. Gratuite, ça compte aussi.", "For an honest budget, tell us which one you pay. Free counts too.")}
    links={[later(lang)]} preview={{ label: t(lang, "Budget partiel", "Partial budget"), value: t(lang, "À renseigner", "Not set yet") }} />,
};

/** Nothing left to decide. */
export const AtRest: Story = {
  render: (_args, { globals: { lang } }) => <DecisionRest lang={lang} onAddTool={() => {}} />,
};
