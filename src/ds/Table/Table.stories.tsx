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

/**
 * The server sheet's actions (step 8d): one table, one head of columns, a section per consequence under its own head
 * row, fixed columns; a long section folds in its own last row.
 */
export const Actions: Story = {
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    const row = ([action, id]: string[]) => ({ key: id, cells: [action, <code key={id}>{id}</code>] });
    return <>
      <h3 id="story-table-title" style={{ margin: 0 }}>{fr ? "Ce qu'il peut faire" : "What it can do"}</h3>
      <Table labelledBy="story-table-title" columns={fr ? ["Action", "Identifiant"] : ["Action", "Identifier"]} sections={[
        { key: "delete", group: "delete", head: <strong>{fr ? "Supprime des données · 7" : "Deletes data · 7"}</strong>, rows: ROWS.map(row), visible: 6,
          hideLabel: fr ? "Réduire" : "Show less", showLabel: (n: number) => (fr ? (n === 1 ? "Voir l'autre action" : `Voir les ${n} autres actions`) : (n === 1 ? "Show the other action" : `Show the ${n} other actions`)) },
        { key: "read", group: "read", head: <strong>{fr ? "Lecture seule · 2" : "Read only · 2"}</strong>, rows: [["Lire une page", "data_pages_read"], ["Lister les sites", "sites_list"]].map(row) },
      ]} />
    </>;
  },
  play: async ({ canvas, canvasElement, globals }) => {
    const fr = globals.lang !== "en";
    await expect(canvas.getByRole("table", { name: fr ? /Ce qu'il peut faire/ : /What it can do/ })).toBeInTheDocument();
    // One head of columns for every section, a row-group head per section.
    await expect(canvas.getAllByRole("columnheader").length).toBe(2);
    await expect(canvasElement.querySelectorAll("th[scope=rowgroup]").length).toBe(2);
    const shown = () => canvasElement.querySelectorAll("tbody:not([hidden]) tr[data-kind], tbody:not([hidden]) tr:not([class*=section]):not([class*=foot])").length;
    const before = shown();
    // The fold counts the hidden rows only, opens in place, then folds back.
    const fold = canvas.getByRole("button", { name: fr ? /Voir l'autre action/ : /Show the other action/ });
    await userEvent.click(fold);
    await expect(fold).toHaveAttribute("aria-expanded", "true");
    await expect(shown()).toBe(before + 1);
    await userEvent.click(canvas.getByRole("button", { name: fr ? /Réduire/ : /Show less/ }));
    await expect(shown()).toBe(before);
  },
};
