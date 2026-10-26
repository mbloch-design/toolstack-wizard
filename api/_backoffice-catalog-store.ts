import { redisCommand } from "./_submission-store.js";
import {
  catalogError,
  catalogHash,
  type CatalogDraft,
} from "./_backoffice-catalog-contract.js";
import { validateCatalogTool } from "../src/lib/backofficeCatalog.js";
export const CATALOG_HASH = "tt:catalog-editor:v1";
export type CatalogSnapshot = {
  revision: number;
  drafts: CatalogDraft[];
};
function decodeDraft(raw: string): CatalogDraft {
  const row = JSON.parse(raw) as {
    version: number;
    data: CatalogDraft;
  };
  if (!row.data || !Number.isSafeInteger(row.version) || row.version < 1)
    throw catalogError();
  return { ...row.data, version: row.version };
}
export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  try {
    const raw = await redisCommand(["HGETALL", CATALOG_HASH]);
    if (!Array.isArray(raw) || raw.length % 2) throw new Error();
    let revision = 0;
    const drafts: CatalogDraft[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const key = raw[i],
        value = raw[i + 1];
      if (key === "revision") {
        revision = Number(value);
        continue;
      }
      if (
        typeof key !== "string" ||
        !key.startsWith("draft:") ||
        typeof value !== "string"
      )
        throw new Error();
      const d = decodeDraft(value);
      if (
        key !== `draft:${d.slug}` ||
        !Number.isSafeInteger(d.version) ||
        d.version < 1 ||
        typeof d.updatedAt !== "string" ||
        !Number.isFinite(Date.parse(d.updatedAt)) ||
        catalogHash(d.base) !== d.baseHash
      )
        throw new Error();
      validateCatalogTool(d.base, d.value);
      drafts.push(d);
    }
    if (
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      drafts.length > 100 ||
      drafts.some((d) => d.version > revision)
    )
      throw new Error();
    return { revision, drafts };
  } catch {
    throw catalogError();
  }
}
/** Per-record CAS and monotonic global version avoid stale tabs and delete/recreate ABA. */
export const MUTATE_CATALOG_SCRIPT = `
local key='draft:'..ARGV[1]
local raw=redis.call('HGET',KEYS[1],key)
local current=0
if raw then current=cjson.decode(raw).version end
if current~=tonumber(ARGV[2]) then return {'conflict'} end
if ARGV[3]=='delete' then
 if raw then redis.call('HDEL',KEYS[1],key);redis.call('HINCRBY',KEYS[1],'revision',1) end
 return {'ok'}
end
if not raw and redis.call('HLEN',KEYS[1])-(redis.call('HEXISTS',KEYS[1],'revision'))>=100 then return {'limit'} end
local incoming=cjson.decode(ARGV[3])
if raw and cjson.decode(raw).data.baseHash~=incoming.baseHash then return {'conflict'} end
local revision=redis.call('HINCRBY',KEYS[1],'revision',1)
local encoded='{"version":'..revision..',"data":'..ARGV[3]..'}'
redis.call('HSET',KEYS[1],key,encoded)
return {'saved',encoded}
`;
async function mutate(
  slug: string,
  version: number,
  value: string,
): Promise<unknown[]> {
  let r: unknown;
  try {
    r = await redisCommand([
      "EVAL",
      MUTATE_CATALOG_SCRIPT,
      1,
      CATALOG_HASH,
      slug,
      version,
      value,
    ]);
  } catch {
    throw catalogError();
  }
  if (!Array.isArray(r)) throw catalogError();
  if (r[0] === "conflict") throw catalogError(409, "CATALOG_DRAFT_CONFLICT");
  if (r[0] === "limit") throw catalogError(409, "CATALOG_DRAFT_LIMIT");
  return r;
}
export async function saveCatalogDraft(
  draft: CatalogDraft,
  expectedVersion: number,
): Promise<CatalogDraft> {
  const r = await mutate(draft.slug, expectedVersion, JSON.stringify(draft));
  if (r[0] !== "saved" || typeof r[1] !== "string") throw catalogError();
  return decodeDraft(r[1]);
}
export async function deleteCatalogDraft(
  slug: string,
  version: number,
): Promise<void> {
  const r = await mutate(slug, version, "delete");
  if (r[0] !== "ok") throw catalogError();
}
export const CLEANUP_CATALOG_SCRIPT = `
local drafts=cjson.decode(ARGV[1])
local removed=0
for _,d in ipairs(drafts) do
 local key='draft:'..d.slug
 local raw=redis.call('HGET',KEYS[1],key)
 if raw and cjson.decode(raw).version==d.version then redis.call('HDEL',KEYS[1],key);removed=removed+1 end
end
if removed>0 then redis.call('HINCRBY',KEYS[1],'revision',1) end
return removed
`;
export async function cleanupCatalogDrafts(
  drafts: CatalogDraft[],
): Promise<void> {
  const r = await redisCommand([
    "EVAL",
    CLEANUP_CATALOG_SCRIPT,
    1,
    CATALOG_HASH,
    JSON.stringify(drafts.map((d) => ({ slug: d.slug, version: d.version }))),
  ]);
  if (typeof r !== "number") throw catalogError();
}
