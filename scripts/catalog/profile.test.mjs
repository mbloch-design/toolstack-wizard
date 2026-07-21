import { describe, it, expect } from "vitest";
import { loadProfile, validateProfile, profiledSlugs } from "./profile.mjs";
import { deriveConfig } from "./supabase-engine.mjs";
import { prepareStageDryRun } from "../research-stage.mjs";

describe("profil unifié — validation avant réseau", () => {
  it("rejette un profil incomplet (avant tout réseau)", () => {
    expect(validateProfile({ slug: "x" }).ok).toBe(false);
    expect(validateProfile({ slug: "x", pricing_url: "u", renderer_hint: "browser", source_tier: 1,
      planOrder: ["a"], comparePlanKey: "b", locale: "fr-FR" }).errors.join(" ")).toMatch(/comparePlanKey/);
  });

  it("charge les 3 fixtures avec un profil valide", () => {
    for (const slug of ["wix", "webflow", "n8n"]) {
      const p = loadProfile(slug);
      expect(validateProfile(p).ok).toBe(true);
      expect(p.planOrder).toContain(p.comparePlanKey);
    }
  });

  it("distingue le contexte marché déclaré (webflow=global_usd_fallback) du candidat (wix/n8n=null)", () => {
    expect(loadProfile("webflow").marketContext).toBe("global_usd_fallback");
    expect(loadProfile("wix").marketContext).toBeNull();      // candidat reference_fr à la revue
    expect(loadProfile("n8n").marketContext).toBeNull();
    expect(loadProfile("n8n").editorialSource).toBe("research");
    expect(loadProfile("webflow").editorialSource).toBe("legacy");
  });

  it("profiledSlugs contient les 3 fixtures", () => {
    expect(profiledSlugs()).toEqual(expect.arrayContaining(["wix", "webflow", "n8n"]));
  });
});

describe("deriveConfig — config canonique dérivée (offline)", () => {
  it("n8n : reference_fr, identité EUR, comparePlan starter, freePlan community, 3 prix", async () => {
    const { proposal } = await prepareStageDryRun("n8n");
    const cfg = deriveConfig(loadProfile("n8n"), proposal);
    expect(cfg).toMatchObject({ toolId: "n8n", marketContext: "reference_fr", requiresAttestation: true,
      eurIdentity: true, currency: "EUR", comparePlanKey: "starter", freePlanKey: "community", planCount: 4 });
    expect(cfg.expectedPrices).toEqual([20, 50, 667]);
  });

  it("webflow : global_usd_fallback, aucune attestation, aucune identité EUR", async () => {
    const { proposal } = await prepareStageDryRun("webflow");
    const cfg = deriveConfig(loadProfile("webflow"), proposal);
    expect(cfg).toMatchObject({ toolId: "webflow", marketContext: "global_usd_fallback",
      requiresAttestation: false, eurIdentity: false, currency: "USD", comparePlanKey: "basic" });
  });
});
