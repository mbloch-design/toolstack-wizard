import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import Table from "./Table";

const meta: Meta<typeof Table> = { title: "Molécules/Tableau", component: Table, tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Table>;

const ROWS = [
  ["Supprimer une collection", "data_cms_tool"], ["Supprimer une page", "data_pages_tool"], ["Retirer un script", "data_scripts_tool"],
  ["Gérer les polices", "data_sites_tool"], ["Supprimer un élément de la page", "element_tool"], ["Supprimer un style", "style_tool"], ["Supprimer une variable", "variable_tool"],
];

/** The server sheet's actions for one consequence: a real table, its name from the heading above, the 7th row folded. */
export const Actions: Story = {
  render: (_args, { globals }) => <>
    <h3 id="story-table-title" style={{ margin: 0 }}>{globals.lang === "en" ? "Deletes data · 7" : "Supprime des données · 7"}</h3>
    <Table labelledBy="story-table-title" columns={globals.lang === "en" ? ["Action", "Identifier"] : ["Action", "Identifiant"]}
      rows={ROWS.map(([action, id], index) => ({ key: id, cells: [action, <code key={id}>{id}</code>], hidden: index >= 6 }))} />
  </>,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("table", { name: /Supprime des données|Deletes data/ })).toBeInTheDocument();
    await expect(canvas.getAllByRole("columnheader").length).toBe(2);
    await expect(canvasElement.querySelectorAll("tbody tr").length).toBe(7);
    await expect(canvasElement.querySelectorAll("tbody tr:not([hidden])").length).toBe(6);
  },
};
