// Sérialisation JSON DÉTERMINISTE (clés triées récursivement) — garantit "même input => même sortie"
// pour les work orders, matrices et rapports compacts. Aucun timestamp/aléa injecté ici.
export function stableStringify(value) {
  return JSON.stringify(sortDeep(value), null, 2) + "\n";
}
export function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortDeep(v[k])]));
  }
  return v;
}
