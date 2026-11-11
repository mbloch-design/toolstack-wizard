import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Pencil, Plus, Search } from "@/lib/icons";
import Button, { IconButton, TextButton, linkClass } from "./Button";

const meta: Meta = { title: "Molécules/Boutons", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 } as const;
const grid = { display: "grid", gap: 24 } as const;

/** Each variant at rest, with an icon, pressed and disabled. Long labels come from the real site. */
export const Matrix: Story = {
  render: (_args, { globals: { lang } }) => <div style={grid}>
    <div style={row}>
      <Button variant="primary">{t(lang, "Ajouter à ma stack", "Add to my stack")}</Button>
      <Button variant="primary" icon={<Plus />}>{t(lang, "Ajouter", "Add")}</Button>
      <Button variant="primary" size="lg" arrow>{t(lang, "Voir mes économies", "See my savings")}</Button>
      <Button variant="primary" disabled>{t(lang, "Enregistré", "Saved")}</Button>
    </div>
    <div style={row}>
      <Button>{t(lang, "D’autres pistes", "More ideas")}</Button>
      <Button icon={<Pencil />}>{t(lang, "Modifier", "Edit")}</Button>
      <Button icon={<Check />} pressed>{t(lang, "Terminé", "Done")}</Button>
      <Button disabled>{t(lang, "Indisponible", "Unavailable")}</Button>
    </div>
    <div style={row}>
      <Button variant="quiet">{t(lang, "Plus tard", "Later")}</Button>
      <TextButton arrow>{t(lang, "Explorer les pistes", "Explore more ideas")}</TextButton>
      <TextButton>{t(lang, "Revoir ce choix", "Review this choice")}</TextButton>
      <a className={linkClass()} href="#explorer">{t(lang, "Explorer les pistes", "Explore more ideas")}</a>
      <TextButton tone="quiet">{t(lang, "Je n’utilise plus cet outil", "I no longer use this tool")}</TextButton>
      <span style={{ font: "var(--tt-text-font)", letterSpacing: "var(--tt-text-tracking)", color: "var(--tt-ink)" }}>{t(lang, "Formule Pro, 3 places. ", "Pro plan, 3 seats. ")}<TextButton tone="inline">{t(lang, "Changer", "Change")}</TextButton></span>
    </div>
    <div style={row}>
      <IconButton label={t(lang, "Ajouter Notion", "Add Notion")} icon={<Plus />} />
      <IconButton label={t(lang, "Ajouter Notion", "Add Notion")} icon={<Plus />} size={40} />
      <IconButton label={t(lang, "Rechercher", "Search")} icon={<Search />} tone="grey" size={40} />
      <IconButton label={t(lang, "Ajouté", "Added")} icon={<Check />} tone="grey" size={32} disabled />
    </div>
  </div>,
};

/** In a narrow column the label stays on one line: the button grows, it never breaks a word. */
export const Narrow: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ ...grid, width: 280 }}>
    <Button variant="primary" size="lg">{t(lang, "Ajouter à ma stack", "Add to my stack")}</Button>
    <Button>{t(lang, "Comparer les alternatives", "Compare alternatives")}</Button>
  </div>,
};

/** Keyboard focus: the same ring on every button and link. */
export const Focus: Story = {
  render: (_args, { globals: { lang } }) => <div style={row}>
    <Button variant="primary" data-focus>{t(lang, "Ajouter", "Add")}</Button>
    <TextButton>{t(lang, "Revoir ce choix", "Review this choice")}</TextButton>
  </div>,
  play: async ({ canvasElement }) => { (canvasElement.querySelector("[data-focus]") as HTMLElement | null)?.focus({ focusVisible: true } as FocusOptions); },
};

