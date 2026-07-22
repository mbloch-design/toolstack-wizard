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
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBatch, loadBatch, transition, resumable, batchPath, reconcileState, nextAction } from "./catalog/batch-state.mjs";
import { loadProfile } from "./catalog/profile.mjs";
import { writeWorkOrder } from "./catalog/work-order.mjs";
import { localControls, failingControls } from "./catalog/controls.mjs";
import { batchMetrics } from "./catalog/metrics.mjs";
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
  for (const slug of pending) {
    if (a.recollect || !existsSync(dossier(slug))) continue;
    // Reprise avec dossier présent : un outil "failed" repasse par "queued" (transition légale)
    // avant "collected" — sinon failed->collected est rejeté par le graphe d'états.
    if (loadBatch(a.batch).tools[slug].state === "failed") transition(a.batch, slug, "queued", { reason: "reprise depuis échec" });
    transition(a.batch, slug, "collected", { reason: "dossier existant (reprise)" });
  }
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
      const doc = JSON.parse(readFileSync(path.join(ROOT, "research", "tool-pages", `${slug}.json`), "utf8"));
      // Garde éditoriale automatique (contrat) pour les fiches à contenu research.
      if (profile.editorialSource === "research") {
        const v = validateEditorial(doc.editorial_drafts, { slug });
        if (!v.ok) blockers.push(`éditorial non conforme: ${v.errors.slice(0, 2).join("; ")}`);
      }
      // Règle B automatique : un outil free-only (plan comparatif = plan gratuit) ne peut être
      // canonical que s'il est OPEN SOURCE avec preuve de licence (jamais un freeware propriétaire).
      if (profile.comparePlanKey === profile.freePlanKey && profile.freePlanKey) {
        if (!(profile.openSource === true && hasOpenSourceEvidence(doc)))
          blockers.push("free-only : licence open source vérifiée requise (sinon non représentable en canonical)");
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

// Statut compact normalisé par outil.
function compactStatus(state) {
  if (["eligible", "approved", "canonical"].includes(state)) return "ready";
  if (["needs_review"].includes(state)) return "blocked";
  if (state === "failed") return "failed";
  return "pending";
}
// Rapport COMPACT (JSON machine) — {slug,phase,status,blockers,tests,mutations,next_action}.
// --slug=<s> => objet unique ; sinon tableau. Aucun audit narratif.
function cmdReportCompact(a) {
  const b = loadBatch(a.batch);
  const one = (slug) => {
    const t = b.tools[slug];
    const failing = failingControls(localControls(slug));
    return {
      slug, phase: t.state, status: compactStatus(t.state),
      blockers: t.blockers || [],
      tests: { validator_failures: failing.length },
      mutations: [],
      next_action: nextAction(t),
    };
  };
  const only = a.slugs ? String(a.slugs).split(",").map((s) => s.trim()).filter(Boolean) : b.slugs;
  const payload = a.slug ? one(a.slug) : only.map(one);
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

// ── work-order : dossier factuel compact par outil ──
function cmdWorkOrder(a) {
  const slugs = a.slug ? [a.slug] : String(a.slugs || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!slugs.length) throw new Error("work-order exige --slug ou --slugs");
  const written = slugs.map((s) => { writeWorkOrder(s); return `research/work-orders/${s}.json`; });
  console.log(JSON.stringify({ mode: "WORK_ORDER", written }, null, 2));
}

// ── metrics : coût du lot ──
function cmdMetrics(a) {
  if (!a.batch) throw new Error("metrics exige --batch");
  console.log(JSON.stringify({ mode: "METRICS", ...batchMetrics(a.batch) }, null, 2));
}

// ── report : tableau compact ──
function cmdReport(a) {
  if (a.report === "compact") return cmdReportCompact(a);
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

// Preuve de licence OPEN SOURCE au sens OSI (nom de licence explicite). NE compte PAS
// "fair-code"/"source-available"/"sustainable use" (n8n) comme open source.
const OSI_LICENSE = /\b(MIT|Apache[- ]?2(?:\.0)?|GPL(?:v?[23])?|LGPL|AGPL|BSD(?:-[0-9])?|MPL(?:-2\.0)?|ISC|EPL|CDDL|Unlicense|CC0|Zlib)\b/;
function hasOpenSourceEvidence(doc) {
  const hay = JSON.stringify({ claims: doc.collector?.claims ?? [], sources: doc.collector?.sources ?? [],
    editorial: doc.editorial_drafts ?? {} });
  return OSI_LICENSE.test(hay);
}

// ── auto-signature de l'attestation reference_fr (réserve levée par ToolTrim).
//    Ne signe QUE si le marché est reference_fr (candidat ou prouvé), qu'aucune attestation
//    active n'existe, et qu'une basis au FAISCEAU FORT existe. Sinon renvoie un blocage (jamais forcé). ──
export function autoSignReferenceFr(slug, actor) {
  const p = path.join(ROOT, "research", "tool-pages", `${slug}.json`);
  if (!existsSync(p)) return { skip: true };
  const doc = JSON.parse(readFileSync(p, "utf8"));
  const obs = doc.collector?.observations ?? [];
  const needsRef = obs.some((o) => o.market_context_candidate === "reference_fr" || o.market_context === "reference_fr");
  if (!needsRef) return { skip: true };
  const active = (doc.review_attestations ?? []).some((att) =>
    att.attests === "market_context" && att.value === "reference_fr" && !att.revoked_at && att.active !== false);
  if (active) return { already: true };
  const obsHashes = new Set(obs.map((o) => o.content_hash));
  const ctx = (doc.collector?.context_attestations ?? []).find((att) =>
    att.egress_country === "FR" && obsHashes.has(att.content_hash) && (att.currency_symbols_seen || []).includes("€"));
  if (!ctx) return { blocked: "aucune basis reference_fr conforme (faisceau fort absent)" };
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "research-attest.mjs"),
    `--slug=${slug}`, "--attest=market_context", "--value=reference_fr",
    `--basis=${ctx.attestation_id}`, `--by=${actor}`, "--apply"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return { blocked: `signature refusée: ${(r.stderr || r.stdout || "").trim().slice(0, 140)}` };
  return { signed: ctx.attestation_id };
}

// Un outil est applicable si eligible/approved/canonical, OU en needs_review dont le SEUL
// blocage est l'attestation reference_fr (l'auto-signature autorisée peut le débloquer).
export function applicableForApply(tool) {
  const st = tool?.state;
  if (["eligible", "approved", "canonical"].includes(st)) return true;
  if (st === "needs_review") {
    const bl = tool.blockers || [];
    return bl.length > 0 && bl.every((x) => /attestation reference_fr/i.test(x));
  }
  return false;
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
      if (apply && !applicableForApply(b.tools[slug])) { results.push({ toolId: slug, skipped: b.tools[slug].state }); continue; }
      try {
        // Lot mixte en une commande : auto-signe l'attestation reference_fr si requise (réserve levée).
        // Un outil en needs_review dont le SEUL blocage est l'attestation devient eligible ici.
        let attestation = null;
        if (apply) {
          const sign = autoSignReferenceFr(slug, actor);
          if (sign.blocked) { results.push({ toolId: slug, blocked: sign.blocked }); transition(a.batch, slug, "needs_review", { blockers: [sign.blocked] }); continue; }
          attestation = sign.signed ? "signed" : sign.already ? "already" : null;
          if (loadBatch(a.batch).tools[slug].state === "needs_review" && attestation)
            transition(a.batch, slug, "eligible", { reason: "attestation reference_fr auto-signée", blockers: [] });
        }
        const { proposal } = await prepareStageDryRun(slug);
        const res = await runTool({ sql, profile: loadProfile(slug), proposal, actor, apply });   // profil unifié (marketContext)
        results.push({ ...res, attestation });
        if (apply && res.applied) {
          if (loadBatch(a.batch).tools[slug].state === "eligible") transition(a.batch, slug, "approved");
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

// ── reconcile : aligne l'état LOCAL du lot sur Supabase (remote READ-ONLY) ──
async function cmdReconcile(a) {
  const b = loadBatch(a.batch);
  const sql = await connect();
  try {
    const rows = await sql`select id, data_contract from public.tools where id = any(${b.slugs}::text[])`;
    const dc = Object.fromEntries(rows.map((r) => [r.id, r.data_contract]));
    const changes = [];
    for (const slug of b.slugs) {
      const dbCanon = dc[slug] === "canonical";
      const local = b.tools[slug].state;
      if (dbCanon && local !== "canonical") { reconcileState(a.batch, slug, "canonical", "Supabase=canonical"); changes.push(`${slug}: ${local} -> canonical (DB)`); }
      else if (!dbCanon && local === "canonical") { reconcileState(a.batch, slug, "rolled_back", `Supabase=${dc[slug] ?? "absent"}`); changes.push(`${slug}: canonical local mais DB=${dc[slug] ?? "absent"} -> rolled_back (DIVERGENCE)`); }
    }
    console.log(JSON.stringify({ mode: "RECONCILE", batch: b.batch_id, remote_read_only: true, changes: changes.length ? changes : ["aucun écart"], db: dc }, null, 2));
  } finally { await sql.end({ timeout: 1 }); }
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

// Exécution CLI uniquement quand lancé directement (importable pour les tests sans effet de bord).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = args(process.argv.slice(2));
  const cmd = a._[0];
  const run = {
    prepare: () => cmdPrepare(a), report: () => cmdReport(a),
    "dry-run": () => cmdRun(a, false), apply: () => cmdRun(a, true), rollback: () => cmdRollback(a),
    verify: () => cmdVerify(a), reconcile: () => cmdReconcile(a),
    "work-order": () => cmdWorkOrder(a), metrics: () => cmdMetrics(a),
  }[cmd];
  if (!run) { console.error("commandes: prepare | report [--report=compact] | work-order | metrics | dry-run | apply | rollback | verify | reconcile"); process.exit(1); }
  Promise.resolve(run()).catch((e) => { console.error(e.message); process.exit(1); });
}
