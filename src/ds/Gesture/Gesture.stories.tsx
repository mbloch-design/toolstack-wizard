import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import { Fall, Meet, Odometer, Stamp, Tilt, Trim } from "./Gesture";

const meta: Meta = { title: "Molécules/Gestes", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const tool = (name: string, slug: string) => ({ id: slug, name, slug });

/** One gesture on its stage, its caption, and a way to play it again. */
function Stage({ lang, title, caption, children }: { lang: Lang; title: string; caption: string; children: (round: number) => ReactNode }) {
  const [round, setRound] = useState(1);
  return (
    <figure style={{ display: "grid", gap: 12, margin: 0 }}>
      <div style={{ display: "grid", placeItems: "center", height: 140, borderRadius: 16, background: "var(--tt-tile)" }}>{children(round)}</div>
      <figcaption style={{ font: "var(--tt-note-font)" }}><strong style={{ font: "var(--tt-label-font)" }}>{title}</strong> {caption}</figcaption>
      <div><Button onClick={() => setRound((n) => n + 1)}>{t(lang, "Rejouer", "Play again")}</Button></div>
    </figure>
  );
}

/** A fresh mount per round: at rest for a frame, then played. */
function Played({ round, children }: { round: number; children: (play: boolean) => ReactNode }) {
  return <PlayOnce key={round}>{children}</PlayOnce>;
}
function PlayOnce({ children }: { children: (play: boolean) => ReactNode }) {
  const [play, setPlay] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setPlay(true)); return () => cancelAnimationFrame(frame); }, []);
  return <>{children(play)}</>;
}

/** The planche's gestures, each played once when its moment comes. */
export const Gestures: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
    <Stage lang={lang} title={t(lang, "Garder", "Keep")} caption={t(lang, "le tampon se pose, la tuile encaisse.", "the stamp lands, the tile takes the hit.")}>
      {(round) => <Played round={round}>{(play) => <Stamp play={play} label={t(lang, "Gardé", "Kept")}><Logo tool={tool("Figma", "figma")} size={40} localOnly /></Stamp>}</Played>}
    </Stage>
    <Stage lang={lang} title={t(lang, "Doublon", "Duplicate")} caption={t(lang, "les deux se rapprochent, se reconnaissent, un seul reste.", "the two come together, recognise each other, one stays.")}>
      {(round) => <Played round={round}>{(play) => <Meet play={play} kept="left" badge={t(lang, "Doublon", "Duplicate")} left={<Logo tool={tool("Notion", "notion")} size={40} localOnly />} right={<Logo tool={tool("Airtable", "airtable")} size={40} localOnly />} />}</Played>}
    </Stage>
    <Stage lang={lang} title={t(lang, "Économiser", "Save")} caption={t(lang, "le prix défile comme un compteur, chiffre par chiffre.", "the price rolls like a counter, digit by digit.")}>
      {(round) => <Played round={round}>{(play) => <span style={{ font: "var(--tt-figure-font)", letterSpacing: "var(--tt-figure-tracking)" }}><Odometer value={play ? "24\u00a0€" : "36\u00a0€"} /></span>}</Played>}
    </Stage>
    <Stage lang={lang} title={t(lang, "Survoler", "Hover")} caption={t(lang, "la carte s'incline vers vous, un reflet suit le doigt.", "the card leans toward you, a sheen follows the finger.")}>
      {() => <Tilt><span style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 12px 12px", background: "var(--tt-bg)" }}><Logo tool={tool("Canva", "canva")} size={40} localOnly /><span style={{ font: "var(--tt-label-font)" }}>Canva</span></span></Tilt>}
    </Stage>
    <Stage lang={lang} title={t(lang, "Le trim", "The trim")} caption={t(lang, "ce qui part tombe ; un outil s'accroche un instant.", "what goes falls; one tool clings a moment.")}>
      {(round) => <Played round={round}>{(play) => <span style={{ display: "inline-flex", gap: 12 }}>
        <Logo tool={tool("Notion", "notion")} size={40} localOnly />
        <Fall leaving={play}><Logo tool={tool("Airtable", "airtable")} size={40} localOnly /></Fall>
        <Fall leaving={play} cling><Logo tool={tool("Make", "make")} size={40} localOnly /></Fall>
      </span>}</Played>}
    </Stage>
  </div>,
};

/** The signature gesture: the cut line runs, duplicates fall (Make clings a moment), what stays settles, the saving shows. */
export const TheTrim: Story = {
  name: "Le trim",
  render: (_args, { globals: { lang } }) => <TrimDemo lang={lang} />,
};

function TrimDemo({ lang }: { lang: Lang }) {
    const [cut, setCut] = useState(false);
    const money = (value: number) => `${value}\u00a0€`;
    return <div style={{ display: "grid", gap: 24, maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16 }}>
        <h3 style={{ margin: 0, font: "var(--tt-title-l-font)", letterSpacing: "var(--tt-title-l-tracking)" }}>{t(lang, "Le trim", "The trim")}</h3>
        <Button variant="primary" arrow onClick={() => setCut((value) => !value)}>{cut ? t(lang, "Recommencer", "Start again") : t(lang, "Trimer ma stack", "Trim my stack")}</Button>
      </div>
      <div style={{ padding: "var(--tt-space-8) var(--tt-space-6) var(--tt-space-10, 40px)", borderRadius: "var(--tt-r-tile)", background: "var(--tt-tile)" }}>
        <Trim cut={cut} total={78} saved={24} restSentence={t(lang, "5 outils, dont 2 qui font doublon.", "5 tools, 2 of them duplicates.")} format={money} unit={t(lang, "/mois", "/mo")} clingSay={t(lang, "Attendez…", "Wait…")}
          sentence={t(lang, "Airtable et Make faisaient le travail de Notion.", "Airtable and Make were doing Notion's job.")}
          tools={[
            { id: "notion", node: <Logo tool={tool("Notion", "notion")} size={40} localOnly /> },
            { id: "airtable", cut: "fall", node: <Logo tool={tool("Airtable", "airtable")} size={40} localOnly /> },
            { id: "figma", node: <Logo tool={tool("Figma", "figma")} size={40} localOnly /> },
            { id: "make", cut: "cling", node: <Logo tool={tool("Make", "make")} size={40} localOnly /> },
            { id: "canva", node: <Logo tool={tool("Canva", "canva")} size={40} localOnly /> },
          ]} />
      </div>
    </div>;
}
