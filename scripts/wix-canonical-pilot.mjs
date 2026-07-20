#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import postgres from "postgres";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const APPLY = process.argv.includes("--apply");
const ACTOR = "ToolTrim — Mike";
const EXPECTED_PRICES = [16.8, 30, 40.8, 178.8];

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

function numberList(rows) {
  return rows.map((row) => Number(row.native_amount)).sort((a, b) => a - b);
}

async function snapshot(sql) {
  const [tool] = await sql`
    select id,slug,content_status,data_contract,research_status
    from public.tools where slug='wix'
  `;
  const observations = await sql`
    select o.id,p.plan_key,o.native_amount,o.native_currency,o.billing_period,
           o.billing_commitment,o.tax_inclusion,o.review_status,o.market_context,
           o.observed_market,o.observed_locale,o.context_attestation_id,
           o.approval_event_id,o.normalized_monthly_eur,
           c.market_context as capture_context,c.observed_market as capture_market,
           c.observed_locale as capture_locale
    from catalog_private.tool_price_observations o
    join catalog_private.tool_plans p on p.id=o.plan_id
    join catalog_private.tool_source_captures c on c.id=o.capture_id
    where p.tool_id='wix'
    order by p.display_order
  `;
  const localizations = await sql`
    select l.id,p.plan_key,l.locale,l.display_name,l.status,l.approval_event_id
    from catalog_private.tool_plan_localizations l
    join catalog_private.tool_plans p on p.id=l.plan_id
    where p.tool_id='wix' order by p.display_order
  `;
  const editorial = await sql`
    select id,lang,status,content_hash,reviewed_by,published_at
    from catalog_private.tool_editorial_content
    where tool_id='wix' order by lang
  `;
  const attestations = await sql`
    select id,attested_by,value_json,capture_id
    from catalog_private.active_review_attestations
    where tool_id='wix' order by attested_at desc
  `;
  const [{ canonical_count }] = await sql`
    select count(*)::int as canonical_count from public.tools where data_contract='canonical'
  `;
  return { tool, observations, localizations, editorial, attestations, canonicalCount: canonical_count };
}

function validatePreflight(state) {
  assert(state.tool?.id === "wix", "Wix absent de public.tools");
  assert(state.tool.content_status === "published", "Wix doit être publié");
  assert(["legacy", "canonical"].includes(state.tool.data_contract), "data_contract Wix invalide");
  assert(state.observations.length === 4, `4 observations Wix attendues, reçu ${state.observations.length}`);
  assert(JSON.stringify(numberList(state.observations)) === JSON.stringify(EXPECTED_PRICES), "montants Wix inattendus");
  assert(state.observations.every((row) => row.native_currency === "EUR"), "devise Wix non EUR");
  assert(state.observations.every((row) => row.billing_period === "monthly"), "période Wix non mensuelle");
  assert(state.observations.every((row) => row.billing_commitment === "annual_prepaid"), "engagement Wix inattendu");
  assert(state.observations.every((row) => row.tax_inclusion === "ttc"), "TVA Wix non attestée TTC");
  assert(state.observations.every((row) => row.market_context === "reference_fr" && row.observed_market === "FR" && row.observed_locale === "fr-FR"), "contexte Wix non FR/fr-FR");
  assert(state.observations.every((row) =>
    (row.capture_context == null && row.capture_market == null && row.capture_locale == null)
    || (row.capture_context === row.market_context && row.capture_market === row.observed_market && row.capture_locale === row.observed_locale)
  ), "capture et observation Wix portent des contextes incompatibles");
  assert(state.localizations.length === 4, `4 localisations Wix attendues, reçu ${state.localizations.length}`);
  assert(state.editorial.length === 2 && state.editorial.every((row) => row.content_hash), "contenus FR/EN complets requis");
  assert(state.attestations.length === 1, `une attestation active Wix attendue, reçu ${state.attestations.length}`);
  assert(state.attestations[0].attested_by === ACTOR && state.attestations[0].value_json === "reference_fr", "attestation ToolTrim — Mike/reference_fr absente");
}

async function validateEditorialParity(sql) {
  const rows = await sql`
    select ec.lang,
      ec.short_description is not distinct from case when ec.lang='fr' then t.short_description else coalesce(t.short_description_en,t.short_description) end as short_ok,
      ec.long_description is not distinct from case when ec.lang='fr' then t.long_description else coalesce(t.long_description_en,t.long_description) end as long_ok,
      ec.verdict is not distinct from case when ec.lang='fr' then t.verdict else coalesce(nullif(t.verdict_en,'null'::jsonb),t.verdict) end as verdict_ok,
      ec.pros is not distinct from case when ec.lang='fr' then t.pros else coalesce(t.pros_en,t.pros) end as pros_ok,
      ec.cons is not distinct from case when ec.lang='fr' then t.cons else coalesce(t.cons_en,t.cons) end as cons_ok,
      ec.use_cases is not distinct from case when ec.lang='fr' then t.use_cases else coalesce(t.use_cases_en,t.use_cases) end as uses_ok,
      ec.covers is not distinct from t.covers as covers_ok,
      ec.relevant_for is not distinct from t.relevant_for as relevant_ok,
      ec.seo is not distinct from t.seo as seo_ok,
      ec.gallery_images is not distinct from t.legacy_payload->'gallery_images' as gallery_ok
    from catalog_private.tool_editorial_content ec
    join public.tools t on t.id=ec.tool_id
    where ec.tool_id='wix'
  `;
  assert(rows.length === 2 && rows.every((row) => Object.entries(row).every(([key, value]) => key === "lang" || value === true)), "le contenu canonique Wix diverge du contenu éditorial publié actuel");
}

async function validateProjection(sql) {
  const rows = await sql`
    select lang,data_contract,price_status,compare_plan,compare_native_amount,
           compare_native_currency,compare_monthly_eur,billing_commitment,
           tax_inclusion,compare_market,compare_locale,price_source_url,plans
    from catalog_api.published_tool_projection
    where slug='wix' order by lang
  `;
  assert(rows.length === 2, "projection Wix FR/EN incomplète");
  for (const row of rows) {
    assert(row.data_contract === "canonical", `projection ${row.lang} non canonical`);
    assert(row.price_status === "approved", `projection ${row.lang} non approved`);
    assert(row.compare_plan === "light", `plan comparatif ${row.lang} inattendu`);
    assert(Number(row.compare_native_amount) === 16.8 && row.compare_native_currency === "EUR", `prix comparatif ${row.lang} incorrect`);
    assert(Number(row.compare_monthly_eur) === 16.8, `prix EUR ${row.lang} incorrect`);
    assert(row.billing_commitment === "annual_prepaid" && row.tax_inclusion === "ttc", `conditions tarifaires ${row.lang} incorrectes`);
    assert(row.compare_market === "FR" && row.compare_locale === "fr-FR", `contexte projeté ${row.lang} incorrect`);
    assert(Array.isArray(row.plans) && row.plans.length === 5, `5 plans Wix attendus en ${row.lang}`);
    const paid = row.plans.filter((plan) => plan.native_amount != null).map((plan) => Number(plan.native_amount)).sort((a, b) => a - b);
    assert(JSON.stringify(paid) === JSON.stringify(EXPECTED_PRICES), `plans tarifaires ${row.lang} incomplets`);
  }
  return rows;
}

class DryRunRollback extends Error {}

loadEnvFile(ENV_FILE);
const ref = required("VITE_SUPABASE_PROJECT_ID");
const password = required("SUPABASE_DB_PASSWORD");
const host = process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com";
const sql = postgres({
  host,
  port: 5432,
  database: "postgres",
  username: `postgres.${ref}`,
  password,
  ssl: "require",
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5,
});

const before = await snapshot(sql);
validatePreflight(before);
await validateEditorialParity(sql);

let projected;
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:wix-canonical-pilot'))`;

    // L'attestation active contextualise les colonnes dérivées de la capture.
    // Le collector_payload brut et le content_hash restent immuables.
    await tx`
      update catalog_private.tool_source_captures c
      set market_context='reference_fr',observed_market='FR',observed_locale='fr-FR',
          updated_at=clock_timestamp()
      from catalog_private.active_review_attestations a
      where a.tool_id='wix' and a.id=${before.attestations[0].id}
        and c.id=a.capture_id
        and c.market_context is null and c.observed_market is null and c.observed_locale is null
    `;

    await tx`
      insert into catalog_private.tool_review_events
        (id,tool_id,event_type,subject_type,subject_id,attestation_id,actor,occurred_at,reason,payload)
      select 'evt:wix:price:' || o.id::text,'wix','observation_approved','price_observation',
             o.id::text,a.id,${ACTOR},clock_timestamp(),
             'Pilote Wix: prix officiel FR, contexte et conditions vérifiés',
             jsonb_build_object('pilot','wix','source','official','native_amount',o.native_amount,'native_currency',o.native_currency)
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      cross join lateral (
        select id from catalog_private.active_review_attestations
        where tool_id='wix' and attested_by=${ACTOR} and value_json=to_jsonb('reference_fr'::text)
        order by attested_at desc limit 1
      ) a
      where p.tool_id='wix' and o.review_status <> 'approved'
      on conflict (id) do nothing
    `;

    await tx`
      update catalog_private.tool_price_observations o
      set approval_event_id='evt:wix:price:' || o.id::text,
          review_status='approved',
          normalized_monthly_eur=o.native_amount,
          fx_rate=1,
          fx_rate_date=coalesce(o.last_confirmed_on,o.observed_on),
          normalization_method='native_eur_identity',
          updated_at=clock_timestamp()
      from catalog_private.tool_plans p
      where p.id=o.plan_id and p.tool_id='wix' and o.review_status <> 'approved'
    `;

    await tx`
      insert into catalog_private.tool_review_events
        (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
      select 'evt:wix:localization:' || l.id::text,'wix','localization_approved','localization',
             l.id::text,${ACTOR},clock_timestamp(),
             'Pilote Wix: libellé de plan observé sur la page officielle FR',
             jsonb_build_object('pilot','wix','locale',l.locale,'display_name',l.display_name)
      from catalog_private.tool_plan_localizations l
      join catalog_private.tool_plans p on p.id=l.plan_id
      where p.tool_id='wix' and l.status <> 'approved'
      on conflict (id) do nothing
    `;

    await tx`
      update catalog_private.tool_plan_localizations l
      set approval_event_id='evt:wix:localization:' || l.id::text,
          status='approved',updated_at=clock_timestamp()
      from catalog_private.tool_plans p
      where p.id=l.plan_id and p.tool_id='wix' and l.status <> 'approved'
    `;

    await tx`
      update catalog_private.tool_editorial_content
      set status='published',reviewed_by=${ACTOR},published_at=clock_timestamp(),updated_at=clock_timestamp()
      where tool_id='wix' and status <> 'published'
    `;

    await tx`
      update public.tools
      set data_contract='canonical',research_status='approved',
          editorially_reviewed_at=clock_timestamp(),next_review_at=current_date + 90,
          updated_at=clock_timestamp()
      where id='wix' and data_contract <> 'canonical'
    `;

    const approved = await tx`
      select count(*)::int as count
      from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      where p.tool_id='wix' and o.review_status='approved'
    `;
    assert(approved[0].count === 4, `4 observations approuvées attendues, reçu ${approved[0].count}`);
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
  validatePreflight(after);
  assert(after.tool.data_contract === "canonical", "Wix n'est pas canonical après COMMIT");
  assert(after.observations.every((row) => row.review_status === "approved"), "observations Wix non approuvées après COMMIT");
  assert(after.localizations.every((row) => row.status === "approved"), "localisations Wix non approuvées après COMMIT");
  assert(after.editorial.every((row) => row.status === "published"), "contenus Wix non publiés après COMMIT");
  assert(after.canonicalCount === before.canonicalCount + (before.tool.data_contract === "canonical" ? 0 : 1), "un autre outil que Wix a changé de contrat");
  await validateProjection(sql);
} else {
  assert(after.tool.data_contract === before.tool.data_contract, "le dry-run a persisté data_contract");
  assert(after.observations.every((row) => row.review_status === before.observations.find((item) => item.id === row.id)?.review_status), "le dry-run a persisté une approbation");
}

console.log(JSON.stringify({
  mode: APPLY ? "APPLY" : "DRY_RUN_ROLLBACK",
  applied: APPLY,
  tool: "wix",
  before: {
    data_contract: before.tool.data_contract,
    approved_prices: before.observations.filter((row) => row.review_status === "approved").length,
    published_editorials: before.editorial.filter((row) => row.status === "published").length,
    approved_localizations: before.localizations.filter((row) => row.status === "approved").length,
  },
  projected: {
    data_contract: "canonical",
    compare_plan: "light",
    compare_price_eur: 16.8,
    plans: [0, ...EXPECTED_PRICES],
    rows: projected?.length || 2,
  },
  after: {
    data_contract: after.tool.data_contract,
    approved_prices: after.observations.filter((row) => row.review_status === "approved").length,
    published_editorials: after.editorial.filter((row) => row.status === "published").length,
    approved_localizations: after.localizations.filter((row) => row.status === "approved").length,
  },
}, null, 2));

await sql.end({ timeout: 1 });
