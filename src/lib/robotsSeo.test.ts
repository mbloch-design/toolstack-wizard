import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const robots = fs.readFileSync(path.join(root, "public/robots.txt"), "utf8");
const dynamicCanonical = fs.readFileSync(
  path.join(root, "src/components/DynamicCanonical.tsx"),
  "utf8",
);
const appRoutes = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const seoSource = fs.readFileSync(path.join(root, "src/lib/seo.ts"), "utf8");

describe("robots SEO policy", () => {
  it("keeps private API routes blocked", () => {
    expect(robots).toContain("Disallow: /api/");
  });

  it("lets crawlers read directives on noindex and tracking variants", () => {
    expect(robots).not.toMatch(/Disallow:.*\/(selector|diagnostic)/);
    expect(robots).not.toMatch(/Disallow:.*utm_(source|medium|campaign)/);
    expect(dynamicCanonical).toContain(
      "const canonical = `${SEO_BASE}${canonicalPath}`;",
    );
    expect(dynamicCanonical).not.toContain("location.search");
  });

  it("redirects retired selector and diagnostic URL families to Ma Stack", () => {
    expect(appRoutes).toContain(
      '<Route path="diagnostic/*" element={<Navigate to="../ma-stack" replace />} />',
    );
    expect(appRoutes).toContain(
      '<Route path="selector/*" element={<Navigate to="../ma-stack" replace />} />',
    );
    expect(appRoutes).not.toContain('import("@/pages/SelectorPage")');
    expect(appRoutes).not.toContain('import("@/pages/ResultsPage")');
  });

  it("maps the Adobe Podcast guide to its real English alternate", () => {
    expect(seoSource).toContain(
      '"adobe-podcast-ai-gratuit-alternatives-2026": "adobe-podcast-ai-free-limits-alternatives-2026"',
    );
  });

  it("maps translated guides and omits alternates for French-only guides", () => {
    expect(seoSource).toContain(
      '"stack-saas-minimaliste-freelance-2026-moins-50-euros": "minimalist-saas-stack-freelancer-2026-under-50-euros"',
    );
    // Ces deux guides etaient marques francais seulement jusqu au 10/09/2026,
    // date a laquelle leur version anglaise a ete redigee. Ils sont desormais
    // apparies, et ce sont leurs paires qui doivent exister.
    expect(seoSource).toContain(
      '"agents-ia-freelances-2026-lesquels-valent-le-coup": "ai-agents-freelancers-2026"',
    );
    expect(seoSource).toContain(
      '"zapier-vs-make-vs-n8n-2026-automatiser-stack": "zapier-vs-make-vs-n8n-pricing"',
    );
    // Le mecanisme lui-meme reste teste sur un guide encore sans traduction.
    expect(seoSource).toMatch(
      /GUIDE_FR_ONLY_SLUGS[\s\S]*"notion-gratuit-vs-payant-vrai-calcul"/,
    );
  });
});
