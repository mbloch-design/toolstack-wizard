/**
 * Audit the image sources used by catalog cards without mutating catalogue data.
 *
 * Default mode is deterministic and offline: missing values, malformed URLs and
 * missing local ToolTrim screenshots are reported immediately. Add --network to
 * verify remote status, content type, payload size and common raster dimensions.
 * Add --write to persist the JSON report under reports/card-image-audit.json.
 *
 * Usage:
 *   npm run audit:card-images
 *   npm run audit:card-images -- --network --limit=100
 *   npm run audit:card-images -- --network --write
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/data/tools_index.json");
const NETWORK = process.argv.includes("--network");
const WRITE = process.argv.includes("--write");
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || Infinity);
const MIN_WIDTH = 320;
const MIN_HEIGHT = 160;
const MIN_BYTES = 4_000;

const tools = JSON.parse(readFileSync(SOURCE, "utf8")).slice(0, LIMIT);

function normalizeSource(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { kind: "fallback", src: null };
  try {
    const url = new URL(raw, "https://tooltrim.com");
    if (["tooltrim.com", "www.tooltrim.com"].includes(url.hostname)) {
      const pathname = url.pathname.startsWith("/public/") ? url.pathname.slice(7) : url.pathname;
      return {
        kind: pathname.startsWith("/og-screenshots/") ? "curated" : "local",
        src: pathname,
        file: path.join(ROOT, "public", pathname.replace(/^\//, "")),
      };
    }
    return { kind: "remote", src: url.href };
  } catch {
    return { kind: "invalid", src: raw };
  }
}

function dimensions(buffer, contentType = "") {
  if (buffer.length >= 24 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && /gif/i.test(contentType || buffer.toString("ascii", 0, 6))) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (!length || length < 2) break;
      offset += length + 2;
    }
  }
  return null;
}

async function inspectRemote(src) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(src, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ToolTrimImageAudit/1.0; +https://tooltrim.com)" },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) return { status: "broken", reason: `http_${response.status}` };
    if (!contentType.startsWith("image/")) return { status: "broken", reason: `content_type_${contentType || "missing"}` };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < MIN_BYTES) return { status: "review", reason: "payload_too_small", bytes: buffer.length };
    const size = dimensions(buffer, contentType);
    if (size && (size.width < MIN_WIDTH || size.height < MIN_HEIGHT)) {
      return { status: "review", reason: "dimensions_too_small", bytes: buffer.length, ...size };
    }
    return { status: size ? "ok" : "review", reason: size ? null : "dimensions_unreadable", bytes: buffer.length, ...size };
  } catch (error) {
    return { status: "uncertain", reason: error.name === "AbortError" ? "timeout" : error.message };
  } finally {
    clearTimeout(timer);
  }
}

const report = [];
for (const tool of tools) {
  const source = normalizeSource(tool.ogImageUrl);
  let result;
  if (source.kind === "fallback") result = { status: "fallback", reason: "missing_image" };
  else if (source.kind === "invalid") result = { status: "broken", reason: "invalid_url" };
  else if (source.file) {
    if (!existsSync(source.file)) result = { status: "broken", reason: "local_file_missing" };
    else {
      const buffer = readFileSync(source.file);
      const size = dimensions(buffer);
      result = size && (size.width < MIN_WIDTH || size.height < MIN_HEIGHT)
        ? { status: "review", reason: "dimensions_too_small", bytes: buffer.length, ...size }
        : { status: size ? "ok" : "review", reason: size ? null : "dimensions_unreadable", bytes: buffer.length, ...size };
    }
  } else if (NETWORK) result = await inspectRemote(source.src);
  else result = { status: "unchecked", reason: "network_check_disabled" };

  report.push({ slug: tool.slug || tool.id, name: tool.name, source: source.kind, src: source.src, ...result });
}

const counts = report.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {});
const actionable = report.filter((item) => ["broken", "fallback", "review"].includes(item.status));

console.log(`Card image audit — ${report.length} tools${NETWORK ? " (network enabled)" : " (offline)"}`);
console.table(counts);
actionable.slice(0, 30).forEach((item) => console.log(`${item.status.toUpperCase().padEnd(8)} ${item.slug.padEnd(30)} ${item.reason}`));
if (actionable.length > 30) console.log(`… ${actionable.length - 30} additional actionable entries`);

if (WRITE) {
  const outputDir = path.join(ROOT, "reports");
  mkdirSync(outputDir, { recursive: true });
  const output = path.join(outputDir, "card-image-audit.json");
  writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), network: NETWORK, counts, items: report }, null, 2)}\n`);
  console.log(`Report written to ${path.relative(ROOT, output)}`);
}

if (counts.broken) process.exitCode = 1;
