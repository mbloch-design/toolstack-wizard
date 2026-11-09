import type { Meta, StoryObj } from "@storybook/react-vite";
import Logo from "../Logo/Logo";
import Cover from "./Cover";

const meta: Meta = { title: "Atomes/Couverture", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;

const frame = (child: React.ReactNode, label: string) => <figure style={{ display: "grid", gap: 8, margin: 0 }}>
  <span style={{ display: "block", aspectRatio: "16 / 10", borderRadius: "var(--tt-r-card)", overflow: "hidden" }}>{child}</span>
  <figcaption style={{ font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)", color: "var(--tt-ink)" }}>{label}</figcaption>
</figure>;

/** A screenshot fills its frame; while loading, a sheen; without one, the logo on the tile. */
export const States: Story = {
  render: () => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
    {frame(<Cover src="/home-logos/notion.svg" alt="Notion" fallback={null} />, "Image")}
    {frame(<Cover src="/home-logos/notion.svg" alt="" loading fallback={null} />, "Chargement")}
    {frame(<Cover alt="Airtable" fallback={<Logo tool={{ name: "Airtable", slug: "airtable" }} size={40} localOnly />} />, "Sans capture : le logo")}
  </div>,
};
