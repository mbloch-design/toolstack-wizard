import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Les tables de correspondance FR/EN des guides sont dupliquees dans trois
 * fichiers, chacun pour une raison differente :
 *
 * - src/App.tsx        : redirections des routes cote client ;
 * - src/lib/seo.ts     : canonical et hreflang injectes apres hydratation ;
 * - vite.config.ts     : canonical et hreflang du prerendu et du sitemap.
 *
 * Quand elles divergent, le HTML servi et le DOM apres hydratation declarent
 * deux hreflang differents pour la meme page, et Google peut ignorer
 * l'annotation en entier. C'est arrive : trois paires publiees en septembre 2026
 * n'existaient que dans deux fichiers sur trois, et deux guides traduits
 * restaient marques francais uniquement dans seo.ts.
 *
 * Ce test echoue des qu'une table est modifiee sans les autres.
 */

function readMap(file: string): Record<string, string> {
  const source = readFileSync(file, "utf8");
  const block = source.match(/GUIDE_SLUG_ALTERNATES[^{]*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error(`GUIDE_SLUG_ALTERNATES introuvable dans ${file}`);
  const map: Record<string, string> = {};
  for (const line of block[1].split("\n")) {
    const entry = line.match(/"([^"]+)":\s*"([^"]+)"/);
    if (entry) map[entry[1]] = entry[2];
  }
  return map;
}

function readFrOnly(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const block = source.match(/GUIDE_FR_ONLY_SLUGS = new Set\(\[([\s\S]*?)\]\)/);
  if (!block) throw new Error(`GUIDE_FR_ONLY_SLUGS introuvable dans ${file}`);
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
}

const FILES = ["src/App.tsx", "src/lib/seo.ts", "vite.config.ts"];

describe("tables de correspondance des guides FR/EN", () => {
  it("declare les memes paires dans seo.ts et vite.config.ts", () => {
    // Ces deux la doivent coincider exactement : seo.ts emet le hreflang apres
    // hydratation, vite.config.ts l'emet dans le HTML servi. Une divergence fait
    // cohabiter deux annotations contradictoires sur la meme page.
    const seo = readMap("src/lib/seo.ts");
    const vite = readMap("vite.config.ts");
    expect(Object.keys(vite).filter((k) => !(k in seo)).sort(), "presentes dans vite.config.ts seulement").toEqual([]);
    expect(Object.keys(seo).filter((k) => !(k in vite)).sort(), "presentes dans seo.ts seulement").toEqual([]);
    for (const [fr, en] of Object.entries(seo)) {
      expect(vite[fr], `cible differente pour ${fr}`).toBe(en);
    }
  });

  it("declare dans App.tsx les paires qui ne sont pas des routes en dur", () => {
    // App.tsx sert a rediriger une URL vers sa traduction. Les guides qui ont
    // leur propre route declaree (les 5 piliers persona) n'ont rien a y faire.
    const app = readFileSync("src/App.tsx", "utf8");
    const hardRoutes = new Set([...app.matchAll(/path="guide\/([a-z0-9-]+)"/g)].map((m) => m[1]));
    const appMap = readMap("src/App.tsx");
    const missing = Object.entries(readMap("src/lib/seo.ts"))
      .filter(([fr, en]) => !hardRoutes.has(fr) && !hardRoutes.has(en) && !(fr in appMap))
      .map(([fr]) => fr);
    expect(missing, "paires absentes de la table de redirection d'App.tsx").toEqual([]);
  });

  it("declare les memes guides francais seulement dans les trois fichiers", () => {
    const sets = FILES.map((f) => ({ file: f, slugs: readFrOnly(f) }));
    for (const other of sets.slice(1)) {
      expect(other.slugs, `${other.file} diverge de ${sets[0].file}`).toEqual(sets[0].slugs);
    }
  });

  it("ne marque pas francais seulement un guide qui a une paire declaree", () => {
    const map = readMap("src/lib/seo.ts");
    const frOnly = readFrOnly("src/lib/seo.ts");
    const conflict = frOnly.filter((slug) => slug in map);
    expect(conflict, "ces slugs ont une traduction declaree ET sont marques francais seulement").toEqual([]);
  });

  it("pointe vers des cibles anglaises qui existent", () => {
    // Un slug de guide n'est pas forcement un article de posts-en.json. Il peut
    // aussi etre une route declaree en dur dans App.tsx (les 5 piliers persona)
    // ou une redirection vers une page de comparatif. Verifier uniquement le
    // JSON produit de fausses alertes : c'est l'erreur commise en septembre 2026
    // en auditant le maillage interne.
    const posts = JSON.parse(readFileSync("src/data/posts-en.json", "utf8")) as { slug: string }[];
    const app = readFileSync("src/App.tsx", "utf8");
    const hardRoutes = new Set(
      [...app.matchAll(/path="guide\/([a-z0-9-]+)"/g)].map((m) => m[1]),
    );
    const redirects = new Set(
      [...(app.match(/GUIDE_COMPARISON_REDIRECTS[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? "")
        .matchAll(/"([^"]+)":/g)].map((m) => m[1]),
    );
    // Certaines paires pointent vers un slug qui ne fait que rediriger vers une
    // page /comparatif/ : la liste vit dans vite.config.ts.
    const vite = readFileSync("vite.config.ts", "utf8");
    const viteRedirects = new Set(
      [...(vite.match(/GUIDE_COMPARISON_REDIRECTS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "")
        .matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    );
    const known = new Set([...posts.map((p) => p.slug), ...hardRoutes, ...redirects, ...viteRedirects]);

    const dangling = Object.entries(readMap("src/lib/seo.ts"))
      .filter(([, en]) => !known.has(en))
      .map(([fr, en]) => `${fr} -> ${en}`);
    expect(dangling, "paires pointant vers une cible anglaise inexistante").toEqual([]);
  });
});
