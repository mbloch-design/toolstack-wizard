// Moteur Supabase générique — extrait la logique commune des pilotes Wix/Webflow/n8n.
// Piloté par PROFIL + PROPOSITION de staging. Aucun script propre à un outil.
//
// Invariants (identiques aux pilotes de référence) :
//  - dry-run rollback par défaut ; apply=true => COMMIT.
//  - transaction + verrou advisory PAR OUTIL ; erreur isolée (le lot continue ailleurs).
//  - import idempotent ; événements de revue append-only ; approbation des seuls faits éligibles.
//  - prix reference_fr approuvés UNIQUEMENT via attestation active de l'actor, liée capture+content_hash+basis.
//  - global_usd_fallback : contexte déclaré, aucune attestation, aucune conversion (montant natif).
//  - EUR reference_fr : IDENTITÉ EUR (normalized=native, fx=1, native_eur_identity). Jamais de conversion inventée.
//  - contenu FR/EN publié AVANT canonical ; data_contract canonical en toute fin ; projection validée en transaction.
//  - public.tools : SEULS les champs de contrôle changent (jamais les colonnes éditoriales legacy).
import { generateStageDryRunSql } from "../research-stage-sql.mjs";

const A = (c, m) => { if (!c) throw new Error(m); };

/** Config canonique dérivée du profil + proposition (aucune valeur codée par outil). */
export function deriveConfig(profile, proposal) {
  const obs = proposal.tables.tool_price_observations ?? [];
  const currencies = [...new Set(obs.map((o) => o.native_currency).filter(Boolean))];
  const currency = currencies.length === 1 ? currencies[0] : null;
  const candidate = obs.map((o) => o.market_context_candidate).find(Boolean) ?? null;
  const proven = obs.map((o) => o.market_context).find((m) => m === "reference_fr") ?? null;   // ex: hôte fr.* prouvé
  const declared = profile.marketContext ?? null;   // ex: global_usd_fallback déclaré au registre
  const marketContext = declared ?? candidate ?? proven ?? null;
  const requiresAttestation = marketContext === "reference_fr";
  const eurIdentity = currency === "EUR" && marketContext === "reference_fr";
  // Éligible à l'approbation = observé + montant présent + (gratuit OU engagement présent).
  // La contrainte DB refuse un prix payant approuvé sans billing_commitment (ex. month-to-month).
  // Les observations non éligibles (ex. mensuel sans engagement) restent observed (documentées, non promues).
  const eligible = (o) => o.review_status === "observed" && o.native_amount != null
    && (Number(o.native_amount) === 0 || o.billing_commitment != null);
  const currentCollectorIds = obs.filter(eligible).map((o) => o.collector_id);
  const expectedPrices = obs.filter(eligible).filter((o) => Number(o.native_amount) > 0)
    .map((o) => Number(o.native_amount)).sort((a, b) => a - b);
  return {
    toolId: proposal.tool_id, planCount: (proposal.tables.tool_plans ?? []).length,
    comparePlanKey: profile.comparePlanKey, freePlanKey: profile.freePlanKey ?? null,
    marketContext, requiresAttestation, eurIdentity, currency,
    observedMarket: requiresAttestation ? "FR" : null, observedLocale: requiresAttestation ? "fr-FR" : null,
    currentCollectorIds, expectedPrices,
  };
}

function importSqlForTransaction(proposal) {
  return generateStageDryRunSql(proposal).replace(/\nbegin;\n/, "\n").replace(/\nrollback;\s*$/, "\n");
}

async function snapshot(sql, toolId) {
  const [tool] = await sql`select id,slug,content_status,data_contract,research_status,
    short_description is not null legacy_short from public.tools where id=${toolId}`;
  const plans = await sql`select plan_key,pricing_unit,is_free,is_compare_plan,display_order
    from catalog_private.tool_plans where tool_id=${toolId} order by display_order`;
  const observations = await sql`select o.collector_id,p.plan_key,o.native_amount,o.native_currency,
    o.billing_commitment,o.tax_inclusion,o.review_status,o.market_context,o.market_context_candidate,
    o.normalized_monthly_eur,o.fx_rate,o.normalization_method
    from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id
    where p.tool_id=${toolId} order by p.display_order,o.collector_id`;
  const editorial = await sql`select lang,status,content_hash,reviewed_by from catalog_private.tool_editorial_content
    where tool_id=${toolId} order by lang`;
  const relationships = await sql`select related_tool_id,status from catalog_private.tool_relationships
    where tool_id=${toolId} order by related_tool_id`;
  const [counts] = await sql`select
    (select count(*)::int from catalog_private.tool_sources where tool_id=${toolId}) sources,
    (select count(*)::int from public.tools where data_contract='canonical') canonical_count`;
  return { tool, plans, observations, editorial, relationships, counts };
}

/** État complet outil + empreinte des AUTRES outils (preuve stabilité rollback / non-régression). */
async function fullState(sql, toolId) {
  const [c] = await sql`select
    (select count(*)::int from catalog_private.tool_sources where tool_id=${toolId}) sources,
    (select count(*)::int from catalog_private.tool_source_captures c join catalog_private.tool_sources s on s.id=c.source_id where s.tool_id=${toolId}) captures,
    (select count(*)::int from catalog_private.tool_claims where tool_id=${toolId}) claims,
    (select count(*)::int from catalog_private.tool_plans where tool_id=${toolId}) plans,
    (select count(*)::int from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id where p.tool_id=${toolId}) observations,
    (select count(*)::int from catalog_private.tool_editorial_content where tool_id=${toolId}) editorial,
    (select count(*)::int from catalog_private.tool_relationships where tool_id=${toolId}) relationships`;
  const [others] = await sql`select md5(coalesce(string_agg(id||':'||data_contract,',' order by id),'')) fp
    from public.tools where id <> ${toolId}`;
  return { self: c, other_fp: others.fp };
}

function validateStaged(state, cfg) {
  A(state.tool?.content_status === "published", `${cfg.toolId}: outil publié introuvable`);
  A(state.plans.length === cfg.planCount, `${cfg.toolId}: ${cfg.planCount} plans attendus, reçu ${state.plans.length}`);
  A(state.plans.some((r) => r.plan_key === cfg.comparePlanKey && r.is_compare_plan), `${cfg.toolId}: plan comparatif absent`);
  if (cfg.freePlanKey) {
    A(state.plans.some((r) => r.plan_key === cfg.freePlanKey && r.is_free), `${cfg.toolId}: plan gratuit ${cfg.freePlanKey} absent`);
    A(!state.observations.some((o) => o.plan_key === cfg.freePlanKey), `${cfg.toolId}: le plan gratuit ne doit porter aucune observation de prix`);
  }
  A(state.editorial.length === 2, `${cfg.toolId}: éditorial FR/EN incomplet`);
}

async function publishAndApprove(sql, cfg, actor, apply) {
  const { toolId } = cfg;
  for (const lang of ["fr", "en"]) {
    const [row] = await sql`select id,content_hash from catalog_private.tool_editorial_content
      where tool_id=${toolId} and lang=${lang} for update`;
    A(row?.content_hash, `${toolId}: contenu éditorial ${lang} sans hash`);
    await sql`update catalog_private.tool_editorial_content set status='published',reviewed_by=${actor},
      published_at=coalesce(published_at,clock_timestamp()),updated_at=clock_timestamp() where id=${row.id}`;
  }
  // localisations + relations : approbation via événements distincts
  await sql`insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
    select 'evt:'||${toolId}||':loc:'||l.id::text,${toolId},'localization_approved','localization',l.id::text,${actor},clock_timestamp(),
    'Moteur: libellé officiel du plan vérifié',jsonb_build_object('locale',l.locale,'display_name',l.display_name)
    from catalog_private.tool_plan_localizations l join catalog_private.tool_plans p on p.id=l.plan_id
    where p.tool_id=${toolId} and l.status<>'approved' on conflict (id) do nothing`;
  await sql`update catalog_private.tool_plan_localizations l set approval_event_id='evt:'||${toolId}||':loc:'||l.id::text,
    status='approved',updated_at=clock_timestamp() from catalog_private.tool_plans p
    where p.id=l.plan_id and p.tool_id=${toolId} and l.status<>'approved'`;
  await sql`insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
    select 'evt:'||${toolId}||':rel:'||r.id::text,${toolId},'relationship_approved','relationship',r.id::text,${actor},clock_timestamp(),
    'Moteur: relation sourcée vers outil publié',jsonb_build_object('related',r.related_tool_id,'type',r.rel_type)
    from catalog_private.tool_relationships r where r.tool_id=${toolId} and r.status<>'approved' on conflict (id) do nothing`;
  await sql`update catalog_private.tool_relationships r set approval_event_id='evt:'||${toolId}||':rel:'||r.id::text,
    status='approved',verified_at=current_date,updated_at=clock_timestamp() where r.tool_id=${toolId} and r.status<>'approved'`;

  // Prix : selon le contexte marché.
  let approvedPrices = 0;
  if (cfg.marketContext === "reference_fr") {
    const [strict] = await sql`select count(distinct o.id)::int n from catalog_private.tool_price_observations o
      join catalog_private.tool_plans p on p.id=o.plan_id
      join catalog_private.tool_source_captures c on c.id=o.capture_id
      join catalog_private.active_review_attestations a on a.tool_id=${toolId} and a.capture_id=o.capture_id
        and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text)
        and a.attested_by=${actor} and a.basis_attestation_id is not null
      where p.tool_id=${toolId} and a.content_hash=c.content_hash`;
    const hasStrict = (strict?.n ?? 0) > 0;
    if (apply && !hasStrict) throw new Error(`REFUS DUR: ${toolId} apply exige une attestation reference_fr active de ${actor} liée capture/content_hash/basis`);
    if (hasStrict) {
      await sql`update catalog_private.tool_source_captures c set market_context='reference_fr',observed_market='FR',
        observed_locale='fr-FR',updated_at=clock_timestamp() from catalog_private.tool_price_observations o
        join catalog_private.tool_plans p on p.id=o.plan_id
        join catalog_private.active_review_attestations a on a.tool_id=${toolId} and a.capture_id=o.capture_id
          and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${actor}
        where c.id=o.capture_id and a.content_hash=c.content_hash and p.tool_id=${toolId} and c.market_context is distinct from 'reference_fr'`;
      await sql`insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,attestation_id,actor,occurred_at,reason,payload)
        select 'evt:'||${toolId}||':price:'||o.id::text,${toolId},'observation_approved','price_observation',o.id::text,a.id,${actor},clock_timestamp(),
        'Moteur: prix natif vérifié, contexte reference_fr attesté',jsonb_build_object('native_amount',o.native_amount,'native_currency',o.native_currency)
        from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id
        join catalog_private.tool_source_captures c on c.id=o.capture_id
        join catalog_private.active_review_attestations a on a.tool_id=${toolId} and a.capture_id=o.capture_id
          and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${actor}
        where p.tool_id=${toolId} and o.review_status<>'approved' on conflict (id) do nothing`;
      const norm = cfg.eurIdentity;
      const res = await sql`update catalog_private.tool_price_observations o
        set approval_event_id='evt:'||${toolId}||':price:'||o.id::text,review_status='approved',market_context='reference_fr',
        observed_market='FR',observed_locale='fr-FR',
        normalized_monthly_eur=${norm ? sql`o.native_amount` : sql`null`},fx_rate=${norm ? 1 : null},
        fx_rate_date=${norm ? sql`current_date` : null},normalization_method=${norm ? "native_eur_identity" : null},
        updated_at=clock_timestamp()
        from catalog_private.tool_plans p, catalog_private.tool_source_captures c, catalog_private.active_review_attestations a
        where p.id=o.plan_id and c.id=o.capture_id and p.tool_id=${toolId}
          and a.tool_id=${toolId} and a.capture_id=o.capture_id and a.content_hash=c.content_hash
          and a.attestation_type='market_context' and a.value_json=to_jsonb('reference_fr'::text) and a.attested_by=${actor}
          and o.review_status<>'approved'`;
      approvedPrices = res.count ?? 0;
    }
  } else if (cfg.marketContext === "global_usd_fallback") {
    // Contexte mondial USD déclaré : projeter sur la capture, approuver SANS attestation, SANS conversion.
    await sql`update catalog_private.tool_source_captures c set market_context='global_usd_fallback',
      observed_market=null,observed_locale=null,updated_at=clock_timestamp()
      from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id
      where c.id=o.capture_id and p.tool_id=${toolId} and c.market_context is null`;
    await sql`insert into catalog_private.tool_review_events (id,tool_id,event_type,subject_type,subject_id,actor,occurred_at,reason,payload)
      select 'evt:'||${toolId}||':price:'||o.id::text,${toolId},'observation_approved','price_observation',o.id::text,${actor},clock_timestamp(),
      'Moteur: prix natif vérifié, contexte mondial USD',jsonb_build_object('native_amount',o.native_amount,'native_currency',o.native_currency)
      from catalog_private.tool_price_observations o join catalog_private.tool_plans p on p.id=o.plan_id
      where p.tool_id=${toolId} and o.collector_id in ${sql(cfg.currentCollectorIds)} and o.review_status<>'approved' on conflict (id) do nothing`;
    const res = await sql`update catalog_private.tool_price_observations o
      set approval_event_id='evt:'||${toolId}||':price:'||o.id::text,review_status='approved',
      normalized_monthly_eur=null,fx_rate=null,fx_rate_date=null,normalization_method=null,updated_at=clock_timestamp()
      from catalog_private.tool_plans p where p.id=o.plan_id and p.tool_id=${toolId}
      and o.collector_id in ${sql(cfg.currentCollectorIds)} and o.review_status<>'approved'`;
    approvedPrices = res.count ?? 0;
  }
  return approvedPrices;
}

async function validateProjection(sql, cfg, expectApproved) {
  const rows = await sql`select lang,data_contract,price_status,compare_plan,compare_native_amount,
    compare_native_currency,compare_monthly_eur,plans,pricing_guidance,short_description
    from catalog_api.published_tool_projection where slug=${cfg.toolId} order by lang`;
  A(rows.length === 2, `${cfg.toolId}: projection FR/EN incomplète`);
  for (const r of rows) {
    A(r.data_contract === "canonical", `${cfg.toolId}: projection ${r.lang} non canonical`);
    A(Array.isArray(r.plans) && r.plans.length === cfg.planCount, `${cfg.toolId}: ${cfg.planCount} plans attendus (${r.lang})`);
    const g = JSON.stringify(r.pricing_guidance ?? {});
    A(!/native_amount|compare_price_monthly_eur/.test(g), `${cfg.toolId}: fuite de fait tarifaire dans pricing_guidance (${r.lang})`);
    if (!cfg.eurIdentity) A(r.compare_monthly_eur == null, `${cfg.toolId}: conversion EUR non sourcée (${r.lang})`);
    if (expectApproved) {
      A(r.price_status === "approved", `${cfg.toolId}: price_status approved attendu (${r.lang})`);
      A(r.compare_plan === cfg.comparePlanKey, `${cfg.toolId}: plan comparatif ${cfg.comparePlanKey} attendu (${r.lang})`);
    }
  }
  return rows;
}

class DryRunRollback extends Error {}

/**
 * Rollback ordinaire d'un outil : data_contract canonical -> legacy. Ne supprime NI sources, NI
 * captures, NI événements (ledger conservé). Rend la fiche legacy immédiatement. Ne touche aucun autre outil.
 */
export async function rollbackTool({ sql, toolId, apply = false }) {
  const before = await snapshot(sql, toolId);
  if (before.tool?.data_contract !== "canonical") {
    return { toolId, mode: "ROLLBACK_NOOP", applied: false, note: "déjà legacy", data_contract: before.tool?.data_contract };
  }
  const beforeOtherFp = (await fullState(sql, toolId)).other_fp;
  let ok = false;
  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('tooltrim:canonical:'||${toolId}))`;
      await tx`update public.tools set data_contract='legacy',research_status='needs_review',updated_at=clock_timestamp() where id=${toolId}`;
      const [chk] = await tx`select data_contract from catalog_api.published_tool_projection where slug=${toolId} limit 1`;
      A(chk?.data_contract === "legacy", `${toolId}: projection non revenue à legacy`);
      A((await fullState(tx, toolId)).other_fp === beforeOtherFp, `${toolId}: rollback a modifié un autre outil`);
      if (!apply) throw new DryRunRollback();
      ok = true;
    });
  } catch (e) { if (!(e instanceof DryRunRollback)) throw e; }
  const after = await snapshot(sql, toolId);
  return { toolId, mode: apply ? "ROLLBACK_APPLIED" : "ROLLBACK_DRY_RUN", applied: apply && ok,
    data_contract: after.tool.data_contract, canonical_count: after.counts.canonical_count };
}

/**
 * Traite UN outil dans sa propre transaction. Retourne un résultat structuré (jamais de throw
 * qui casse le lot : l'appelant isole). advisoryLock par outil ; apply=false => rollback.
 */
export async function runTool({ sql, profile, proposal, actor, apply = false }) {
  const cfg = deriveConfig(profile, proposal);
  A(proposal.approved_rows === 0, `${cfg.toolId}: la proposition ne doit contenir aucun approved`);
  const stageSql = importSqlForTransaction(proposal);
  const before = await snapshot(sql, cfg.toolId);
  const beforeFull = await fullState(sql, cfg.toolId);
  A(["legacy", "canonical"].includes(before.tool?.data_contract), `${cfg.toolId}: état initial invalide`);

  if (before.tool.data_contract === "canonical") {
    await validateProjection(sql, cfg, cfg.expectedPrices.length > 0);   // outil free-only => needs_review attendu
    return { toolId: cfg.toolId, mode: apply ? "APPLY_NOOP" : "DRY_RUN_CURRENT_STATE", applied: false, noop: true,
      proposal_hash: proposal.proposal_hash, canonical_count: before.counts.canonical_count };
  }

  let approvedPrices = 0, projected = [];
  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('tooltrim:canonical:'||${cfg.toolId}))`;
      await tx.unsafe(stageSql).simple();
      const staged = await snapshot(tx, cfg.toolId);
      validateStaged(staged, cfg);
      approvedPrices = await publishAndApprove(tx, cfg, actor, apply);
      const priceComplete = cfg.expectedPrices.length === 0 || approvedPrices === cfg.expectedPrices.length;
      await tx`update public.tools set data_contract='canonical',
        research_status=${priceComplete && (approvedPrices > 0 || cfg.expectedPrices.length === 0) ? "approved" : "needs_review"},
        editorially_reviewed_at=clock_timestamp(),next_review_at=current_date+90,updated_at=clock_timestamp()
        where id=${cfg.toolId} and data_contract<>'canonical'`;
      projected = await validateProjection(tx, cfg, approvedPrices === cfg.expectedPrices.length && cfg.expectedPrices.length > 0);
      if (!apply) throw new DryRunRollback();
    });
  } catch (e) {
    if (!(e instanceof DryRunRollback)) return { toolId: cfg.toolId, mode: apply ? "APPLY_FAILED" : "DRY_RUN_FAILED", applied: false, error: String(e.message), rolled_back: true };
  }

  const after = await snapshot(sql, cfg.toolId);
  const afterFull = await fullState(sql, cfg.toolId);
  const rollbackStable = JSON.stringify(afterFull) === JSON.stringify(beforeFull);
  if (apply) {
    A(after.tool.data_contract === "canonical", `${cfg.toolId}: non canonical après COMMIT`);
    A(after.tool.legacy_short === before.tool.legacy_short, `${cfg.toolId}: colonnes éditoriales legacy modifiées (interdit)`);
    A(after.counts.canonical_count === before.counts.canonical_count + 1, `${cfg.toolId}: canonical_count doit +1`);
    A(afterFull.other_fp === beforeFull.other_fp, `${cfg.toolId}: un autre outil a été modifié (interdit)`);
    await validateProjection(sql, cfg, cfg.expectedPrices.length > 0);
  } else {
    A(after.tool.data_contract === before.tool.data_contract, `${cfg.toolId}: dry-run a persisté data_contract`);
    A(rollbackStable, `${cfg.toolId}: dry-run a laissé une trace`);
  }
  return {
    toolId: cfg.toolId, mode: apply ? "APPLY" : "DRY_RUN_ROLLBACK", applied: apply, noop: false,
    proposal_hash: proposal.proposal_hash, market_context: cfg.marketContext, requires_attestation: cfg.requiresAttestation,
    approved_prices: approvedPrices, expected_prices: cfg.expectedPrices, rollback_stable: apply ? null : rollbackStable,
    canonical_count: after.counts.canonical_count,
    projected_fr: (() => { const r = projected.find((x) => x.lang === "fr") ?? {}; return { price_status: r.price_status, compare_plan: r.compare_plan, compare_native_amount: r.compare_native_amount == null ? null : Number(r.compare_native_amount), compare_native_currency: r.compare_native_currency, compare_monthly_eur: r.compare_monthly_eur == null ? null : Number(r.compare_monthly_eur) }; })(),
  };
}
