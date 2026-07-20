/**
 * Mapping PUR d'un dossier RESEARCH_ONLY vers une proposition de staging.
 * Aucun réseau, aucune I/O, aucune DB, aucune écriture et jamais d'`approved`.
 * Les UUID SQL sont résolus plus tard par l'importeur à partir des collector_id.
 */
import { createHash } from "node:crypto";
import { captureIdOf, sourceIdOf, sortKeys } from "./research-model.mjs";

const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");
const deterministicId = (prefix, value) => `${prefix}:${sha256(JSON.stringify(sortKeys(value)))}`;
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const PRICING_GUIDANCE_KEYS = [
  "billing_options", "cautions", "costTable", "costTableNoteFr", "costTableNoteEn",
  "minSeats", "price_reliability", "tcoExampleFr", "tcoExampleEn", "usage_sensitive",
];

function activeReviewAttestations(doc) {
  return (doc.review_attestations ?? []).filter((a) => a && !a.revoked_at && a.active !== false);
}

function reviewStatus(value) {
  if (value === "conflicted" || value === "superseded_candidate") return "conflicted";
  if (value === "needs_review" || value === "rejected") return value;
  return "observed"; // le collecteur/local ne peut jamais importer approved
}

/**
 * Construit le registre canonique des plans depuis les faits de recherche et
 * les seules décisions éditoriales qui ne sont pas déductibles des sources.
 */
export function planRegistryFromResearch(doc, registryEntry, { planOrder, comparePlanKey, freePlanKey = "free" } = {}) {
  requireValue(registryEntry?.plan_key_mapping, "staging: plan_key_mapping du registre requis");
  requireValue(Array.isArray(planOrder) && planOrder.length > 0, "staging: ordre canonique explicite requis");
  requireValue(comparePlanKey && planOrder.includes(comparePlanKey), "staging: plan comparatif explicite invalide");

  const mappedKeys = new Set(Object.values(registryEntry.plan_key_mapping));
  const observations = doc?.collector?.observations ?? [];
  const observedKeys = new Set(observations.map((row) => row.plan_key).filter(Boolean));
  const hasFree = (doc?.collector?.claims ?? []).some((claim) =>
    claim.key === "pricing.free_plan_exists" && claim.value_native === true);
  if (hasFree) observedKeys.add(freePlanKey);

  for (const key of observedKeys) requireValue(mappedKeys.has(key), `staging: plan ${key} absent du mapping humain`);
  for (const key of planOrder) requireValue(mappedKeys.has(key), `staging: ordre contient un plan non mappé ${key}`);
  requireValue(planOrder.length === new Set(planOrder).size, "staging: ordre de plans dupliqué");
  requireValue([...observedKeys].every((key) => planOrder.includes(key)), "staging: ordre canonique incomplet");

  const unitClaim = (doc?.collector?.claims ?? []).find((claim) => claim.key === "pricing.unit")?.value_native ?? null;
  return Object.fromEntries(planOrder.map((planKey, displayOrder) => {
    const units = new Set(observations.filter((row) => row.plan_key === planKey).map((row) => row.pricing_unit).filter(Boolean));
    const seats = new Set(observations.filter((row) => row.plan_key === planKey).map((row) => row.seat_type).filter(Boolean));
    requireValue(units.size <= 1, `staging: unités contradictoires pour ${planKey}`);
    requireValue(seats.size <= 1, `staging: seat_type contradictoires pour ${planKey}`);
    return [planKey, {
      is_free: hasFree && planKey === freePlanKey,
      pricing_unit: [...units][0] ?? unitClaim,
      seat_type: [...seats][0] ?? null,
      is_compare_plan: planKey === comparePlanKey,
      display_order: displayOrder,
    }];
  }));
}

export function editorialRowsFromLegacy(tool, toolId = tool?.id ?? tool?.slug) {
  requireValue(tool && toolId, "staging: payload éditorial legacy requis");
  const pricingGuidance = Object.fromEntries(PRICING_GUIDANCE_KEYS
    .filter((key) => tool.pricing_v5?.[key] != null)
    .map((key) => [key, tool.pricing_v5[key]]));
  const shared = {
    tool_id: toolId,
    content_version: 1,
    covers: tool.covers ?? null,
    relevant_for: tool.relevantFor ?? tool.relevant_for ?? null,
    seo: tool.seo ?? null,
    gallery_images: tool.gallery_images ?? null,
    ai_angle: tool.aiAngle ?? tool.seo?.aiAngle ?? null,
    pricing_guidance: Object.keys(pricingGuidance).length ? pricingGuidance : null,
    status: "draft",
    author: "legacy-import",
    reviewed_by: null,
    published_at: null,
  };
  return [
    {
      ...shared,
      lang: "fr",
      short_description: tool.shortDescription ?? tool.short_description ?? null,
      long_description: tool.longDescription ?? tool.long_description ?? tool.description ?? null,
      use_cases: tool.useCases ?? tool.use_cases ?? null,
      pros: tool.pros ?? null,
      cons: tool.cons ?? null,
      verdict: tool.verdict ?? null,
    },
    {
      ...shared,
      lang: "en",
      short_description: tool.shortDescriptionEn ?? tool.short_description_en ?? tool.shortDescription ?? null,
      long_description: tool.longDescriptionEn ?? tool.long_description_en ?? tool.longDescription ?? tool.description ?? null,
      use_cases: tool.useCasesEn ?? tool.use_cases_en ?? tool.useCases ?? null,
      pros: tool.prosEn ?? tool.pros_en ?? tool.pros ?? null,
      cons: tool.consEn ?? tool.cons_en ?? tool.cons ?? null,
      verdict: tool.verdictEn ?? tool.verdict_en ?? tool.verdict ?? null,
    },
  ].map((row) => ({
    ...row,
    content_hash: `sha256:${sha256(JSON.stringify(sortKeys(row)))}`,
  }));
}

export function buildStagingProposal(doc, { planRegistry, locale = "fr-FR", toolId: resolvedToolId, publishedTools, legacyTool } = {}) {
  requireValue(doc?.slug, "staging: slug manquant");
  requireValue(planRegistry && typeof planRegistry === "object", "staging: planRegistry explicite requis");
  const toolSlug = doc.slug;
  const toolId = resolvedToolId ?? toolSlug;
  const collector = doc.collector ?? {};
  const sources = collector.sources ?? [];
  const observations = collector.observations ?? [];
  const claims = collector.claims ?? [];
  const relationships = collector.relationships ?? [];

  for (const source of sources) {
    requireValue(source.url && source.source_id === sourceIdOf(source.url), `staging: source_id incohérent (${source.url ?? "?"})`);
  }

  const sourceRows = sources.map((source) => ({
    tool_id: toolId,
    collector_id: source.source_id,
    url: source.url,
    domain: source.domain ?? null,
    source_type: source.source_type ?? null,
    source_tier: source.source_tier ?? null,
    is_official: source.is_official ?? null,
    collector_payload: sortKeys(source),
  }));

  const captureRows = [];
  const capturesByCollectorId = new Map();
  for (const source of sources) {
    for (const capture of source.captures ?? []) {
      const expected = captureIdOf(source.url, capture.content_hash);
      requireValue(capture.capture_id === expected, `staging: capture_id incohérent (${capture.capture_id ?? "?"})`);
      const row = {
        source_collector_id: source.source_id,
        collector_id: capture.capture_id,
        accessed_at: capture.accessed_at,
        http_status: capture.http_status ?? null,
        title: capture.title ?? null,
        content_hash: capture.content_hash,
        rendered_by: capture.rendered_by ?? null,
        observed_market: capture.observed_market ?? null,
        observed_locale: capture.observed_locale ?? null,
        market_context: capture.market_context ?? null,
        is_accessible: capture.is_accessible ?? null,
        notes: capture.notes ?? null,
        collector_payload: sortKeys(capture),
      };
      captureRows.push(row);
      capturesByCollectorId.set(row.collector_id, row);
    }
  }

  const contextRows = (collector.context_attestations ?? []).map((basis) => {
    const captureCollectorId = captureIdOf(basis.source_url, basis.content_hash);
    requireValue(capturesByCollectorId.has(captureCollectorId), `staging: basis sans capture ${basis.attestation_id}`);
    return {
      id: basis.attestation_id,
      tool_id: toolId,
      capture_collector_id: captureCollectorId,
      source_url: basis.source_url,
      content_hash: basis.content_hash,
      accessed_at: basis.accessed_at,
      payload: sortKeys(basis),
    };
  });
  const contextIds = new Set(contextRows.map((row) => row.id));

  const reviewRows = (doc.review_attestations ?? []).map((attestation) => {
    requireValue(contextIds.has(attestation.basis_attestation_id), `staging: attestation sans basis ${attestation.review_attestation_id}`);
    requireValue(capturesByCollectorId.has(attestation.applies_to_capture_ref), `staging: attestation sans capture ${attestation.review_attestation_id}`);
    return {
      id: attestation.review_attestation_id,
      tool_id: toolId,
      attestation_type: attestation.attests,
      value_json: attestation.value,
      basis_attestation_id: attestation.basis_attestation_id,
      capture_collector_id: attestation.applies_to_capture_ref,
      content_hash: attestation.content_hash,
      source_url: attestation.source_url,
      attested_by: attestation.attested_by,
      attested_at: attestation.attested_at,
      note: attestation.note ?? null,
      collector_payload: sortKeys(attestation),
    };
  });
  const reviewIds = new Set(reviewRows.map((row) => row.id));

  const reviewEvents = [];
  for (const attestation of doc.review_attestations ?? []) {
    if (!attestation.revoked_at) continue;
    reviewEvents.push({
      id: deterministicId("evt", { type: "attestation_revoked", id: attestation.review_attestation_id, at: attestation.revoked_at }),
      tool_id: toolId,
      event_type: "attestation_revoked",
      subject_type: "context_attestation",
      subject_id: attestation.review_attestation_id,
      attestation_id: attestation.review_attestation_id,
      actor: attestation.revoked_by || "unknown-reviewer",
      occurred_at: attestation.revoked_at,
      reason: attestation.revocation_reason ?? null,
      payload: sortKeys({ source: "review_attestations.revoked_*" }),
    });
  }
  for (const event of doc.review_events ?? []) {
    requireValue(event.attestation_id && reviewIds.has(event.attestation_id), `staging: review_event sans attestation ${event.event_id ?? "?"}`);
    reviewEvents.push({
      id: event.event_id || deterministicId("evt", event),
      tool_id: toolId,
      event_type: "incident_recorded",
      subject_type: "context_attestation",
      subject_id: event.attestation_id,
      attestation_id: event.attestation_id,
      actor: event.actor || "unknown-reviewer",
      occurred_at: event.occurred_at || event.detected_at,
      reason: event.reason ?? null,
      payload: sortKeys(event),
    });
  }

  const freeClaim = claims.find((claim) => claim.key === "pricing.free_plan_exists" && claim.value_native === true);
  const observedPlanKeys = new Set(observations.map((observation) => observation.plan_key).filter(Boolean));
  if (freeClaim) {
    const freePlanKey = Object.entries(planRegistry).find(([, meta]) => meta.is_free === true)?.[0];
    requireValue(freePlanKey, "staging: claim de gratuité sans plan gratuit déclaré");
    observedPlanKeys.add(freePlanKey);
  }
  for (const planKey of observedPlanKeys) requireValue(planRegistry[planKey], `staging: plan non déclaré ${planKey}`);

  const planRows = Object.entries(planRegistry)
    .filter(([planKey]) => observedPlanKeys.has(planKey))
    .map(([planKey, meta], index) => ({
      tool_id: toolId,
      plan_key: planKey,
      seat_type: meta.seat_type ?? null,
      pricing_unit: meta.pricing_unit ?? null,
      is_free: meta.is_free === true,
      is_compare_plan: meta.is_compare_plan === true,
      display_order: meta.display_order ?? index,
    }));
  requireValue(planRows.filter((plan) => plan.is_compare_plan).length === 1, "staging: exactement un plan comparatif requis");

  const activeAttestations = activeReviewAttestations(doc);
  const observationRows = observations.map((observation) => {
    requireValue(observation.observation_id && observation.plan_key, "staging: observation sans identités canoniques");
    requireValue(capturesByCollectorId.has(observation.capture_ref), `staging: observation sans capture ${observation.observation_id}`);
    const applicable = activeAttestations.find((attestation) =>
      attestation.attests === "market_context" &&
      attestation.value === observation.market_context_candidate &&
      attestation.applies_to_capture_ref === observation.capture_ref &&
      attestation.content_hash === observation.content_hash &&
      !attestation.revoked_at && attestation.active !== false);
    const effectiveReferenceFr = applicable?.value === "reference_fr";
    return {
      collector_id: observation.observation_id,
      plan_ref: { tool_id: toolId, plan_key: observation.plan_key, seat_type: observation.seat_type ?? null },
      native_amount: observation.native_amount,
      native_currency: observation.native_currency,
      billing_period: observation.billing_period ?? null,
      billing_commitment: observation.billing_commitment ?? null,
      tax_inclusion: observation.tax_inclusion ?? "unknown",
      observed_market: effectiveReferenceFr ? "FR" : (observation.observed_market ?? null),
      observed_locale: effectiveReferenceFr ? "fr-FR" : (observation.observed_locale ?? null),
      market_context: applicable?.value ?? observation.market_context ?? null,
      market_context_candidate: observation.market_context_candidate ?? null,
      market_context_source: observation.market_context_source ?? null,
      market_evidence: observation.market_evidence ?? null,
      evidence_excerpt: observation.evidence_excerpt ?? null,
      evidence_selector: observation.evidence_selector ?? null,
      observed_on: observation.observed_on,
      last_confirmed_on: observation.last_confirmed_on ?? observation.observed_on,
      capture_collector_id: observation.capture_ref,
      context_attestation_id: applicable?.review_attestation_id ?? null,
      approval_event_id: null,
      confidence: observation.confidence ?? null,
      review_status: reviewStatus(observation.status),
      collector_payload: sortKeys(observation),
    };
  });

  const claimRows = claims.map((claim) => {
    requireValue(claim.claim_id && capturesByCollectorId.has(claim.capture_id), `staging: claim sans capture ${claim.claim_id ?? "?"}`);
    return {
      collector_id: claim.claim_id,
      tool_id: toolId,
      claim_key: claim.key,
      value_json: claim.value_native,
      capture_collector_id: claim.capture_id,
      context_attestation_id: null,
      approval_event_id: null,
      observed_market: claim.observed_market ?? null,
      observed_locale: claim.observed_locale ?? null,
      market_context: claim.market_context ?? null,
      market_context_candidate: claim.market_context_candidate ?? null,
      confidence: claim.confidence ?? null,
      volatility: claim.volatility ?? null,
      observed_on: claim.observed_on ?? null,
      verified_at: null,
      expires_at: null,
      status: reviewStatus(claim.status),
      evidence_note: claim.note ?? claim.evidence ?? null,
      collector_payload: sortKeys(claim),
    };
  });

  const localizationRows = observations.map((observation) => ({
    collector_id: deterministicId("loc", {
      tool: toolId, plan_key: observation.plan_key, locale,
      name: observation.plan_name_localized, capture: observation.capture_ref,
    }),
    plan_ref: { tool_id: toolId, plan_key: observation.plan_key, seat_type: observation.seat_type ?? null },
    locale,
    display_name: observation.plan_name_localized,
    capture_collector_id: observation.capture_ref,
    observed_on: observation.observed_on,
    approval_event_id: null,
    status: "observed",
  }));

  if (relationships.length > 0) {
    requireValue(publishedTools instanceof Map, "staging: catalogue publié requis pour importer des relations");
  }
  const relationshipRows = relationships.map((relationship) => {
    const relType = relationship.rel_type ?? relationship.relationship_type;
    const direction = relationship.direction ?? "directed";
    const target = relationship.target_slug ?? relationship.related_tool_slug;
    requireValue(["substitutes", "extends", "complements"].includes(relType), `staging: type de relation invalide ${relType ?? "null"}`);
    requireValue(target && target !== toolSlug, "staging: cible de relation invalide");
    requireValue(publishedTools.has(target), `staging: cible de relation non publiée ${target}`);
    requireValue(["directed", "mutual"].includes(direction), `staging: direction de relation invalide ${direction}`);
    requireValue(relationship.reason_fr || relationship.reason_en, `staging: relation ${target} sans explication`);
    requireValue(relationship.capture_ref, `staging: relation ${target} sans provenance de capture`);
    requireValue(capturesByCollectorId.has(relationship.capture_ref), `staging: relation sans capture ${target}`);
    const collectorId = relationship.relationship_id ?? deterministicId("rel", {
      tool_id: toolId,
      related_tool_slug: target,
      rel_type: relType,
      direction,
      capture_ref: relationship.capture_ref ?? null,
    });
    requireValue(/^rel:[0-9a-f]{64}$/.test(collectorId), `staging: relationship_id invalide ${collectorId}`);
    return {
      tool_id: toolId,
      related_tool_id: publishedTools.get(target),
      related_tool_slug: target,
      collector_id: collectorId,
      rel_type: relType,
      direction,
      reason_fr: relationship.reason_fr ?? null,
      reason_en: relationship.reason_en ?? null,
      capture_collector_id: relationship.capture_ref ?? null,
      confidence: relationship.confidence ?? null,
      observed_on: relationship.observed_on ?? null,
      verified_at: null,
      approval_event_id: null,
      status: relationship.status === "rejected" ? "rejected" : "proposed",
      collector_payload: sortKeys(relationship),
    };
  });

  const editorialRows = legacyTool ? editorialRowsFromLegacy(legacyTool, toolId) : [];

  const tables = sortKeys({
    tool_sources: sourceRows,
    tool_source_captures: captureRows,
    tool_context_attestations: contextRows,
    tool_review_attestations: reviewRows,
    tool_review_events: reviewEvents,
    tool_plans: planRows,
    tool_price_observations: observationRows,
    tool_claims: claimRows,
    tool_editorial_content: editorialRows,
    tool_plan_localizations: localizationRows,
    tool_relationships: relationshipRows,
  });
  const validation = validateStagingProposal(tables);
  requireValue(validation.ok, `staging invalide: ${validation.errors.join("; ")}`);
  return {
    mode: "STAGING_PROPOSAL_ONLY",
    tool_id: toolId,
    tool_slug: toolSlug,
    tables,
    proposal_hash: `sha256:${sha256(JSON.stringify(tables))}`,
    counts: Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length])),
    approved_rows: 0,
  };
}

export function validateStagingProposal(tables) {
  const errors = [];
  const unique = (rows, key, label) => {
    const seen = new Set();
    for (const row of rows) {
      const value = key(row);
      if (seen.has(value)) errors.push(`${label} dupliqué: ${value}`);
      seen.add(value);
    }
  };
  const sources = tables.tool_sources ?? [];
  const captures = tables.tool_source_captures ?? [];
  const basis = tables.tool_context_attestations ?? [];
  const reviews = tables.tool_review_attestations ?? [];
  const events = tables.tool_review_events ?? [];
  const observations = tables.tool_price_observations ?? [];
  const claims = tables.tool_claims ?? [];
  const relationships = tables.tool_relationships ?? [];
  const editorial = tables.tool_editorial_content ?? [];
  unique(sources, (row) => `${row.tool_id}|${row.collector_id}`, "source");
  unique(captures, (row) => `${row.source_collector_id}|${row.collector_id}`, "capture");
  unique(basis, (row) => row.id, "basis");
  unique(reviews, (row) => row.id, "attestation");
  unique(events, (row) => row.id, "review_event");
  unique(observations, (row) => `${row.plan_ref.tool_id}|${row.plan_ref.plan_key}|${row.collector_id}`, "observation");
  unique(claims, (row) => `${row.tool_id}|${row.collector_id}`, "claim");
  unique(relationships, (row) => `${row.tool_id}|${row.collector_id}`, "relation");
  unique(editorial, (row) => `${row.tool_id}|${row.lang}|${row.content_version}`, "contenu éditorial");
  const sourceIds = new Set(sources.map((row) => row.collector_id));
  const captureIds = new Set(captures.map((row) => row.collector_id));
  const basisIds = new Set(basis.map((row) => row.id));
  const reviewIds = new Set(reviews.map((row) => row.id));
  for (const row of captures) if (!sourceIds.has(row.source_collector_id)) errors.push(`capture sans source: ${row.collector_id}`);
  for (const row of basis) if (!captureIds.has(row.capture_collector_id)) errors.push(`basis sans capture: ${row.id}`);
  for (const row of reviews) {
    if (!basisIds.has(row.basis_attestation_id)) errors.push(`attestation sans basis: ${row.id}`);
    if (!captureIds.has(row.capture_collector_id)) errors.push(`attestation sans capture: ${row.id}`);
  }
  for (const row of events) if (row.attestation_id && !reviewIds.has(row.attestation_id)) errors.push(`event sans attestation: ${row.id}`);
  for (const row of [...observations, ...claims]) {
    if (!captureIds.has(row.capture_collector_id)) errors.push(`fait sans capture: ${row.collector_id}`);
    if (row.review_status === "approved" || row.status === "approved") errors.push(`approved interdit dans la proposition: ${row.collector_id}`);
  }
  for (const row of relationships) {
    if (row.capture_collector_id && !captureIds.has(row.capture_collector_id)) errors.push(`relation sans capture: ${row.collector_id}`);
    if (row.tool_id === row.related_tool_id) errors.push(`relation réflexive: ${row.collector_id}`);
    if (row.status === "approved") errors.push(`approved interdit dans la proposition: ${row.collector_id}`);
  }
  for (const row of editorial) {
    if (row.status === "published") errors.push(`publication éditoriale interdite dans la proposition: ${row.tool_id}|${row.lang}`);
    if (!/^sha256:[0-9a-f]{64}$/.test(row.content_hash ?? "")) errors.push(`hash éditorial invalide: ${row.tool_id}|${row.lang}`);
  }
  return { ok: errors.length === 0, errors };
}
