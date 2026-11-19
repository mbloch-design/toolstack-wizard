import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy } from "@/lib/icons";
import { expect } from "storybook/test";
import { IconButton } from "../Button/Button";
import { say, type McpAdvice, type McpSheet } from "@/lib/agents";
import catalog from "@/data/agents/catalog.json";
import SituationArt, { type Direction, type SceneId } from "./SituationArt";
import styles from "./SituationArt.module.css";

/*
 * PROPOSITION du 19/11/2026, à valider par Michael (« pourquoi pas mettre de petites illustrations ? », choix
 * « illustrations dessinées »). Trois directions, chacune sur les neuf situations pilotes de Notion, Canva et Stripe.
 * Rien n'est branché sur les fiches avant son choix.
 */

const meta: Meta = {
  title: "Agents/Illustrations (proposition)",
  tags: ["a-valider"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

const advice = (slug: string) => (catalog.servers as McpSheet[]).find((s) => s.slug === slug)!.advice!;

const TOOLS = [
  { name: "Notion", advice: advice("notion-mcp"), scenes: ["notion-meeting", "notion-week", "notion-invoice"] },
  { name: "Canva", advice: advice("canva-mcp"), scenes: ["canva-post", "canva-deck", "canva-feedback"] },
  { name: "Stripe", advice: advice("stripe-mcp"), scenes: ["stripe-invoice", "stripe-link", "stripe-unpaid"] },
] as const satisfies readonly { name: string; advice: McpAdvice; scenes: readonly SceneId[] }[];

const DIRECTIONS: { id: Direction; name: string; spec: string }[] = [
  {
    id: "ink",
    name: "A · Encre et aplat",
    spec: "Un trait fin à l'encre nuit (1,5 px) sur des aplats pastel légèrement décalés, comme une impression riso. Plateau os en tête de carte, pleine largeur, 12:7. Le plus « dessiné », le plus éditorial.",
  },
  {
    id: "flat",
    name: "B · Aplats posés",
    spec: "Sans contour : des formes pleines de la palette, l'écriture en petits traits d'encre. Plateau teinté de la couleur de la situation (ciel, beurre, menthe, rose, corail adoucis), pleine largeur, 12:7. Le plus proche de Ma stack.",
  },
  {
    id: "line",
    name: "C · Trait seul",
    spec: "Un seul trait à l'encre de la page et une seule touche pastel, sans plateau ; 88 px de haut, à la place de la pastille actuelle. Le plus discret, il suit le mode sombre sans effort.",
  },
];

function Card({ situation, scene, direction }: { situation: McpAdvice["situations"][number]; scene: SceneId; direction: Direction }) {
  return (
    <li className={styles.card}>
      <SituationArt scene={scene} direction={direction} />
      <p className={styles.eyebrow}>{say("fr", situation.title)}</p>
      <h3 className={styles.headline}>{say("fr", situation.gain)}</h3>
      <p className={styles.message}>{situation.ask.fr}</p>
      <div className={styles.action}><IconButton tone="grey" label="Copier la demande" icon={<Copy />} /></div>
    </li>
  );
}

function Direction({ direction }: { direction: (typeof DIRECTIONS)[number] }) {
  return (
    <section className={styles.direction} aria-label={direction.name}>
      <div className={styles.head}>
        <h2 className={styles.title}>{direction.name}</h2>
        <p className={styles.text}>{direction.spec}</p>
      </div>
      {TOOLS.map((tool) => (
        <div key={tool.name} className={styles.direction}>
          <p className={styles.tool}>{tool.name}</p>
          <ul className={styles.cards}>
            {tool.advice.situations.map((situation, i) => (
              <Card key={situation.ask.fr} situation={situation} scene={tool.scenes[i]} direction={direction.id} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Recommendation() {
  return (
    <aside className={styles.reco} aria-label="Recommandation">
      <h2 className={styles.title}>Notre recommandation : B, Aplats posés</h2>
      <p className={styles.text}>
        B prolonge la palette de Ma stack sans ajouter de trait ni d'effet : la carte reste calme et grise, la couleur vit dans
        le plateau, comme dans les pastilles d'aujourd'hui. Elle tient le mieux la finesse demandée et se dessine vite, scène
        après scène. A a plus de caractère mais tire la fiche vers l'illustration de presse ; C est la plus sobre mais se
        distingue mal d'un grand pictogramme.
      </p>
      <ul className={styles.text}>
        <li>Format : SVG inline dans le code, chaque scène décrite une fois en formes simples et rendue par un seul composant, couleurs prises dans les jetons de la palette (--tt-pal-*) ; aucune image à charger.</li>
        <li>Emplacement : en tête de carte, à la place de la pastille, pleine largeur, 12:7, rayon de carte ; 24 au-dessus du surtitre.</li>
        <li>Mode sombre : les plateaux restent clairs comme les tuiles de Ma stack, leur encre reste la nuit (C prend l'encre de la page).</li>
        <li>Accessibilité : aria-hidden, jamais de texte dans l'image ; le surtitre et la demande disent tout.</li>
        <li>Règle à amender (à toi, Michael) : le système dit qu'une illustration montre « un fragment réel du produit sur un plateau teinté, jamais une forme abstraite ». Ces dessins restent des fragments réels du résultat (la page, la base, la facture), mais dessinés et non capturés : la règle doit le permettre, pour les fiches MCP au moins.</li>
      </ul>
    </aside>
  );
}

/** The whole board: the recommendation, then each direction on the nine pilot situations. */
export const Planche: Story = {
  render: () => (
    <div className={styles.board}>
      <Recommendation />
      {DIRECTIONS.map((direction) => <Direction key={direction.id} direction={direction} />)}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Nine cards per direction, every drawing hidden from assistive technology and free of text.
    const drawings = canvasElement.querySelectorAll("svg[aria-hidden='true'][viewBox]");
    await expect(canvasElement.querySelectorAll("li").length).toBeGreaterThanOrEqual(27);
    await expect([...drawings].filter((svg) => svg.closest("li")).length).toBe(27);
    await expect(canvasElement.querySelectorAll("li svg text").length).toBe(0);
  },
};

/** One situation, the three directions side by side: the quickest way to choose. */
export const Comparaison: Story = {
  render: () => {
    const [notion, canva, stripe] = TOOLS.map((tool) => tool.advice.situations);
    return (
      <div className={styles.board}>
        <p className={styles.text}>De gauche à droite : A, Encre et aplat ; B, Aplats posés ; C, Trait seul.</p>
        {(["stripe-unpaid", "canva-post", "notion-meeting"] as const).map((scene) => {
          const situation = scene === "stripe-unpaid" ? stripe[2] : scene === "canva-post" ? canva[0] : notion[0];
          return (
            <ul key={scene} className={styles.cards} aria-label={say("fr", situation.title)}>
              {DIRECTIONS.map((direction) => <Card key={direction.id} situation={situation} scene={scene} direction={direction.id} />)}
            </ul>
          );
        })}
      </div>
    );
  },
};
