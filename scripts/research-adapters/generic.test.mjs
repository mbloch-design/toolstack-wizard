import { describe, it, expect } from "vitest";
import { extractGeneric } from "./generic.mjs";

const ld = (obj) => `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body></body></html>`;

describe("adaptateur générique (Phase D) — sûr par conception", () => {
  it("promeut un plan depuis des données structurées NON ambiguës", () => {
    const r = extractGeneric({ html: ld({
      "@type": "Product", name: "Pro",
      offers: [{ "@type": "Offer", name: "Pro", price: "29", priceCurrency: "USD",
        priceSpecification: { unitText: "month" } }],
    }) });
    expect(r.page_proof.extraction_strategy).toBe("structured_data");
    expect(r.plans).toHaveLength(1);
    expect(r.plans[0]).toMatchObject({ plan_name: "Pro", native_amount: 29, native_currency: "USD", billing_period: "monthly" });
    // l'adaptateur ne fabrique jamais engagement/unité : fournis par le registre
    expect(r.plans[0].billing_commitment).toBeNull();
    expect(r.plans[0].pricing_unit).toBeNull();
  });

  it("REFUSE de promouvoir un nom ambigu (plusieurs devises) -> ambiguïté", () => {
    const r = extractGeneric({ html: ld({ "@type": "Product", name: "Basic", offers: [
      { "@type": "Offer", name: "Basic", price: "14", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Basic", price: "16", priceCurrency: "GBP" },
      { "@type": "Offer", name: "Basic", price: "18", priceCurrency: "USD" },
    ] }) });
    expect(r.plans).toHaveLength(0);
    expect(r.ambiguities.some((a) => a.plan_name === "Basic")).toBe(true);
  });

  it("hors données structurées : SIGNAL heuristique seulement, jamais d'observation", () => {
    const r = extractGeneric({ html: "<html><body>Pro Plan only $29 / mo for teams. Enterprise $99 / mo.</body></html>" });
    expect(r.page_proof.extraction_strategy).toBe("heuristic_signal_only");
    expect(r.plans).toHaveLength(0);   // jamais de plan bruité promu
    expect(r.ambiguities.length).toBeGreaterThan(0);
    expect(r.ambiguities.every((a) => a.plan_name === null)).toBe(true);
  });

  it("un « $0/mo » n'est jamais une observation (plan gratuit = claim)", () => {
    const r = extractGeneric({ html: ld({ "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" }) });
    expect(r.plans).toHaveLength(0);
  });

  it("page sans prix : aucune extraction, aucun bruit", () => {
    const r = extractGeneric({ html: "<html><body>Documentation and help center.</body></html>" });
    expect(r.plans).toHaveLength(0);
    expect(r.page_proof.extraction_strategy).toBe("none");
  });
});
