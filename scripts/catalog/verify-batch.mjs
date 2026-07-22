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
    const now = await untouchedFingerprint(sql, expected.untouched.batch ?? []);
    A(now.fingerprint === expected.untouched.fingerprint, "un outil hors lot a été modifié (empreinte divergente sur tools/plans/prix/contenus/relations/localisations)");
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

/**
 * Empreinte DÉTERMINISTE des outils hors d'un lot, sur TOUTES les surfaces consommées par la
 * projection : public.tools (identité/lifecycle), plans, observations/prix, contenus éditoriaux,
 * relations, localisations. Une mutation hors lot sur l'une d'elles change l'empreinte.
 * Une seule requête, agrégats ordonnés (coût raisonnable).
 */
export async function untouchedFingerprint(sql, batchIds) {
  const ids = batchIds;
  const [r] = await sql`select md5(concat_ws('|',
    coalesce((select string_agg(id||':'||data_contract||':'||content_status||':'||research_status, ',' order by id)
      from public.tools where id <> all(${ids}::text[])), ''),
    coalesce((select md5(string_agg(p.tool_id||'/'||p.plan_key||'/'||p.is_free||'/'||p.is_compare_plan||'/'||coalesce(p.pricing_unit,''), ',' order by p.tool_id, p.plan_key))
      from catalog_private.tool_plans p where p.tool_id <> all(${ids}::text[])), ''),
    coalesce((select md5(string_agg(pl.tool_id||'/'||o.review_status||'/'||coalesce(o.native_amount::text,'')||'/'||coalesce(o.native_currency,'')||'/'||coalesce(o.approval_event_id,''), ',' order by pl.tool_id, o.id))
      from catalog_private.tool_price_observations o join catalog_private.tool_plans pl on pl.id=o.plan_id where pl.tool_id <> all(${ids}::text[])), ''),
    coalesce((select md5(string_agg(e.tool_id||'/'||e.lang||'/'||e.status||'/'||coalesce(e.content_hash,''), ',' order by e.tool_id, e.lang))
      from catalog_private.tool_editorial_content e where e.tool_id <> all(${ids}::text[])), ''),
    coalesce((select md5(string_agg(rr.tool_id||'/'||rr.related_tool_id||'/'||rr.status, ',' order by rr.tool_id, rr.related_tool_id))
      from catalog_private.tool_relationships rr where rr.tool_id <> all(${ids}::text[])), ''),
    coalesce((select md5(string_agg(pl.tool_id||'/'||l.locale||'/'||l.status||'/'||coalesce(l.display_name,''), ',' order by pl.tool_id, l.locale, l.id))
      from catalog_private.tool_plan_localizations l join catalog_private.tool_plans pl on pl.id=l.plan_id where pl.tool_id <> all(${ids}::text[])), '')
  )) fp`;
  return { batch: batchIds, fingerprint: r.fp };
}
