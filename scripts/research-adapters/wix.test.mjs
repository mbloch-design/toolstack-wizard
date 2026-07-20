import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { extractWix } from "./wix.mjs";

const html = readFileSync(path.join(process.cwd(), "scripts/fixtures/wix-premium-fr.html"), "utf8");
const URL_WIX = "https://www.wix.com/premium-purchase-plan/dynamo";

/** Attendu golden : exactement ces 4 plans/prix, sans doublon. */
const EXPECTED = [
  { plan_name: "Light", native_amount: 16.8 },
  { plan_name: "Essentiel", native_amount: 30 },
  { plan_name: "Business", native_amount: 40.8 },
  { plan_name: "Business Plus", native_amount: 178.8 },
];

describe("adaptateur Wix — golden", () => {
  const r = extractWix({ html, url: URL_WIX });

  it("la page rend bien la grille 2x (8 price-container) et on déduplique à 4", () => {
    expect(r.page_proof.price_containers_found).toBe(8);
    expect(r.page_proof.deduped_to).toBe(4);
  });

  it("EXACTEMENT quatre plans, sans doublon", () => {
    expect(r.plans).toHaveLength(4);
    const keys = r.plans.map((p) => `${p.plan_name}|${p.native_amount}`);
    expect(new Set(keys).size).toBe(4);
  });

  it("les quatre plans/prix attendus, au centime près", () => {
    for (const e of EXPECTED) {
      const got = r.plans.find((p) => p.plan_name === e.plan_name);
      expect(got, `plan manquant: ${e.plan_name}`).toBeTruthy();
      expect(got.native_amount).toBe(e.native_amount);
      expect(got.native_currency).toBe("EUR");
      expect(got.billing_period).toBe("monthly");
    }
  });

  it("aucun plan inattendu", () => {
    expect(r.plans.map((p) => p.plan_name).sort()).toEqual(
      ["Business", "Business Plus", "Essentiel", "Light"]
    );
  });

  it("engagement annuel prouvé par la page", () => {
    expect(r.page_proof.billing_commitment).toBe("annual_prepaid");
    expect(r.plans.every((p) => p.billing_commitment === "annual_prepaid")).toBe(true);
  });

  it("TVA incluse prouvée par la note de taxe", () => {
    expect(r.plans.every((p) => p.tax_inclusion === "ttc")).toBe(true);
    expect(r.plans[0].tax_evidence).toMatch(/TVA/);
  });

  it("pricing_unit JAMAIS déduite : « collaborateurs sur le site » ne prouve pas « par site »", () => {
    expect(r.plans.every((p) => p.pricing_unit === null)).toBe(true);
    expect(r.unknowns.join(" ")).toMatch(/pricing_unit non prouvée/);
  });

  it("chaque plan porte une preuve (extrait + sélecteur)", () => {
    for (const p of r.plans) {
      expect(p.evidence_selector).toBe('[data-hook="price-container"]');
      expect(p.evidence_excerpt.length).toBeGreaterThan(0);
    }
  });

  it("aucun `approved` produit par l'adaptateur", () => {
    expect(JSON.stringify(r)).not.toMatch(/"approved"/);
  });
});

describe("adaptateur Wix — correspondance non univoque => weak_claim", () => {
  it("deux prix dans une même carte => aucune observation, weak_claim", () => {
    const dual = `<html><body><div class="card">
      <div class="box"><span>Ambigu</span></div>
      <div data-hook="price-container"><div data-hook="display-price">
        <span data-hook="display-price-currency-symbol">€</span>
        <span data-hook="display-price-integer-price">10</span>
        <span data-hook="display-price-cycle-label">/mois</span></div></div>
      <div data-hook="price-container"><div data-hook="display-price">
        <span data-hook="display-price-currency-symbol">€</span>
        <span data-hook="display-price-integer-price">20</span>
        <span data-hook="display-price-cycle-label">/mois</span></div></div>
      <p>abonnements annuels réglés en totalité</p>
    </div></body></html>`;
    const r = extractWix({ html: dual, url: URL_WIX });
    expect(r.plans).toHaveLength(0);
    expect(r.ambiguities.length).toBeGreaterThan(0);
    expect(r.ambiguities[0].missing.join(" ")).toMatch(/non univoque/);
  });

  it("engagement non prouvé => weak_claim, pas d'observation", () => {
    const noCommit = `<html><body><div class="card">
      <div class="box"><span>Light</span></div>
      <div data-hook="price-container"><div data-hook="display-price">
        <span data-hook="display-price-currency-symbol">€</span>
        <span data-hook="display-price-integer-price">16</span>
        <span data-hook="display-price-fraction-price">80</span>
        <span data-hook="display-price-cycle-label">/mois</span></div></div>
    </div></body></html>`;
    const r = extractWix({ html: noCommit, url: URL_WIX });
    expect(r.plans).toHaveLength(0);
    expect(r.ambiguities[0].missing.join(" ")).toMatch(/billing_commitment non prouvé/);
  });
});
