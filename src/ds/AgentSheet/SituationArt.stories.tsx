import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import catalog from "@/data/agents/catalog.json";
import { say, type McpAdvice, type McpSheet, type SituationScene } from "@/lib/agents";
import { SituationCard } from "./AgentSheet";
import sheet from "./AgentSheet.module.css";
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

const advice = (slug: string) => (catalog.servers as McpSheet[]).find((s) => s.slug === slug)!.advice!;

const TOOLS: { name: string; advice: McpAdvice }[] = [
  { name: "Notion", advice: advice("notion-mcp") },
  { name: "Canva", advice: advice("canva-mcp") },
  { name: "Stripe", advice: advice("stripe-mcp") },
];

/** The gag of each scene, for the reviewer and whoever draws the next ones (the card itself never says it). */
const GAGS: Record<SituationScene, string> = {
  "notion-meeting": "L'assistant plonge tête la première dans le grenier Notion ; la seule page utile s'envole.",
  "notion-week": "La semaine arrive en traînant sa tâche bloquée comme un boulet.",
  "notion-invoice": "La facture court après le client, qui sort déjà du cadre.",
  "canva-post": "Le post carré et sa jumelle story : même tête, même soleil, l'une un peu gênée d'être si grande.",
  "canva-deck": "Les notes froissées passent au hachoir, une diapositive propre en sort.",
  "canva-feedback": "La présentation est ensevelie sous les commentaires ; une main dépasse du tas.",
  "stripe-invoice": "Le brouillon de facture, genoux qui tremblent, sous la loupe de la relecture.",
  "stripe-link": "La pêche au paiement : le lien sert d'hameçon, une pièce hésite.",
  "stripe-unpaid": "Les factures ouvertes attendent sur un banc, assez longtemps pour qu'une barbe pousse.",
};

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
        {TOOLS.flatMap((tool) => tool.advice.situations.map((situation) => situation.scene && <li key={situation.scene}>{tool.name} · {say("fr", situation.title)} : {GAGS[situation.scene]}</li>))}
      </ul>
    </aside>
  );
}

/** The nine pilot situations, as the sheets show them. */
export const Planche: Story = {
  render: () => (
    <div className={styles.board}>
      <Rule />
      <Board pencil />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const drawings = [...canvasElement.querySelectorAll("[data-situation] > svg[aria-hidden='true']")];
    await expect(drawings.length).toBe(9);
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
