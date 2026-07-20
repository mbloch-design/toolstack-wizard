#!/usr/bin/env node
/**
 * Mise à jour d'identité n8n, séparée du pilote éditorial/pricing.
 *
 * Les sources officielles sont contrôlées en direct avant toute transaction :
 *   - identité de l'organisation : https://n8n.io/
 *   - asset immuable du dépôt officiel n8n-io/n8n (commit épinglé)
 *
 * DRY-RUN par défaut ; --apply applique uniquement public.tools.logo pour n8n.
 */
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const TOOL_ID = "n8n";
const SOURCE_URL = "https://n8n.io/";
const LOGO_SOURCE_URL = "https://github.com/n8n-io/n8n/blob/a2c19e46974990c39007ffe64ab2ae908fe2f1b9/assets/n8n-logo.png";
const LOGO_URL = "https://raw.githubusercontent.com/n8n-io/n8n/a2c19e46974990c39007ffe64ab2ae908fe2f1b9/assets/n8n-logo.png";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value || value.includes("<")) throw new Error(`Variable manquante : ${name}`);
  return value;
}

async function verifyOfficialSource() {
  const [home, logo] = await Promise.all([
    fetch(SOURCE_URL, { headers: { "Cache-Control": "no-cache" }, cache: "no-store" }),
    fetch(LOGO_URL, { headers: { "Cache-Control": "no-cache" }, cache: "no-store" }),
  ]);
  assert(home.ok, `source officielle n8n inaccessible : HTTP ${home.status}`);
  assert(logo.ok, `logo officiel n8n inaccessible : HTTP ${logo.status}`);
  const [homeHtml, logoBytes] = await Promise.all([home.text(), logo.arrayBuffer()]);
  assert(homeHtml.includes('"name":"n8n","@type":"Organization"'), "l'identité officielle n8n n'est plus déclarée sur le site");
  assert((logo.headers.get("content-type") || "").startsWith("image/png") && logoBytes.byteLength > 1000,
    "la ressource du dépôt officiel n'est pas un PNG exploitable");
  return { source_url: SOURCE_URL, logo_source_url: LOGO_SOURCE_URL, logo_url: LOGO_URL };
}

class DryRunRollback extends Error {}

loadEnvFile(ENV_FILE);
const source = await verifyOfficialSource();
const ref = required("VITE_SUPABASE_PROJECT_ID");
const sql = postgres({
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  username: `postgres.${ref}`,
  password: required("SUPABASE_DB_PASSWORD"),
  ssl: "require",
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5,
});

const [before] = await sql`
  select id,slug,data_contract,logo from public.tools where id=${TOOL_ID}`;
assert(before?.slug === TOOL_ID && before.data_contract === "canonical", "n8n canonique introuvable");

const [othersBefore] = await sql`
  select md5(coalesce(string_agg(id||':'||coalesce(logo,''), ',' order by id), '')) fp
  from public.tools where id <> ${TOOL_ID}`;

let changed = 0;
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:n8n-identity-pilot'))`;
    const result = await tx`
      update public.tools set logo=${LOGO_URL},updated_at=clock_timestamp()
      where id=${TOOL_ID} and logo is distinct from ${LOGO_URL}`;
    changed = result.count ?? 0;
    const [inside] = await tx`select logo from public.tools where id=${TOOL_ID}`;
    assert(inside.logo === LOGO_URL, "logo n8n non projeté dans la transaction");
    if (!APPLY) throw new DryRunRollback("rollback dry-run");
  });
} catch (error) {
  if (!(error instanceof DryRunRollback)) {
    await sql.end({ timeout: 1 });
    throw error;
  }
}

const [after] = await sql`select logo from public.tools where id=${TOOL_ID}`;
const [othersAfter] = await sql`
  select md5(coalesce(string_agg(id||':'||coalesce(logo,''), ',' order by id), '')) fp
  from public.tools where id <> ${TOOL_ID}`;
assert(othersAfter.fp === othersBefore.fp, "le logo d'un autre outil a changé");
assert(APPLY ? after.logo === LOGO_URL : after.logo === before.logo, APPLY ? "logo n8n non persisté" : "le dry-run a persisté une modification");

console.log(JSON.stringify({
  mode: APPLY ? "APPLY" : "DRY_RUN_ROLLBACK",
  applied: APPLY && changed === 1,
  noop: APPLY && changed === 0,
  tool: TOOL_ID,
  source,
  before_logo: before.logo || null,
  after_logo: after.logo || null,
  other_tools_unchanged: true,
}, null, 2));

await sql.end({ timeout: 1 });
