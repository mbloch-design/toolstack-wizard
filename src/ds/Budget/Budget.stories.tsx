import type { Meta, StoryObj } from "@storybook/react-vite";
import { BudgetTrust } from "./Budget";

const meta: Meta = { title: "Molécules/Fiabilité du budget", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/** Prices still to confirm: the ring fills with what is known and opens the next question. Then, every price known. */
export const States: Story = {
  render: (_a, { globals: { lang } }) => <div style={{ display: "grid", gap: 24, justifyItems: "start" }}>
    <BudgetTrust lang={lang} known={3} total={8} left={t(lang, "2 prix et 3 formules", "2 prices and 3 plans")} onConfirmNext={() => {}} />
    <BudgetTrust lang={lang} known={7} total={8} left={t(lang, "1 formule", "1 plan")} onConfirmNext={() => {}} />
    <BudgetTrust lang={lang} known={8} total={8} left={null} />
  </div>,
};
