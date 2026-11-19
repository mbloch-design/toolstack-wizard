import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import catalog from "@/data/agents/catalog.json";
import { say, type McpAdvice, type McpSheet } from "@/lib/agents";
import { SituationCard } from "./AgentSheet";
import sheet from "./AgentSheet.module.css";
import SituationArt, { type SceneId } from "./SituationArt";
import styles from "./SituationArt.module.css";

/*
 * PROPOSITION du 19/11/2026, second tour, à valider par Michael. Sa direction, avec ses mots : « je veux ce genre de
 * style, tracé crayon, scène ou dessin avec de l'autodérision et du second degré ». Ses références (d'autres
 * illustrateurs) ne sont pas dans le dépôt : on n'en retient que des traits de style, sans copier ni décalquer.
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

/** The gag of each scene, for the reviewer and the illustrator's brief (the card itself never says it). */
const GAGS: Record<SceneId, string> = {
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
          {/* The sheet's own list and card (SituationCard), the drawing in place of the round. */}
          <ul className={sheet.cards}>
            {tool.advice.situations.map((situation, i) => (
              <SituationCard key={situation.ask.fr} situation={situation} lang="fr" art={<SituationArt scene={tool.scenes[i]} pencil={pencil} />} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Recommendation() {
  return (
    <aside className={styles.reco} aria-label="Recommandation">
      <h2 className={styles.title}>Tracé crayon : ce que le code donne, et comment aller plus loin</h2>
      <p className={styles.text}>
        Les neuf scènes ci-dessous sont codées en SVG : trait épais, une seule touche de la palette par dessin (ciel, beurre,
        corail ou menthe), le reste à l'encre de la page. Un filtre de déplacement fait trembler le trait, une texture de
        bruit le grène. La story « Sans crayon » montre les mêmes dessins sans ce filtre.
      </p>
      <ul className={styles.text}>
        <li>SVG codé (cette planche). Pour : léger (quelques ko par dessin, rien à charger), couleurs en jetons, mode sombre sans effort (l'encre devient craie), net à toute taille, retouchable dans le code. Contre, franchement : le trait tremble mais ne vit pas. L'épaisseur est presque constante, sans pression ni accident de pinceau, et le grain est le même partout. Surtout, le dessin reste celui de quelqu'un qui place des coordonnées : personnages sommaires, expressions limitées, gags lisibles mais sans la main d'un illustrateur. Bon pour une maquette, pas au niveau des références.</li>
        <li>Images générées, puis nettoyées et vectorisées. Pour : vraie texture, variantes rapides. Contre : cohérence difficile d'un dessin à l'autre, risque de reproduire de trop près les illustrateurs qu'on cite (exclu), provenance et droits flous, nettoyage à la main de chaque image, SVG vectorisés lourds (des dizaines de ko) et touche de couleur à reposer à la main.</li>
        <li>Commande à un illustrateur. Pour : un vrai trait, une vraie autodérision, une cohérence garantie, des droits clairs par contrat. Contre : coût et délai sur devis, et chaque nouvelle fiche dépend de lui si l'on commande scène par scène.</li>
      </ul>
      <p className={styles.text}>
        <strong>Recommandation : la commande à un illustrateur</strong>, sous forme d'une petite bibliothèque plutôt que de
        scènes à l'unité. Une douzaine de personnages et d'objets récurrents (la facture qui marche, l'assistant, la page, la
        pièce…), un guide de trait, livrés en SVG à une seule encre et un calque de couleur. On compose ensuite les scènes de
        chaque fiche dans le code, avec la touche de palette en jeton. Cette planche sert de brief : les gags, le cadrage et
        la place dans la carte sont posés. Limites : un budget et quelques semaines ; une cession de droits à prévoir pour le
        web ; au-delà de la bibliothèque, une scène vraiment nouvelle repasse par lui.
      </p>
      <p className={styles.text}>Les gags, pour le brief :</p>
      <ul className={styles.text}>
        {TOOLS.flatMap((tool) => tool.scenes.map((scene) => <li key={scene}>{tool.name} · {GAGS[scene]}</li>))}
      </ul>
      <p className={styles.text}>
        Emplacement : en tête de carte, à la place de la pastille, sur le gris de la carte, sans plateau. Une bande fixe de
        96 px dans toutes les cartes, le dessin calé sur le bord gauche du texte et posé sur le bas de la bande, 24 au-dessus
        du surtitre ; tous les dessins à la même échelle. Accessibilité : aria-hidden, jamais de texte dans l'image. Règle à amender, à toi Michael : le système
        dit qu'une illustration montre « un fragment réel du produit sur un plateau teinté, jamais une forme abstraite » ;
        ces scènes ne sont ni un fragment réel ni sur un plateau.
      </p>
    </aside>
  );
}

/** The board: the recommendation, then the nine pilot situations drawn in pencil. */
export const Planche: Story = {
  render: () => (
    <div className={styles.board}>
      <Recommendation />
      <Board pencil />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const drawings = [...canvasElement.querySelectorAll("li svg[aria-hidden='true']")];
    await expect(drawings.length).toBe(9);
    // No text in a drawing, and at most one palette touch per drawing.
    await expect(canvasElement.querySelectorAll("li svg text").length).toBe(0);
    for (const svg of drawings) {
      const touches = new Set([...svg.querySelectorAll("[fill^='var(--tt-pal-']")].map((el) => el.getAttribute("fill")));
      await expect(touches.size).toBeLessThanOrEqual(1);
    }
  },
};

/** The same drawings without the pencil filter: what the trembling and the grain add, and what they cannot. */
export const SansCrayon: Story = {
  name: "Sans crayon",
  render: () => (
    <div className={styles.board}>
      <Board pencil={false} />
    </div>
  ),
};
