import { describe, it, expect } from "vitest";
import { deriveConfig } from "./supabase-engine.mjs";

const obs = (o) => ({ review_status: "observed", native_currency: "EUR", native_amount: 20,
  billing_commitment: "annual_prepaid", collector_id: "obs:x", market_context: null, market_context_candidate: null, ...o });
const proposal = (observations, plans = [{}]) => ({
  tool_id: "t", tables: { tool_price_observations: observations, tool_plans: plans } });
const profile = (p = {}) => ({ comparePlanKey: "pro", freePlanKey: "free", ...p });

describe("deriveConfig — dérivation générique", () => {
  it("EUR + candidat reference_fr => eurIdentity, attestation requise, prix attendus", () => {
    const c = deriveConfig(profile(), proposal([obs({ market_context_candidate: "reference_fr", native_amount: 20 })]));
    expect(c).toMatchObject({ marketContext: "reference_fr", requiresAttestation: true, eurIdentity: true, currency: "EUR" });
    expect(c.expectedPrices).toEqual([20]);
  });

  it("reference_fr PROUVÉ (market_context, sans candidat) est détecté", () => {
    const c = deriveConfig(profile(), proposal([obs({ market_context: "reference_fr", market_context_candidate: null })]));
    expect(c.marketContext).toBe("reference_fr");
    expect(c.requiresAttestation).toBe(true);
  });

  it("global_usd_fallback déclaré => pas d'attestation, pas d'identité EUR", () => {
    const c = deriveConfig(profile({ marketContext: "global_usd_fallback" }),
      proposal([obs({ native_currency: "USD", native_amount: 15 })]));
    expect(c).toMatchObject({ marketContext: "global_usd_fallback", requiresAttestation: false, eurIdentity: false });
  });

  it("FILTRE ÉLIGIBILITÉ : un prix payant SANS engagement est exclu (contrainte DB)", () => {
    const c = deriveConfig(profile(), proposal([
      obs({ native_amount: 199, billing_commitment: "annual_prepaid", collector_id: "a" }),
      obs({ native_amount: 29, billing_commitment: null, collector_id: "b" }),   // month-to-month
    ]));
    expect(c.expectedPrices).toEqual([199]);          // 29 exclu (non approvable)
    expect(c.currentCollectorIds).toEqual(["a"]);     // seul l'éligible sera approuvé
  });

  it("outil sans observation (gratuit) => aucun prix attendu", () => {
    const c = deriveConfig(profile({ comparePlanKey: "free", freePlanKey: "free" }), proposal([]));
    expect(c.expectedPrices).toEqual([]);
    expect(c.requiresAttestation).toBe(false);
  });
});
