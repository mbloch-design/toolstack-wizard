import { describe, it, expect, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { createBatch, loadBatch, transition, resumable, nextAction, batchPath, STATES } from "./batch-state.mjs";

const ids = [];
const mk = () => { const id = `test-batch-${Math.random().toString(36).slice(2, 8)}`; ids.push(id); return id; };
afterEach(() => { for (const id of ids.splice(0)) { const f = batchPath(id); if (existsSync(f)) rmSync(f); } });

describe("batch-state — machine d'états de lot", () => {
  it("crée un lot déterministe avec slugs explicites", () => {
    const id = mk();
    const b = createBatch({ batch_id: id, slugs: ["framer", "squarespace"] });
    expect(b.schema_version).toBe(1);
    expect(b.slugs).toEqual(["framer", "squarespace"]);
    expect(b.tools.framer.state).toBe("queued");
    expect(b.tools.framer.attempts).toBe(0);
    expect(loadBatch(id).batch_id).toBe(id);
  });

  it("refuse slugs vides / dupliqués / invalides", () => {
    expect(() => createBatch({ batch_id: mk(), slugs: [] })).toThrow(/explicites/);
    expect(() => createBatch({ batch_id: mk(), slugs: ["a", "a"] })).toThrow(/dupliqués/);
    expect(() => createBatch({ batch_id: mk(), slugs: ["Bad Slug"] })).toThrow(/invalide/);
  });

  it("autorise une transition valide et conserve l'historique", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["framer"] });
    transition(id, "framer", "collecting", { run_id: "run-1" });
    const t = transition(id, "framer", "collected", { reason: "3 captures" });
    expect(t.state).toBe("collected");
    expect(t.run_id).toBe("run-1");
    expect(t.history.map((h) => h.to)).toEqual(["queued", "collecting", "collected"]);
  });

  it("REFUSE une transition interdite sans détruire l'état", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["framer"] });
    expect(() => transition(id, "framer", "canonical")).toThrow(/transition interdite/);
    expect(loadBatch(id).tools.framer.state).toBe("queued");   // état préservé
  });

  it("isole l'erreur d'un outil sans affecter les autres", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["framer", "squarespace"] });
    transition(id, "framer", "failed", { error: "network_or_tool_limit", incrementAttempt: true });
    const b = loadBatch(id);
    expect(b.tools.framer.state).toBe("failed");
    expect(b.tools.framer.attempts).toBe(1);
    expect(b.tools.framer.errors[0].message).toMatch(/network/);
    expect(b.tools.squarespace.state).toBe("queued");   // intact
    expect(b.status).toBe("attention");
  });

  it("permet la reprise depuis le dernier bon état", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["framer", "squarespace"] });
    transition(id, "framer", "collecting");
    transition(id, "framer", "collected");
    transition(id, "framer", "editorial_draft");
    transition(id, "framer", "staged");
    transition(id, "framer", "eligible");
    const r = resumable(id);
    expect(r.find((x) => x.slug === "framer")).toMatchObject({ state: "eligible", next: "await_apply_go" });
    expect(r.find((x) => x.slug === "squarespace")).toMatchObject({ state: "queued", next: "collect" });
  });

  it("exclut les outils terminaux de la reprise", () => {
    const id = mk();
    createBatch({ batch_id: id, slugs: ["framer"] });
    for (const s of ["collecting", "collected", "editorial_draft", "staged", "eligible", "approved", "canonical"]) transition(id, "framer", s);
    expect(resumable(id)).toHaveLength(0);
    expect(loadBatch(id).status).toBe("done");
  });

  it("nextAction couvre tous les états", () => {
    for (const s of STATES) expect(nextAction({ state: s })).not.toBe("unknown");
  });
});
