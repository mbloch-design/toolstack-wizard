import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const DAYS = Number(process.env.GO28_DAYS || 2);
const LIMIT = Number(process.env.GO28_LIMIT || 25);
const SESSION_ID =
  process.env.GO28_SESSION_ID ||
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
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function hasOwnKeys(record, keys) {
  return Boolean(record && keys.some((key) => Object.prototype.hasOwnProperty.call(record, key)));
}

function latestSnapshotWithTools(detail) {
  return [...(detail.snapshots || [])]
    .sort((a, b) => Number(Boolean(b.is_final)) - Number(Boolean(a.is_final)) || (b.step_id || 0) - (a.step_id || 0))
    .find((snapshot) => Array.isArray(snapshot.snapshot?.selectedTools) && snapshot.snapshot.selectedTools.length > 0);
}

function sessionStatus(session) {
  if (session.completed_at) return "completed";
  if (session.abandoned_at) return "abandoned";
  if ((session.last_step_id || 0) > 0) return "active";
  return "new";
}

function recentSessionSummary(sessions) {
  const counts = sessions.reduce((acc, session) => {
    const status = sessionStatus(session);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const lastSessions = sessions.slice(0, 5).map((session) => {
    const label = [
      sessionStatus(session),
      `step=${session.last_step_id ?? "?"}`,
      session.email ? `email=${session.email}` : "email=none",
      session.created_at ? `created=${session.created_at}` : null,
    ].filter(Boolean).join(" ");
    return `- ${session.session_id}: ${label}`;
  });

  return [
    `recent sessions: ${sessions.length}`,
    `completed=${counts.completed || 0}, active=${counts.active || 0}, abandoned=${counts.abandoned || 0}, new=${counts.new || 0}`,
    ...lastSessions,
  ].join("\n");
}

const checks = [];

function add(status, name, details = "") {
  checks.push({ status, name, details });
}

function ok(name, condition, details = "") {
  add(condition ? "OK" : "FAIL", name, details);
}

function warn(name, condition, details = "") {
  add(condition ? "OK" : "WARN", name, details);
}

loadEnvFile(ENV_FILE);

const missing = requiredEnv([
  "SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "BACKOFFICE_ADMIN_KEY",
]);

if (missing.length > 0) {
  console.error(`Missing GO28 env: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  const dashboard = await postBackoffice({
    mode: "dashboard",
    days: DAYS,
    limit: LIMIT,
  });

  const sessions = Array.isArray(dashboard.sessions) ? dashboard.sessions : [];
  const completedSessions = sessions
    .filter((session) => session.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

  const target =
    (SESSION_ID ? sessions.find((session) => session.session_id === SESSION_ID) : null) ||
    completedSessions[0];

  ok("recent completed session exists", Boolean(target), `${completedSessions.length} completed sessions in ${DAYS}d`);

  if (!target) {
    throw new Error(
      `No completed diagnostic session found in the last ${DAYS} day(s).\n${recentSessionSummary(sessions)}\nOpen PREPROD_APP_URL, complete one diagnostic until the final results dashboard, then rerun. If the session is older, rerun with GO28_DAYS=7.`
    );
  }

  const detail = await postBackoffice({
    mode: "session_detail",
    sessionId: target.session_id,
  });

  const session = detail.session || target;
  const context = asRecord(session.diagnostic_context);
  const insights = asRecord(session.diagnostic_insights);
  const snapshotWithTools = latestSnapshotWithTools(detail);
  const sessionCompletedEvent = (detail.stepEvents || []).some((event) => event.event_name === "session_completed");
  const stepViewedEvents = (detail.stepEvents || []).filter((event) => event.event_name === "step_viewed");
  const finalSnapshot = (detail.snapshots || []).some((snapshot) => snapshot.is_final === true || snapshot.step_id >= 12);
  const restitution = (detail.restitutions || [])[0];
  const emailJobs = detail.emailJobs || [];

  ok("session detail loads", detail.mode === "session_detail", session.session_id);
  ok("session is completed", Boolean(session.completed_at), session.completed_at || "missing completed_at");
  ok("score captured", typeof session.health_score === "number", String(session.health_score));
  ok("savings captured", typeof session.annual_savings === "number" || typeof session.estimated_waste === "number");
  ok("onboarding context captured", hasOwnKeys(context, ["persona_confidence", "stack_goal", "complementary_skills"]));
  ok("diagnostic insights captured", hasOwnKeys(insights, ["profile", "maturity", "metrics", "confidence", "calibration"]));
  ok("functional coverage captured", Array.isArray(session.functional_coverage));
  ok("risk flags captured", Array.isArray(session.risk_flags));
  ok("selected tools captured in snapshots", Boolean(snapshotWithTools), snapshotWithTools?.snapshot?.selectedTools?.length || 0);
  ok("final snapshot captured", finalSnapshot);
  ok("step journey captured", stepViewedEvents.length >= 5, `${stepViewedEvents.length} step_viewed events`);
  ok("completion event captured", sessionCompletedEvent);
  ok("dashboard restitution captured", Boolean(restitution), restitution?.id || "missing restitution");
  warn(
    "email job captured when email exists",
    !session.email || emailJobs.length > 0,
    session.email ? `${emailJobs.length} email jobs` : "no email on session"
  );

  for (const item of checks) {
    console.log(`[${item.status}] ${item.name}`);
    if (item.details) console.log(`     ${item.details}`);
  }

  const failed = checks.filter((item) => item.status === "FAIL");
  const warned = checks.filter((item) => item.status === "WARN");
  console.log("");
  console.log(`GO28 e2e verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
  console.log(`Checks: ${checks.length}, failed: ${failed.length}, warnings: ${warned.length}`);

  if (failed.length > 0) process.exit(1);
} catch (error) {
  console.error("[FAIL] GO28 e2e validation failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
