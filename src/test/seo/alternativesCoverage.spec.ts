import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import toolsIndex from "@/data/tools_index.json";
import { findSimilarTools, functionalAffinity } from "@/lib/alternativesSimilarity";

/**
 * La page /alternatives promet « Meilleures alternatives à X » dans son titre.
 * 525 des 1074 ne tenaient pas cette promesse : aucun bloc, 225 mots, rien.
 *
 * C'est la deuxième famille du site en clics (23,4 % sur trois mois) et la
 * seule où une demande mesurée faisait face à une offre vide.
 *
 * Ce test reproduit la cascade de ToolDetailPage — alternatives curées, puis
 * substituts de cluster, puis voisinage de catégorie par affinité
 * fonctionnelle, puis renvoi vers l'exploration — et échoue si une fiche
 * retombe dans le vide.
 *
 * Il ne verrouille pas la qualité des suggestions, seulement le fait qu'il y
 * en ait. La qualité tient au remplissage du catalogue, suivi à part.
 */

type Tool = Record<string, any>;

const raw = toolsIndex as unknown;
const allTools = (Array.isArray(raw) ? raw : (raw as any).tools ?? Object.values(raw as any)[0]) as Tool[];

const deprecated = new Set(
  [...readFileSync("vite.config.ts", "utf8")
    .match(/DEPRECATED_TOOL_SLUGS = new Set\(\[([\s\S]*?)\]\)/)![1]
    .matchAll(/"([^"]+)"/g)].map((m) => m[1]),
);

const served = allTools.filter((t) => !deprecated.has(t.slug || t.id));

/** Même cascade que ToolDetailPage, sans les alternatives curées de tools_v4. */
function neighbourCount(tool: Tool): number {
  if (tool.substitution_cluster_v2) {
    const cluster = served.filter(
      (c) => c.substitution_cluster_v2 === tool.substitution_cluster_v2 && c.id !== tool.id,
    );
    const similar = findSimilarTools(tool as any, cluster as any);
    if (similar.length) return similar.length;
  }
  return served.filter(
    (c) => c.categoryId && c.categoryId === tool.categoryId && c.id !== tool.id
      && functionalAffinity(tool as any, c as any) > 0,
  ).length;
}

describe("couverture des pages /alternatives", () => {
  it("sert au moins un voisin ou un renvoi d'exploration sur chaque fiche", () => {
    // Le renvoi d'exploration est inconditionnel dans ToolDetailPage, donc
    // aucune fiche ne peut plus afficher une section vide. Ce test garde la
    // propriété explicite : si la retombée est un jour retirée, il tombe.
    const orphelines = served.filter((t) => neighbourCount(t) === 0 && !t.slug);
    expect(orphelines, "fiches sans slug, donc sans page d'exploration atteignable").toEqual([]);
  });

  it("garde le nombre de fiches sans voisin dérivable sous le niveau constaté", () => {
    // 175 fiches n'ont aucun voisin dérivable des seules données du catalogue,
    // mesuré le 13/09/2026.
    //
    // Ce chiffre est volontairement plus élevé que les 105 pages réellement
    // vides sur le prérendu : la cascade ci-dessus ignore les alternatives
    // curées de `tools_v4.json` et les comparatifs mis en avant, que la page
    // consulte en plus. Il mesure donc la santé de la classification, pas le
    // rendu. Reproduire la cascade complète ferait dépendre le test de deux
    // sources supplémentaires pour un signal moins net.
    //
    // C'est une dette, pas une cible : le plafond doit baisser à mesure que
    // `functional_needs` et `substitution_cluster_v2` se remplissent. S'il
    // monte, c'est qu'une fiche a été ajoutée sans classement, ou qu'un tag a
    // été renommé sans être raccordé aux autres.
    const sansVoisin = served.filter((t) => neighbourCount(t) === 0);
    expect(sansVoisin.length, `fiches sans voisin : ${sansVoisin.slice(0, 10).map((t) => t.slug).join(", ")}`)
      .toBeLessThanOrEqual(175);
  });

  it("n'accepte pas un voisinage de catégorie sans affinité fonctionnelle", () => {
    // La catégorie seule ne qualifie rien : « creation » compte 226 outils, et
    // un classement par note y proposait FLUX AI et Grammarly en face
    // d'Ableton Live. L'affinité fonctionnelle est ce qui rend le voisinage
    // défendable, donc elle doit rester strictement positive.
    const ableton = served.find((t) => (t.slug || t.id) === "ableton-live");
    if (!ableton) return;
    const voisins = served
      .filter((c) => c.categoryId === ableton.categoryId && c.id !== ableton.id
        && functionalAffinity(ableton as any, c as any) > 0)
      .map((c) => c.name);
    expect(voisins).not.toContain("Grammarly");
    expect(voisins.length).toBeGreaterThan(0);
  });
});
