import { buildExplorationCandidates, type ExplorationCandidate } from './toolExploration';

/** Discovery can include alternatives; every card must retain its actual catalogue reason. */
export function buildStackDiscovery(options: Parameters<typeof buildExplorationCandidates>[0]): ExplorationCandidate[] {
  const seen = new Set<string>();
  const candidates = buildExplorationCandidates({ ...options, relationPolicy: 'audited' }).filter(candidate => {
    if (seen.has(candidate.tool.id)) return false;
    seen.add(candidate.tool.id);
    return candidate.stackState === 'new' && !candidate.comparisonNeedsReview &&
      !!candidate.reasonFr && !!candidate.reasonEn && !candidate.reasonFr.startsWith('Rattaché à ');
  });

  const ordered: ExplorationCandidate[] = [];
  const counts = { family: new Map<string, number>(), source: new Map<string, number>(), direction: new Map<string, number>() };
  const family = (candidate: ExplorationCandidate) => candidate.tool.bundle_parent || candidate.tool.host_app || candidate.tool.id;
  // Prefer variety without inventing relationships or changing their evidence.
  while (candidates.length) {
    const penalty = (candidate: ExplorationCandidate) => (counts.family.get(family(candidate)) || 0) * 100 +
      (counts.source.get(candidate.relatedSource.id) || 0) * 20 + (counts.direction.get(candidate.direction) || 0) * 10;
    let best = 0;
    for (let index = 1; index < candidates.length; index++) if (penalty(candidates[index]) < penalty(candidates[best])) best = index;
    const [candidate] = candidates.splice(best, 1);
    ordered.push(candidate);
    for (const [map, key] of [[counts.family, family(candidate)], [counts.source, candidate.relatedSource.id], [counts.direction, candidate.direction]] as const) map.set(key, (map.get(key) || 0) + 1);
  }
  return ordered;
}
