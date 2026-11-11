import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button/Button";
import { UndoToast } from "./Toast";

const meta: Meta = { title: "Molécules/Retour", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

function Demo({ lang }: { lang: Lang }) {
  const [round, setRound] = useState(1);
  const [back, setBack] = useState(false);
  return <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
    {back
      ? <p style={{ margin: 0, font: "var(--tt-text-font)", letterSpacing: "var(--tt-label-tracking)" }}>{t(lang, "Canva est de retour. On ne juge pas.", "Canva is back. No judgement.")}</p>
      : <UndoToast key={round} message={t(lang, "Canva retiré de ma stack.", "Canva removed from your stack.")} saving={t(lang, "−12 €/mois", "−€12/mo")} undoLabel={t(lang, "Annuler", "Undo")} duration={6000} onUndo={() => setBack(true)} />}
    <Button onClick={() => { setBack(false); setRound((n) => n + 1); }}>{t(lang, "Retirer Canva de ma stack", "Remove Canva from my stack")}</Button>
  </div>;
}

/** Removal with undo: the undo window is a cut line the scissors run back, right to left, in 6 s. */
export const Undo: Story = { name: "Retrait avec annulation", render: (_args, { globals: { lang } }) => <Demo lang={lang} /> };
