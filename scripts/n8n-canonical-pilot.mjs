#!/usr/bin/env node
/**
 * Pilote canonique n8n — calqué sur webflow-canonical-pilot.mjs.
 *
 * Différences n8n (architecture inchangée) :
 *  - L'éditorial FR/EN vient de research.editorial_drafts (fiche legacy vide) : importé en
 *    `draft` par le staging, PUBLIÉ dans la transaction. public.tools n'est JAMAIS réécrit
 *    sur ses colonnes éditoriales — seuls les champs de contrôle changent.
 *  - Les prix sont des CANDIDATS reference_fr : approuvés UNIQUEMENT si une attestation
 *    humaine active existe déjà en base (importée depuis n8n.json). Sinon ils restent
 *    `observed`/needs_review (état attendu avant la signature ToolTrim — Mike).
 *  - Localisations et relations approuvées via événements de revue distincts.
 *
 * DRY-RUN (défaut) => rollback. --apply => COMMIT.
 */
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import postgres from "postgres";
import { prepareStageDryRun } from "./research-stage.mjs";
import { generateStageDryRunSql } from "./research-stage-sql.mjs";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const APPLY = process.argv.includes("--apply");
const ACTOR = "ToolTrim — Mike";
const TOOL_ID = "n8n";

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
function assert(condition, message) { if (!condition) throw new Error(message); }
function importSqlForTransaction(proposal) {
  return generateStageDryRunSql(proposal).replace(/\nbegin;\n/, "\n").replace(/\nrollback;\s*$/, "\n");
}

async function snapshot(sql) {
  const [tool] = await sql`
    select id,slug,content_status,data_contract,research_status,
           short_description is not null as legacy_short_present,
           long_description is not null as legacy_long_present
    from public.tools where id=${TOOL_ID}`;
  const plans = await sql`
    select plan_key,pricing_unit,is_free,is_compare_plan,display_order
    from catalog_private.tool_plans where tool_id=${TOOL_ID} order by display_order`;
  const observations = await sql`
    select o.collector_id,p.plan_key,o.native_amount,o.native_currency,o.billing_period,
           o.billing_commitment,o.tax_inclusion,o.review_status,o.market_context,o.market_context_candidate,
           o.observed_market,o.observed_locale,o.approval_event_id,o.normalized_monthly_eur
    from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    where p.tool_id=${TOOL_ID} order by p.display_order,o.collector_id`;
  const localizations = await sql`
    select l.id,p.plan_key,l.locale,l.display_name,l.status
    from catalog_private.tool_plan_localizations l
    join catalog_private.tool_plans p on p.id=l.plan_id
    where p.tool_id=${TOOL_ID} order by p.display_order,l.locale`;
  const relationships = await sql`
    select id,related_tool_id,rel_type,status,approval_event_id
    from catalog_private.tool_relationships where tool_id=${TOOL_ID} order by related_tool_id`;
  const editorial = await sql`
    select lang,status,content_hash,author,reviewed_by,published_at,(pricing_guidance is not null) guidance
    from catalog_private.tool_editorial_content where tool_id=${TOOL_ID} order by lang`;
  const attestations = await sql`
    select id,attestation_type,value_json,attested_by from catalog_private.active_review_attestations where tool_id=${TOOL_ID}`;
  const [counts] = await sql`
    select
      (select count(*)::int from catalog_private.tool_sources where tool_id=${TOOL_ID}) sources,
      (select count(*)::int from catalog_private.tool_claims where tool_id=${TOOL_ID}) claims,
      (select count(*)::int from public.tools where data_contract='canonical') canonical_count`;
  return { tool, plans, observations, localizations, relationships, editorial, attestations, counts };
}

function validateStaged(state) {
  assert(state.tool?.id === TOOL_ID && state.tool.content_status === "published", "n8n publié introuvable");
  assert(state.plans.length === 4, `4 plans n8n attendus, reçu ${state.plans.length}`);
  assert(state.plans.some((r) => r.plan_key === "community" && r.is_free), "plan community gratuit absent");
  assert(state.plans.some((r) => r.plan_key === "starter" && r.is_compare_plan && r.pricing_unit === "workflow_execution"), "plan starter comparatif invalide");
  assert(!state.observations.some((o) => o.plan_key === "community"), "community ne doit porter AUCUNE observation de prix");
  assert(state.observations.length === 3, `3 observations de prix attendues, reçu ${state.observations.length}`);
  assert(state.observations.every((o) => o.native_currency === "EUR" && o.billing_commitment === "annual_prepaid"), "conditions tarifaires n8n invalides");
  assert(state.observations.every((o) => o.tax_inclusion === "unknown" || o.tax_inclusion == null), "tax_inclusion doit rester inconnu (unknown/null)");
  assert(state.editorial.length === 2, "éditorial FR/EN incomplet");
}

async function publishEditorialAndApprove(tx, hasActiveReferenceFr) {
  // 1) PUBLIER l'éditorial research FR/EN (jamais recopié dans public.tools).
  for (const lang of ["fr", "en"]) {
    const [row] = await tx`
      select id,content_hash from catalog_private.tool_editorial_content
      where tool_id=${TOOL_ID} and lang=${lang} for update`;
    assert(row?.content_hash, `contenu éditorial ${lang} sans hash`);
    await tx`
      update catalog_private.tool_editorial_content
      set status='published',reviewed_by=${ACTOR},published_at=coalesce(published_at,clock_timestamp()),updated_at=clock_timestamp()
      where id=${row.id}`;
  }
  // 2) Approuver les LOCALISATIONS via événements distincts.
  await tx`
    insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
    select 'evt:n8n:localization:'||l.id::text,${TOOL_ID},'localization_approved','localization',l.id::text,${ACTOR},clock_timestamp(),
           'Pilote n8n: libellé officiel du plan vérifié',jsonb_build_object('pilot','n8n','locale',l.locale,'display_name',l.display_name)
    from catalog_private.tool_plan_localizations l join catalog_private.tool_plans p on p.id=l.plan_id
    where p.tool_id=${TOOL_ID} and l.status <> 'approved' on conflict (id) do nothing`;
  await tx`
    update catalog_private.tool_plan_localizations l set approval_event_id='evt:n8n:localization:'||l.id::text,status='approved',updated_at=clock_timestamp()
    from catalog_private.tool_plans p where p.id=l.plan_id and p.tool_id=${TOOL_ID} and l.status <> 'approved'`;
  // 3) Approuver les RELATIONS sourcées via événements distincts.
  await tx`
    insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
    select 'evt:n8n:relationship:'||r.id::text,${TOOL_ID},'relationship_approved','relationship',r.id::text,${ACTOR},clock_timestamp(),
           'Pilote n8n: relation sourcée vers outil publié',jsonb_build_object('pilot','n8n','related',r.related_tool_id,'type',r.rel_type)
    from catalog_private.tool_relationships r where r.tool_id=${TOOL_ID} and r.status <> 'approved' on conflict (id) do nothing`;
  await tx`
    update catalog_private.tool_relationships r set approval_event_id='evt:n8n:relationship:'||r.id::text,status='approved',
        verified_at=current_date,updated_at=clock_timestamp()
    where r.tool_id=${TOOL_ID} and r.status <> 'approved'`;
  // 4) Prix : attestation reference_fr STRICTE de ToolTrim — Mike, liée à la capture EXACTE
  //    (capture_id + content_hash) et portant une basis. Sinon aucun prix n'est approuvé.
  const [strict] = await tx`
    select count(distinct o.id)::int n from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    join catalog_private.tool_source_captures c on c.id=o.capture_id
    join catalog_private.active_review_attestations a
      on a.tool_id=${TOOL_ID} and a.capture_id=o.capture_id and a.content_hash=c.content_hash
     and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text)
     and a.attested_by=${ACTOR} and a.basis_attestation_id is not null
    where p.tool_id=${TOOL_ID}`;
  const hasStrict = (strict?.n ?? 0) > 0;
  // REFUS DUR : --apply interdit sans attestation reference_fr active liée capture/content_hash/basis.
  if (APPLY && !hasStrict) {
    throw new Error("REFUS DUR: --apply exige une attestation reference_fr active de ToolTrim — Mike, liée à la capture, au content_hash et à la basis exacts (absente).");
  }
  let approvedPrices = 0;
  if (hasStrict) {
    // Projeter le contexte ATTESTÉ sur la capture : reference_fr / FR / fr-FR.
    // Ne touche NI collector_payload NI content_hash (payload brut préservé).
    await tx`
      update catalog_private.tool_source_captures c
      set market_context='reference_fr',observed_market='FR',observed_locale='fr-FR',updated_at=clock_timestamp()
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      join catalog_private.active_review_attestations a
        on a.tool_id=${TOOL_ID} and a.capture_id=o.capture_id
       and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${ACTOR}
      where c.id=o.capture_id and a.content_hash=c.content_hash
        and p.tool_id=${TOOL_ID} and c.market_context is distinct from 'reference_fr'`;
    // Événement d'approbation distinct par observation, lié à l'attestation.
    await tx`
      insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,attestation_id,actor,occurred_at,reason,payload)
      select 'evt:n8n:price:'||o.id::text,${TOOL_ID},'observation_approved','price_observation',o.id::text,a.id,${ACTOR},clock_timestamp(),
             'Pilote n8n: prix natif EUR vérifié, contexte reference_fr attesté (identité EUR)',
             jsonb_build_object('pilot','n8n','native_amount',o.native_amount,'native_currency',o.native_currency,'market_context','reference_fr','normalization','native_eur_identity')
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      join catalog_private.tool_source_captures c on c.id=o.capture_id
      join catalog_private.active_review_attestations a
        on a.tool_id=${TOOL_ID} and a.capture_id=o.capture_id and a.content_hash=c.content_hash
       and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${ACTOR}
      where p.tool_id=${TOOL_ID} and o.native_currency='EUR' and o.review_status <> 'approved' on conflict (id) do nothing`;
    // Approbation + IDENTITÉ EUR (jamais une conversion) : normalized = native, fx_rate = 1.
    const res = await tx`
      update catalog_private.tool_price_observations o
      set approval_event_id='evt:n8n:price:'||o.id::text,review_status='approved',market_context='reference_fr',
          observed_market='FR',observed_locale='fr-FR',
          normalized_monthly_eur=o.native_amount,fx_rate=1,fx_rate_date=current_date,normalization_method='native_eur_identity',
          updated_at=clock_timestamp()
      from catalog_private.tool_plans p, catalog_private.tool_source_captures c,
           catalog_private.active_review_attestations a
      where p.id=o.plan_id and c.id=o.capture_id and p.tool_id=${TOOL_ID}
        and a.tool_id=${TOOL_ID} and a.capture_id=o.capture_id and a.content_hash=c.content_hash
        and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${ACTOR}
        and o.native_currency='EUR' and o.review_status <> 'approved'`;
    approvedPrices = res.count ?? 0;
  }
  return approvedPrices;
}

async function validateProjection(sql, expectApproved) {
  const rows = await sql`
    select lang,data_contract,price_status,compare_plan,compare_native_amount,compare_native_currency,
           compare_monthly_eur,plans,pricing_guidance,short_description,relationships
    from catalog_api.published_tool_projection where slug=${TOOL_ID} order by lang`;
  assert(rows.length === 2, "projection n8n FR/EN incomplète");
  for (const row of rows) {
    assert(row.data_contract === "canonical", `projection ${row.lang} non canonical`);
    assert(row.short_description && /fair-code|automation|automatisation/i.test(row.short_description), `éditorial research absent en ${row.lang}`);
    assert(Array.isArray(row.plans) && row.plans.length === 4, `4 plans attendus en ${row.lang}`);
    const guidance = JSON.stringify(row.pricing_guidance ?? {});
    assert(!/native_amount|compare_price_monthly_eur/.test(guidance), `fuite de fait tarifaire dans pricing_guidance ${row.lang}`);
    assert(row.compare_plan === "starter", `plan comparatif attendu starter en ${row.lang}`);
    if (expectApproved) {
      // Attesté : identité EUR — Starter à 20 EUR/mois, jamais une conversion (fx=1 identité).
      assert(row.price_status === "approved", `price_status approved attendu en ${row.lang}`);
      assert(Number(row.compare_native_amount) === 20 && row.compare_native_currency === "EUR", `Starter 20 EUR attendu en ${row.lang}`);
      assert(Number(row.compare_monthly_eur) === 20, `compare_monthly_eur=20 (identité EUR) attendu en ${row.lang}`);
    } else {
      // Sans attestation : prix bloqués, aucune valeur EUR exposée.
      assert(row.price_status === "needs_review", `price_status needs_review attendu (sans attestation) en ${row.lang}`);
      assert(row.compare_native_amount == null && row.compare_monthly_eur == null, `aucun prix ne doit fuiter sans attestation en ${row.lang}`);
    }
  }
  return rows;
}

/** État complet n8n + empreinte des AUTRES outils, pour la preuve de stabilité rollback / non-régression. */
async function fullState(sql) {
  const [c] = await sql`
    select
      (select count(*)::int from catalog_private.tool_sources where tool_id=${TOOL_ID}) sources,
      (select count(*)::int from catalog_private.tool_source_captures c join catalog_private.tool_sources s on s.id=c.source_id where s.tool_id=${TOOL_ID}) captures,
      (select count(*)::int from catalog_private.tool_claims where tool_id=${TOOL_ID}) claims,
      (select count(*)::int from catalog_private.tool_plans where tool_id=${TOOL_ID}) plans,
      (select count(*)::int from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id where p.tool_id=${TOOL_ID}) observations,
      (select count(*)::int from catalog_private.tool_editorial_content where tool_id=${TOOL_ID}) editorial,
      (select count(*)::int from catalog_private.tool_plan_localizations l join catalog_private.tool_plans p on p.id=l.plan_id where p.tool_id=${TOOL_ID}) localizations,
      (select count(*)::int from catalog_private.tool_relationships where tool_id=${TOOL_ID}) relationships`;
  const [others] = await sql`
    select md5(coalesce(string_agg(id||':'||data_contract, ',' order by id), '')) fp,
           count(*) filter (where data_contract='canonical')::int canon
    from public.tools where id <> ${TOOL_ID}`;
  return { n8n: c, other_tools_fp: others.fp, other_canonical: others.canon };
}

class DryRunRollback extends Error {}

loadEnvFile(ENV_FILE);
const ref = required("VITE_SUPABASE_PROJECT_ID");
const sql = postgres({
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432, database: "postgres", username: `postgres.${ref}`,
  password: required("SUPABASE_DB_PASSWORD"), ssl: "require", max: 1, connect_timeout: 10, idle_timeout: 5,
});

const { proposal } = await prepareStageDryRun(TOOL_ID);
assert(proposal.approved_rows === 0, "la proposition de staging ne doit contenir aucun approved");
const stageSql = importSqlForTransaction(proposal);

const before = await snapshot(sql);
const beforeFull = await fullState(sql);
assert(["legacy", "canonical"].includes(before.tool?.data_contract), "état initial n8n invalide");
if (before.tool.data_contract === "canonical") {
  await validateProjection(sql, true);
  console.log(JSON.stringify({ mode: APPLY ? "APPLY_NOOP" : "DRY_RUN_CURRENT_STATE", applied: false, noop: true,
    tool: TOOL_ID, proposal_hash: proposal.proposal_hash,
    state: { data_contract: "canonical", canonical_count: before.counts.canonical_count } }, null, 2));
  await sql.end({ timeout: 1 });
  process.exit(0);
}

let projected = [];
let approvedPrices = 0;
let hadAttestation = false;
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:n8n-canonical-pilot'))`;
    await tx.unsafe(stageSql).simple();

    const staged = await snapshot(tx);
    validateStaged(staged);
    hadAttestation = staged.attestations.some((a) => a.attestation_type === "market_context" && a.value_json === "reference_fr");

    approvedPrices = await publishEditorialAndApprove(tx);   // refus dur intégré si --apply sans attestation

    // data_contract canonical UNIQUEMENT à la fin ; public.tools : champs de contrôle seulement.
    await tx`
      update public.tools
      set data_contract='canonical',
          research_status=${approvedPrices === 3 ? "approved" : "needs_review"},
          editorially_reviewed_at=clock_timestamp(),next_review_at=current_date + 90,updated_at=clock_timestamp()
      where id=${TOOL_ID} and data_contract <> 'canonical'`;

    projected = await validateProjection(tx, approvedPrices === 3);
    if (!APPLY) throw new DryRunRollback("rollback dry-run");
  });
} catch (error) {
  if (!(error instanceof DryRunRollback)) { await sql.end({ timeout: 1 }); throw error; }
}

const after = await snapshot(sql);
const afterFull = await fullState(sql);
if (APPLY) {
  // Assertions post-apply (correction 4).
  assert(after.tool.data_contract === "canonical", "n8n n'est pas canonical après COMMIT");
  assert(approvedPrices === 3, `exactement 3 prix approved attendus, obtenu ${approvedPrices}`);
  const approved = after.observations.filter((o) => o.review_status === "approved");
  assert(approved.length === 3, `3 observations approved attendues, obtenu ${approved.length}`);
  assert(JSON.stringify(approved.map((o) => Number(o.native_amount)).sort((a, b) => a - b)) === JSON.stringify([20, 50, 667]),
    "les 3 prix approved doivent être 20/50/667 EUR");
  assert(approved.every((o) => o.native_currency === "EUR" && Number(o.normalized_monthly_eur) === Number(o.native_amount)), "identité EUR non appliquée");
  assert(after.plans.length === 4, "4 plans attendus");
  assert(after.editorial.length === 2 && after.editorial.every((r) => r.status === "published"), "2 contenus FR/EN publiés attendus");
  assert(after.relationships.length === 2 && after.relationships.every((r) => r.status === "approved"), "2 relations approved attendues");
  assert(after.tool.legacy_short_present === before.tool.legacy_short_present && after.tool.legacy_long_present === before.tool.legacy_long_present,
    "les colonnes éditoriales legacy de public.tools ont changé (interdit)");
  assert(after.counts.canonical_count === before.counts.canonical_count + 1, "canonical_count doit augmenter d'exactement 1");
  // Aucun AUTRE outil modifié.
  assert(afterFull.other_tools_fp === beforeFull.other_tools_fp && afterFull.other_canonical === beforeFull.other_canonical,
    "un autre outil a été modifié (interdit)");
  await validateProjection(sql, true);
} else {
  // Preuve de stabilité rollback (correction 5) : état n8n + autres outils STRICTEMENT identiques.
  assert(after.tool.data_contract === before.tool.data_contract, "le dry-run a persisté data_contract");
  assert(JSON.stringify(afterFull) === JSON.stringify(beforeFull),
    `le dry-run a laissé une trace : ${JSON.stringify({ before: beforeFull, after: afterFull })}`);
}

const proj = projected.find((r) => r.lang === "fr") ?? {};
console.log(JSON.stringify({
  mode: APPLY ? "APPLY" : "DRY_RUN_ROLLBACK",
  applied: APPLY,
  tool: TOOL_ID,
  proposal_hash: proposal.proposal_hash,
  reference_fr_attestation_active: hadAttestation,
  before: { data_contract: before.tool.data_contract, canonical_count: before.counts.canonical_count },
  projected_fr: { data_contract: proj.data_contract, price_status: proj.price_status, compare_plan: proj.compare_plan,
    compare_native_amount: proj.compare_native_amount, compare_native_currency: proj.compare_native_currency,
    compare_monthly_eur: proj.compare_monthly_eur, plans: Array.isArray(proj.plans) ? proj.plans.map((p) => p.plan_key) : null,
    relationships: Array.isArray(proj.relationships) ? proj.relationships.map((r) => r.slug) : null },
  approved_prices: approvedPrices,
  rollback_stability: APPLY ? "n/a (commit)" : (JSON.stringify(afterFull) === JSON.stringify(beforeFull) ? "STABLE — 0 trace" : "INSTABLE"),
  note: approvedPrices === 3 ? "3 prix approuvés (identité EUR, Starter 20 EUR/mois)"
    : "prix BLOQUÉS (needs_review) — attestation reference_fr non active ; --apply REFUSÉ tant qu'elle n'est pas signée par ToolTrim — Mike",
  after: { data_contract: after.tool.data_contract, canonical_count: after.counts.canonical_count },
}, null, 2));

await sql.end({ timeout: 1 });
