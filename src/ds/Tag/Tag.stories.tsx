import type { Meta, StoryObj } from "@storybook/react-vite";
import Tag from "./Tag";

const meta: Meta = { title: "Molécules/Étiquette", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

const tags = (lang: Lang, on: "card" | "tile") => <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 16, borderRadius: 16, background: on === "tile" ? "var(--tt-tile)" : "var(--tt-bg)" }}>
  <Tag on={on}>{t(lang, "Le moins cher", "Cheaper")}</Tag>
  <Tag on={on} tone="ok">{t(lang, "Prix renseigné", "Price recorded")}</Tag>
  <Tag on={on} tone="overlap">{t(lang, "Doublon", "Overlap")}</Tag>
  <Tag on={on}>{t(lang, "À vérifier", "To check")}</Tag>
  <Tag on={on} tone="keep">{t(lang, "Garder", "Keep")}</Tag>
  <Tag on={on} tone="swap">{t(lang, "Remplacer", "Swap")}</Tag>
  <Tag on={on} tone="add">{t(lang, "Ajouter", "Add")}</Tag>
</div>;

/** On a card and on a grey tile: the neutral tag swaps its tint to stay visible. */
export const Tones: Story = {
  render: (_args, { globals: { lang } }) => <div style={{ display: "grid", gap: 16 }}>{tags(lang, "card")}{tags(lang, "tile")}</div>,
};
