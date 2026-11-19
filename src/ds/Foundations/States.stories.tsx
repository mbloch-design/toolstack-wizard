import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { Copy, PiggyBank, Wallet } from "@/lib/icons";
import Bento, { BentoRow, Tile, type Palette } from "../Bento/Bento";
import Button, { LinkArrow, TextButton, linkClass } from "../Button/Button";
import { Checkpoints } from "../StackBoard/StackBoard";
import Tabs, { ChoiceMenu } from "../Tabs/Tabs";
import Table from "../Table/Table";
import CopyText from "../CopyText/CopyText";
import { ToolRow, ToolRows } from "../ToolSheet/ToolSheet";
import { stateProblems } from "../test/invariants";
import { atoms } from "../atoms";

// Every interactive piece of Ma stack's tiles on every surface of the palette (18/11/2026; Michael on « À faire » in
// night: a hovered line turned white under white words). The play puts each one in each state and reads it.
const meta: Meta = { title: "Fondations/États sur chaque surface", tags: ["a-valider"], decorators: [(Story) => <div style={{ maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;

const SURFACES: Palette[] = ["plain", "bone", "sky", "butter", "coral", "pink", "mint", "blue", "night", "sky-soft", "butter-soft", "coral-soft", "pink-soft", "mint-soft", "blue-soft"];
const ASSISTANTS = [{ value: "claude", label: "Claude" }, { value: "chatgpt", label: "ChatGPT" }, { value: "other", label: "Autre" }];

function Surface({ palette }: { palette: Palette }) {
  return (
    <Tile span={6} palette={palette} label={palette} control={<ChoiceMenu label="Votre assistant" closeLabel="Fermer" value="claude" onChange={() => {}} options={ASSISTANTS} />}
      statement="2 étapes" footer={<div style={{ display: "grid", gap: 16 }}>
        <Checkpoints layout="list" label="Étapes" steps={[
          { id: "a", name: "Doublons", note: "Notion ou Milanote ?", done: false, icon: <Copy />, action: <TextButton arrow>Départager</TextButton> },
          { id: "b", name: "Prix", note: "9 à préciser", done: false, icon: <Wallet />, action: <TextButton arrow>Renseigner</TextButton> },
          { id: "c", name: "Facturer", note: "Couvert", done: true, icon: <PiggyBank /> },
        ]} />
        <span style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <a className={linkClass()} href="#">Tous les outils à brancher<LinkArrow shown /></a>
          <Button variant="secondary" icon={<Copy />}>Copier la demande</Button>
          <TextButton disabled>Indisponible</TextButton>
        </span>
      </div>} />
  );
}

export const Matrice: Story = {
  render: () => (
    <Bento compact label="États sur chaque surface">
      {Array.from({ length: Math.ceil(SURFACES.length / 2) }, (_, row) => (
        <BentoRow key={row}>{SURFACES.slice(row * 2, row * 2 + 2).map((palette) => <Surface key={palette} palette={palette} />)}</BentoRow>
      ))}
    </Bento>
  ),
  play: async ({ canvasElement }) => {
    const problems: string[] = [];
    const tiles = [...canvasElement.querySelectorAll<HTMLElement>("[data-palette]")];
    await expect(tiles.length).toBe(SURFACES.length);
    for (const tile of tiles) {
      const where = tile.dataset.palette;
      const pieces = [...tile.querySelectorAll<HTMLElement>("a, button:not([disabled]), li[data-done], li:not([data-done])")]
        .filter((el) => el.getBoundingClientRect().width > 0 && !el.closest("[aria-hidden='true']"));
      for (const el of pieces) {
        problems.push(...stateProblems(el, "repos").map((p) => `${where} · ${p}`));
        await userEvent.hover(el);
        problems.push(...stateProblems(el, "survol").map((p) => `${where} · ${p}`));
        // The words of a hovered line, on the line's own ground.
        for (const words of el.querySelectorAll<HTMLElement>("span")) if ((words.textContent ?? "").trim() && words.children.length === 0) problems.push(...stateProblems(words, "survol").map((p) => `${where} · ${p}`));
        await userEvent.unhover(el);
        if (el.matches("a, button")) {
          // Keyboard focus: the ring shows (focus-visible follows a key press).
          await userEvent.keyboard("{Shift}");
          el.focus();
          problems.push(...stateProblems(el, "focus").map((p) => `${where} · ${p}`));
          await userEvent.pointer({ keys: "[MouseLeft>]", target: el });
          problems.push(...stateProblems(el, "appui").map((p) => `${where} · ${p}`));
          await userEvent.pointer({ keys: "[/MouseLeft]", target: el });
          await userEvent.keyboard("{Escape}");
          el.blur();
        }
      }
    }
    await expect(problems).toEqual([]);
  },
};

/** The agents pages' controls on their white ground: tabs and their menu, the table's fold, a copyable identifier, a row. */
export const Agents: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 32 }}>
      <Tabs label="Où utilisez-vous l'IA ?" value="claude" onChange={() => {}} tabs={[{ value: "claude", label: "Claude" }, { value: "chatgpt", label: "ChatGPT" }]}
        more={{ label: "Outil de code", short: "Code", menuLabel: "Outil de code", closeLabel: "Fermer", options: [{ value: "cursor", label: "Cursor" }, { value: "any", label: "Adresse du serveur (autre outil)" }] }} />
      <Table columns={["Action", "Identifiant"]} sections={[{ key: "write", head: <span className={atoms.strong}>Modifie vos données · 8</span>, visible: 6, hideLabel: "Réduire", showLabel: (n) => `Voir les ${n} autres actions`,
        rows: Array.from({ length: 8 }, (_, i) => ({ key: String(i), cells: [`Action ${i + 1}`, <CopyText key={i} value={`tool_${i + 1}`} lang="fr" />] })) }]} />
      <ToolRows>
        <ToolRow logo={<span style={{ width: 40, height: 40, display: "inline-block" }} />} name="Notion" note="Retrouver, résumer et créer des pages." renderMain={(className, content) => <a className={className} href="#">{content}</a>} />
      </ToolRows>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const problems: string[] = [];
    const pieces = [...canvasElement.querySelectorAll<HTMLElement>("a, button:not([disabled]), [role=tab]")].filter((el) => el.getBoundingClientRect().width > 0);
    for (const el of pieces) {
      problems.push(...stateProblems(el, "repos"));
      await userEvent.hover(el);
      problems.push(...stateProblems(el, "survol"));
      await userEvent.unhover(el);
      await userEvent.keyboard("{Shift}");
      el.focus();
      problems.push(...stateProblems(el, "focus"));
      el.blur();
    }
    await expect(problems).toEqual([]);
  },
};
