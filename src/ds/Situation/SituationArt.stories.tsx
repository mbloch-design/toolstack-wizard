import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import catalog from "@/data/agents/catalog.json";
import { say, type McpAdvice, type McpSheet } from "@/lib/agents";
import { SituationCard } from "./AgentSheet";
import sheet from "./AgentSheet.module.css";
import { SCENES } from "./SituationArt";
import styles from "./SituationArt.module.css";

/*
 * The pencil scenes of the MCP sheets' situation cards (19/11/2026). Michael's direction: « je veux ce genre de style,
 * tracé crayon, scène ou dessin avec de l'autodérision et du second degré », then « parfait, go sur ça ». His references
 * (other illustrators' work) are not in the repository: only traits of style were kept, nothing copied or traced.
 * Each card is the sheet's own SituationCard; the scene comes from the data (advice.situations[].scene).
 */

const meta: Meta = {
  title: "Agents/Illustrations",
  tags: ["a-valider"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

const servers = (catalog.servers as McpSheet[]).filter((server) => server.advice);
const advice = (slug: string) => servers.find((s) => s.slug === slug)!.advice!;

/** Every sheet with a freelancer's advice: the three pilots first, then the others in the catalogue's order. */
const PILOT = ["notion-mcp", "canva-mcp", "stripe-mcp"];
const TOOLS: { name: string; advice: McpAdvice }[] = [
  ...PILOT.map((slug) => servers.find((s) => s.slug === slug)!),
  ...servers.filter((s) => !PILOT.includes(s.slug)),
].map((server) => ({ name: server.name, advice: server.advice! }));
const situations = TOOLS.flatMap((tool) => tool.advice.situations);

function Board({ pencil }: { pencil: boolean }) {
  return (
    <>
      {TOOLS.map((tool) => (
        <section key={tool.name} className={styles.direction} aria-label={tool.name}>
          <p className={styles.tool}>{tool.name}</p>
          <ul className={sheet.cards}>
            {tool.advice.situations.map((situation) => <SituationCard key={situation.ask.fr} situation={situation} lang="fr" pencil={pencil} />)}
          </ul>
        </section>
      ))}
    </>
  );
}

function Rule() {
  return (
    <aside className={styles.reco} aria-label="La règle">
      <h2 className={styles.title}>Une scène au crayon, au second degré</h2>
      <p className={styles.text}>
        Une carte de situation d'une fiche MCP porte une scène dessinée : un gag sur la vie de free, trait épais à la main,
        quasi monochrome, au plus une touche de la palette (ciel, beurre, corail ou menthe). Une bande de 96 px, calée sur le
        bord gauche du texte, 24 au-dessus du surtitre, à la place de la pastille. Une situation sans scène garde sa
        pastille. Le trait est simulé en SVG : un filtre de déplacement le fait trembler, une texture de bruit le grène.
        aria-hidden, jamais de texte dans l'image.
      </p>
      <p className={styles.text}>Les gags :</p>
      <ul className={styles.text}>
        {TOOLS.flatMap((tool) => tool.advice.situations.map((situation) => situation.scene && <li key={`${tool.name}-${situation.scene}`}>{tool.name} · {say("fr", situation.title)} : {SCENES[situation.scene].gag}</li>))}
      </ul>
    </aside>
  );
}

/** Every situation of every sheet, server by server, as the sheets show them. */
export const Planche: Story = {
  render: () => (
    <div className={styles.board}>
      <Rule />
      <Board pencil />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const drawings = [...canvasElement.querySelectorAll("[data-situation] > svg[aria-hidden='true']")];
    await expect(drawings.length).toBe(situations.filter((situation) => situation.scene).length);
    // No text in a drawing, and at most one palette touch per drawing.
    await expect(canvasElement.querySelectorAll("[data-situation] svg text").length).toBe(0);
    for (const svg of drawings) {
      const touches = new Set([...svg.querySelectorAll<SVGElement>("[style*='--tt-pal-']")].map((el) => el.style.fill));
      await expect(touches.size).toBeLessThanOrEqual(1);
    }
  },
};

/** The same drawings without the pencil filter: what the trembling and the grain add. */
export const SansCrayon: Story = {
  name: "Sans crayon",
  render: () => (
    <div className={styles.board}>
      <Board pencil={false} />
    </div>
  ),
};

/** A situation without a scene (the other sheets, the situations to come) keeps its icon round. */
export const SansScene: Story = {
  name: "Sans scène",
  render: () => {
    const situation = { ...advice("notion-mcp").situations[0], scene: undefined };
    return <ul className={sheet.cards}><SituationCard situation={situation} lang="fr" /></ul>;
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[data-situation] [data-palette='sky'] > svg")).not.toBeNull();
    await expect(canvasElement.querySelector("[data-situation] > svg")).toBeNull();
  },
};
