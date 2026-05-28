import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const RUN_EMAIL_WORKER = process.argv.includes("--email-worker") || process.env.GO26_RUN_EMAIL_WORKER === "true";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

function requiredEnv(keys) {
  return keys.filter((key) => !process.env[key] || process.env[key]?.includes("<"));
}

function functionUrl(name) {
  return `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${name}`;
}

function restUrl(path) {
  return `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${path}`;
}

function anonHeaders(extra = {}) {
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
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

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function isDenied(status) {
  return status === 401 || status === 403 || status === 404;
}

const checks = [];

async function check(name, fn, options = {}) {
  const started = Date.now();
  try {
    const details = await fn();
    checks.push({ name, status: options.skip ? "SKIP" : "OK", durationMs: Date.now() - started, details });
  } catch (error) {
    if (options.optional) {
      checks.push({
        name,
        status: "WARN",
        durationMs: Date.now() - started,
        details: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    checks.push({
      name,
      status: "FAIL",
      durationMs: Date.now() - started,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function expectStatus(name, res, predicate) {
  const body = await readJsonSafe(res);
  if (!predicate(res.status, body)) {
    throw new Error(`${name}: unexpected HTTP ${res.status} ${JSON.stringify(body).slice(0, 500)}`);
  }
  return { status: res.status, body };
}

loadEnvFile(ENV_FILE);

const missing = requiredEnv([
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "BACKOFFICE_ADMIN_KEY",
  "BACKOFFICE_ALERT_WORKER_KEY",
  "DIAGNOSTIC_EMAIL_WORKER_KEY",
]);

if (missing.length > 0) {
  console.error(`Missing preprod env: ${missing.join(", ")}`);
  console.error(`Create ${ENV_FILE} from .env.preprod.example or export the variables before running this script.`);
  process.exit(1);
}

await check("preprod app responds", async () => {
  const appUrl = process.env.PREPROD_APP_URL || process.env.TOOLTRIM_APP_URL;
  if (!appUrl || appUrl.includes("<")) return { skipped: "PREPROD_APP_URL/TOOLTRIM_APP_URL not set" };
  try {
    const res = await fetch(appUrl, { method: "GET" });
    return expectStatus(`app ${appUrl}`, res, (status) => status >= 200 && status < 400);
  } catch (error) {
    throw new Error(`app ${appUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }
}, { optional: true });

await check("anon can read public catalog", async () => {
  const res = await fetch(restUrl("tools?select=id&limit=1"), { headers: anonHeaders() });
  return expectStatus("catalog read", res, (status) => status === 200);
});

await check("anon cannot read back-office sessions view", async () => {
  const res = await fetch(restUrl("vw_backoffice_diagnostic_sessions?select=session_id&limit=1"), {
    headers: anonHeaders(),
  });
  return expectStatus("backoffice sessions anon read", res, (status) => isDenied(status));
});

await check("anon cannot read back-office email health view", async () => {
  const res = await fetch(restUrl("vw_backoffice_email_health?select=day&limit=1"), {
    headers: anonHeaders(),
  });
  return expectStatus("backoffice email health anon read", res, (status) => isDenied(status));
});

await check("anon cannot insert tools", async () => {
  const id = `go26-probe-${Date.now()}`;
  const res = await fetch(restUrl("tools"), {
    method: "POST",
    headers: anonHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      id,
      name: "GO26 probe",
      slug: id,
      short_description: "Preprod hardening probe",
    }),
  });
  return expectStatus("tools anon insert", res, (status) => isDenied(status));
});

await check("backoffice rejects missing admin key", async () => {
  const res = await fetch(functionUrl("backoffice-diagnostic"), {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify({ mode: "dashboard", days: 1, limit: 1 }),
  });
  return expectStatus("backoffice unauthorized", res, (status) => status === 401);
});

await check("backoffice dashboard works with admin key", async () => {
  const res = await fetch(functionUrl("backoffice-diagnostic"), {
    method: "POST",
    headers: anonHeaders({ "x-admin-key": process.env.BACKOFFICE_ADMIN_KEY }),
    body: JSON.stringify({ mode: "dashboard", days: 7, limit: 5 }),
  });
  return expectStatus("backoffice dashboard", res, (status, body) => status === 200 && body?.mode === "dashboard");
});

await check("service role can read back-office view", async () => {
  const res = await fetch(restUrl("vw_backoffice_diagnostic_sessions?select=session_id&limit=1"), {
    headers: serviceHeaders(),
  });
  return expectStatus("service role backoffice view", res, (status) => status === 200);
});

await check("admin alerts dry-run works", async () => {
  const res = await fetch(functionUrl("send-backoffice-alerts"), {
    method: "POST",
    headers: anonHeaders({ "x-worker-key": process.env.BACKOFFICE_ALERT_WORKER_KEY }),
    body: JSON.stringify({ days: 7, limit: 12, locale: "fr", dryRun: true }),
  });
  return expectStatus("admin alerts dry-run", res, (status, body) => status === 200 && body?.success === true);
});

if (RUN_EMAIL_WORKER) {
  await check("email worker batchSize=1", async () => {
    const res = await fetch(functionUrl("process-diagnostic-email-jobs"), {
      method: "POST",
      headers: anonHeaders({ "x-worker-key": process.env.DIAGNOSTIC_EMAIL_WORKER_KEY }),
      body: JSON.stringify({ batchSize: 1, maxAttempts: 1 }),
    });
    return expectStatus("email worker", res, (status, body) => status === 200 && body?.success === true);
  });
} else {
  checks.push({
    name: "email worker batchSize=1",
    status: "SKIP",
    durationMs: 0,
    details: "Skipped by default because it can send queued emails. Re-run with --email-worker or GO26_RUN_EMAIL_WORKER=true.",
  });
}

const failed = checks.filter((item) => item.status === "FAIL");
const warned = checks.filter((item) => item.status === "WARN");
const skipped = checks.filter((item) => item.status === "SKIP");

for (const item of checks) {
  const icon = item.status === "OK" ? "OK" : item.status;
  console.log(`[${icon}] ${item.name} (${item.durationMs}ms)`);
  if (item.details && item.status !== "OK") {
    console.log(`     ${typeof item.details === "string" ? item.details : JSON.stringify(item.details).slice(0, 500)}`);
  }
}

console.log("");
console.log(`GO26 preprod verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}, warnings: ${warned.length}, skipped: ${skipped.length}`);

if (failed.length > 0) {
  process.exit(1);
}
