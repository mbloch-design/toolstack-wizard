import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import Table, { CompareMark, CompareTable } from "./Table";

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

const SERVERS: [string, boolean[], [string, string], string][] = [
  ["Notion", [true, true, true, false, false], ["Tous les forfaits", "Every plan"], "ChatGPT, Claude, Gemini"],
  ["Stripe", [true, true, false, false, true], ["Forfait non précisé", "Plan not stated"], "ChatGPT, Claude"],
  ["Google Analytics", [true, false, false, false, false], ["Forfait non précisé", "Plan not stated"], "Claude"],
  ["Buffer", [true, true, true, true, false], ["Tous les forfaits", "Every plan"], "ChatGPT, Claude"],
];

/** /mcp (step 9): the official servers side by side; in a narrow column each row stacks, each fact under its name. */
export const Comparatif: StoryObj = {
  decorators: [(Story) => <div style={{ maxWidth: 1080 }}><Story /></div>],
  render: (_args, { globals }) => {
    const fr = globals.lang !== "en";
    const kinds = fr ? ["Lit", "Modifie", "Supprime", "Envoie", "Paie"] : ["Reads", "Edits", "Deletes", "Sends", "Pays"];
    return (
      <CompareTable headLabel={fr ? "Outil" : "Tool"}
        columns={[...kinds.map((label, i) => ({ key: `k${i}`, label, marks: true })), { key: "plan", label: fr ? "Forfait" : "Plan" }, { key: "assistants", label: fr ? "Assistants" : "Assistants" }]}
        rows={SERVERS.map(([name, marks, plan, assistants]) => ({
          key: name, head: <a href="#">{name}</a>,
          cells: { ...Object.fromEntries(marks.map((on, i) => [`k${i}`, <CompareMark key={i} on={on} label={on ? (fr ? "Oui" : "Yes") : (fr ? "Non" : "No")} />])), plan: fr ? plan[0] : plan[1], assistants },
        }))} />
    );
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("tbody tr").length).toBe(4);
    await expect(canvasElement.querySelectorAll("tbody th[scope=row]").length).toBe(4);
  },
};
