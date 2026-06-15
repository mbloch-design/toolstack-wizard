import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const DAYS = Number(process.env.GO47_DAYS || 2);
const LIMIT = Number(process.env.GO47_LIMIT || 25);
const SESSION_ID =
  process.env.GO47_SESSION_ID ||
  process.argv.find((arg) => arg.startsWith("--session-id="))?.slice("--session-id=".length) ||
  null;

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

async function postBackoffice(body) {
  const res = await fetch(functionUrl("backoffice-diagnostic"), {
    method: "POST",
    headers: headers({ "x-admin-key": process.env.BACKOFFICE_ADMIN_KEY }),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 500)}`);
  return json;
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function latestDashboardRestitution(detail) {
  return [...(detail.restitutions || [])]
    .filter((item) => item.channel === "dashboard")
    .sort((a, b) => new Date(b.generated_at || 0).getTime() - new Date(a.generated_at || 0).getTime())[0];
}

function hasSections(summary, required) {
  const sections = Array.isArray(summary?.report_sections) ? summary.report_sections : [];
  return required.every((section) => sections.includes(section));
}

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

loadEnvFile(ENV_FILE);

const missing = requiredEnv([
  "SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "BACKOFFICE_ADMIN_KEY",
]);

if (missing.length > 0) {
  console.error(`Missing GO47 env: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  const dashboard = await postBackoffice({ mode: "dashboard", days: DAYS, limit: LIMIT });
  const sessions = Array.isArray(dashboard.sessions) ? dashboard.sessions : [];
  const completedSessions = sessions
    .filter((session) => session.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  const target =
    (SESSION_ID ? sessions.find((session) => session.session_id === SESSION_ID) : null) ||
    completedSessions[0];

  ok("recent completed session exists", Boolean(target), `${completedSessions.length} completed sessions in ${DAYS}d`);

  if (!target) {
    throw new Error("No completed diagnostic session found. Complete one preprod diagnostic after GO47 deployment, then rerun.");
  }

  const detail = await postBackoffice({ mode: "session_detail", sessionId: target.session_id });
  const session = detail.session || target;
  const restitution = latestDashboardRestitution(detail);
  const summary = asRecord(restitution?.summary);
  const understoodContext = asRecord(summary?.understood_context);
  const scoreSnapshot = asRecord(restitution?.score_snapshot);

  ok("session detail loads", detail.mode === "session_detail", session.session_id);
  ok("dashboard restitution exists", Boolean(restitution), restitution?.id || "missing restitution");
  ok("guided report pattern captured", summary?.report_pattern === "guided_report", summary?.report_pattern || "missing");
  ok("report sections captured", hasSections(summary, ["understood_context", "verdict", "first_decision", "evidence", "appendices"]));
  ok("currency policy captured", summary?.currency_policy === "source_currency_or_verify", summary?.currency_policy || "missing");
  ok("understood context captured", typeof understoodContext?.selected_tool_count === "number", JSON.stringify(understoodContext || {}));
  ok("score snapshot captured", typeof scoreSnapshot?.health_score === "number" && Boolean(scoreSnapshot?.health_label), JSON.stringify(scoreSnapshot || {}));
  ok("focus areas captured", Array.isArray(summary?.focus_areas), `${summary?.focus_areas?.length || 0} focus areas`);

  for (const item of checks) {
    console.log(`[${item.status}] ${item.name}`);
    if (item.details) console.log(`     ${item.details}`);
  }

  const failed = checks.filter((item) => item.status === "FAIL");
  console.log("");
  console.log(`GO47 guided report verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
  console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

  if (failed.length > 0) process.exit(1);
} catch (error) {
  console.error("[FAIL] GO47 guided report validation failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
