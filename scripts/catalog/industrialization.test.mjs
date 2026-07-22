import { describe, it, expect, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBatch, transition, batchPath } from "./batch-state.mjs";
import { buildWorkOrder } from "./work-order.mjs";
import { localControls, failingControls } from "./controls.mjs";
import { buildMatrix, validateMatrix } from "./editorial-matrix.mjs";
import { captureDigest, refreshIfChanged, recordDigest } from "./capture-cache.mjs";
import { registerFailure, tryEditorial, tryAutofix, failureSignature, loopPath } from "./loop-guard.mjs";
import { batchMetrics } from "./metrics.mjs";
import { stableStringify } from "./stable-json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = path.join(ROOT, "scripts", "catalog-batch.mjs");
const SLUG = "calendly";   // outil canonical avec dossier + profil réels

const cleanup = [];
afterEach(() => { for (const f of cleanup.splice(0)) if (existsSync(f)) rmSync(f); });
const mkBatch = () => {
  const id = `test-indus-${Math.random().toString(36).slice(2, 8)}`;
  cleanup.push(batchPath(id), loopPath(id));
  return id;
};

describe("work order — déterministe et compact", () => {
  it("même input => même work order (stringify stable identique)", () => {
    const a = buildWorkOrder(SLUG);
    const b = buildWorkOrder(SLUG);
    expect(stableStringify(a)).toBe(stableStringify(b));
  });
  it("contient uniquement les champs actionnables (pas d'historique brut)", () => {
    const wo = buildWorkOrder(SLUG);
    expect(wo.slug).toBe(SLUG);
    expect(wo.tool_id).toBeTruthy();
    for (const k of ["profile", "source", "captures", "claims", "observations", "validator_failures", "human_decisions"])
      expect(wo).toHaveProperty(k);
    expect(JSON.stringify(wo)).not.toMatch(/researchedOn|runs|last_checked_at/);
  });
});

describe("contrôles — seuls les échecs remontent", () => {
  it("localControls renvoie des {id, ok} ; failingControls ne garde que ok=false", () => {
    const all = localControls(SLUG);
    expect(all.length).toBeGreaterThan(5);
    const failing = failingControls(all);
    expect(failing.every((f) => "id" in f)).toBe(true);
    expect(failing.length).toBe(all.filter((c) => !c.ok).length);
    // aucun contrôle "ok:true" ne fuit vers l'arbitre
    expect(failing.some((f) => f.ok === true)).toBe(false);
  });
});

describe("matrice éditoriale — compacte, sans montants", () => {
  it("buildMatrix produit tous les champs et validateMatrix passe", () => {
    const m = buildMatrix(SLUG);
    expect(m.pricing_model).toBeTruthy();
    expect(validateMatrix(m).ok).toBe(true);
  });
  it("un montant injecté dans la matrice est rejeté", () => {
    const m = buildMatrix(SLUG);
    m.positioning = "Plans à partir de 12€ par mois";
    expect(validateMatrix(m).ok).toBe(false);
  });
});

describe("cache de collecte — no-op si capture inchangée", () => {
  it("empreinte déterministe ; refreshIfChanged => noop après enregistrement", () => {
    const d1 = captureDigest(SLUG);
    expect(d1.digest).toBe(captureDigest(SLUG).digest);
    cleanup.push(path.join(ROOT, "research", "cache", `${SLUG}.json`));
    recordDigest(SLUG);
    expect(refreshIfChanged(SLUG)).toEqual({ slug: SLUG, noop: true });
  });
});

describe("anti-boucle — arrêt après 2 échecs identiques", () => {
  it("registerFailure bloque au 2e échec identique, pas avant", () => {
    const id = mkBatch();
    // Deux échecs "identiques" à un id volatile près (hash normalisé => même signature).
    const r1 = registerFailure(id, SLUG, "engine: rollback sur cap:ab12cd34ef567890aa");
    expect(r1.block).toBe(false);
    const r2 = registerFailure(id, SLUG, "engine: rollback sur cap:ff99001122334455bb");
    expect(r2.signature).toBe(r1.signature);
    expect(r2.block).toBe(true);
  });
  it("max 1 génération éditoriale par langue, max 1 autofix", () => {
    const id = mkBatch();
    expect(tryEditorial(id, SLUG, "fr").allowed).toBe(true);
    expect(tryEditorial(id, SLUG, "fr").allowed).toBe(false);
    expect(tryEditorial(id, SLUG, "en").allowed).toBe(true);
    expect(tryAutofix(id, SLUG).allowed).toBe(true);
    expect(tryAutofix(id, SLUG).allowed).toBe(false);
  });
  it("signatures : messages équivalents (hash/espaces) partagent la signature", () => {
    expect(failureSignature("Erreur   X")).toBe(failureSignature("erreur x"));
  });
});

describe("rapport compact — conforme au contrat", () => {
  it("--report=compact émet {slug,phase,status,blockers,tests,mutations,next_action}", () => {
    const id = mkBatch();
    createBatch({ batch_id: id, slugs: [SLUG] });
    transition(id, SLUG, "collecting"); transition(id, SLUG, "collected");
    transition(id, SLUG, "editorial_draft"); transition(id, SLUG, "staged");
    transition(id, SLUG, "eligible", { blockers: [] });
    const r = spawnSync(process.execPath, [CLI, "report", `--batch=${id}`, "--report=compact"], { cwd: ROOT, encoding: "utf8" });
    expect(r.status).toBe(0);
    const arr = JSON.parse(r.stdout);
    const o = arr[0];
    for (const k of ["slug", "phase", "status", "blockers", "tests", "mutations", "next_action"]) expect(o).toHaveProperty(k);
    expect(o.status).toBe("ready");
    expect(Array.isArray(o.blockers)).toBe(true);
  });
});

describe("métriques de lot", () => {
  it("batchMetrics expose les compteurs de coût attendus", () => {
    const id = mkBatch();
    createBatch({ batch_id: id, slugs: [SLUG] });
    const m = batchMetrics(id);
    for (const k of ["tools", "processed_without_intervention", "blocked", "agent_calls", "retries", "captures_reused", "editorial_fields"])
      expect(m).toHaveProperty(k);
    expect(m.tools).toBe(1);
  });
});
