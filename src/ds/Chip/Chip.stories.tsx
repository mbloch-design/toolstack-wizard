import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Chip, { Chips } from "./Chip";

const meta: Meta = { title: "Molécules/Puces", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

function Filters({ lang }: { lang: Lang }) {
  const [value, setValue] = useState("all");
  const filters = [
    { id: "all", label: t(lang, "Tous", "All"), count: 12 },
    { id: "overlap", label: t(lang, "Doublons", "Overlaps"), count: 3, alert: true },
    { id: "review", label: t(lang, "À vérifier", "To check"), count: 2 },
    { id: "ok", label: t(lang, "Prix renseigné", "Price recorded"), count: 7 },
  ];
  return <Chips label={t(lang, "Filtrer", "Filter")}>{filters.map((f) => <Chip key={f.id} check pressed={value === f.id} count={f.count} alert={f.alert} onClick={() => setValue(f.id)}>{f.label}</Chip>)}</Chips>;
}

function Sizes({ lang }: { lang: Lang }) {
  const [seats, setSeats] = useState(5);
  return <Chips label={t(lang, "Tailles d’équipe", "Team sizes")}>{[1, 2, 5, 10, 25].map((n) => <Chip key={n} size="md" pressed={seats === n} onClick={() => setSeats(n)}>{n}</Chip>)}</Chips>;
}

/** Filters (a check draws itself, overlaps counted in orange), team sizes, the three answers of Vos usages. */
export const All: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ display: "grid", gap: 24 }}>
    <Filters lang={lang} />
    <Sizes lang={lang} />
    <Chips label={t(lang, "Votre réponse", "Your answer")}>
      <Chip size="md"><kbd aria-hidden="true">1</kbd>{t(lang, "Tous les jours", "Every day")}</Chip>
      <Chip size="md"><kbd aria-hidden="true">2</kbd>{t(lang, "De temps en temps", "Now and then")}</Chip>
      <Chip size="md" tone="cut">{t(lang, "Plus du tout", "Not anymore")}<kbd aria-hidden="true">3</kbd></Chip>
      <Chip size="md" disabled>{t(lang, "En pause", "Paused")}</Chip>
    </Chips>
  </div>,
};
