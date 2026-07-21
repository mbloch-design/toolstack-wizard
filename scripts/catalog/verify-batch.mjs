// Phase K — invariants du catalogue canonique. Filet de sécurité exécuté après chaque apply
// autonome : garantit qu'aucun apply n'a corrompu la cardinalité, la projection, ni touché un
// outil hors lot, et que catalog_private reste inaccessible à anon/authenticated.
const A = (c, m) => { if (!c) throw new Error(m); };

/**
 * Vérifie les invariants globaux. `expected` peut porter :
 *   - canonicalCount / canonicalIds : ensemble canonical attendu (sinon non vérifié)
 *   - untouched : { fingerprint } empreinte (id:data_contract) des outils hors lot avant apply
 * Retourne un rapport ; lève à la première violation.
 */
export async function verifyCatalogInvariants(sql, expected = {}) {
  const report = {};
  const [tools] = await sql`select count(*)::int n from public.tools`;
  A(tools.n === 1126, `cardinalité public.tools = ${tools.n} (attendu 1126)`);
  report.tools = tools.n;

  const [proj] = await sql`select count(*)::int n from catalog_api.published_tool_projection`;
  A(proj.n === 2252, `projection = ${proj.n} lignes (attendu 2252)`);
  report.projection = proj.n;

  // Exactement 2 lignes localisées (fr,en) par outil publié dans la projection.
  const [dup] = await sql`select count(*)::int n from (
    select tool_id, count(*) c from catalog_api.published_tool_projection group by tool_id having count(*) <> 2) x`;
  A(dup.n === 0, `${dup.n} outils sans exactement 2 lignes (fr,en) en projection`);
  const [langs] = await sql`select count(*)::int n from (
    select tool_id, lang, count(*) c from catalog_api.published_tool_projection group by tool_id,lang having count(*) <> 1) x`;
  A(langs.n === 0, `${langs.n} doublons (outil,langue) en projection`);

  const [canon] = await sql`select count(*)::int n, array_agg(id order by id) ids
    from public.tools where data_contract='canonical'`;
  report.canonical = { count: canon.n, ids: canon.ids };
  if (expected.canonicalCount != null) A(canon.n === expected.canonicalCount,
    `canonical_count = ${canon.n} (attendu ${expected.canonicalCount})`);
  if (expected.canonicalIds) A(JSON.stringify(canon.ids) === JSON.stringify([...expected.canonicalIds].sort()),
    `ensemble canonical inattendu: ${JSON.stringify(canon.ids)}`);

  // Aucun outil hors lot modifié (empreinte id:data_contract).
  if (expected.untouched?.fingerprint != null) {
    const ids = expected.untouched.batch ?? [];
    const [fp] = await sql`select md5(coalesce(string_agg(id||':'||data_contract, ',' order by id), '')) fp
      from public.tools where id <> all(${sql.array(ids)})`;
    A(fp.fp === expected.untouched.fingerprint, "un outil hors lot a été modifié (empreinte divergente)");
  }

  // catalog_private inaccessible à anon/authenticated ; projection accessible.
  const [roles] = await sql`select
    has_table_privilege('anon','catalog_private.tool_price_observations','select')=false a1,
    has_table_privilege('authenticated','catalog_private.tool_editorial_content','select')=false a2,
    has_schema_privilege('anon','catalog_private','usage')=false a3,
    has_table_privilege('anon','catalog_api.published_tool_projection','select') a4,
    has_table_privilege('authenticated','catalog_api.published_tool_projection','select') a5`;
  A(roles.a1 && roles.a2 && roles.a3, "catalog_private accessible à anon/authenticated (interdit)");
  A(roles.a4 && roles.a5, "projection non accessible à anon/authenticated");
  report.roles_ok = true;
  return report;
}

/** Empreinte des outils hors d'un lot (à capturer AVANT apply pour la comparaison post-apply). */
export async function untouchedFingerprint(sql, batchIds) {
  const [fp] = await sql`select md5(coalesce(string_agg(id||':'||data_contract, ',' order by id), '')) fp
    from public.tools where id <> all(${sql.array(batchIds)})`;
  return { batch: batchIds, fingerprint: fp.fp };
}
