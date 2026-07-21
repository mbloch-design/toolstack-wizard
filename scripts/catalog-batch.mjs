#!/usr/bin/env node
// Usine catalogue ToolTrim — point d'entrée générique unique.
//   node scripts/catalog-batch.mjs prepare  --batch=<id> --slugs=a,b --market=FR --locale=fr-FR
//   node scripts/catalog-batch.mjs report   --batch=<id>
//   node scripts/catalog-batch.mjs dry-run  --batch=<id>
//   node scripts/catalog-batch.mjs apply    --batch=<id> --actor="ToolTrim — Mike" [--slugs=a]
//   node scripts/catalog-batch.mjs rollback --batch=<id> --slugs=a --actor="ToolTrim — Mike"
//
// Aucun outil implicite. Un outil en erreur n'interrompt pas le lot. Aucun write Supabase sans --apply.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBatch, loadBatch, transition, resumable, batchPath } from "./catalog/batch-state.mjs";
import { loadProfile } from "./catalog/profile.mjs";
import { validateEditorial } from "./catalog/editorial-contract.mjs";
import { verifyCatalogInvariants, untouchedFingerprint } from "./catalog/verify-batch.mjs";
import { prepareStageDryRun } from "./research-stage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";

function args(argv) {
  const a = { _: [] };
  for (const x of argv) {
    const m = x.match(/^--([^=]+)=(.*)$/);
    if (m) a[m[1]] = m[2]; else if (x.startsWith("--")) a[x.slice(2)] = true; else a._.push(x);
  }
  return a;
}
function loadEnv() {
  if (!existsSync(ENV_FILE)) throw new Error(`env absent: ${ENV_FILE}`);
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
async function connect() {
  loadEnv();
  const { default: postgres } = await import("postgres");
  const ref = process.env.VITE_SUPABASE_PROJECT_ID;
  return postgres({ host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
    port: 5432, database: "postgres", username: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD,
    ssl: "require", max: 1, connect_timeout: 10, idle_timeout: 5 });
}

// ── prepare : valide profils (avant réseau), collecte, staging, gate par outil ──
async function cmdPrepare(a) {
  const slugs = String(a.slugs || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!a.batch || slugs.length === 0) throw new Error("prepare exige --batch et --slugs explicites");
  // 1) validation des profils AVANT tout réseau (rejet immédiat si invalide)
  for (const slug of slugs) loadProfile(slug);
  const batch = existsSync(batchPath(a.batch)) ? loadBatch(a.batch)
    : createBatch({ batch_id: a.batch, slugs, market: a.market || "FR", locale: a.locale || "fr-FR" });
  // 2) collecte — REPRISE : un dossier déjà présent n'est pas re-collecté (sauf --recollect).
  const dossier = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);
  const pending = resumable(a.batch).filter((t) => ["queued", "failed", "collecting"].includes(t.state)).map((t) => t.slug);
  for (const slug of pending) if (!a.recollect && existsSync(dossier(slug))) transition(a.batch, slug, "collected", { reason: "dossier existant (reprise)" });
  const todo = resumable(a.batch).filter((t) => ["queued", "failed", "collecting"].includes(t.state)).map((t) => t.slug);
  if (todo.length) {
    for (const slug of todo) transition(a.batch, slug, "collecting", { incrementAttempt: true });
    // Slugs explicites uniquement ; robots respecté ; concurrence bornée (2-3), délai + jitter côté collecteur.
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "research-collector.mjs"),
      `--slugs=${todo.join(",")}`, `--market=${batch.market}`, `--locale=${batch.locale}`,
      "--renderer=auto", "--concurrency=2", "--delay=2000"], { cwd: ROOT, encoding: "utf8" });
    if (r.status !== 0) console.error("collecte: sortie non nulle (voir research/runs) — erreurs isolées par outil");
    for (const slug of todo) transition(a.batch, slug, existsSync(dossier(slug)) ? "collected" : "failed",
      existsSync(dossier(slug)) ? {} : { error: "collecte sans dossier research" });
  }
  // 3) staging + gate (éditorial research requis selon profil)
  for (const slug of loadBatch(a.batch).slugs) {
    const t = loadBatch(a.batch).tools[slug];
    if (t.state === "failed" || t.state === "queued") continue;
    try {
      const profile = loadProfile(slug);
      const blockers = [];
      // Garde éditoriale automatique (contrat) pour les fiches à contenu research.
      if (profile.editorialSource === "research") {
        const doc = JSON.parse(readFileSync(path.join(ROOT, "research", "tool-pages", `${slug}.json`), "utf8"));
        const v = validateEditorial(doc.editorial_drafts, { slug });
        if (!v.ok) blockers.push(`éditorial non conforme: ${v.errors.slice(0, 2).join("; ")}`);
      }
      const { proposal } = await prepareStageDryRun(slug);
      transition(a.batch, slug, "editorial_draft");
      transition(a.batch, slug, "staged", { proposal_hash: proposal.proposal_hash });
      const obs = proposal.tables.tool_price_observations ?? [];
      if (obs.some((o) => o.market_context_candidate === "reference_fr" || o.market_context === "reference_fr"))
        blockers.push("attestation reference_fr requise (ToolTrim — Mike)");
      transition(a.batch, slug, blockers.length ? "needs_review" : "eligible", { blockers });
    } catch (e) { transition(a.batch, slug, "failed", { error: e.message }); }
  }
  cmdReport({ batch: a.batch });
}

// ── report : tableau compact ──
function cmdReport(a) {
  const b = loadBatch(a.batch);
  const rows = b.slugs.map((slug) => {
    const t = b.tools[slug];
    const gate = ["eligible", "approved", "canonical"].includes(t.state) ? "READY"
      : ["needs_review", "staged"].includes(t.state) ? "REVIEW" : t.state === "failed" ? "FAILED" : "…";
    return { slug, state: t.state, gate, blockers: (t.blockers || []).length, errors: (t.errors || []).length };
  });
  console.log(`\n### Lot ${b.batch_id} (${b.status}) — ${b.market}/${b.locale}\n`);
  console.log("| Outil | État | Gate | Blockers | Erreurs |");
  console.log("|---|---|---|--:|--:|");
  for (const r of rows) console.log(`| ${r.slug} | ${r.state} | ${r.gate} | ${r.blockers} | ${r.errors} |`);
  const ready = rows.filter((r) => r.gate === "READY").map((r) => r.slug);
  const blocked = rows.filter((r) => r.gate !== "READY").map((r) => r.slug);
  console.log(`\nREADY: ${ready.join(", ") || "—"}\nBLOCKED: ${blocked.join(", ") || "—"}`);
  return { ready, blocked };
}

// ── dry-run / apply : moteur générique par outil, isolé ──
async function cmdRun(a, apply) {
  const b = loadBatch(a.batch);
  const { runTool } = await import("./catalog/supabase-engine.mjs");
  const only = a.slugs ? new Set(String(a.slugs).split(",").map((s) => s.trim())) : null;
  const actor = a.actor || "ToolTrim — Mike";
  const sql = await connect();
  const results = [];
  try {
    // Empreinte des outils hors lot AVANT apply (filet non-régression).
    const untouched = apply ? await untouchedFingerprint(sql, b.slugs) : null;
    for (const slug of b.slugs) {
      if (only && !only.has(slug)) continue;
      const st = b.tools[slug].state;
      if (apply && st !== "eligible" && st !== "approved" && st !== "canonical") { results.push({ toolId: slug, skipped: st }); continue; }
      try {
        const { proposal } = await prepareStageDryRun(slug);
        const res = await runTool({ sql, profile: loadProfile(slug), proposal, actor, apply });   // profil unifié (marketContext)
        results.push(res);
        if (apply && res.applied) {
          if (b.tools[slug].state === "eligible") transition(a.batch, slug, "approved");
          transition(a.batch, slug, "canonical", { reason: "engine apply" });
        }
      } catch (e) { results.push({ toolId: slug, error: e.message }); if (apply) transition(a.batch, slug, "failed", { error: e.message }); }
    }
    // Phase K : invariants catalogue après apply (cardinalité, projection, rôles, aucun hors-lot modifié).
    if (apply) {
      const inv = await verifyCatalogInvariants(sql, { untouched });
      console.log(JSON.stringify({ mode: "APPLY", batch: b.batch_id, invariants: inv, results }, null, 2));
      return results;
    }
  } finally { await sql.end({ timeout: 1 }); }
  console.log(JSON.stringify({ mode: "DRY_RUN", batch: b.batch_id, results }, null, 2));
  return results;
}

async function cmdVerify(a) {
  const sql = await connect();
  try {
    const inv = await verifyCatalogInvariants(sql, a.canonical ? { canonicalCount: Number(a.canonical) } : {});
    console.log(JSON.stringify({ mode: "VERIFY", invariants: inv }, null, 2));
  } finally { await sql.end({ timeout: 1 }); }
}

// ── rollback : par outil ──
async function cmdRollback(a) {
  const slugs = String(a.slugs || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!slugs.length) throw new Error("rollback exige --slugs explicites");
  const apply = Boolean(a.apply);
  const { rollbackTool } = await import("./catalog/supabase-engine.mjs");
  const sql = await connect();
  const results = [];
  try { for (const slug of slugs) { try { results.push(await rollbackTool({ sql, toolId: slug, apply })); } catch (e) { results.push({ toolId: slug, error: e.message }); } } }
  finally { await sql.end({ timeout: 1 }); }
  console.log(JSON.stringify({ mode: apply ? "ROLLBACK_APPLY" : "ROLLBACK_DRY_RUN", results }, null, 2));
}

const a = args(process.argv.slice(2));
const cmd = a._[0];
const run = {
  prepare: () => cmdPrepare(a), report: () => cmdReport(a),
  "dry-run": () => cmdRun(a, false), apply: () => cmdRun(a, true), rollback: () => cmdRollback(a),
  verify: () => cmdVerify(a),
}[cmd];
if (!run) { console.error("commandes: prepare | report | dry-run | apply | rollback | verify"); process.exit(1); }
Promise.resolve(run()).catch((e) => { console.error(e.message); process.exit(1); });
