#!/usr/bin/env node
/**
 * research-attest — ACTE DE REVUE HUMAINE, distinct du collecteur. v0.3.3.1
 *
 * ⚠️ DRY-RUN STRICT PAR DÉFAUT : aucune écriture sans `--apply` explicite.
 *    (Correctif de gouvernance : une invocation de test a écrit une attestation
 *     sur le dossier réel — cf. review_events[type=accidental_test_attestation_removed].)
 *
 * Le collecteur ne produit QUE `candidate`/`observed` : il ne peut jamais établir
 * `market_context`. Attester est une décision humaine, datée, attribuée, rattachée
 * à une attestation de contexte IMMUABLE **et à une version de contenu précise**.
 *
 * Garde-fous v0.3.2 :
 *  - décisions SUPPORTÉES uniquement (liste blanche explicite) ;
 *  - le faisceau exigé par la décision est VÉRIFIÉ automatiquement dans la basis ;
 *  - l'attestation porte `applies_to_capture_ref` + `content_hash` exact de la
 *    capture pricing : elle ne s'applique JAMAIS à une future version de contenu ;
 *  - doublon (même reviewer + même capture + même valeur) => no-op ;
 *  - l'acte est refusé tant que les observations n'ont pas leur traçabilité
 *    (plan_key, capture_ref, source_url, content_hash, observed_on) ;
 *  - n'écrit QUE research/tool-pages/<slug>.json (append-only). Jamais de DB,
 *    jamais de `approved` de prix : la donnée brute collectée n'est pas mutée.
 *
 * Usage :
 *   node scripts/research-attest.mjs --slug=wix --attest=market_context \
 *     --value=reference_fr --basis=<attestation_id> --by="Prénom Nom" [--note="…"]
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { attestationReadiness, captureIdOf, approvedPreEligibility } from "./research-model.mjs";

const ROOT = process.cwd();
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
export const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
  : v;

function assertWritable(p) {
  const abs = path.resolve(p);
  const wl = path.join(ROOT, "research", "tool-pages");
  if (!abs.startsWith(wl + path.sep)) throw new Error(`WRITE DENIED: ${abs}`);
  return abs;
}

/* ───────────────── décisions SUPPORTÉES (liste blanche stricte) ──────────────── */
/**
 * Chaque décision déclare le faisceau qu'elle exige. Rien n'est laissé à
 * l'appréciation de l'appelant : le contrôle est automatique sur la basis.
 * Décision métier validée : ce faisceau est RECEVABLE pour une attestation
 * humaine `reference_fr` ; il n'autorise jamais une promotion automatique.
 */
export const SUPPORTED_DECISIONS = {
  market_context: {
    reference_fr: {
      label: "Marché de référence FR/fr-FR attesté par faisceau de contexte",
      verify(ctx) {
        const fails = [];
        if (ctx.egress_country !== "FR") fails.push(`egress_country=${ctx.egress_country ?? "null"} (attendu FR)`);
        if (ctx.egress_measured_from !== "playwright_context")
          fails.push(`egress_measured_from=${ctx.egress_measured_from ?? "null"} (attendu playwright_context)`);
        if (ctx.locale_requested !== "fr-FR") fails.push(`locale_requested=${ctx.locale_requested ?? "null"} (attendu fr-FR)`);
        if (!/^fr-FR$/i.test(ctx.navigator_language ?? "")) fails.push(`navigator_language=${ctx.navigator_language ?? "null"} (attendu fr-FR)`);
        if (!/^fr-FR$/i.test(ctx.resolved_locale ?? "")) fails.push(`resolved_locale=${ctx.resolved_locale ?? "null"} (attendu fr-FR)`);
        if (ctx.timezone !== "Europe/Paris") fails.push(`timezone=${ctx.timezone ?? "null"} (attendu Europe/Paris)`);
        const markers = ctx.visible_markers ?? [];
        const symbols = ctx.currency_symbols_seen ?? [];
        if (!symbols.includes("€") && !markers.includes("€")) fails.push("aucun marqueur EUR (€) observé");
        if (!markers.includes("TVA")) fails.push("aucun marqueur TVA observé");
        if (symbols.some((x) => x !== "€")) fails.push(`devises incohérentes: ${JSON.stringify(symbols)} (EUR attendu seul)`);
        return { ok: fails.length === 0, fails };
      },
    },
  },
};

/**
 * Empreinte sémantique STABLE et reproductible : ne dépend PAS de l'horodatage.
 * Fondée sur (attests, value, basis, capture_ref, content_hash, attested_by).
 * Contrairement à `review_attestation_id` (qui inclut `attested_at`), cette
 * empreinte identifie l'ACTE, pas son instant : deux --apply portant la même
 * empreinte active désignent le même acte => no-op. Sert d'ancre d'audit et de
 * clé anti-doublon ; l'ID horodaté reste l'identifiant d'archive de la ligne écrite.
 */
export function semanticFingerprint({ attest, value, basis, applies_to_capture_ref, content_hash, by }) {
  const core = {
    attests: attest, value,
    basis_attestation_id: basis,
    applies_to_capture_ref, content_hash,
    attested_by: by,
  };
  return "sfp:" + sha256(JSON.stringify(sortKeys(core)));
}

/** Empreinte sémantique d'une attestation déjà écrite (pas de champ requis). */
export const fingerprintOf = (a) => semanticFingerprint({
  attest: a.attests, value: a.value, basis: a.basis_attestation_id,
  applies_to_capture_ref: a.applies_to_capture_ref, content_hash: a.content_hash, by: a.attested_by,
});

export function buildReviewAttestation({ slug, attest, value, basis, applies_to_capture_ref, content_hash, source_url, by, note, at }) {
  const body = {
    schema: "review_attestation/2",
    act: "human_review_attestation",
    slug, attests: attest, value,
    basis_attestation_id: basis,
    applies_to_capture_ref,        // portée STRICTE : cette capture
    content_hash,                  // ... et cette version de contenu exacte
    source_url,
    attested_by: by, attested_at: at, note: note ?? null,
    scope_note: "Ne s'applique qu'à cette version de contenu. Toute nouvelle capture exige une nouvelle attestation.",
  };
  return {
    review_attestation_id: "sha256:" + sha256(JSON.stringify(sortKeys(body))),
    semantic_fingerprint: semanticFingerprint({ attest, value, basis, applies_to_capture_ref, content_hash, by }),
    ...body,
  };
}

/** Doublon = même empreinte sémantique active (attests+value+basis+capture+content+reviewer). */
export function findDuplicate(existing = [], fingerprint) {
  return existing.find((a) => a && !a.revoked_at && a.active !== false && fingerprintOf(a) === fingerprint) ?? null;
}

/* ─────────────────────────────────── CLI ─────────────────────────────────────── */
async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("="); return [k, v === undefined ? true : v];
  }));
  const { slug, attest, value, basis, by, note } = args;
  if (!slug || !attest || !value || !basis || !by) {
    console.error('Requis : --slug --attest --value --basis=<attestation_id> --by="Nom"');
    console.error("`--by` est obligatoire : une attestation doit être ATTRIBUABLE à une personne.");
    process.exit(1);
  }
  // 1) décision supportée ?
  const decision = SUPPORTED_DECISIONS[String(attest)]?.[String(value)];
  if (!decision) {
    console.error(`REFUSÉ — décision non supportée : ${attest}=${value}`);
    console.error("Supportées : " + Object.entries(SUPPORTED_DECISIONS)
      .flatMap(([k, vs]) => Object.keys(vs).map((v) => `${k}=${v}`)).join(", "));
    process.exit(2);
  }
  const p = path.join(ROOT, "research", "tool-pages", `${slug}.json`);
  if (!existsSync(p)) { console.error(`dossier introuvable: ${p}`); process.exit(1); }
  const doc = JSON.parse(await readFile(p, "utf8"));

  // 2) basis connue ?
  const ctx = (doc.collector?.context_attestations ?? []).find((a) => a.attestation_id === basis);
  if (!ctx) {
    console.error(`REFUSÉ — --basis inconnu pour ${slug}. Attestations disponibles :`);
    for (const a of doc.collector?.context_attestations ?? []) console.error(`  ${a.attestation_id}  (${a.accessed_at})`);
    process.exit(2);
  }

  // 3) v0.3.3.1 — la BASIS détermine la version ciblée (jamais obs[0]).
  const target_capture_ref = captureIdOf(ctx.source_url, ctx.content_hash);
  const all = doc.collector?.observations ?? [];
  const scoped = all.filter((o) => o.capture_ref === target_capture_ref && o.content_hash === ctx.content_hash);
  if (!scoped.length) {
    console.error("REFUSÉ — aucune observation ne porte la capture visée par la basis.");
    console.error(`  basis.source_url   = ${ctx.source_url}`);
    console.error(`  basis.content_hash = ${ctx.content_hash}`);
    console.error(`  capture visée      = ${target_capture_ref}`);
    console.error(`  (${all.length} observation(s) au dossier, aucune sur cette version)`);
    process.exit(3);
  }
  const sources = [...new Set(scoped.map((o) => o.source_url))];
  if (sources.length > 1) {
    console.error("REFUSÉ — plusieurs sources ambiguës portent cette capture :");
    for (const u of sources) console.error(`  ${u}`);
    process.exit(3);
  }
  // traçabilité minimale AVANT de solliciter l'acte humain
  const notReady = scoped.map((o) => ({ plan_key: o.plan_key, ...attestationReadiness(o) })).filter((x) => !x.ready);
  if (notReady.length) {
    console.error("REFUSÉ — les observations ne portent pas leur traçabilité minimale ; l'acte humain est prématuré.");
    for (const n of notReady) console.error(`  ${n.plan_key ?? "(sans plan_key)"} -> manquant: ${n.missing.join(", ")}`);
    process.exit(3);
  }

  // 4) faisceau vérifié AUTOMATIQUEMENT dans la basis
  const v = decision.verify(ctx);
  if (!v.ok) {
    console.error(`REFUSÉ — le faisceau exigé par ${attest}=${value} n'est pas satisfait par la basis :`);
    for (const f of v.fails) console.error(`  ✗ ${f}`);
    process.exit(4);
  }

  // 5) portée : la capture visée par la BASIS (jamais une future version)
  const applies_to_capture_ref = target_capture_ref;
  const content_hash = ctx.content_hash;

  // 6) doublon => no-op (empreinte sémantique stable, hors horodatage)
  const fingerprint = semanticFingerprint({ attest: String(attest), value: String(value), basis,
    applies_to_capture_ref, content_hash, by: String(by) });
  const dup = findDuplicate(doc.review_attestations ?? [], fingerprint);
  if (dup) {
    console.log(JSON.stringify({ noop: true, reason: "duplicate_attestation",
      detail: "Même empreinte sémantique active (attests, value, basis, capture, content, reviewer) : rien n'est ajouté.",
      semantic_fingerprint: fingerprint,
      existing: dup.review_attestation_id, attested_at: dup.attested_at, applied: false }, null, 2));
    process.exit(0);
  }

  const ra = buildReviewAttestation({ slug, attest: String(attest), value: String(value), basis,
    applies_to_capture_ref, content_hash, source_url: sources[0],
    by: String(by), note: note ? String(note) : null, at: new Date().toISOString() });

  const mapping = null;
  const gateBefore = scoped.map((o) => ({ plan_key: o.plan_key, ...approvedPreEligibility(o, doc, { mapping }) }));
  const preview = { ...doc, review_attestations: [...(doc.review_attestations ?? []), ra] };
  const gateAfter = scoped.map((o) => ({ plan_key: o.plan_key, ...approvedPreEligibility(o, preview, { mapping }) }));

  // ── DRY-RUN STRICT : par défaut, on n'écrit RIEN.
  if (!args.apply) {
    // L'ID horodaté N'EST PAS promis : il sera recalculé à l'--apply (attested_at change).
    // Seule l'empreinte sémantique est stable et vérifiable après écriture.
    const { review_attestation_id: _nonReproducibleId, attested_at: _previewAt, ...attestationPreview } = ra;
    console.log(JSON.stringify({
      mode: "DRY-RUN (aucune écriture)", applied: false,
      hint: "Ajouter --apply pour écrire réellement l'attestation.",
      attestation_identity: {
        semantic_fingerprint: fingerprint,
        note: "Empreinte STABLE fondée sur attests, value, basis, capture_ref, content_hash, attested_by. "
            + "Le review_attestation_id final inclut attested_at : il est horodaté, recalculé à l'écriture et NON reproductible depuis le dry-run. "
            + "Utiliser l'empreinte sémantique pour l'audit et l'anti-doublon ; un --apply portant la même empreinte active est un no-op.",
      },
      attestation_preview: attestationPreview,   // sans l'ID horodaté ni attested_at (non promis)
      targeted_capture: { capture_ref: applies_to_capture_ref, content_hash, source_url: sources[0] },
      scoped_observations: scoped.map((o) => ({ plan_key: o.plan_key, plan_name_localized: o.plan_name_localized,
                                                native_amount: o.native_amount, native_currency: o.native_currency })),
      verified_bundle: { egress_country: ctx.egress_country, egress_measured_from: ctx.egress_measured_from,
        locale_requested: ctx.locale_requested, navigator_language: ctx.navigator_language,
        resolved_locale: ctx.resolved_locale, timezone: ctx.timezone,
        visible_markers: ctx.visible_markers, currency_symbols_seen: ctx.currency_symbols_seen },
      gate_expected: gateAfter.map((g) => ({ plan_key: g.plan_key, eligible: g.eligible, blockers: g.blockers,
                                             effective_market_context: g.effective_market_context })),
      planned_diff: {
        "review_attestations": `+1 (${(doc.review_attestations ?? []).length} -> ${(doc.review_attestations ?? []).length + 1})`,
        gate_transition: gateBefore.map((b, i) => `${b.plan_key}: eligible ${b.eligible} -> ${gateAfter[i].eligible}`),
        raw_data_mutated: false,
      },
    }, null, 2));
    process.exit(0);
  }

  doc.review_attestations = [...(doc.review_attestations ?? []), ra];   // append-only, donnée brute intacte
  await writeFile(assertWritable(p), JSON.stringify(sortKeys(doc), null, 2) + "\n");
  const gateEffective = scoped.map((o) => ({ plan_key: o.plan_key, ...approvedPreEligibility(o, doc, { mapping }) }));
  console.log(JSON.stringify({ applied: true, written: p, review_attestation: ra,
    scoped_observations: scoped.map((o) => ({ plan_key: o.plan_key, native_amount: o.native_amount })),
    gate_effective: gateEffective.map((g) => ({ plan_key: g.plan_key, eligible: g.eligible, blockers: g.blockers,
                                                effective_market_context: g.effective_market_context })),
    verified_bundle: {
    egress_country: ctx.egress_country, egress_measured_from: ctx.egress_measured_from,
    locale_requested: ctx.locale_requested, navigator_language: ctx.navigator_language,
    resolved_locale: ctx.resolved_locale, timezone: ctx.timezone,
    visible_markers: ctx.visible_markers, currency_symbols_seen: ctx.currency_symbols_seen,
  } }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
