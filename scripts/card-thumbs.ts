/**
 * Card thumbnails (12/11/2026). The catalogue cards showed each tool's screenshot at full size (up to 2 400 px)
 * from some forty outside sites: 165 requests and 1.6 MB on /fr/tools, some hosts over a second. This makes one
 * light thumbnail per tool (720 px wide, WebP) and serves them from Cloudflare R2 (no egress fees; Supabase is
 * kept out of it, its egress quota is what cut it in September).
 *
 *   npx tsx scripts/card-thumbs.ts build    download + resize what changed into .cache/card-thumbs/
 *                                           (THUMBS_LIMIT=20 for a trial run)
 *   npx tsx scripts/card-thumbs.ts upload   send new files to R2, then write src/data/cardThumbs.json
 *
 * upload needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in the environment. The site
 * reads the thumbnails from VITE_CARD_THUMBS_BASE (the bucket's public URL); without it, cards keep the original.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";
import { isToolCoverBlocked } from "../src/lib/toolImageBlocklist";

const ROOT = new URL("..", import.meta.url).pathname;
const CACHE = join(ROOT, ".cache/card-thumbs");
const STATE = join(CACHE, "state.json");
const MANIFEST = join(ROOT, "src/data/cardThumbs.json");
const WIDTH = 720;
const QUALITY = 72;
const CONCURRENCY = 8;

/** file: 720 px; its 360 px sibling is the same name with -360 (13/11/2026, for srcset and the card glow). */
type Entry = { source: string; file: string; uploaded?: boolean; small?: boolean; uploadedSmall?: boolean };
const SMALL = 360;
const smallName = (file: string) => file.replace(/\.webp$/, "-360.webp");
type State = Record<string, Entry>;
type Tool = { id: string; slug?: string; name: string; ogImageUrl?: string | null; websiteUrl?: string; affiliateLink?: string; logo?: string };

const readJson = <T,>(path: string, fallback: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as T : fallback);

function catalogue(): Tool[] {
  const data = readJson<{ tools?: Tool[] } | Tool[]>(join(ROOT, "src/data/tools_v4.json"), []);
  return Array.isArray(data) ? data : data.tools ?? [];
}

/** The same address the site would load (local paths are served from tooltrim.com). */
function sourceOf(tool: Tool): string | null {
  const raw = tool.ogImageUrl?.trim();
  if (!raw || isToolCoverBlocked(tool as never)) return null;
  try {
    const url = new URL(raw, "https://tooltrim.com");
    if (url.hostname === "tooltrim.com" || url.hostname === "www.tooltrim.com") {
      const local = join(ROOT, "public", decodeURIComponent(url.pathname.replace(/^\/public\//, "/")));
      return existsSync(local) ? `file:${local}` : url.href;
    }
    return url.href;
  } catch {
    return null;
  }
}

async function fetchBytes(source: string): Promise<Buffer> {
  if (source.startsWith("file:")) return readFileSync(source.slice(5));
  const response = await fetch(source, { signal: AbortSignal.timeout(15000), headers: { "user-agent": "ToolTrim card thumbnails" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function pool<T>(items: T[], run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < items.length) await run(items[next++]); }));
}

async function build() {
  mkdirSync(CACHE, { recursive: true });
  const state = readJson<State>(STATE, {});
  const tools = catalogue().map((tool) => ({ slug: tool.slug || tool.id, source: sourceOf(tool) })).filter((t): t is { slug: string; source: string } => Boolean(t.source));
  const limit = Number(process.env.THUMBS_LIMIT) || Infinity;
  const todo = tools.filter(({ slug, source }) => state[slug]?.source !== source || !existsSync(join(CACHE, state[slug].file))).slice(0, limit);
  let done = 0; const failed: string[] = [];
  await pool(todo, async ({ slug, source }) => {
    try {
      const image = await sharp(await fetchBytes(source)).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
      const meta = await sharp(image).metadata();
      // Same rule as the site (useToolCover): too small to be a screenshot, the card keeps the logo.
      if ((meta.width ?? 0) < 320 || (meta.height ?? 0) < 160) throw new Error("too small");
      const file = `${slug}-${createHash("sha1").update(image).digest("hex").slice(0, 10)}.webp`;
      writeFileSync(join(CACHE, file), image);
      writeFileSync(join(CACHE, smallName(file)), await sharp(image).resize({ width: SMALL }).webp({ quality: QUALITY }).toBuffer());
      state[slug] = { source, file, small: true };
    } catch (error) {
      failed.push(`${slug}: ${(error as Error).message}`);
    }
    if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
  });
  for (const slug of Object.keys(state)) if (!tools.some((t) => t.slug === slug)) delete state[slug];
  // Thumbnails built before the 360 px size: derive it from the cached 720 px file, no download.
  for (const entry of Object.values(state)) {
    if (entry.small || !existsSync(join(CACHE, entry.file))) continue;
    writeFileSync(join(CACHE, smallName(entry.file)), await sharp(join(CACHE, entry.file)).resize({ width: SMALL }).webp({ quality: QUALITY }).toBuffer());
    entry.small = true;
  }
  writeFileSync(STATE, JSON.stringify(state, null, 1));
  console.log(`Vignettes : ${tools.length} outils avec capture, ${todo.length} refaites, ${failed.length} en échec.`);
  if (failed.length) console.log(failed.slice(0, 30).map((line) => `  - ${line}`).join("\n"));
}

async function upload() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY et R2_BUCKET sont requis.");
  }
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  const state = readJson<State>(STATE, {});
  const put = async (file: string) => {
    const response = await client.fetch(`${endpoint}/${file}`, {
      method: "PUT",
      body: readFileSync(join(CACHE, file)),
      // The name carries the content's hash: a thumbnail never changes under its name.
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${await response.text()}`);
  };
  const pending = Object.values(state).filter((entry) => !entry.uploaded || (entry.small && !entry.uploadedSmall));
  let sent = 0;
  await pool(pending, async (entry) => {
    if (!entry.uploaded) { await put(entry.file); entry.uploaded = true; }
    if (entry.small && !entry.uploadedSmall) { await put(smallName(entry.file)); entry.uploadedSmall = true; }
    if (++sent % 50 === 0) console.log(`  ${sent}/${pending.length}`);
  });
  writeFileSync(STATE, JSON.stringify(state, null, 1));
  const manifest = Object.fromEntries(Object.entries(state).filter(([, e]) => e.uploaded && e.uploadedSmall).map(([slug, e]) => [slug, e.file]).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`R2 : ${sent} envoyées ; ${Object.keys(manifest).length} vignettes au manifeste.`);
}

const command = process.argv[2];
if (command === "build") await build();
else if (command === "upload") await upload();
else { console.log("Usage : npx tsx scripts/card-thumbs.ts build | upload"); process.exit(1); }
