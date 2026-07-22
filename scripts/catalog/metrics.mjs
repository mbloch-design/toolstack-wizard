// Métriques de coût par lot. Lecture SEULE de l'état de lot + cache + loops. Aucune écriture Supabase.
// Estimation tokens uniquement si l'environnement la fournit (TOOLTRIM_TOKENS_JSON = {slug:tokens}).
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadBatch } from "./batch-state.mjs";
import { loopState } from "./loop-guard.mjs";
import { isUnchanged } from "./capture-cache.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dossierPath = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);

function editorialFieldCount(slug) {
  if (!existsSync(dossierPath(slug))) return 0;
  const d = JSON.parse(readFileSync(dossierPath(slug), "utf8")).editorial_drafts || {};
  let n = 0;
  for (const lang of ["fr", "en"]) n += Object.values(d[lang] || {}).filter((v) => v != null && v !== "").length;
  return n;
}

/** Métriques agrégées d'un lot (déterministes hors durée horloge). */
export function batchMetrics(batchId) {
  const b = loadBatch(batchId);
  const slugs = b.slugs;
  const done = slugs.filter((s) => ["canonical", "approved", "eligible"].includes(b.tools[s].state));
  const blocked = slugs.filter((s) => ["needs_review", "failed"].includes(b.tools[s].state));
  // "Sans intervention" = éligible/canonical sans blocage humain et sans reprise (attempts <= 1).
  const noTouch = done.filter((s) => (b.tools[s].blockers || []).length === 0 && (b.tools[s].attempts || 0) <= 1);
  const retries = slugs.reduce((n, s) => n + Math.max(0, (b.tools[s].attempts || 0) - 1), 0);
  const agentCalls = slugs.reduce((n, s) => {
    const l = loopState(batchId, s);
    return n + Object.values(l.editorial || {}).reduce((a, x) => a + x, 0) + (l.autofix || 0);
  }, 0);
  const reused = slugs.filter((s) => existsSync(dossierPath(s)) && isUnchanged(s)).length;
  const editorialFields = slugs.reduce((n, s) => n + editorialFieldCount(s), 0);
  let tokens = null;
  try { if (process.env.TOOLTRIM_TOKENS_JSON) {
    const map = JSON.parse(process.env.TOOLTRIM_TOKENS_JSON);
    tokens = slugs.reduce((n, s) => n + (Number(map[s]) || 0), 0);
  } } catch { tokens = null; }
  return {
    batch: batchId,
    tools: slugs.length,
    processed_without_intervention: noTouch.length,
    blocked: blocked.length,
    agent_calls: agentCalls,
    retries,
    duration_s: Math.round((Date.parse(b.updated_at) - Date.parse(b.created_at)) / 1000),
    captures_reused: reused,
    editorial_fields: editorialFields,
    tokens_estimate: tokens,
  };
}
