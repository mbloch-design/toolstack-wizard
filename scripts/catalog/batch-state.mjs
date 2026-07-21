// Machine d'états de lot — usine catalogue ToolTrim.
// État local déterministe et versionné, écriture ATOMIQUE (tmp+rename), reprise possible,
// historique des transitions, isolation d'erreur par outil. Aucune réécriture du ledger/captures.
// Sorties hors bundle applicatif : research/batches/<batch_id>.json.
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

export const SCHEMA_VERSION = 1;
export const BATCH_DIR = "research/batches";

// États minimaux + transitions autorisées (toute autre transition est rejetée).
export const STATES = Object.freeze([
  "queued", "collecting", "collected", "editorial_draft", "staged",
  "needs_review", "eligible", "approved", "canonical", "failed", "rolled_back",
]);
const ALLOWED = Object.freeze({
  queued: ["collecting", "failed"],
  collecting: ["collected", "failed"],
  collected: ["editorial_draft", "failed"],
  editorial_draft: ["staged", "failed"],
  staged: ["needs_review", "eligible", "failed"],
  needs_review: ["eligible", "staged", "failed"],   // re-staging après revue
  eligible: ["approved", "needs_review", "failed"],
  approved: ["canonical", "failed"],
  canonical: ["rolled_back"],
  failed: ["queued", "collecting", "editorial_draft", "staged"],   // reprise
  rolled_back: ["queued", "staged"],
});

const now = () => new Date().toISOString();
const sha256 = (s) => "sha256:" + createHash("sha256").update(s).digest("hex");
const batchPath = (id) => path.join(BATCH_DIR, `${id}.json`);

function atomicWrite(file, obj) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, file);   // rename atomique : jamais d'état partiel
}

export function createBatch({ batch_id, slugs, market = "FR", locale = "fr-FR", created_by = "Claude Code" }) {
  if (!batch_id || !/^[a-z0-9][a-z0-9-]*$/.test(batch_id)) throw new Error("batch_id invalide");
  if (!Array.isArray(slugs) || slugs.length === 0) throw new Error("slugs explicites requis (jamais implicite)");
  if (new Set(slugs).size !== slugs.length) throw new Error("slugs dupliqués");
  for (const s of slugs) if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) throw new Error(`slug invalide: ${s}`);
  if (existsSync(batchPath(batch_id))) throw new Error(`batch existe déjà: ${batch_id}`);
  const tools = Object.fromEntries(slugs.map((slug) => [slug, {
    state: "queued", errors: [], blockers: [], attempts: 0,
    proposal_hash: null, run_id: null, history: [{ to: "queued", at: now() }], updated_at: now(),
  }]));
  const batch = {
    batch_id, schema_version: SCHEMA_VERSION, slugs: [...slugs], market, locale,
    created_by, created_at: now(), updated_at: now(), status: "preparing", tools,
  };
  atomicWrite(batchPath(batch_id), batch);
  return batch;
}

export function loadBatch(batch_id) {
  const file = batchPath(batch_id);
  if (!existsSync(file)) throw new Error(`batch introuvable: ${batch_id}`);
  const b = JSON.parse(readFileSync(file, "utf8"));
  if (b.schema_version !== SCHEMA_VERSION) throw new Error(`schema_version incompatible: ${b.schema_version}`);
  return b;
}

function saveBatch(b) { b.updated_at = now(); atomicWrite(batchPath(b.batch_id), b); return b; }

/** Transition d'un outil, validée. reason/blockers/errors/hash optionnels. Ne détruit jamais l'historique. */
export function transition(batch_id, slug, to, { reason, run_id, proposal_hash, blockers, error, incrementAttempt } = {}) {
  const b = loadBatch(batch_id);
  const t = b.tools[slug];
  if (!t) throw new Error(`slug hors lot: ${slug}`);
  if (!STATES.includes(to)) throw new Error(`état inconnu: ${to}`);
  if (t.state !== to && !(ALLOWED[t.state] ?? []).includes(to)) {
    throw new Error(`transition interdite ${t.state} -> ${to} (${slug})`);
  }
  const from = t.state;
  t.state = to;
  if (run_id !== undefined) t.run_id = run_id;
  if (proposal_hash !== undefined) t.proposal_hash = proposal_hash;
  if (blockers !== undefined) t.blockers = blockers;
  if (incrementAttempt) t.attempts += 1;
  if (error) t.errors = [...(t.errors ?? []), { at: now(), message: String(error) }];
  t.history.push({ from, to, at: now(), reason: reason ?? null, run_id: run_id ?? t.run_id });
  t.updated_at = now();
  // statut global du lot dérivé
  const states = Object.values(b.tools).map((x) => x.state);
  b.status = states.every((s) => ["canonical", "rolled_back"].includes(s)) ? "done"
    : states.some((s) => s === "failed") ? "attention" : "preparing";
  saveBatch(b);
  return t;
}

/** Prochaine action déterministe pour un outil (pour la reprise automatique). */
export function nextAction(tool) {
  return ({
    queued: "collect", collecting: "collect", collected: "editorial", editorial_draft: "stage",
    staged: "evaluate", needs_review: "await_review_or_restage", eligible: "await_apply_go",
    approved: "canonicalize", canonical: "verify_or_noop", failed: "retry_from_last_good", rolled_back: "recollect_or_restage",
  })[tool.state] ?? "unknown";
}

/** Reprise : outils non terminaux, dans l'ordre du lot. Une erreur isolée n'affecte pas les autres. */
export function resumable(batch_id) {
  const b = loadBatch(batch_id);
  return b.slugs
    .map((slug) => ({ slug, ...b.tools[slug] }))
    .filter((t) => !["canonical", "rolled_back"].includes(t.state))
    .map((t) => ({ slug: t.slug, state: t.state, next: nextAction(t), attempts: t.attempts, blockers: t.blockers }));
}

export function batchFingerprint(batch_id) {
  const b = loadBatch(batch_id);
  return sha256(JSON.stringify({ id: b.batch_id, slugs: b.slugs, states: Object.fromEntries(b.slugs.map((s) => [s, b.tools[s].state])) }));
}

export { batchPath };
