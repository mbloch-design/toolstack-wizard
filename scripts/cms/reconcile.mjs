import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { stableStringify } from "../catalog/stable-json.mjs";

const fingerprint = (value) => value == null ? null
  : createHash("sha256").update(stableStringify(value)).digest("hex");
const identity = ({ id, slug }) => ({ id, slug });

function groupBy(records, field) {
  const groups = new Map();
  for (const record of records) {
    const value = record[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Missing or invalid catalogue ${field}`);
    }
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record);
  }
  return groups;
}

function collisions(groups) {
  return [...groups].filter(([, rows]) => rows.length > 1)
    .map(([value, rows]) => ({ value, records: rows.map(identity) }));
}

export function reconcileCatalog({
  publishedJson, archives = null, dbSnapshot = null, redisDrafts = null, overrides = null,
}) {
  const catalog = [...publishedJson, ...(archives ?? [])];
  const catalogIds = groupBy(catalog, "id");
  const catalogSlugs = groupBy(catalog, "slug");
  const dbIds = groupBy(dbSnapshot ?? [], "id");
  const dbSlugs = groupBy(dbSnapshot ?? [], "slug");
  const publishedIds = new Set(publishedJson.map(({ id }) => id));
  const publishedSlugs = new Set(publishedJson.map(({ slug }) => slug));
  const identities = [];
  const crossSource = [];
  const fieldConflicts = [];
  const jsonOnly = [];

  for (const record of publishedJson) {
    if (dbSnapshot === null) break;
    const candidates = new Set([...(dbIds.get(record.id) ?? []), ...(dbSlugs.get(record.slug) ?? [])]);
    if (!candidates.size) jsonOnly.push(identity(record));
    for (const candidate of candidates) {
      if (record.id !== candidate.id || record.slug !== candidate.slug) {
        crossSource.push({ published: identity(record), database: identity(candidate) });
        continue;
      }
      if (candidates.size !== 1 || catalogIds.get(record.id).length !== 1
        || catalogSlugs.get(record.slug).length !== 1) continue;
      identities.push(identity(record));
      if (candidate.projection) {
        const fields = [...new Set([...Object.keys(record), ...Object.keys(candidate.projection)])]
          .filter((key) => Object.hasOwn(record, key) !== Object.hasOwn(candidate.projection, key)
            || fingerprint(record[key]) !== fingerprint(candidate.projection[key]))
          .sort();
        if (fields.length) fieldConflicts.push({ ...identity(record), fields });
      }
    }
  }

  return {
    identities,
    identityConflicts: {
      catalogId: collisions(catalogIds), catalogSlug: collisions(catalogSlugs),
      databaseId: collisions(dbIds), databaseSlug: collisions(dbSlugs), crossSource,
    },
    fieldConflicts,
    coverage: {
      published: publishedJson.length, archived: archives?.length ?? null,
      database: dbSnapshot?.length ?? null,
      projected: dbSnapshot?.filter(({ projection }) => projection != null).length ?? null,
    },
    missingRecords: dbSnapshot === null ? null : {
      jsonOnly,
      dbOnly: dbSnapshot.filter(({ id, slug }) => !publishedIds.has(id) && !publishedSlugs.has(slug))
        .map(identity),
    },
    unpublishedDrafts: redisDrafts === null ? null : {
      revision: redisDrafts.revision,
      drafts: redisDrafts.drafts.map(({ slug, version }) => ({ slug, version })),
    },
    sourceHashes: Object.fromEntries(Object.entries({
      publishedJson, archives, dbSnapshot, redisDrafts, overrides,
    }).map(([name, source]) => [name, fingerprint(source)])),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({
    options: {
      published: { type: "string", default: "src/data/tools_v4.json" },
      archives: { type: "string" },
      database: { type: "string" },
      drafts: { type: "string" },
      overrides: { type: "string" },
    },
  });
  const read = (file) => file ? JSON.parse(readFileSync(file, "utf8")) : null;
  const report = reconcileCatalog({
    publishedJson: read(values.published),
    archives: read(values.archives),
    dbSnapshot: read(values.database),
    redisDrafts: read(values.drafts),
    overrides: read(values.overrides),
  });
  console.log(JSON.stringify(report, null, 2));
}
