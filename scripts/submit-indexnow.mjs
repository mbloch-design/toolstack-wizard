#!/usr/bin/env node
// Submits every URL from dist/sitemap.xml to IndexNow (Bing/Yandex/Seznam
// pick it up; Google does not consume IndexNow but this costs nothing and
// covers the others). Run after a production build, once dist/sitemap.xml
// exists. IndexNow caps a single submission at 10,000 URLs, so the list is
// chunked.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = "tooltrim.com";
const KEY = "e89ac3248e729bb4e356cc2240155b2d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_PATH = path.resolve(__dirname, "../dist/sitemap.xml");
const CHUNK_SIZE = 10000;
const ENDPOINT = "https://api.indexnow.org/indexnow";

if (!existsSync(SITEMAP_PATH)) {
  console.error(`⚠️ IndexNow: ${SITEMAP_PATH} not found — run the production build first.`);
  process.exit(1);
}

const xml = readFileSync(SITEMAP_PATH, "utf-8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  console.error("⚠️ IndexNow: no <loc> entries found in sitemap.xml.");
  process.exit(1);
}

const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
  chunks.push(urls.slice(i, i + CHUNK_SIZE));
}

console.log(`IndexNow: submitting ${urls.length} URLs in ${chunks.length} batch(es)...`);

let ok = 0;
for (const [index, urlList] of chunks.entries()) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    });
    if (res.ok || res.status === 202) {
      console.log(`  batch ${index + 1}/${chunks.length}: OK (${res.status}), ${urlList.length} URLs`);
      ok++;
    } else {
      console.error(`  batch ${index + 1}/${chunks.length}: FAILED (${res.status}) ${await res.text()}`);
    }
  } catch (e) {
    console.error(`  batch ${index + 1}/${chunks.length}: ERROR`, e);
  }
}

console.log(`IndexNow: ${ok}/${chunks.length} batch(es) accepted.`);
