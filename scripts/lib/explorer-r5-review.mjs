// Validate editorial evidence against the exact displayed candidates before
// calculating the gate. Human judgments remain inputs, never inferred scores.
export function summarizeExplorerReview(candidateRows, review) {
  const allowed = new Set(["credible", "partial", "unknown", "reject"]);
  const judgments = new Map();
  for (const result of review.results) {
    const key = `${result.source}:${result.target}`;
    if (judgments.has(key)) throw new Error(`duplicate judgment: ${key}`);
    if (!allowed.has(result.status)) throw new Error(`invalid status: ${key}`);
    if (typeof result.critical !== "boolean") throw new Error(`invalid critical flag: ${key}`);
    judgments.set(key, result);
  }
  const sources = new Set();
  const evaluated = [];
  for (const row of candidateRows) {
    if (sources.has(row.slug)) throw new Error(`duplicate source: ${row.slug}`);
    sources.add(row.slug);
    const targets = new Set();
    if (row.top.length > 10) throw new Error(`too many candidates: ${row.slug}`);
    row.top.forEach((candidate, index) => {
      if (targets.has(candidate.slug) || candidate.slug === row.slug) throw new Error(`duplicate or self target: ${row.slug}`);
      targets.add(candidate.slug);
      const key = `${row.slug}:${candidate.slug}`;
      const judgment = judgments.get(key);
      if (!judgment) throw new Error(`missing judgment: ${key}`);
      if (judgment.rank !== index + 1) throw new Error(`stale rank: ${key}`);
      if (judgment.direction !== candidate.direction) throw new Error(`stale direction: ${key}`);
      if (judgment.displayed_reason !== candidate.reason) throw new Error(`stale displayed reason: ${key}`);
      evaluated.push(judgment);
      judgments.delete(key);
    });
  }
  if (!sources.size) throw new Error("missing sources");
  if (judgments.size) throw new Error(`orphan judgments: ${[...judgments.keys()].join(", ")}`);
  const metrics = {};
  for (const limit of [4, 8, 10]) {
    const selected = evaluated.filter(result => result.rank <= limit);
    const by_status = { credible: 0, partial: 0, unknown: 0, reject: 0 };
    selected.forEach(result => by_status[result.status]++);
    const target_slots = sources.size * limit;
    metrics[`top${limit}`] = {
      target_slots, available: selected.length, missing: target_slots - selected.length,
      by_status, critical: selected.filter(result => result.critical).length,
      credible_over_available: selected.length ? by_status.credible / selected.length : 0,
      credible_slots_over_target: by_status.credible / target_slots,
    };
  }
  const attained = metrics.top8.credible_slots_over_target >= 0.8 && metrics.top4.critical === 0;
  return { sources: sources.size, metrics, quality_gate: attained ? "ATTAINED" : "NOT_ATTAINED" };
}
