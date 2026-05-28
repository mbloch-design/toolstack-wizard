import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";

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

function requiredEnv(keys) {
  return keys.filter((key) => !process.env[key] || process.env[key]?.includes("<"));
}

function anonKey() {
  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
}

function functionUrl(name) {
  return `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${name}`;
}

function headers(extra = {}) {
  const key = anonKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function parseResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function expectOk(label, res) {
  const body = await parseResponse(res);
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 700)}`);
  }
  return body;
}

async function expectUnauthorized(label, res) {
  const body = await parseResponse(res);
  if (res.status !== 401) {
    throw new Error(`${label}: expected HTTP 401, got ${res.status} ${JSON.stringify(body).slice(0, 700)}`);
  }
}

loadEnvFile(ENV_FILE);

const missing = requiredEnv([
  "SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "BACKOFFICE_ADMIN_KEY",
]);

if (missing.length > 0) {
  console.error(`Missing GO30 env: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  const auth = await expectOk(
    "admin key can create temporary admin session",
    await fetch(functionUrl("backoffice-diagnostic"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        mode: "auth",
        adminKey: process.env.BACKOFFICE_ADMIN_KEY,
      }),
    })
  );

  if (!auth?.adminSessionToken || !auth?.expiresAt) {
    throw new Error("admin auth response missing adminSessionToken/expiresAt");
  }

  const expiresAt = new Date(auth.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error(`admin session expiry is invalid: ${auth.expiresAt}`);
  }

  await expectOk(
    "temporary admin session can read dashboard",
    await fetch(functionUrl("backoffice-diagnostic"), {
      method: "POST",
      headers: headers({ "x-admin-session": auth.adminSessionToken }),
      body: JSON.stringify({
        mode: "dashboard",
        days: 2,
        limit: 5,
      }),
    })
  );

  await expectUnauthorized(
    "tampered admin session is rejected",
    await fetch(functionUrl("backoffice-diagnostic"), {
      method: "POST",
      headers: headers({ "x-admin-session": `${auth.adminSessionToken.slice(0, -4)}nope` }),
      body: JSON.stringify({
        mode: "dashboard",
        days: 2,
        limit: 5,
      }),
    })
  );

  console.log("[OK] admin key creates temporary admin session");
  console.log("[OK] temporary admin session reads dashboard");
  console.log("[OK] tampered admin session is rejected");
  console.log("");
  console.log("GO30 admin auth verdict: PASS");
} catch (error) {
  console.error("[FAIL] GO30 admin auth validation failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
