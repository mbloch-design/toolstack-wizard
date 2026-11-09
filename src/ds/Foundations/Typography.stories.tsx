import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import { formatAmount } from "@/lib/currencyRates";
import { Check } from "@/lib/icons";
import Amount from "../Amount/Amount";
import Button, { TextButton } from "../Button/Button";
import Chip from "../Chip/Chip";
import Tag from "../Tag/Tag";

const meta: Meta = { title: "Fondations/Typographie", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

const role = (name: string): CSSProperties => ({ font: `var(--tt-${name}-font)`, letterSpacing: `var(--tt-${name}-tracking)`, color: "var(--tt-ink)", margin: 0 });
const row = (label: string, sample: ReactNode) => <div style={{ display: "grid", gap: 6, padding: "14px 0", borderTop: "1px solid var(--tt-line)" }}>
  <span style={{ ...role("eyebrow"), textTransform: "uppercase" }}>{label}</span>{sample}
</div>;

/** The scale in force (09/11/2026, « délicat »): thin role weights compensated by size, Inter for every interface text. Switch the theme in the toolbar for dark. */
export const Scale: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ maxWidth: 760 }}>
    {row("64", <p style={role("title-xl")}>{t(lang, "Votre stack, au clair.", "Your stack, made clear.")}</p>)}
    {row("42", <Amount size="figure" value={formatAmount(51, "EUR", lang)} unit={t(lang, "/mois", "/mo")} />)}
    {row("21", <p style={role("title-m")}>{t(lang, "Quelle formule de Canva avez-vous ?", "Which Canva plan do you have?")}</p>)}
    {row("17", <Amount value={formatAmount(1234.5, "EUR", lang)} unit={t(lang, "/mois", "/mo")} />)}
    {row(t(lang, "16 libellé", "16 label"), <p style={role("label")}>{t(lang, "2 outils sur 5 renseignés", "2 of 5 tools filled in")}</p>)}
    {row(t(lang, "16 texte", "16 text"), <p style={role("text")}><b style={{ fontWeight: "var(--tt-w-em)" }}>{t(lang, "Soit 612 € par an.", "That is €612 a year.")}</b> {t(lang, "Notion pèse plus de la moitié de la note à lui seul.", "Notion alone is more than half the bill.")}</p>)}
    {row("14", <p style={role("note")}>{t(lang, "5 outils · 2 payants · 3 à préciser", "5 tools · 2 paid · 3 to confirm")}</p>)}
    {row(t(lang, "Interaction", "Interaction"), <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <Button variant="primary">{t(lang, "Ajouter à ma stack", "Add to my stack")}</Button>
      <Button>{t(lang, "D’autres pistes", "More ideas")}</Button>
      <Button pressed icon={<Check />}>{t(lang, "Terminé", "Done")}</Button>
      <Chip check pressed count={12}>{t(lang, "Tous", "All")}</Chip>
      <Chip count={3} alert>{t(lang, "Doublons", "Overlaps")}</Chip>
      <Tag>{t(lang, "Le moins cher", "Cheaper")}</Tag>
      <TextButton>{t(lang, "Revoir ce choix", "Review this choice")}</TextButton>
    </div>)}
  </div>,
};
