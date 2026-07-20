import { describe, it, expect } from "vitest";
import { extractWebflow } from "./webflow.mjs";
import { extractFramer } from "./framer.mjs";
import { extractSquarespace } from "./squarespace.mjs";

const wrap = (text) => `<html><body>${text.split(" | ").map((x) => `<div>${x}</div>`).join("")}</body></html>`;

describe("adaptateurs pilotes — familles et prix", () => {
  it("Webflow isole les Site plans et exclut la famille Platform", () => {
    const r = extractWebflow({ html: wrap("Site plans | Starter | For exploring | Free | Basic | For simple sites that don't need a CMS. | $ 15 /mo billed yearly | Add plan | Custom domain | Premium | For content-rich sites with robust CMS and traffic needs. | $ 25 /mo billed yearly | Add plan | Webflow CMS | Platform plans | Team | $2500/mo | All prices in USD, per site, plus applicable taxes added at checkout.") });
    expect(r.plans.map((p) => [p.plan_name, p.native_amount])).toEqual([["Basic", 15], ["Premium", 25]]);
    expect(r.page_proof.free_plan_proven).toBe(true);
    expect(r.page_proof.platform_plans_excluded).toBe(true);
    expect(r.plans.every((p) => p.tax_inclusion === "ht")).toBe(true);
  });

  it("Framer conserve Basic/Pro et signale Mini absent + Enterprise sur devis", () => {
    const r = extractFramer({ html: wrap("Start free, then scale your site | Yearly billing | Free | Try for free | $0 | Basic | Creative personal sites | $10 per month | Free custom domain | 2 CMS collections | 50 GB bandwidth | Built-in SEO | Pro | Growing professional sites | $30 per month | 10 CMS collections | 100 GB bandwidth | Staging environment | Enterprise | Mission critical sites | Custom | Additional editors") });
    expect(r.plans.map((p) => [p.plan_name, p.native_amount])).toEqual([["Basic", 10], ["Pro", 30]]);
    expect(r.page_proof.free_plan_proven).toBe(true);
    expect(r.page_proof.enterprise_custom).toBe(true);
    expect(r.page_proof.mini_absent_from_current_grid).toBe(true);
  });

  it("Squarespace extrait les quatre montants FR du rendu JS annuel", () => {
    const r = extractSquarespace({ html: wrap("Paiement annuel | Basic | 12 € /mois | 2 contributeurs | Essentiel | 18 € /mois | CSS et JavaScript | Plus | 32 € /mois | 1 % de frais | Advanced | 69 € /mois | 0 % de frais | Comparer les forfaits | Aucun forfait gratuit. Essai de 14 jours.") });
    expect(r.plans.map((p) => [p.plan_name, p.native_amount])).toEqual([["Basic", 12], ["Essentiel", 18], ["Plus", 32], ["Advanced", 69]]);
  });

  it("aucun adaptateur ne produit approved", () => {
    for (const fn of [extractWebflow, extractFramer, extractSquarespace]) {
      expect(JSON.stringify(fn({ html: "<html><body></body></html>" }))).not.toMatch(/approved/);
    }
  });
});
