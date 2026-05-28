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

function baseUrl(path) {
  return `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${path}`;
}

function anonKey() {
  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
}

function anonHeaders(extra = {}) {
  const key = anonKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function serviceHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function createUuid() {
  return crypto.randomUUID();
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
    throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 800)}`);
  }
  return body;
}

loadEnvFile(ENV_FILE);

const missing = requiredEnv([
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
]);

if (missing.length > 0) {
  console.error(`Missing diagnostic write env: ${missing.join(", ")}`);
  process.exit(1);
}

let sessionId = null;
let sessionToken = null;

try {
  const marker = `go28-write-probe-${Date.now()}`;
  sessionId = createUuid();
  sessionToken = createUuid();

  await expectOk(
    "create diagnostic session as anon",
    await fetch(baseUrl("diagnostic_sessions"), {
      method: "POST",
      headers: anonHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        id: sessionId,
        session_token: sessionToken,
        first_name: "GO28 Probe",
        persona: "THEO",
        language: "fr",
        email: `${marker}@example.com`,
        source: "go28-write-probe",
        funnel_version: "v1",
        last_step_id: 0,
      }),
    })
  );

  await expectOk(
    "update diagnostic session with x-session-token",
    await fetch(baseUrl(`diagnostic_sessions?id=eq.${encodeURIComponent(sessionId)}`), {
      method: "PATCH",
      headers: anonHeaders({
        Prefer: "return=minimal",
        "x-session-token": sessionToken,
      }),
      body: JSON.stringify({
        last_step_id: 1,
        diagnostic_context: {
          persona_confidence: "clear",
          stack_goal: "reduce_costs",
        },
      }),
    })
  );

  await expectOk(
    "insert diagnostic step event with x-session-token",
    await fetch(baseUrl("diagnostic_step_events"), {
      method: "POST",
      headers: anonHeaders({
        Prefer: "return=minimal",
        "x-session-token": sessionToken,
      }),
      body: JSON.stringify({
        session_id: sessionId,
        step_id: 1,
        event_name: "go28_write_probe",
        event_payload: { marker },
        source: "go28-write-probe",
        lang: "fr",
        persona: "THEO",
      }),
    })
  );

  console.log("[OK] anon can create diagnostic session");
  console.log("[OK] anon can update diagnostic session with session token");
  console.log("[OK] anon can insert diagnostic step event with session token");
  console.log("");
  console.log("GO28 diagnostic write path verdict: PASS");
} catch (error) {
  console.error("[FAIL] GO28 diagnostic write path failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (sessionId) {
    await fetch(baseUrl(`diagnostic_sessions?id=eq.${encodeURIComponent(sessionId)}`), {
      method: "DELETE",
      headers: serviceHeaders({ Prefer: "return=minimal" }),
    }).catch(() => undefined);
  }
}
