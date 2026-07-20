#!/usr/bin/env node
/**
 * Générateur du bundle dark-launch rév. 4.12 (NE MODIFIE PAS le modèle métier).
 * Source unique de la liste de colonnes = COLS ci-dessous, transcription fidèle de
 * l'INSERT d'autorité A2 (A2-mapping-legacy-canonical.md, lignes 36-65).
 *
 * Émet dans docs/tool-catalog-migration/contract-v3/ :
 *  - A2-import-593-legacy.sql        : stage 1126 + backfill payload 533 + INSERT 593 (marqueur import_batch)
 *  - A7-expected-snapshot.4.12.sql   : _expected_tool(slug, expected jsonb) pour les 1126 (référence figée)
 *  - A7-baseline-existing.4.12.sql   : remplace les 533 attendus par leur état SQL réel pré-migration
 *  - A7-schema-preflight.4.12.sql    : fingerprint des 52 colonnes legacy requises
 *  - A7-parity-gate.4.12.sql         : DO block de comparaison exhaustive actual==expected sur 1126
 *  - _seed-533-existing.4.12.sql     : (REJEU JETABLE UNIQUEMENT) 533 lignes existantes typées comme la prod
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const DIR = "docs/tool-catalog-migration/contract-v3";
const BATCH = "dark-launch-4.12";
const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
const manifest = JSON.parse(readFileSync(`${DIR}/manifest-1126.json`, "utf8"));
const jsonOnly = new Set(manifest.legacyJsonOnlySlugs);
const legacyIsFree = new Map(manifest.legacyIsFreeExpected.map((row) => [row.slug, row.isFree]));

const slugOf = (p) => p.slug ?? p.id;

// kind: v=varchar, t=text, j=jsonb, n=numeric, i=integer, b=boolean.
// Les types physiques reproduisent le fingerprint Supabase observé avant dark launch.
const COLS = [
  ["id", "v", p => p.id ?? null],
  ["slug", "v", p => p.slug ?? p.id ?? null],
  ["name", "v", p => p.name ?? null],
  ["category", "v", p => p.category ?? p.categoryId ?? null],
  ["tool_type", "t", p => p.tool_type ?? "satellite"],
  ["website_url", "v", p => p.websiteUrl ?? p.website ?? p.link ?? null],
  ["affiliate_link", "v", p => p.affiliateLink ?? null],
  ["logo", "v", p => p.logo ?? null],
  ["og_image_url", "t", p => p.ogImageUrl ?? null],
  ["short_description", "t", p => p.shortDescription ?? null],
  ["short_description_en", "t", p => p.shortDescriptionEn ?? null],
  ["long_description", "t", p => p.longDescription ?? p.description ?? null],
  ["long_description_en", "t", p => p.longDescriptionEn ?? p.descriptionEn ?? null],
  ["pricing", "j", p => p.pricing ?? p.pricingTiers ?? null],
  ["pricing_en", "j", p => p.pricingEn ?? null],
  ["default_monthly_price", "n", p => numOrNull(p.defaultMonthlyPrice)],
  ["pricing_v5", "j", p => p.pricing_v5 ?? null],
  ["verdict", "j", p => p.verdict ?? p.verdictFr ?? null],
  ["verdict_en", "j", p => p.verdictEn ?? null],
  ["pros", "j", p => p.pros ?? null],
  ["pros_en", "j", p => p.prosEn ?? null],
  ["cons", "j", p => p.cons ?? null],
  ["cons_en", "j", p => p.consEn ?? null],
  ["covers", "j", p => p.covers ?? null],
  ["use_cases", "j", p => p.useCases ?? null],
  ["use_cases_en", "j", p => p.useCasesEn ?? null],
  ["relevant_for", "j", p => p.relevantFor ?? null],
  ["seo", "j", p => p.seo ?? null],
  ["articles", "j", p => p.articles ?? null],
  ["alternatives", "j", p => p.alternatives ?? null],
  ["functional_needs", "j", p => p.functional_needs ?? null],
  ["verticals", "j", p => p.verticals ?? null],
  ["personas", "j", p => p.personas ?? null],
  ["better_alternative", "j", p => p.betterAlternative ?? null],
  ["free_alternative", "t", p => p.freeAlternative ?? null],
  ["migration_guide", "j", p => p.migrationGuide ?? null],
  ["downgrade_plan", "j", p => p.downgradePlan ?? null],
  ["solo_relevance", "v", p => p.soloRelevance ?? null],
  ["team_relevance", "v", p => p.teamRelevance ?? null],
  ["time_gained_hours_per_month", "i", p => numOrNull(p.timeGainedHoursPerMonth)],
  ["substitutable", "b", p => (p.substitutable ?? true)],
  ["prescription_quality", "t", p => p.prescription_quality ?? "silence"],
  ["prescription_output", "j", p => p.prescription_output ?? null],
  ["prescription_block_reasons", "j", p => p.prescription_block_reasons ?? null],
  ["prescription_context_questions", "j", p => p.prescription_context_questions ?? null],
  ["substitution_cluster_v2", "t", p => p.substitution_cluster_v2 ?? null],
  ["decision_policy_v3", "j", p => p.decision_policy_v3 ?? null],
  ["pertinence_by_persona", "j", p => p.pertinence_by_persona ?? null],
  ["force_silence", "b", p => (p.force_silence ?? false)],
  ["ia_use_case", "j", p => p.ia_use_case ?? null],
  ["host_app", "t", p => p.host_app ?? null],
  ["bundle_parent", "t", p => p.bundle_parent ?? null],
];

const VARCHAR_LIMITS = new Map([
  ["id", 50],
  ["slug", 255],
  ["name", 255],
  ["category", 50],
  ["website_url", 500],
  ["affiliate_link", 500],
  ["logo", 10],
  ["solo_relevance", 50],
  ["team_relevance", 50],
]);

const VALID_CATEGORY_IDS = [
  "ai-general", "analytics", "automation", "budgeting-fpa", "communication",
  "communication-team", "creation", "design-tools", "email-productivity", "erp",
  "finance", "formation-education", "hris-payroll", "legal-contracts", "nocode-web",
  "organization", "productivity-tracking", "project-management", "security", "storage",
  "vendor-risk-data",
];
const validCategoryIds = new Set(VALID_CATEGORY_IDS);

function ddlType(col, kind) {
  if (kind === "v") return `varchar(${VARCHAR_LIMITS.get(col)})`;
  return { t: "text", j: "jsonb", n: "numeric", i: "integer", b: "boolean" }[kind];
}

function numOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
}
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const jlit = (v) => (v === null || v === undefined) ? "null" : q(JSON.stringify(v)) + "::jsonb";
function actualJsonExpr(alias = "t") {
  const chunks = [];
  for (let i = 0; i < COLS.length; i += 25) {
    const args = COLS.slice(i, i + 25)
      .map(([col]) => `${q(col)}, to_jsonb(${alias}.${col})`).join(",\n         ");
    chunks.push(`jsonb_build_object(\n         ${args}\n       )`);
  }
  return chunks.join(" ||\n       ");
}

// ── expected jsonb par slug : {col: value}, valeur normalisée jsonb (null explicite) ──
function expectedJson(p) {
  const o = {};
  for (const [col, , get] of COLS) {
    const v = get(p);
    o[col] = (v === undefined ? null : v);
  }
  return o;
}

// ── 1. Import 593 (+ backfill 533) fidèle à A2, marqueur dans legacy_payload ──
function emitImport() {
  const L = [];
  L.push("-- === A2-import-593-legacy.sql — rév.4.12 (GÉNÉRÉ, NON EXÉCUTÉ) ===");
  L.push("-- Fidèle à l'INSERT d'autorité A2 (lignes 36-65). Stage TEMP (aucune persistance hors tx).");
  L.push(`-- Seules les 593 insertions portent import_batch=${BATCH}; les 533 existants ne sont jamais marqués importés.`);
  L.push("create temporary table legacy_import_stage(slug text primary key, is_json_only boolean not null, payload jsonb not null) on commit drop;");
  L.push("insert into legacy_import_stage(slug,is_json_only,payload) values");
  L.push(tools.map((p) => {
    const s = slugOf(p);
    return `  (${q(s)}, ${jsonOnly.has(s) ? "true" : "false"}, ${jlit(p)})`;
  }).join(",\n") + ";");
  L.push("");
  L.push("-- backfill legacy_payload des 533 existants (SANS marqueur d'import : rollback sûr)");
  L.push("update public.tools t set legacy_payload = s.payload");
  L.push("from legacy_import_stage s where s.slug=t.slug and not s.is_json_only;");
  L.push("");
  L.push("-- INSERT des 593 JSON-only, payload complet, colonnes typées A2");
  L.push("insert into public.tools (");
  L.push("  " + COLS.map(c => c[0]).join(", ") + ",");
  L.push("  data_contract, research_status, content_status, legacy_payload");
  L.push(") select");
  const exprs = COLS.map(([col, kind]) => {
    if (kind === "t") return `  p->>${q(col2json(col))}`.replace(col2json(col), a2key(col));
    return null;
  });
  // On délègue le typage à A2 : on réécrit les expressions A2 littéralement.
  L.push(A2_SELECT_EXPRS);
  L.push(`  'legacy','todo','draft', p || jsonb_build_object('import_batch', ${q(BATCH)})`);
  L.push("from (select payload p from legacy_import_stage where is_json_only) staged");
  L.push("on conflict (id) do nothing;");
  writeFileSync(`${DIR}/A2-import-593-legacy.sql`, L.join("\n") + "\n");
  return L.length;
}
// placeholders inutilisés (garde-fous lint)
function col2json(c){return c;} function a2key(c){return c;}

// Transcription littérale des expressions SELECT d'A2 (lignes 50-64), sans la dernière (legacy_payload).
const A2_SELECT_EXPRS = [
"  p->>'id', coalesce(p->>'slug',p->>'id'), p->>'name',",
"  case when exists (select 1 from public.categories c where c.id=coalesce(p->>'category',p->>'categoryId'))",
"       then coalesce(p->>'category',p->>'categoryId') else null end,",
"  coalesce(p->>'tool_type','satellite'), coalesce(p->>'websiteUrl',p->>'website',p->>'link'),",
"  p->>'affiliateLink', p->>'logo', p->>'ogImageUrl',",
"  p->>'shortDescription', p->>'shortDescriptionEn',",
"  coalesce(p->>'longDescription',p->>'description'), coalesce(p->>'longDescriptionEn',p->>'descriptionEn'),",
"  coalesce(p->'pricing',p->'pricingTiers'), p->'pricingEn', nullif(p->>'defaultMonthlyPrice','')::numeric, p->'pricing_v5',",
"  coalesce(p->'verdict',p->'verdictFr'), p->'verdictEn', p->'pros', p->'prosEn', p->'cons', p->'consEn',",
"  p->'covers', p->'useCases', p->'useCasesEn', p->'relevantFor', p->'seo', p->'articles', p->'alternatives',",
"  p->'functional_needs', p->'verticals', p->'personas', p->'betterAlternative', p->>'freeAlternative',",
"  p->'migrationGuide', p->'downgradePlan', p->>'soloRelevance', p->>'teamRelevance',",
"  nullif(p->>'timeGainedHoursPerMonth','')::integer, coalesce((p->>'substitutable')::boolean,true),",
"  coalesce(p->>'prescription_quality','silence'), p->'prescription_output', p->'prescription_block_reasons',",
"  p->'prescription_context_questions', p->>'substitution_cluster_v2', p->'decision_policy_v3',",
"  p->'pertinence_by_persona', coalesce((p->>'force_silence')::boolean,false), p->'ia_use_case',",
"  p->>'host_app', p->>'bundle_parent',",
].join("\n");

// ── 2. Expected snapshot figé pour les 1126 ──
function emitExpected() {
  const L = [];
  L.push("-- === A7-expected-snapshot.4.12.sql — référence figée (GÉNÉRÉ, NON EXÉCUTÉ) ===");
  L.push("-- Comparaison exhaustive champ-par-champ. Aucun harnais applicatif externe requis.");
  L.push("create temporary table _expected_tool(slug text primary key, is_json_only boolean not null, expected_is_free boolean not null, expected jsonb not null) on commit drop;");
  L.push("insert into _expected_tool(slug,is_json_only,expected_is_free,expected) values");
  L.push(tools.map((p) => {
    const slug = slugOf(p);
    const isFree = legacyIsFree.get(slug);
    if (typeof isFree !== "boolean") throw new Error(`legacyIsFreeExpected absent pour ${slug}`);
    return `  (${q(slug)}, ${jsonOnly.has(slug) ? "true" : "false"}, ${isFree ? "true" : "false"}, ${jlit(expectedJson(p))})`;
  }).join(",\n") + ";");
  writeFileSync(`${DIR}/A7-expected-snapshot.4.12.sql`, L.join("\n") + "\n");
  return tools.length;
}

// ── 2b. Baseline réel des 533 : Supabase gagne aujourd'hui sur ces slugs. ──
function emitExistingBaseline() {
  const L = [];
  L.push("-- === A7-baseline-existing.4.12.sql — état réel des 533 AVANT migration ===");
  L.push("-- Remplace la référence JSON pour les lignes déjà présentes : leur état SQL est l'autorité legacy.");
  L.push("do $baseline$");
  L.push("begin");
  L.push("  if (select count(*) from public.tools) <> 533 then raise exception 'BASELINE: public.tools doit contenir 533 lignes'; end if;");
  L.push("  if exists ((select slug from public.tools except select slug from _expected_tool where not is_json_only)");
  L.push("             union all (select slug from _expected_tool where not is_json_only except select slug from public.tools))");
  L.push("  then raise exception 'BASELINE: ensemble des 533 slugs différent du manifeste'; end if;");
  L.push("end $baseline$;");
  L.push("update _expected_tool e set expected = " + actualJsonExpr("t"));
  L.push("from public.tools t where t.slug=e.slug and not e.is_json_only;");
  L.push("create temporary table _baseline_is_free on commit drop as");
  L.push("select t.slug, case");
  L.push("  when coalesce(trim(t.pricing->>'free'),'')='' then false");
  L.push("  when t.pricing->>'free' ~* 'no free|aucun|pas de|non communiqué' then false");
  L.push("  when t.pricing->>'free' ~* 'essai|trial|jours? gratuit|demo gratuite|démo gratuite'");
  L.push("       and not t.pricing->>'free' ~* 'gratuit (a|à) vie|forever free|illimité dans le temps|sans limite de temps|entièrement gratuit|plan gratuit permanent|produit complet|open-?source' then false");
  L.push("  else true end as actual_is_free");
  L.push("from public.tools t;");
  L.push("do $free_delta$");
  L.push("begin");
  L.push("  if (select coalesce(array_agg(b.slug::text order by b.slug),'{}'::text[])");
  L.push("      from _baseline_is_free b join _expected_tool e using(slug)");
  L.push("      where b.actual_is_free is distinct from e.expected_is_free)");
  L.push("     is distinct from array['gamma','unbounce']::text[] then");
  L.push("    raise exception 'BASELINE: delta legacy_is_free différent de gamma/unbounce';");
  L.push("  end if;");
  L.push("end $free_delta$;");
  L.push("update _expected_tool e set expected_is_free=b.actual_is_free");
  L.push("from _baseline_is_free b where b.slug=e.slug and not e.is_json_only;");
  writeFileSync(`${DIR}/A7-baseline-existing.4.12.sql`, L.join("\n") + "\n");
}

// ── 2c. Fingerprint structurel requis par A2/A4/A5. Les colonnes en plus sont tolérées. ──
function emitSchemaPreflight() {
  const type = { v: "character varying", t: "text", j: "jsonb", n: "numeric", i: "integer", b: "boolean" };
  const L = [];
  L.push("-- === A7-schema-preflight.4.12.sql — fingerprint legacy requis ===");
  L.push("create temporary table _expected_legacy_column(name text primary key, sql_type text not null, char_max int) on commit drop;");
  for (const [col, kind] of COLS) {
    const charMax = kind === "v" ? VARCHAR_LIMITS.get(col) : null;
    L.push(`insert into _expected_legacy_column values(${q(col)},${q(type[kind])},${charMax ?? "null"});`);
  }
  L.push("do $schema$");
  L.push("declare bad text;");
  L.push("begin");
  L.push("  select string_agg(e.name||':'||e.sql_type||coalesce('('||e.char_max||')','')||'!='||coalesce(c.data_type||coalesce('('||c.character_maximum_length||')',''),'ABSENT'), ', ' order by e.name) into bad");
  L.push("  from _expected_legacy_column e left join information_schema.columns c");
  L.push("    on c.table_schema='public' and c.table_name='tools' and c.column_name=e.name");
  L.push("  where c.column_name is null or c.data_type is distinct from e.sql_type");
  L.push("     or c.character_maximum_length is distinct from e.char_max;");
  L.push("  if bad is not null then raise exception 'SCHEMA FINGERPRINT incompatible: %', bad; end if;");
  L.push("end $schema$;");
  writeFileSync(`${DIR}/A7-schema-preflight.4.12.sql`, L.join("\n") + "\n");
}

// ── 3. Gate de parité : actual jsonb (colonnes typées) == expected, sur les 1126 ──
function emitParityGate() {
  const L = [];
  L.push("-- === A7-parity-gate.4.12.sql — comparaison exhaustive 1126 (GÉNÉRÉ) ===");
  L.push("do $parity$");
  L.push("declare n_missing int; n_mismatch int;");
  L.push("begin");
  L.push("  -- chaque slug attendu a une ligne");
  L.push("  select count(*) into n_missing from _expected_tool e left join public.tools t using(slug) where t.id is null;");
  L.push("  if n_missing <> 0 then raise exception 'PARITÉ: % slugs attendus absents de public.tools', n_missing; end if;");
  L.push("  if (select count(*) from public.tools) <> 1126 then raise exception 'PARITÉ: public.tools doit contenir 1126 lignes'; end if;");
  L.push("  -- comparaison champ-par-champ (colonnes typées) via jsonb reconstruit");
  L.push("  select count(*) into n_mismatch from public.tools t join _expected_tool e using(slug)");
  L.push("  where " + actualJsonExpr("t") + " is distinct from e.expected;");
  L.push("  if n_mismatch <> 0 then raise exception 'PARITÉ: % lignes divergent champ-par-champ de tools_v4.json', n_mismatch; end if;");
  L.push(`  -- provenance : exactement 593 insertions marquées ${BATCH}, aucun des 533 existants.`);
  L.push("  if (select count(*) from public.tools where legacy_payload->>'import_batch' = " + q(BATCH) + ") <> 593");
  L.push("    then raise exception 'PARITÉ: marqueur import_batch attendu sur exactement 593 lignes'; end if;");
  L.push("  if exists (select 1 from public.tools t join _expected_tool e using(slug)");
  L.push("             where not e.is_json_only and t.legacy_payload ? 'import_batch')");
  L.push("    then raise exception 'PARITÉ: une ligne préexistante porte un marqueur d''import'; end if;");
  L.push("  if exists (select 1 from public.tools t join _expected_tool e using(slug)");
  L.push("             where catalog_api.legacy_is_free(t.pricing->>'free') is distinct from e.expected_is_free)");
  L.push("    then raise exception 'PARITÉ: legacy_is_free diffère de la référence JS'; end if;");
  L.push("  if (select count(*) from public.tools where catalog_api.legacy_is_free(pricing->>'free')) <> 589");
  L.push("    then raise exception 'PARITÉ: legacy_is_free doit produire 589 true / 537 false'; end if;");
  L.push("  raise notice 'PARITÉ 1126: 0 manquant, 0 divergence champ-par-champ';");
  L.push("end $parity$;");
  writeFileSync(`${DIR}/A7-parity-gate.4.12.sql`, L.join("\n") + "\n");
  return COLS.length;
}

// ── 4. Seed 533 (rejeu jetable uniquement) : lignes existantes typées comme la prod ──
function emitSeed533() {
  const L = [];
  L.push("-- === _seed-533-existing.4.12.sql — REJEU JETABLE UNIQUEMENT (hors bundle Supabase) ===");
  L.push("-- Simule les 533 lignes déjà présentes en prod (colonnes typées, sans colonnes A1).");
  const existing = tools.filter(p => !jsonOnly.has(slugOf(p)));
  L.push(`insert into public.tools (${COLS.map(c => c[0]).join(",")}) values`);
  L.push(existing.map((p) => {
    const vals = COLS.map(([col, kind, get]) => {
      let v = get(p);
      if (col === "pricing" && slugOf(p) === "gamma") {
        v = { ...(v ?? {}), free: "Plan gratuit (10 cards/prompt, watermark)" };
      }
      if (col === "pricing" && slugOf(p) === "unbounce") {
        v = { ...(v ?? {}), free: "Essai 14 jours" };
      }
      if (v === null) return "null";
      if (kind === "j") return jlit(v);
      if (kind === "n" || kind === "i") return String(v);
      if (kind === "b") return v ? "true" : "false";
      if (col === "category" && !validCategoryIds.has(String(v))) return "null";
      if (kind === "v") return q(String(v).slice(0, VARCHAR_LIMITS.get(col)));
      return q(v);
    });
    return `  (${vals.join(",")})`;
  }).join(",\n") + " on conflict (id) do nothing;");
  writeFileSync(`${DIR}/_seed-533-existing.4.12.sql`, L.join("\n") + "\n");
  return existing.length;
}

// ── 5. Bootstrap public.tools (rejeu jetable) : toutes les colonnes A2, SANS les 9 colonnes A1 ──
function emitBootstrap() {
  const L = [];
  L.push("-- === _bootstrap-public-tools.4.12.sql — REJEU JETABLE UNIQUEMENT ===");
  L.push("-- Reproduit public.tools (colonnes A2) avec le référentiel/FK categories réel,");
  L.push("-- sans les 9 colonnes A1 (ajoutées par la migration), + RLS + policy publique de lecture.");
  L.push("create table public.categories(id varchar(50) primary key, name varchar(255) not null, slug varchar(255) not null, description text);");
  L.push("insert into public.categories(id,name,slug) values");
  L.push(VALID_CATEGORY_IDS.map((id) => `  (${q(id)},${q(id)},${q(id)})`).join(",\n") + ";");
  L.push("create table public.tools (");
  const defs = COLS.map(([col, kind]) => `  ${col} ${ddlType(col, kind)}${col === "id" ? " primary key" : ""}${col === "category" ? " references public.categories(id)" : ""}`);
  L.push(defs.join(",\n"));
  L.push(");");
  L.push("alter table public.tools enable row level security;");
  L.push('create policy "Public read tools" on public.tools for select to anon, authenticated using (true);');
  L.push("grant select on public.tools to anon, authenticated;");
  writeFileSync(`${DIR}/_bootstrap-public-tools.4.12.sql`, L.join("\n") + "\n");
  return COLS.length;
}

function emitBundleLock() {
  const files = [
    "A1-contrat-canonique.sql",
    "A2-import-593-legacy.sql",
    "A4-regle-selection-prix.sql",
    "A5-projection-publique.sql",
    "A7-expected-snapshot.4.12.sql",
    "A7-baseline-existing.4.12.sql",
    "A7-schema-preflight.4.12.sql",
    "A7-parity-gate.4.12.sql",
    "A7-online-preflight-readonly.4.12.sql",
    "wix-staging-import.embed.4.11.sql",
    "A7-migration-dark-launch.4.12.sql",
    "A7-rollback-dark-launch.4.12.sql",
  ];
  const lines = files.map((file) => {
    const hash = createHash("sha256").update(readFileSync(`${DIR}/${file}`)).digest("hex");
    return `${hash}  ${file}`;
  });
  writeFileSync(`${DIR}/A7-bundle-lock.4.12.sha256`, lines.join("\n") + "\n");
  return files.length;
}
emitBootstrap();
const ci = emitImport();
const ce = emitExpected();
emitExistingBaseline();
emitSchemaPreflight();
const cg = emitParityGate();
const cs = emitSeed533();
const locked = emitBundleLock();
console.log(JSON.stringify({ import_lines: ci, expected_rows: ce, parity_cols: cg, seed_533: cs, json_only: jsonOnly.size, locked_files: locked }, null, 2));
