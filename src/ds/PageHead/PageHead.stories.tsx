import type { Meta, StoryObj } from "@storybook/react-vite";
import { buttonAttrs } from "../Button/Button";
import PageHead from "./PageHead";

const meta: Meta = { title: "Ma stack/En-tête de page", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/** Signed in, with a trade and a day rate, decisions waiting, the explorer as the rare action. */
export const Full: Story = {
  render: (_args, { globals: { lang } }) => <PageHead greeting={<>{t(lang, "Bonjour, Camille", "Hi, Camille")} <span aria-hidden="true">👋</span></>}
    eyebrow={t(lang, "Ma stack", "My stack")} title={t(lang, "Mes outils", "My tools")}
    meta={t(lang, "3 outils · 85,87 €/mois · partiel", "3 tools · €85.87/mo · partial")}
    message={t(lang, "2 petites décisions vous attendent. Promis, aucune ne mord.", "2 small decisions waiting. None of them bite.")}
    facts={[{ label: t(lang, "Développement", "Development") }, { label: t(lang, "687 €/jour · votre heure ≈ 98 €", "€687/day · your hour ≈ €98"), title: t(lang, "Sur une journée de 7 heures", "On a 7-hour day") }]}
    action={<a {...buttonAttrs()} href="#explorer">{t(lang, "Explorer autour de ma stack", "Explore around my stack")}</a>} />,
};

/** A visitor without an account: greeted without a name, no facts, no action. */
export const Visitor: Story = {
  render: (_args, { globals: { lang } }) => <PageHead greeting={<>{t(lang, "Bonsoir", "Good evening")} <span aria-hidden="true">👋</span></>}
    eyebrow={t(lang, "Ma stack", "My stack")} title={t(lang, "Mes outils", "My tools")} meta={t(lang, "1 outil", "1 tool")}
    message={t(lang, "Votre stack, à votre rythme. Vous gardez la main.", "Your stack, at your pace. You stay in control.")} />,
};
