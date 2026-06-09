import { existsSync, readFileSync } from "node:fs";

const PROJECT_REF = "rtfyfuwfdpnsogovkwai";
const REQUIRED_SECRETS = [
  "BACKOFFICE_ADMIN_KEY",
  "BACKOFFICE_ADMIN_EMAILS",
  "BACKOFFICE_ALERT_WORKER_KEY",
  "DIAGNOSTIC_EMAIL_WORKER_KEY",
];
const OPTIONAL_SECRETS = [
  "DIAGNOSTIC_EMAIL_WEBHOOK_KEY",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "DIAGNOSTIC_EMAIL_FROM",
  "BACKOFFICE_ALERT_EMAILS",
  "TOOLTRIM_APP_URL",
];

function loadEnv(path = ".env.preprod") {
  if (!existsSync(path)) {
    throw new Error(`${path} not found.`);
  }

  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function hasValue(value) {
  return Boolean(value && !value.includes("<"));
}

async function pushSecrets(accessToken, envFile, keys) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      keys.map((key) => ({
        name: key,
        value: envFile[key],
      }))
    ),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Management API HTTP ${response.status}: ${text.slice(0, 700)}`);
  }
}

const envFile = loadEnv();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || envFile.SUPABASE_ACCESS_TOKEN;
if (!hasValue(accessToken)) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.preprod.");
  process.exit(1);
}

const missing = REQUIRED_SECRETS.filter((key) => !hasValue(envFile[key]));
if (missing.length) {
  console.error(`Missing required secrets in .env.preprod: ${missing.join(", ")}`);
  process.exit(1);
}

const keys = [
  ...REQUIRED_SECRETS,
  ...OPTIONAL_SECRETS.filter((key) => hasValue(envFile[key])),
];

try {
  console.log(`Pushing Supabase Edge Function secrets to ${PROJECT_REF}:`);
  for (const key of keys) console.log(`- ${key}`);
  console.log("");

  await pushSecrets(accessToken, envFile, keys);

  console.log("");
  console.log("Supabase Edge Function secrets pushed. Now run: npm run validate:preprod");
} catch (error) {
  console.error("[FAIL] Supabase Edge Function secrets push failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
