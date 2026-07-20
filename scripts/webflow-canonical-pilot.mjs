#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import postgres from "postgres";
import { prepareStageDryRun } from "./research-stage.mjs";
import { generateStageDryRunSql } from "./research-stage-sql.mjs";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const APPLY = process.argv.includes("--apply");
const ACTOR = "ToolTrim — Mike";
const TOOL_ID = "webflow";
const EXPECTED_CURRENT_PRICES = [15, 25];

const PLAN_DETAILS = Object.freeze({
  fr: {
    starter: {
      summary: "Pour créer et tester un site avant de passer sur un domaine personnalisé.",
      highlights: ["Plan gratuit durable", "Hébergement Webflow inclus", "Publication sur un sous-domaine Webflow"],
      source_url: "https://help.webflow.com/hc/en-us/articles/33961232582419-Choose-a-Site-plan",
    },
    basic: {
      summary: "Pour un site simple sans CMS.",
      highlights: ["Domaine personnalisé", "300 pages statiques", "10 Go de bande passante"],
      source_url: "https://webflow.com/pricing",
    },
    premium: {
      summary: "Pour un site riche en contenu avec CMS et davantage de trafic.",
      highlights: ["Webflow CMS", "Bande passante renforcée", "Recherche et composants de code"],
      source_url: "https://webflow.com/pricing",
    },
  },
  en: {
    starter: {
      summary: "For building and testing a site before connecting a custom domain.",
      highlights: ["Permanent free plan", "Webflow hosting included", "Publish to a Webflow subdomain"],
      source_url: "https://help.webflow.com/hc/en-us/articles/33961232582419-Choose-a-Site-plan",
    },
    basic: {
      summary: "For a simple site that does not need a CMS.",
      highlights: ["Custom domain", "300 static pages", "10 GB bandwidth"],
      source_url: "https://webflow.com/pricing",
    },
    premium: {
      summary: "For a content-rich site with CMS and higher traffic needs.",
      highlights: ["Webflow CMS", "Higher bandwidth", "Site search and code components"],
      source_url: "https://webflow.com/pricing",
    },
  },
});

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function importSqlForTransaction(proposal) {
  return generateStageDryRunSql(proposal)
    .replace(/\nbegin;\n/, "\n")
    .replace(/\nrollback;\s*$/, "\n");
}

async function snapshot(sql) {
  const [tool] = await sql`
    select id,slug,content_status,data_contract,research_status
    from public.tools where id=${TOOL_ID}
  `;
  const observations = await sql`
    select o.id,o.collector_id,p.plan_key,o.native_amount,o.native_currency,
           o.billing_period,o.billing_commitment,o.tax_inclusion,o.review_status,
           o.market_context,o.observed_market,o.observed_locale,o.approval_event_id,
           o.normalized_monthly_eur,o.fx_rate,o.fx_rate_date,o.normalization_method
    from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    where p.tool_id=${TOOL_ID}
    order by p.display_order,o.collector_id
  `;
  const plans = await sql`
    select plan_key,pricing_unit,is_free,is_compare_plan,display_order
    from catalog_private.tool_plans where tool_id=${TOOL_ID} order by display_order
  `;
  const localizations = await sql`
    select l.id,p.plan_key,l.locale,l.display_name,l.status,l.approval_event_id
    from catalog_private.tool_plan_localizations l
    join catalog_private.tool_plans p on p.id=l.plan_id
    where p.tool_id=${TOOL_ID} order by p.display_order,l.observed_on desc
  `;
  const editorial = await sql`
    select id,lang,status,content_hash,pricing_guidance,reviewed_by,published_at
    from catalog_private.tool_editorial_content where tool_id=${TOOL_ID} order by lang
  `;
  const [counts] = await sql`
    select
      (select count(*)::int from catalog_private.tool_sources where tool_id=${TOOL_ID}) sources,
      (select count(*)::int from catalog_private.tool_source_captures c join catalog_private.tool_sources s on s.id=c.source_id where s.tool_id=${TOOL_ID}) captures,
      (select count(*)::int from catalog_private.tool_claims where tool_id=${TOOL_ID}) claims,
      (select count(*)::int from catalog_private.tool_context_attestations where tool_id=${TOOL_ID}) context_attestations,
      (select count(*)::int from public.tools where data_contract='canonical') canonical_count
  `;
  return { tool, observations, plans, localizations, editorial, counts };
}

function validateStaged(state, currentCollectorIds) {
  assert(state.tool?.id === TOOL_ID && state.tool.content_status === "published", "Webflow publié introuvable");
  assert(state.counts.sources === 3 && state.counts.captures === 4 && state.counts.claims === 3, "provenance Webflow incomplète");
  assert(state.counts.context_attestations === 6, "faisceaux machine Webflow incomplets");
  assert(state.plans.length === 3, `3 plans Webflow attendus, reçu ${state.plans.length}`);
  assert(state.plans.some((row) => row.plan_key === "starter" && row.is_free), "plan Starter gratuit absent");
  assert(state.plans.some((row) => row.plan_key === "basic" && row.is_compare_plan && row.pricing_unit === "site"), "plan Basic comparatif invalide");
  assert(state.observations.length === 4, `4 versions d'observation attendues, reçu ${state.observations.length}`);
  const current = state.observations.filter((row) => currentCollectorIds.includes(row.collector_id));
  assert(current.length === 2, "deux observations courantes Webflow attendues");
  assert(JSON.stringify(current.map((row) => Number(row.native_amount)).sort((a, b) => a - b)) === JSON.stringify(EXPECTED_CURRENT_PRICES), "montants Webflow inattendus");
  assert(current.every((row) => row.native_currency === "USD" && row.billing_period === "monthly" && row.billing_commitment === "annual_prepaid"), "conditions tarifaires Webflow invalides");
  assert(current.every((row) => row.tax_inclusion === "ht" && row.market_context === "global_usd_fallback" && row.observed_market == null && row.observed_locale == null), "contexte mondial USD Webflow invalide");
  assert(state.editorial.length === 2 && state.editorial.every((row) => row.content_hash), "contenu éditorial bilingue incomplet");
}

async function validateEditorialParity(sql) {
  const rows = await sql`
    select ec.lang,
      ec.short_description is not distinct from case when ec.lang='fr' then t.short_description else coalesce(t.short_description_en,t.short_description) end as short_ok,
      ec.long_description is not distinct from case when ec.lang='fr' then t.long_description else coalesce(t.long_description_en,t.long_description) end as long_ok,
      ec.verdict is not distinct from case when ec.lang='fr' then t.verdict else coalesce(nullif(t.verdict_en,'null'::jsonb),t.verdict) end as verdict_ok,
      ec.pros is not distinct from case when ec.lang='fr' then t.pros else coalesce(t.pros_en,t.pros) end as pros_ok,
      ec.cons is not distinct from case when ec.lang='fr' then t.cons else coalesce(t.cons_en,t.cons) end as cons_ok,
      ec.use_cases is not distinct from case when ec.lang='fr' then t.use_cases else coalesce(t.use_cases_en,t.use_cases) end as uses_ok
    from catalog_private.tool_editorial_content ec
    join public.tools t on t.id=ec.tool_id
    where ec.tool_id=${TOOL_ID}
  `;
  assert(rows.length === 2 && rows.every((row) => Object.entries(row).every(([key, value]) => key === "lang" || value === true)), "le contenu de transition diverge de la fiche publiée");
}

async function validateProjection(sql) {
  const rows = await sql`
    select lang,data_contract,price_status,compare_plan,compare_native_amount,
           compare_native_currency,compare_monthly_eur,billing_commitment,
           tax_inclusion,compare_market,compare_locale,price_source_url,plans,
           pricing_guidance
    from catalog_api.published_tool_projection
    where slug=${TOOL_ID} order by lang
  `;
  assert(rows.length === 2, "projection Webflow FR/EN incomplète");
  for (const row of rows) {
    assert(row.data_contract === "canonical" && row.price_status === "approved", `projection ${row.lang} non approuvée`);
    assert(row.compare_plan === "basic" && Number(row.compare_native_amount) === 15 && row.compare_native_currency === "USD", `prix comparatif ${row.lang} incorrect`);
    assert(row.compare_monthly_eur == null, `conversion EUR non sourcée détectée en ${row.lang}`);
    assert(row.billing_commitment === "annual_prepaid" && row.tax_inclusion === "ht", `conditions ${row.lang} incorrectes`);
    assert(row.compare_market == null && row.compare_locale == null, `locale artificielle détectée en ${row.lang}`);
    assert(Array.isArray(row.plans) && row.plans.length === 3, `3 plans attendus en ${row.lang}`);
    const paid = row.plans.filter((plan) => plan.native_amount != null).map((plan) => Number(plan.native_amount)).sort((a, b) => a - b);
    assert(JSON.stringify(paid) === JSON.stringify(EXPECTED_CURRENT_PRICES), `plans payants incomplets en ${row.lang}`);
    assert(Object.keys(row.pricing_guidance?.plan_details || {}).length === 3, `correspondances de plans absentes en ${row.lang}`);
  }
  return rows;
}

class DryRunRollback extends Error {}

loadEnvFile(ENV_FILE);
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

const { proposal } = await prepareStageDryRun(TOOL_ID);
const currentCollectorIds = proposal.tables.tool_price_observations
  .filter((row) => row.review_status === "observed")
  .map((row) => row.collector_id);
assert(currentCollectorIds.length === 2, "la proposition doit désigner exactement deux observations courantes");

const before = await snapshot(sql);
assert(["legacy", "canonical"].includes(before.tool?.data_contract), "état initial Webflow invalide");
if (before.tool.data_contract === "canonical") {
  validateStaged(before, currentCollectorIds);
  assert(before.observations.filter((row) => row.review_status === "approved").length === 2, "état canonical Webflow incomplet");
  assert(before.observations.filter((row) => row.review_status === "conflicted").length === 2, "historique conflictuel Webflow incomplet");
  await validateProjection(sql);
  console.log(JSON.stringify({
    mode: APPLY ? "APPLY_NOOP" : "DRY_RUN_CURRENT_STATE",
    applied: false,
    noop: true,
    tool: TOOL_ID,
    proposal_hash: proposal.proposal_hash,
    state: { data_contract: "canonical", approved_prices: 2, conflicted_prices: 2, canonical_count: before.counts.canonical_count },
  }, null, 2));
  await sql.end({ timeout: 1 });
  process.exit(0);
}
const stageSql = importSqlForTransaction(proposal);
let projected = [];

try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:webflow-canonical-pilot'))`;
    await tx.unsafe(stageSql).simple();

    const staged = await snapshot(tx);
    validateStaged(staged, currentCollectorIds);
    await validateEditorialParity(tx);

    // Le registre de sources a déjà qualifié cette grille de fallback mondial
    // USD. On reporte ce contexte dérivé sur la capture exacte sans toucher à
    // son collector_payload brut ni à son content_hash.
    await tx`
      update catalog_private.tool_source_captures c
      set market_context='global_usd_fallback',observed_market=null,observed_locale=null,
          updated_at=clock_timestamp()
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      where c.id=o.capture_id and p.tool_id=${TOOL_ID}
        and o.collector_id in ${tx(currentCollectorIds)}
        and c.market_context is null
    `;

    await tx`
      insert into catalog_private.tool_review_events
        (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
      select 'evt:webflow:price:' || o.id::text,${TOOL_ID},'observation_approved','price_observation',
             o.id::text,${ACTOR},clock_timestamp(),
             'Pilote Webflow: prix natif USD et conditions vérifiés sur sources officielles',
             jsonb_build_object('pilot','webflow','source','official','native_amount',o.native_amount,'native_currency',o.native_currency,'market_context',o.market_context)
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      where p.tool_id=${TOOL_ID} and o.collector_id in ${tx(currentCollectorIds)}
        and o.review_status <> 'approved'
      on conflict (id) do nothing
    `;

    await tx`
      update catalog_private.tool_price_observations o
      set approval_event_id='evt:webflow:price:' || o.id::text,
          review_status='approved',normalized_monthly_eur=null,fx_rate=null,
          fx_rate_date=null,normalization_method=null,updated_at=clock_timestamp()
      from catalog_private.tool_plans p
      where p.id=o.plan_id and p.tool_id=${TOOL_ID}
        and o.collector_id in ${tx(currentCollectorIds)} and o.review_status <> 'approved'
    `;

    await tx`
      insert into catalog_private.tool_review_events
        (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
      select 'evt:webflow:localization:' || l.id::text,${TOOL_ID},'localization_approved','localization',
             l.id::text,${ACTOR},clock_timestamp(),
             'Pilote Webflow: libellé officiel du plan vérifié',
             jsonb_build_object('pilot','webflow','locale',l.locale,'display_name',l.display_name)
      from catalog_private.tool_plan_localizations l
      join catalog_private.tool_plans p on p.id=l.plan_id
      where p.tool_id=${TOOL_ID} and l.status <> 'approved'
      on conflict (id) do nothing
    `;

    await tx`
      update catalog_private.tool_plan_localizations l
      set approval_event_id='evt:webflow:localization:' || l.id::text,
          status='approved',updated_at=clock_timestamp()
      from catalog_private.tool_plans p
      where p.id=l.plan_id and p.tool_id=${TOOL_ID} and l.status <> 'approved'
    `;

    for (const lang of ["fr", "en"]) {
      const [row] = await tx`
        select id,pricing_guidance from catalog_private.tool_editorial_content
        where tool_id=${TOOL_ID} and lang=${lang} for update
      `;
      const pricingGuidance = { ...(row.pricing_guidance || {}), plan_details: PLAN_DETAILS[lang] };
      await tx`
        update catalog_private.tool_editorial_content
        set pricing_guidance=${tx.json(pricingGuidance)},status='published',reviewed_by=${ACTOR},
            published_at=coalesce(published_at,clock_timestamp()),updated_at=clock_timestamp()
        where id=${row.id}
      `;
    }

    await tx`
      update public.tools
      set data_contract='canonical',research_status='approved',
          editorially_reviewed_at=clock_timestamp(),next_review_at=current_date + 90,
          updated_at=clock_timestamp()
      where id=${TOOL_ID} and data_contract <> 'canonical'
    `;

    projected = await validateProjection(tx);
    if (!APPLY) throw new DryRunRollback("rollback dry-run");
  });
} catch (error) {
  if (!(error instanceof DryRunRollback)) {
    await sql.end({ timeout: 1 });
    throw error;
  }
}

const after = await snapshot(sql);
if (APPLY) {
  validateStaged(after, currentCollectorIds);
  assert(after.tool.data_contract === "canonical", "Webflow n'est pas canonical après COMMIT");
  assert(after.observations.filter((row) => row.review_status === "approved").length === 2, "deux prix Webflow approuvés attendus");
  assert(after.observations.filter((row) => row.review_status === "conflicted").length === 2, "deux anciennes observations conflictuelles attendues");
  assert(after.localizations.every((row) => row.status === "approved"), "localisations Webflow non approuvées");
  assert(after.editorial.every((row) => row.status === "published"), "contenus Webflow non publiés");
  assert(after.counts.canonical_count === before.counts.canonical_count + (before.tool.data_contract === "canonical" ? 0 : 1), "un autre outil a changé de contrat");
  await validateProjection(sql);
} else {
  assert(after.tool.data_contract === before.tool.data_contract, "le dry-run a persisté data_contract");
  assert(after.counts.sources === before.counts.sources, "le dry-run a persisté le staging");
}

console.log(JSON.stringify({
  mode: APPLY ? "APPLY" : "DRY_RUN_ROLLBACK",
  applied: APPLY,
  tool: TOOL_ID,
  proposal_hash: proposal.proposal_hash,
  before: { data_contract: before.tool.data_contract, sources: before.counts.sources, canonical_count: before.counts.canonical_count },
  projected: { compare_plan: "basic", compare_native_amount: 15, compare_native_currency: "USD", compare_monthly_eur: null, plans: ["starter", "basic", "premium"], rows: projected.length },
  after: { data_contract: after.tool.data_contract, approved_prices: after.observations.filter((row) => row.review_status === "approved").length, conflicted_prices: after.observations.filter((row) => row.review_status === "conflicted").length, canonical_count: after.counts.canonical_count },
}, null, 2));

await sql.end({ timeout: 1 });
