#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const slugs = argv.filter((arg) => !arg.startsWith("--"));
if (!slugs.length || slugs.some((slug) => !/^[a-z0-9][a-z0-9-]*$/.test(slug))) {
  throw new Error("usage: node scripts/catalog-register-identities.mjs [--apply] <slug...>");
}

const envFile = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
if (!existsSync(envFile)) throw new Error(`env absent: ${envFile}`);
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const manifest = JSON.parse(readFileSync("docs/tool-catalog-migration/contract-v3/manifest-1126.json", "utf8"));
for (const slug of slugs) if (!manifest.slugs.includes(slug)) throw new Error(`${slug}: absent du manifeste local explicite`);

const { default: postgres } = await import("postgres");
const ref = process.env.VITE_SUPABASE_PROJECT_ID;
const sql = postgres({
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  username: `postgres.${ref}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: "require",
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5,
});

class Rollback extends Error {}
let result;
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:published-manifest-extension'))`;
    const before = await tx`select count(*)::int count from catalog_private.published_manifest`;
    const tools = await tx`select id,slug,content_status from public.tools where slug in ${sql(slugs)} order by slug`;
    if (tools.length !== slugs.length) throw new Error(`identités publiques incomplètes: ${tools.length}/${slugs.length}`);
    for (const slug of slugs) {
      await tx`insert into catalog_private.published_manifest(slug,source_commit,slug_set_sha256)
        values (${slug},${manifest.gitCommit},${manifest.slugListSha256}) on conflict (slug) do nothing`;
    }
    await tx`update public.tools set content_status='published',published_at=coalesce(published_at,clock_timestamp()),updated_at=clock_timestamp()
      where slug in ${sql(slugs)}`;
    const after = await tx`select count(*)::int count from catalog_private.published_manifest`;
    const published = await tx`select slug,content_status from public.tools where slug in ${sql(slugs)} order by slug`;
    if (published.some((row) => row.content_status !== "published")) throw new Error("publication des identités incomplète");
    result = { mode: apply ? "APPLY" : "DRY_RUN", before: before[0].count, after: after[0].count, tools: published };
    if (!apply) throw new Rollback("dry-run rollback");
  });
} catch (error) {
  if (!(error instanceof Rollback)) throw error;
}
await sql.end();
console.log(JSON.stringify(result, null, 2));
