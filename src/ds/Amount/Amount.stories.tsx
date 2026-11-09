import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import Amount from "./Amount";

const meta: Meta = { title: "Molécules/Montant", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const per = (lang: Lang) => (lang === "fr" ? "/mois" : "/mo");

/** The two sizes, thousands, dollars and the dust tone. The unit never leaves its figure. */
export const Sizes: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
    <Amount size="figure" value={formatAmount(1234.5, "EUR", lang)} unit={per(lang)} />
    <Amount size="figure" value={formatAmount(49, "USD", lang)} unit={per(lang)} />
    <Amount size="figure" tone="overlap" value={formatAmount(38, "EUR", lang)} unit={per(lang)} />
    <Amount value={formatAmount(17.17, "EUR", lang)} unit={per(lang)} />
    <Amount value={formatAmount(12480, "EUR", lang)} unit={lang === "fr" ? "par an" : "a year"} />
    <Amount value={lang === "fr" ? "Gratuit" : "Free"} />
  </div>,
};
