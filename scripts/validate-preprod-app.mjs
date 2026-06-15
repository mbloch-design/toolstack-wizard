import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const TIMEOUT_MS = Number(process.env.GO27_APP_TIMEOUT_MS || 15000);

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function appUrl() {
  const value = process.env.PREPROD_APP_URL || process.env.TOOLTRIM_APP_URL;
  if (!value || value.includes("<")) return null;
  return value.replace(/\/+$/, "");
}

function vercelCurl(path, deployment) {
  const args = ["curl", path, "--deployment", deployment];
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    args.push("--protection-bypass", process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  }
  let result = spawnSync("vercel", args, { encoding: "utf8" });

  if (result.error?.code === "ENOENT") {
    result = spawnSync("npx", ["--yes", "vercel", ...args], { encoding: "utf8" });
  }

  return result;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function firstAssetUrls(baseUrl, html) {
  const urls = [];
  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi,
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const assetUrl = new URL(match[1], baseUrl).toString();
      if (!urls.includes(assetUrl)) urls.push(assetUrl);
      if (urls.length >= 4) return urls;
    }
  }
  return urls;
}

async function main() {
  loadEnvFile(ENV_FILE);

  const url = appUrl();
  if (!url) {
    throw new Error("PREPROD_APP_URL or TOOLTRIM_APP_URL is missing in .env.preprod.");
  }

  const checks = [];

  let pageRes;
  try {
    const headers = { "User-Agent": "ToolTrim-GO27-Preprod-Check" };
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }
    pageRes = await fetchWithTimeout(url, {
      headers,
      redirect: "follow",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to fetch ${url}: ${message}`);
  }
  checks.push(["app status", pageRes.status >= 200 && pageRes.status < 400, `${pageRes.status} ${pageRes.url}`]);

  if (pageRes.status === 401 || pageRes.status === 403) {
    const protectedStatus = pageRes.status;
    const vercelUrl = new URL(url);
    const path = `${vercelUrl.pathname || "/"}${vercelUrl.search || ""}`;
    const deployment = `${vercelUrl.origin}`;
    const result = vercelCurl(path, deployment);

    if (result.status !== 0) {
      const details = [
        result.stderr?.trim(),
        result.stdout?.trim(),
      ].filter(Boolean).join(" ");
      throw new Error(
        `Preprod app is protected (${protectedStatus}). Run "npm run login:vercel", set VERCEL_AUTOMATION_BYPASS_SECRET, or disable Preview Protection. ${details ? `Vercel CLI said: ${details.slice(0, 500)}` : ""}`
      );
    }

    const stdout = result.stdout || "";
    checks.push(["app protected preview bypass", true, "verified with vercel curl"]);
    checks.push(["app returns html", stdout.includes("<html") || stdout.includes("<!doctype html"), "vercel curl html"]);
    checks.push(["vite root exists", stdout.includes('id="root"') || stdout.includes("id='root'"), "root marker"]);

    const failed = checks.filter(([, ok]) => !ok);
    for (const [name, ok, details] of checks) {
      console.log(`[${ok ? "OK" : "FAIL"}] ${name}`);
      if (!ok || process.env.GO27_VERBOSE === "true") console.log(`     ${details}`);
    }

    console.log("");
    console.log(`GO27 preprod app verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);

    if (failed.length > 0) process.exit(1);
    return;
  }

  const contentType = pageRes.headers.get("content-type") || "";
  checks.push(["app returns html", contentType.includes("text/html"), contentType || "missing content-type"]);

  const html = await pageRes.text();
  checks.push(["vite root exists", html.includes('id="root"') || html.includes("id='root'"), "root marker"]);

  const assets = firstAssetUrls(pageRes.url || url, html);
  checks.push(["asset references exist", assets.length > 0, `${assets.length} assets found`]);

  for (const asset of assets) {
    let assetRes;
    try {
      assetRes = await fetchWithTimeout(asset, { redirect: "follow" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push([`asset ${new URL(asset).pathname}`, false, message]);
      continue;
    }
    checks.push([`asset ${new URL(asset).pathname}`, assetRes.status >= 200 && assetRes.status < 400, String(assetRes.status)]);
  }

  const failed = checks.filter(([, ok]) => !ok);
  for (const [name, ok, details] of checks) {
    console.log(`[${ok ? "OK" : "FAIL"}] ${name}`);
    if (!ok || process.env.GO27_VERBOSE === "true") console.log(`     ${details}`);
  }

  console.log("");
  console.log(`GO27 preprod app verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);

  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(`[FAIL] preprod app check`);
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  console.log("");
  console.log("GO27 preprod app verdict: FAIL");
  process.exit(1);
});
