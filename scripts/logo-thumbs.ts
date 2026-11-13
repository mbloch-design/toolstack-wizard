/**
 * Tool logos, self-hosted (13/11/2026). Each catalogue logo was found in the browser by walking a chain of outside
 * sources (official URL, SimpleIcons probes, Google and DuckDuckGo favicons): up to four requests per logo to a
 * dozen hosts, 79 dead attempts on a single load of /fr/tools. This walks the same chain once, here, keeps the
 * first file that answers (SVG as is, raster as a 128 px WebP), and serves them all from Cloudflare R2 next to the
 * card thumbnails.
 *
 *   npx tsx scripts/logo-thumbs.ts build    resolve + fetch what changed into .cache/logo-thumbs/  (LOGOS_LIMIT=20 to try)
 *   npx tsx scripts/logo-thumbs.ts upload   send new files to R2 under logos/, then write src/data/logoThumbs.json
 *
 * upload needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET; the site reads them from
 * VITE_CARD_THUMBS_BASE (same bucket). Logos the site already serves itself (/home-logos, inline badges) are skipped.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";
import { getToolLogoSources } from "../src/lib/toolLogos";

const ROOT = new URL("..", import.meta.url).pathname;
const CACHE = join(ROOT, ".cache/logo-thumbs");
const STATE = join(CACHE, "state.json");
const MANIFEST = join(ROOT, "src/data/logoThumbs.json");
const SIZE = 128;
const CONCURRENCY = 8;

type Entry = { source: string; file: string; uploaded?: boolean };
type State = Record<string, Entry>;
type Tool = { id: string; slug?: string; name: string; websiteUrl?: string; affiliateLink?: string; logo?: string };

const readJson = <T,>(path: string, fallback: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as T : fallback);

function catalogue(): Tool[] {
  const data = readJson<{ tools?: Tool[] } | Tool[]>(join(ROOT, "src/data/tools_v4.json"), []);
  return Array.isArray(data) ? data : data.tools ?? [];
}

async function pool<T>(items: T[], run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < items.length) await run(items[next++]); }));
}

/** The first remote source that answers with a real image, as the browser chain would have found it. */
async function resolve(sources: string[]): Promise<{ source: string; bytes: Buffer; ext: "svg" | "webp" } | null> {
  for (const source of sources) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "ToolTrim logos" } });
      if (!response.ok) continue;
      const raw = Buffer.from(await response.arrayBuffer());
      const type = response.headers.get("content-type") || "";
      if (type.includes("svg") || raw.subarray(0, 200).toString().includes("<svg")) return { source, bytes: raw, ext: "svg" };
      const meta = await sharp(raw).metadata();
      if (!meta.width || meta.width < 16) continue;
      const bytes = await sharp(raw).resize({ width: SIZE, height: SIZE, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
      return { source, bytes, ext: "webp" };
    } catch {
      // Dead, blocked or not an image: the next source, as the browser would.
    }
  }
  return null;
}

async function build() {
  mkdirSync(CACHE, { recursive: true });
  const state = readJson<State>(STATE, {});
  const tools = catalogue().map((tool) => {
    const sources = getToolLogoSources(tool, SIZE);
    // Already same-origin or inline: nothing to gain.
    const remote = sources[0]?.startsWith("http") ? sources.filter((s) => s.startsWith("http")) : [];
    return { slug: tool.slug || tool.id, remote };
  }).filter((t) => t.remote.length);
  const limit = Number(process.env.LOGOS_LIMIT) || Infinity;
  const todo = tools.filter(({ slug }) => !state[slug] || !existsSync(join(CACHE, state[slug].file))).slice(0, limit);
  let done = 0; const failed: string[] = [];
  await pool(todo, async ({ slug, remote }) => {
    const found = await resolve(remote);
    if (found) {
      const file = `${slug}-${createHash("sha1").update(found.bytes).digest("hex").slice(0, 10)}.${found.ext}`;
      writeFileSync(join(CACHE, file), found.bytes);
      state[slug] = { source: found.source, file };
    } else failed.push(slug);
    if (++done % 100 === 0) console.log(`  ${done}/${todo.length}`);
  });
  for (const slug of Object.keys(state)) if (!tools.some((t) => t.slug === slug)) delete state[slug];
  writeFileSync(STATE, JSON.stringify(state, null, 1));
  console.log(`Logos : ${tools.length} outils à logo distant, ${todo.length} résolus, ${failed.length} sans source valide (gardent leurs initiales).`);
}

async function upload() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY et R2_BUCKET sont requis.");
  }
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  const state = readJson<State>(STATE, {});
  const pending = Object.values(state).filter((entry) => !entry.uploaded);
  let sent = 0;
  await pool(pending, async (entry) => {
    const response = await client.fetch(`${endpoint}/logos/${entry.file}`, {
      method: "PUT",
      body: readFileSync(join(CACHE, entry.file)),
      // The name carries the content's hash: a logo never changes under its name.
      headers: { "content-type": entry.file.endsWith(".svg") ? "image/svg+xml" : "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
    if (!response.ok) throw new Error(`${entry.file}: HTTP ${response.status} ${await response.text()}`);
    entry.uploaded = true;
    if (++sent % 100 === 0) console.log(`  ${sent}/${pending.length}`);
  });
  writeFileSync(STATE, JSON.stringify(state, null, 1));
  const manifest = Object.fromEntries(Object.entries(state).filter(([, e]) => e.uploaded).map(([slug, e]) => [slug, e.file]).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`R2 : ${sent} logos envoyés ; ${Object.keys(manifest).length} au manifeste.`);
}

const command = process.argv[2];
if (command === "build") await build();
else if (command === "upload") await upload();
else { console.log("Usage : npx tsx scripts/logo-thumbs.ts build | upload"); process.exit(1); }
