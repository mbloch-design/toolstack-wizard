import type { Meta, StoryObj } from "@storybook/react-vite";

// Témoin du socle : vérifie polices, jetons et thèmes. Supprimé quand la carte Budget existe.
const meta: Meta = { title: "Socle/Témoin" };
export default meta;

export const Typo: StoryObj = {
  render: () => <div style={{ display: "grid", gap: 8 }}>
    <p style={{ font: "var(--tt-title-l-font)", letterSpacing: "var(--tt-title-l-tracking)", margin: 0 }}>Budget mensuel</p>
    <p style={{ font: "var(--tt-text-font)", margin: 0 }}>Pas de tyran dans la stack.</p>
  </div>,
};
