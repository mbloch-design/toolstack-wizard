import { describe, it, expect } from "vitest";
import { DRAFTS, editorialPayload } from "./research-editorial-pilots.mjs";

describe("brouillons éditoriaux pilotes", () => {
  it("fournit FR et EN pour les trois outils", () => {
    expect(Object.keys(DRAFTS).sort()).toEqual(["framer", "squarespace", "webflow"]);
    for (const draft of Object.values(DRAFTS)) {
      expect(draft.fr.short_description).toBeTruthy();
      expect(draft.en.short_description).toBeTruthy();
      expect(draft.fr.verdict.threshold).toBeTruthy();
      expect(draft.en.verdict.threshold).toBeTruthy();
    }
  });

  it("référence les captures factuelles sans recopier les prix", () => {
    const doc = { collector: { observations: [{ status: "observed", capture_ref: "cap:1" }, { status: "observed", capture_ref: "cap:1" }] } };
    const p = editorialPayload("webflow", doc);
    expect(p.facts_basis).toEqual(["cap:1"]);
    expect(p.pricing_facts_policy).toMatch(/collector\.observations/);
    expect(JSON.stringify(p)).not.toMatch(/native_amount|native_currency|billing_commitment/);
  });
});
