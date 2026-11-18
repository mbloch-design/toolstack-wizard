import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import Table from "./Table";

const meta: Meta<typeof Table> = { title: "Molécules/Tableau", component: Table, tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Table>;

const ROWS = [
  ["Supprimer une collection", "data_cms_tool"], ["Supprimer une page", "data_pages_tool"], ["Retirer un script", "data_scripts_tool"],
  ["Gérer les polices", "data_sites_tool"], ["Supprimer un élément de la page", "element_tool"], ["Supprimer un style", "style_tool"], ["Supprimer une variable", "variable_tool"],
];

/** The server sheet's actions for one consequence: a real table, its name from the heading above, the 7th row folded in its foot. */
export const Actions: Story = {
  render: (_args, { globals }) => {
    const row = ([action, id]: string[]) => ({ key: id, cells: [action, <code key={id}>{id}</code>] });
    return <>
      <h3 id="story-table-title" style={{ margin: 0 }}>{globals.lang === "en" ? "Deletes data · 7" : "Supprime des données · 7"}</h3>
      <Table labelledBy="story-table-title" columns={globals.lang === "en" ? ["Action", "Identifier"] : ["Action", "Identifiant"]} rows={ROWS.slice(0, 6).map(row)}
        more={{ groups: [{ key: "rest", rows: ROWS.slice(6).map(row) }], hideLabel: globals.lang === "en" ? "Show less" : "Réduire",
          showLabel: (count) => (globals.lang === "en" ? (count === 1 ? "Show the other action" : `Show the ${count} other actions`) : (count === 1 ? "Voir l'autre action" : `Voir les ${count} autres actions`)) }} />
    </>;
  },
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByRole("table", { name: /Supprime des données|Deletes data/ })).toBeInTheDocument();
    await expect(canvas.getAllByRole("columnheader").length).toBe(2);
    const shown = () => canvasElement.querySelectorAll("tbody:not([hidden]) tr").length;
    await expect(shown()).toBe(6);
    // The fold counts the hidden rows only, opens in place, then folds back.
    const fold = canvas.getByRole("button", { name: fr ? /Voir l'autre action/ : /Show the other action/ });
    await userEvent.click(fold);
    await expect(fold).toHaveAttribute("aria-expanded", "true");
    await expect(shown()).toBe(7);
    await userEvent.click(canvas.getByRole("button", { name: fr ? /Réduire/ : /Show less/ }));
    await expect(shown()).toBe(6);
  },
};
