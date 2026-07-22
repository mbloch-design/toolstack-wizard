import { describe, it, expect, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { createBatch, transition, loadBatch, batchPath } from "./batch-state.mjs";
import { applicableForApply, autoSignReferenceFr } from "../catalog-batch.mjs";

const ids = [];
const mk = () => { const id = `test-reffr-${Math.random().toString(36).slice(2, 8)}`; ids.push(id); return id; };
afterEach(() => { for (const id of ids.splice(0)) { const f = batchPath(id); if (existsSync(f)) rmSync(f); } });

describe("workflow reference_fr — auto-attestation atteignable (intégration)", () => {
  it("applicableForApply : eligible/approved/canonical OK", () => {
    for (const s of ["eligible", "approved", "canonical"]) expect(applicableForApply({ state: s })).toBe(true);
    expect(applicableForApply({ state: "queued" })).toBe(false);
    expect(applicableForApply({ state: "failed" })).toBe(false);
  });

  it("needs_review dont le SEUL blocage est l'attestation reference_fr => applicable (auto-signe)", () => {
    expect(applicableForApply({ state: "needs_review", blockers: ["attestation reference_fr requise (ToolTrim — Mike)"] })).toBe(true);
  });

  it("needs_review avec un AUTRE blocage => NON applicable (pas d'auto-signature)", () => {
    expect(applicableForApply({ state: "needs_review", blockers: ["éditorial non conforme: ..."] })).toBe(false);
    expect(applicableForApply({ state: "needs_review", blockers: ["attestation reference_fr requise", "éditorial non conforme"] })).toBe(false);
    expect(applicableForApply({ state: "needs_review", blockers: [] })).toBe(false);
  });

  it("SÉQUENCE complète : prepare(needs_review) -> auto-attestation -> eligible -> applicable", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["squarespace"] });
    // prepare a placé l'outil en needs_review (attestation absente)
    transition(id, "squarespace", "collecting");
    transition(id, "squarespace", "collected");
    transition(id, "squarespace", "editorial_draft");
    transition(id, "squarespace", "staged");
    transition(id, "squarespace", "needs_review", { blockers: ["attestation reference_fr requise (ToolTrim — Mike)"] });
    // avant apply : l'outil est APPLICABLE (l'ancienne garde le sautait -> bug corrigé)
    expect(applicableForApply(loadBatch(id).tools.squarespace)).toBe(true);
    // l'auto-attestation le fait passer eligible (simulé comme dans cmdRun)
    transition(id, "squarespace", "eligible", { blockers: [] });
    expect(applicableForApply(loadBatch(id).tools.squarespace)).toBe(true);
    expect(loadBatch(id).tools.squarespace.blockers).toEqual([]);
  });

  it("autoSignReferenceFr : détection read-only (already pour un dossier reference_fr signé, skip sinon)", () => {
    // n8n possède une attestation reference_fr active -> 'already' sans écriture
    const n8n = autoSignReferenceFr("n8n", "ToolTrim — Mike");
    expect(n8n.already || n8n.signed || n8n.skip).toBeTruthy();
    // webflow : marché global USD, aucun reference_fr -> skip (aucune écriture)
    expect(autoSignReferenceFr("webflow", "ToolTrim — Mike").skip).toBe(true);
  });
});
